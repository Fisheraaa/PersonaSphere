from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
import json
import os
import re
from difflib import SequenceMatcher
from datetime import datetime, timedelta
from dotenv import load_dotenv
import httpx

from .database import engine, SessionLocal, get_db, Base
from . import models, schemas

load_dotenv()

Base.metadata.create_all(bind=engine)

async def determine_more_detailed(desc1: str, desc2: str) -> Dict:
    api_key = os.getenv("NVIDIA_API_KEY")
    
    if api_key and api_key != "your_nvidia_api_key_here":
        try:
            system_prompt = """你是一个专业的事件描述比较助手。请比较两个事件描述，判断哪个更加详细和具体。

任务要求：
1. 分析两个事件描述，判断哪一个包含更多具体信息
2. 考虑时间信息（早/中/晚餐）、地点、参与者等因素
3. 例如："吃晚饭"比"吃饭"更详细；"和张三在上海吃午饭"比"吃饭"更详细

输出格式要求：
请严格按照以下JSON格式输出，不要包含任何额外文字：
{
  "more_detailed": "desc1" 或 "desc2",
  "reason": "简短原因"
}
"""
            
            models = [
                "z-ai/glm4.7",
                "deepseek-ai/DeepSeek-V3",
                "Qwen/Qwen2.5-72B-Instruct",
                "meta/llama-3.1-405b-instruct"
            ]
            
            for model in models:
                try:
                    async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
                        response = await client.post(
                            "https://integrate.api.nvidia.com/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {api_key}",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": model,
                                "messages": [
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": f"desc1: {desc1}\ndesc2: {desc2}"}
                                ],
                                "temperature": 0.3,
                                "max_tokens": 500
                            }
                        )
                    
                    if response.status_code == 200:
                        result = response.json()
                        content = result["choices"][0]["message"]["content"]
                        json_match = re.search(r'\{[\s\S]*\}', content)
                        if json_match:
                            data = json.loads(json_match.group(0))
                            return data
                except Exception as e:
                    print(f"模型 {model} 比较失败: {e}")
                    continue
        except Exception as e:
            print(f"AI比较失败: {e}")
    
    if len(desc2) > len(desc1):
        return {"more_detailed": "desc2", "reason": "desc2更长"}
    else:
        return {"more_detailed": "desc1", "reason": "desc1更长"}

def calculate_similarity(str1: str, str2: str) -> float:
    return SequenceMatcher(None, str1, str2).ratio()

def is_similar_event(event1: Dict, event2: Dict, threshold: float = 0.5) -> bool:
    if event1.get('date') != event2.get('date'):
        return False
    
    desc1 = event1.get('description', '')
    desc2 = event2.get('description', '')
    
    similarity = calculate_similarity(desc1, desc2)
    if similarity >= threshold:
        return True
    
    eat_keywords = ['吃饭', '吃早饭', '吃午饭', '吃晚饭', '用餐', '进餐', '早餐', '午餐', '晚餐', '早饭', '午饭', '晚饭']
    has_eat1 = any(keyword in desc1 for keyword in eat_keywords)
    has_eat2 = any(keyword in desc2 for keyword in eat_keywords)
    if has_eat1 and has_eat2:
        return True
    
    meet_keywords = ['见面', '会面', '碰面', '会见', '相聚', '聚会']
    has_meet1 = any(keyword in desc1 for keyword in meet_keywords)
    has_meet2 = any(keyword in desc2 for keyword in meet_keywords)
    if has_meet1 and has_meet2:
        return True
    
    return False

