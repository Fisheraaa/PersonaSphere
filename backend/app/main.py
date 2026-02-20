from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
import json

from .database import engine, SessionLocal, get_db, Base
from . import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="智能人脉管理工具 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "智能人脉管理工具 API"}

@app.post("/extract", response_model=schemas.ExtractResponse)
def extract_info(request: schemas.ExtractRequest):
    profile = schemas.ExtractedProfile(
        name="张三",
        job="AI工程师",
        birthday="05-20",
        events=[schemas.EventBase(date="2025-03-15", description="一起吃饭", location="北京")]
    )
    annotations = [schemas.AnnotationBase(time="2025-04-01", location="上海", description="出差")]
    developments = [schemas.DevelopmentBase(content="AI芯片", type="resource")]
    relations = [schemas.ExtractedRelation(name="李四", relation_type="同事")]
    
    return schemas.ExtractResponse(
        profile=profile,
        annotations=annotations,
        developments=developments,
        relations=relations
    )

@app.post("/confirm", response_model=schemas.ConfirmResponse)
def confirm_data(request: schemas.ConfirmRequest, db: Session = Depends(get_db)):
    try:
        if request.is_new_person:
            person = models.Person(
                name=request.profile.name,
                profile={"job": request.profile.job, "birthday": request.profile.birthday}
            )
            db.add(person)
            db.flush()
            
            for event_data in request.profile.events:
                event = models.Event(
                    person_id=person.id,
                    date=event_data.date,
                    location=event_data.location,
                    description=event_data.description,
                    source="user"
                )
                db.add(event)
            
            for ann_data in request.annotations:
                ann = models.Annotation(
                    person_id=person.id,
                    time=ann_data.time,
                    location=ann_data.location,
                    description=ann_data.description,
                    source="user"
                )
                db.add(ann)
            
            for dev_data in request.developments:
                dev = models.Development(
                    person_id=person.id,
                    content=dev_data.content,
                    type=dev_data.type,
                    source="user"
                )
                db.add(dev)
            
            for rel_data in request.relations:
                related_person = db.query(models.Person).filter(models.Person.name == rel_data.name).first()
                if not related_person:
                    related_person = models.Person(name=rel_data.name, profile={})
                    db.add(related_person)
                    db.flush()
                
                rel1 = models.Relation(
                    from_person_id=person.id,
                    to_person_id=related_person.id,
                    relation_type=rel_data.relation_type
                )
                rel2 = models.Relation(
                    from_person_id=related_person.id,
                    to_person_id=person.id,
                    relation_type=rel_data.relation_type
                )
                db.add(rel1)
                db.add(rel2)
            
            db.commit()
            db.refresh(person)
            return schemas.ConfirmResponse(success=True, person_id=person.id, message="人物创建成功")
        else:
            if not request.person_id:
                raise HTTPException(status_code=400, detail="person_id 不能为空")
            person = db.query(models.Person).filter(models.Person.id == request.person_id).first()
            if not person:
                raise HTTPException(status_code=404, detail="人物不存在")
            
            current_profile = person.profile
            if request.profile.job:
                current_profile["job"] = request.profile.job
            if request.profile.birthday:
                current_profile["birthday"] = request.profile.birthday
            person.profile = current_profile
            
            for event_data in request.profile.events:
                event = models.Event(
                    person_id=person.id,
                    date=event_data.date,
                    location=event_data.location,
                    description=event_data.description,
                    source="user"
                )
                db.add(event)
            
            for ann_data in request.annotations:
                ann = models.Annotation(
                    person_id=person.id,
                    time=ann_data.time,
                    location=ann_data.location,
                    description=ann_data.description,
                    source="user"
                )
                db.add(ann)
            
            for dev_data in request.developments:
                dev = models.Development(
                    person_id=person.id,
                    content=dev_data.content,
                    type=dev_data.type,
                    source="user"
                )
                db.add(dev)
            
            for rel_data in request.relations:
                related_person = db.query(models.Person).filter(models.Person.name == rel_data.name).first()
                if not related_person:
                    related_person = models.Person(name=rel_data.name, profile={})
                    db.add(related_person)
                    db.flush()
                
                existing_rel = db.query(models.Relation).filter(
                    or_(
                        (models.Relation.from_person_id == person.id) & (models.Relation.to_person_id == related_person.id),
                        (models.Relation.from_person_id == related_person.id) & (models.Relation.to_person_id == person.id)
                    )
                ).first()
                
                if not existing_rel:
                    rel1 = models.Relation(
                        from_person_id=person.id,
                        to_person_id=related_person.id,
                        relation_type=rel_data.relation_type
                    )
                    rel2 = models.Relation(
                        from_person_id=related_person.id,
                        to_person_id=person.id,
                        relation_type=rel_data.relation_type
                    )
                    db.add(rel1)
                    db.add(rel2)
            
            db.commit()
            db.refresh(person)
            return schemas.ConfirmResponse(success=True, person_id=person.id, message="人物更新成功")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/persons", response_model=List[schemas.Person])
