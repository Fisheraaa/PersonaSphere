from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class EventBase(BaseModel):
    date: str
    location: Optional[str] = None
    description: str

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    person_id: int
    source: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnnotationBase(BaseModel):
    time: str
    location: Optional[str] = None
    description: str

class AnnotationCreate(AnnotationBase):
    pass

class Annotation(AnnotationBase):
    id: int
    person_id: int
    source: str
    confirmed_by_user: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DevelopmentBase(BaseModel):
    content: str
    type: str = "resource"

class DevelopmentCreate(DevelopmentBase):
    pass

class Development(DevelopmentBase):
    id: int
    person_id: int
    source: str
    confirmed_by_user: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RelationBase(BaseModel):
    to_person_id: int
    relation_type: str

class RelationCreate(RelationBase):
    pass

class Relation(RelationBase):
    id: int
    from_person_id: int
    confirmed_by_user: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PersonBase(BaseModel):
    name: str
    avatar: Optional[str] = None
    profile: Dict[str, Any] = Field(default_factory=dict)

class PersonCreate(PersonBase):
    pass

class PersonUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None

class Person(PersonBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    events: List[Event] = []
    annotations: List[Annotation] = []
    developments: List[Development] = []

    class Config:
        from_attributes = True

class CircleBase(BaseModel):
    name: str
    color: str

class CircleCreate(CircleBase):
    pass

class Circle(CircleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PersonCircleBase(BaseModel):
    person_id: int
    circle_id: int

class PersonCircleCreate(PersonCircleBase):
    pass

class PersonCircle(PersonCircleBase):
    id: int
    assigned_by_user: bool

    class Config:
        from_attributes = True

class ExtractRequest(BaseModel):
    text: str = Field(..., max_length=2000)

class ExtractedProfile(BaseModel):
    name: str
    job: Optional[str] = None
    birthday: Optional[str] = None
    events: List[EventBase] = Field(default_factory=list)

class ExtractedRelation(BaseModel):
    name: str
    relation_type: str

class ExtractResponse(BaseModel):
    profile: ExtractedProfile
    annotations: List[AnnotationBase] = Field(default_factory=list)
    developments: List[DevelopmentBase] = Field(default_factory=list)
    relations: List[ExtractedRelation] = Field(default_factory=list)

class ConfirmRequest(BaseModel):
    original_text: str
    is_new_person: bool
    person_id: Optional[int] = None
    profile: ExtractedProfile
    annotations: List[AnnotationBase]
    developments: List[DevelopmentBase]
    relations: List[ExtractedRelation]
    conflict_resolutions: Optional[Dict[str, Any]] = None

class ConfirmResponse(BaseModel):
    success: bool
    person_id: int
    message: str

class GraphNode(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None

class GraphEdge(BaseModel):
    source: int
    target: int
    relation_type: str

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class GraphLayoutRequest(BaseModel):
    layout_json: Dict[str, Any]

class GraphLayoutResponse(BaseModel):
    success: bool
    message: str