async def compare_and_filter_new_data(
    existing_person: models.Person,
    extracted_data: schemas.ExtractResponse
) -> Dict[str, Any]:
    result = {
        'profile': {
            'name': extracted_data.profile.name,
            'job': None,
            'birthday': None,
            'notes': [],
            'events': []
        },
        'annotations': [],
        'developments': [],
        'relations': [],
        'conflicts': [],
        'events_to_replace': []
    }
    
    existing_profile = existing_person.profile or {}
    existing_job = existing_profile.get('job')
    existing_birthday = existing_profile.get('birthday')
    existing_notes = existing_profile.get('notes', [])
    
    if extracted_data.profile.job and extracted_data.profile.job != existing_job:
        if existing_job:
            result['conflicts'].append({
                'field': 'job',
                'existing': existing_job,
                'new': extracted_data.profile.job
            })
        result['profile']['job'] = extracted_data.profile.job
    
    if extracted_data.profile.birthday and extracted_data.profile.birthday != existing_birthday:
        if existing_birthday:
            result['conflicts'].append({
                'field': 'birthday',
                'existing': existing_birthday,
                'new': extracted_data.profile.birthday
            })
        result['profile']['birthday'] = extracted_data.profile.birthday
    
    for new_note in extracted_data.profile.notes:
        if new_note not in existing_notes:
            result['profile']['notes'].append(new_note)
    
    existing_events = [
        {
            'id': e.id,
            'date': e.date,
            'location': e.location,
            'description': e.description
        }
        for e in existing_person.events
    ]
    
    for new_event in extracted_data.profile.events:
        new_event_dict = {
            'date': new_event.date,
            'location': new_event.location,
            'description': new_event.description
        }
        
        similar_existing = None
        for existing_event in existing_events:
            if is_similar_event(existing_event, new_event_dict):
                similar_existing = existing_event
                break
        
        if similar_existing:
            existing_desc = similar_existing.get('description', '')
            new_desc = new_event.description
            ai_decision = await determine_more_detailed(existing_desc, new_desc)
            if ai_decision['more_detailed'] == 'desc2':
                result['profile']['events'].append(new_event)
                result['events_to_replace'].append({
                    'old_event_id': similar_existing['id'],
                    'new_event': new_event_dict
                })
                result['conflicts'].append({
                    'field': 'event',
                    'existing': similar_existing,
                    'new': new_event_dict,
                    'action': 'replace',
                    'reason': ai_decision['reason']
                })
        else:
            result['profile']['events'].append(new_event)
    
    existing_annotations = [
        {
            'time': a.time,
            'location': a.location,
            'description': a.description
        }
        for a in existing_person.annotations
    ]
    
    for new_ann in extracted_data.annotations:
        new_ann_dict = {
            'time': new_ann.time,
            'location': new_ann.location,
            'description': new_ann.description
        }
        
        exists = any(
            a['time'] == new_ann.time and 
            a['description'] == new_ann.description
            for a in existing_annotations
        )
        
        if not exists:
            result['annotations'].append(new_ann)
    
    existing_devs = [
        {'content': d.content, 'type': d.type}
        for d in existing_person.developments
    ]
    
    for new_dev in extracted_data.developments:
        new_dev_dict = {'content': new_dev.content, 'type': new_dev.type}
        exists = any(
            d['content'] == new_dev.content and d['type'] == new_dev.type
            for d in existing_devs
        )
        if not exists:
            result['developments'].append(new_dev)
    
    for new_rel in extracted_data.relations:
        result['relations'].append(new_rel)
    
    return result

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
async def extract_info(request: schemas.ExtractRequest):
    api_key = os.getenv("NVIDIA_API_KEY")
    
    if api_key and api_key != "your_nvidia_api_key_here":
        try:
            return await extract_with_ai(request.text, api_key)
        except Exception as e:
            print(f"AI 提取失败: {e}")
            raise HTTPException(status_code=500, detail=f"AI信息提取失败: {str(e)}")
    
    raise HTTPException(status_code=500, detail="NVIDIA_API_KEY 未配置")