def get_persons(db: Session = Depends(get_db)):
    persons = db.query(models.Person).all()
    result = []
    for person in persons:
        person_dict = {
            "id": person.id,
            "name": person.name,
            "avatar": person.avatar,
            "profile": person.profile,
            "created_at": person.created_at,
            "updated_at": person.updated_at,
            "events": person.events,
            "annotations": person.annotations,
            "developments": person.developments
        }
        result.append(schemas.Person(**person_dict))
    return result

@app.get("/persons/{person_id}", response_model=schemas.Person)
def get_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="人物不存在")
    return schemas.Person(
        id=person.id,
        name=person.name,
        avatar=person.avatar,
        profile=person.profile,
        created_at=person.created_at,
        updated_at=person.updated_at,
        events=person.events,
        annotations=person.annotations,
        developments=person.developments
    )

@app.get("/graph", response_model=schemas.GraphResponse)
def get_graph(db: Session = Depends(get_db)):
    persons = db.query(models.Person).all()
    nodes = [schemas.GraphNode(id=p.id, name=p.name, avatar=p.avatar) for p in persons]
    
    relations = db.query(models.Relation).all()
    edges = []
    seen_pairs = set()
    for rel in relations:
        pair = tuple(sorted([rel.from_person_id, rel.to_person_id]))
        if pair not in seen_pairs:
            seen_pairs.add(pair)
            edges.append(schemas.GraphEdge(
                source=rel.from_person_id,
                target=rel.to_person_id,
                relation_type=rel.relation_type
            ))
    
    return schemas.GraphResponse(nodes=nodes, edges=edges)

@app.post("/graph/layout", response_model=schemas.GraphLayoutResponse)
def save_graph_layout(request: schemas.GraphLayoutRequest, db: Session = Depends(get_db)):
    layout = db.query(models.GraphLayout).filter(models.GraphLayout.user_id == "default").first()
    if not layout:
        layout = models.GraphLayout(user_id="default", layout_json=json.dumps(request.layout_json, ensure_ascii=False))
        db.add(layout)
    else:
        layout.layout_json = json.dumps(request.layout_json, ensure_ascii=False)
    db.commit()
    return schemas.GraphLayoutResponse(success=True, message="布局保存成功")

@app.get("/graph/layout")
def get_graph_layout(db: Session = Depends(get_db)):
    layout = db.query(models.GraphLayout).filter(models.GraphLayout.user_id == "default").first()
    if not layout:
        return {"layout_json": {}}
    return {"layout_json": json.loads(layout.layout_json)}

@app.get("/circles", response_model=List[schemas.Circle])
def get_circles(db: Session = Depends(get_db)):
    circles = db.query(models.Circle).all()
    return circles

@app.post("/circles", response_model=schemas.Circle)
def create_circle(circle: schemas.CircleCreate, db: Session = Depends(get_db)):
    db_circle = models.Circle(name=circle.name, color=circle.color)
    db.add(db_circle)
    db.commit()
    db.refresh(db_circle)
    return db_circle