async def extract_with_ai(text: str, api_key: str) -> schemas.ExtractResponse:
    system_prompt = """你是一个专业的人物信息提取助手。请仔细分析用户输入的文本，按语义智能提取所有相关信息，并严格按照以下JSON格式输出，不要包含任何额外的解释或说明。

{
  "profile": {
    "name": "主要人物姓名（必填）",
    "job": "职业或工作内容（可选）",
    "birthday": "生日（可选，格式为MM-DD或YYYY-MM-DD，例如：05-20、1990-05-20）",
    "notes": [
      "其它个人信息，如过敏、饮食喜好、学校、习惯等。例如：对海鲜过敏、爱吃榴莲、深圳中学、早睡早起"
    ],
    "events": [
      {
        "date": "日期（格式为YYYY-MM-DD）",
        "location": "地点（可选）",
        "description": "事件详细描述"
      }
    ]
  },
  "annotations": [
    {
      "time": "时间（格式为YYYY-MM-DD或YYYY-MM）",
      "location": "地点（可选）",
      "description": "关键动作或待办事项描述"
    }
  ],
  "developments": [
    {
      "content": "发展方向或领域内容",
      "type": "resource"
    }
  ],
  "relations": [
    {
      "name": "相关人物姓名",
      "relation_type": "关系类型，如朋友、同事、同学、家人等"
    }
  ]
}

【重要提取规则】
1. 当前参考日期：2026-02-20
   - 相对时间转换：
     - "昨天" → 2026-02-19
     - "今天" → 2026-02-20
     - "明天" → 2026-02-21
     - "下个月" → 2026-03（格式YYYY-MM）
     - "6月18日" → 06-18（格式MM-DD，用于生日）
   - 如果文本中没有明确提到时间，但有明确的动作/事件（如"吃晚饭"、"见面"等），默认认为是今天发生的，日期设为2026-02-20

2. 事件(events)：提取过去或已经发生的事情，或者没有明确时间但已经发生或正在发生的事情
3. 标注(annotations)：只提取未来的计划、约定或待办事项
4. 发展方向(developments)：提取人物从事的领域、行业或专业方向
5. 生日提取：仔细查找生日相关表述，如"生日是5月20日"、"5月20日是她生日"、"1990年5月20日出生"等，提取为MM-DD或YYYY-MM-DD格式
6. 如果某个字段没有明确提到的信息，保持为null或空数组
7. 绝对不要编造任何信息，只提取文本中明确存在的内容
8. 注意区分事件和标注：已发生的放events，未来计划放annotations
9. 对于类似"和张三吃晚饭"这样的文本，"张三"是主要人物姓名，"吃晚饭"是事件描述，日期默认为今天，不要把张三放到relations里！
10.【关键】事件描述必须忠实于原文，不要随意添加或修改原文中没有的信息。例如：原文是"吃饭"，就保留"吃饭"，不要改成"和我吃饭"、"一起吃饭"等；原文是"吃晚饭"，就保留"吃晚饭"。
11.【关键】不要添加冗余的、原文中没有明确提到的词语（如"和我"、"我们"、"一起"等），除非原文明确提到。
12. 事件描述要简洁明了，准确反映原文内容，确保信息质量。
13.【关键】地点提取要保持一致性：
    - 对于常见城市名称，使用标准简称，如"上海"、"北京"、"深圳"、"广州"等
    - 不要添加冗余前缀或后缀，如"上海市"简称为"上海"，"北京市"简称为"北京"
    - 对于公司、餐厅等具体地点，直接提取原文中的完整名称
    - 同一地点在多次提取中必须保持相同的表述，例如始终用"上海"而不要一会儿"上海"一会儿"上海市"
14.【关键】所有信息的提取都要保持用词一致性，避免同一概念有多种不同表述，确保后续数据比对和处理的准确性。
15.【关键】其它个人信息(notes)提取：仔细识别文本中不属于事件、标注、发展方向的个人信息，例如：
    - 过敏信息：如"对海鲜过敏"、"对芒果过敏"
    - 饮食喜好：如"爱吃榴莲"、"喜欢吃辣"、"不喜欢吃香菜"
    - 学校/教育背景：如"深圳中学"、"清华大学毕业"
    - 习惯/特点：如"不喜欢喝酒"、"早睡早起"、"性格开朗"
    - 其他个人信息：任何与人物相关但不属于上述类别的信息
    - 直接提取原文中的描述，不要添加额外信息，不要分类，直接作为简单文本放入notes数组。"""

    models = [
        "z-ai/glm4.7",
        "deepseek-ai/DeepSeek-V3",
        "Qwen/Qwen2.5-72B-Instruct",
        "meta/llama-3.1-405b-instruct"
    ]
    
    last_error = None
    
    for model in models:
        try:
            print(f"开始调用NVIDIA API，模型: {model}，输入文本: {text}")
            async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
                response = await client.post(
                    "https://integrate.api.nvidia.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": text}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000
                    }
                )
            
            print(f"API响应状态码: {response.status_code}")
            
            if response.status_code != 200:
                print(f"API响应: {response.text}")
                last_error = f"API调用失败，状态码: {response.status_code}"
                continue
            
            result = response.json()
            print(f"API返回结果: {json.dumps(result, ensure_ascii=False)[:500]}")
            
            content = result["choices"][0]["message"]["content"]
            print(f"模型输出: {content}")
            
            if content is None:
                content = result["choices"][0]["message"].get("reasoning_content", "")
                print(f"使用 reasoning_content: {content[:500]}")
            
            json_match = re.search(r'\{[\s\S]*\}', content)
            if not json_match:
                last_error = "模型返回结果格式错误，无法提取JSON"
                continue
            
            json_str = json_match.group(0)
            data = json.loads(json_str)
            print(f"解析后的数据: {json.dumps(data, ensure_ascii=False)}")
            
            profile = data.get("profile", {})
            
            name = profile.get("name", "")
            if name is None:
                name = ""
            
            events = profile.get("events", [])
            if not events:
                events = data.get("events", [])
            
            print(f"模型 {model} 调用成功")
            return schemas.ExtractResponse(
                profile=schemas.ExtractedProfile(
                    name=name,
                    job=profile.get("job"),
                    birthday=profile.get("birthday"),
                    notes=profile.get("notes", []),
                    events=[schemas.EventBase(**e) for e in events]
                ),
                annotations=[schemas.AnnotationBase(**a) for a in data.get("annotations", [])],
                developments=[schemas.DevelopmentBase(**d) for d in data.get("developments", [])],
                relations=[schemas.ExtractedRelation(**r) for r in data.get("relations", []) if r.get("name")]
            )
        except Exception as e:
            print(f"模型 {model} 调用失败: {e}")
            import traceback
            print(f"堆栈跟踪: {traceback.format_exc()}")
            last_error = str(e)
            continue
    
    print(f"所有模型都调用失败，最后错误: {last_error}")
    raise HTTPException(status_code=500, detail=f"所有模型都调用失败: {last_error}")



@app.post("/confirm", response_model=schemas.ConfirmResponse)
def confirm_data(request: schemas.ConfirmRequest, db: Session = Depends(get_db)):
    try:
        if request.is_new_person:
            person = models.Person(
                name=request.profile.name,
                profile={"job": request.profile.job, "birthday": request.profile.birthday, "notes": request.profile.notes}
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
            existing_notes = current_profile.get("notes", [])
            for note in request.profile.notes:
                if note not in existing_notes:
                    existing_notes.append(note)
            current_profile["notes"] = existing_notes
            person.profile = current_profile
            
            import asyncio
            extracted_data_for_compare = schemas.ExtractResponse(
                profile=request.profile,
                annotations=request.annotations,
                developments=request.developments,
                relations=request.relations
            )
            compare_result = asyncio.run(compare_and_filter_new_data(person, extracted_data_for_compare))
            
            events_to_replace = compare_result.get('events_to_replace', [])
            for replace_info in events_to_replace:
                old_event_id = replace_info['old_event_id']
                old_event = db.query(models.Event).filter(models.Event.id == old_event_id).first()
                if old_event:
                    db.delete(old_event)
            
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

@app.get("/circles/{circle_id}", response_model=schemas.CircleWithMembers)
def get_circle(circle_id: int, db: Session = Depends(get_db)):
    circle = db.query(models.Circle).filter(models.Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="圈子不存在")
    
    members = []
    for pc in circle.person_circles:
        person = db.query(models.Person).filter(models.Person.id == pc.person_id).first()
        if person:
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
            members.append(schemas.Person(**person_dict))
    
    return schemas.CircleWithMembers(
        id=circle.id,
        name=circle.name,
        color=circle.color,
        created_at=circle.created_at,
        members=members
    )

@app.put("/circles/{circle_id}", response_model=schemas.Circle)
def update_circle(circle_id: int, circle_update: schemas.CircleUpdate, db: Session = Depends(get_db)):
    circle = db.query(models.Circle).filter(models.Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="圈子不存在")
    
    if circle_update.name is not None:
        existing_circle = db.query(models.Circle).filter(
            models.Circle.name == circle_update.name,
            models.Circle.id != circle_id
        ).first()
        if existing_circle:
            raise HTTPException(status_code=400, detail="圈子名称已存在")
        circle.name = circle_update.name
    
    if circle_update.color is not None:
        circle.color = circle_update.color
    
    db.commit()
    db.refresh(circle)
    return circle

@app.delete("/circles/{circle_id}")
def delete_circle(circle_id: int, db: Session = Depends(get_db)):
    circle = db.query(models.Circle).filter(models.Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="圈子不存在")
    db.delete(circle)
    db.commit()
    return {"success": True, "message": "圈子删除成功"}

@app.post("/circles/{circle_id}/persons/{person_id}")
def assign_person_to_circle(circle_id: int, person_id: int, db: Session = Depends(get_db)):
    circle = db.query(models.Circle).filter(models.Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(status_code=404, detail="圈子不存在")
    
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="人物不存在")
    
    existing = db.query(models.PersonCircle).filter(
        models.PersonCircle.circle_id == circle_id,
        models.PersonCircle.person_id == person_id
    ).first()
    if existing:
        return {"success": True, "message": "人物已在圈子中"}
    
    pc = models.PersonCircle(circle_id=circle_id, person_id=person_id)
    db.add(pc)
    db.commit()
    return {"success": True, "message": "人物添加成功"}

@app.delete("/circles/{circle_id}/persons/{person_id}")
def remove_person_from_circle(circle_id: int, person_id: int, db: Session = Depends(get_db)):
    pc = db.query(models.PersonCircle).filter(
        models.PersonCircle.circle_id == circle_id,
        models.PersonCircle.person_id == person_id
    ).first()
    if not pc:
        raise HTTPException(status_code=404, detail="人物不在该圈子中")
    db.delete(pc)
    db.commit()
    return {"success": True, "message": "人物移除成功"}

@app.get("/circles-with-members", response_model=List[schemas.CircleWithMembers])
def get_circles_with_members(db: Session = Depends(get_db)):
    circles = db.query(models.Circle).all()
    result = []
    for circle in circles:
        members = []
        for pc in circle.person_circles:
            person = db.query(models.Person).filter(models.Person.id == pc.person_id).first()
            if person:
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
                members.append(schemas.Person(**person_dict))
        result.append(schemas.CircleWithMembers(
            id=circle.id,
            name=circle.name,
            color=circle.color,
            created_at=circle.created_at,
            members=members
        ))
    return result

def get_semantic_similarity(s1: str, s2: str) -> float:
    s1_lower = s1.lower()
    s2_lower = s2.lower()
    
    synonyms = {
        'ai': ['人工智能', 'artificial intelligence'],
        '人工智能': ['ai', 'artificial intelligence'],
        '芯片': ['半导体', '集成电路'],
        '半导体': ['芯片', '集成电路'],
    }
    
    if s1_lower in synonyms:
        if s2_lower in synonyms[s1_lower]:
            return 1.0
    if s2_lower in synonyms:
        if s1_lower in synonyms[s2_lower]:
            return 1.0
    
    return calculate_similarity(s1_lower, s2_lower)

@app.post("/circles/auto-generate", response_model=schemas.AutoGenerateCirclesResponse)
def auto_generate_circles(db: Session = Depends(get_db)):
    MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8']
    
    persons = db.query(models.Person).all()
    
    content_groups = {}
    for person in persons:
        for dev in person.developments:
            content = dev.content
            if not content:
                continue
            
            found_group = None
            for existing_content in content_groups.keys():
                if get_semantic_similarity(content, existing_content) >= 0.8:
                    found_group = existing_content
                    break
            
            if found_group:
                if person.id not in content_groups[found_group]:
                    content_groups[found_group].append(person.id)
            else:
                content_groups[content] = [person.id]
    
    suggested_circles = []
    for i, (content, person_ids) in enumerate(content_groups.items()):
        color = MORANDI_COLORS[i % len(MORANDI_COLORS)]
        suggested_circles.append(schemas.SuggestedCircle(
            name=content,
            color=color,
            person_ids=person_ids
        ))
    
    return schemas.AutoGenerateCirclesResponse(suggested_circles=suggested_circles)

@app.post("/circles/confirm")
def confirm_circles(request: schemas.ConfirmCirclesRequest, db: Session = Depends(get_db)):
    for circle_data in request.circles:
        existing_circle = db.query(models.Circle).filter(models.Circle.name == circle_data.name).first()
        
        if existing_circle:
            for person_id in circle_data.person_ids:
                existing = db.query(models.PersonCircle).filter(
                    models.PersonCircle.circle_id == existing_circle.id,
                    models.PersonCircle.person_id == person_id
                ).first()
                if not existing:
                    pc = models.PersonCircle(circle_id=existing_circle.id, person_id=person_id)
                    db.add(pc)
        else:
            db_circle = models.Circle(name=circle_data.name, color=circle_data.color)
            db.add(db_circle)
            db.flush()
            
            for person_id in circle_data.person_ids:
                pc = models.PersonCircle(circle_id=db_circle.id, person_id=person_id)
                db.add(pc)
    
    db.commit()
    return {"success": True, "message": "圈子创建成功"}

@app.delete("/persons/{person_id}")
def delete_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="人物不存在")
    
    db.query(models.Relation).filter(
        (models.Relation.from_person_id == person_id) | 
        (models.Relation.to_person_id == person_id)
    ).delete()
    
    db.query(models.Event).filter(models.Event.person_id == person_id).delete()
    db.query(models.Annotation).filter(models.Annotation.person_id == person_id).delete()
    db.query(models.Development).filter(models.Development.person_id == person_id).delete()
    
    db.delete(person)
    db.commit()
    return {"success": True, "message": "人物删除成功"}

@app.put("/persons/{person_id}", response_model=schemas.Person)
def update_person(person_id: int, request: dict, db: Session = Depends(get_db)):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="人物不存在")
    
    if "name" in request:
        existing_person = db.query(models.Person).filter(
            models.Person.name == request["name"],
            models.Person.id != person_id
        ).first()
        if existing_person:
            raise HTTPException(status_code=400, detail="姓名已存在")
        person.name = request["name"]
    
    if "profile" in request:
        person.profile = request["profile"]
    
    if "events" in request:
        db.query(models.Event).filter(models.Event.person_id == person_id).delete()
        for event_data in request["events"]:
            event = models.Event(
                person_id=person_id,
                date=event_data.get("date", ""),
                location=event_data.get("location"),
                description=event_data.get("description", ""),
                source="user"
            )
            db.add(event)
    
    if "annotations" in request:
        db.query(models.Annotation).filter(models.Annotation.person_id == person_id).delete()
        for ann_data in request["annotations"]:
            ann = models.Annotation(
                person_id=person_id,
                time=ann_data.get("time", ""),
                location=ann_data.get("location"),
                description=ann_data.get("description", ""),
                source="user",
                confirmed_by_user=True
            )
            db.add(ann)
    
    if "developments" in request:
        db.query(models.Development).filter(models.Development.person_id == person_id).delete()
        for dev_data in request["developments"]:
            dev = models.Development(
                person_id=person_id,
                content=dev_data.get("content", ""),
                type=dev_data.get("type", "resource"),
                source="user",
                confirmed_by_user=True
            )
            db.add(dev)
    
    db.commit()
    db.refresh(person)
    
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

@app.post("/extract/check-name")
def check_name(request: dict, db: Session = Depends(get_db)):
    name = request.get("name", "")
    existing_person = db.query(models.Person).filter(models.Person.name == name).first()
    
    if existing_person:
        return {
            "exists": True,
            "person": {
                "id": existing_person.id,
                "name": existing_person.name,
                "job": existing_person.profile.get("job"),
                "birthday": existing_person.profile.get("birthday")
            }
        }
    else:
        return {"exists": False}

@app.post("/extract/compare", response_model=schemas.CompareResponse)
async def compare_data(request: dict, db: Session = Depends(get_db)):
    person_id = request.get("person_id")
    extracted_data_dict = request.get("extracted_data")
    
    if not person_id or not extracted_data_dict:
        raise HTTPException(status_code=400, detail="缺少必要参数")
    
    existing_person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not existing_person:
        raise HTTPException(status_code=404, detail="人物不存在")
    
    extracted_data = schemas.ExtractResponse(**extracted_data_dict)
    
    result = await compare_and_filter_new_data(existing_person, extracted_data)
    
    return schemas.CompareResponse(
        profile=schemas.ExtractedProfile(**result['profile']),
        annotations=result['annotations'],
        developments=result['developments'],
        relations=result['relations'],
        conflicts=result['conflicts']
    )
