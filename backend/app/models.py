from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import json

class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    avatar = Column(String, nullable=True)
    profile_json = Column(Text, nullable=False, default='{}')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    events = relationship("Event", back_populates="person", cascade="all, delete-orphan")
    annotations = relationship("Annotation", back_populates="person", cascade="all, delete-orphan")
    developments = relationship("Development", back_populates="person", cascade="all, delete-orphan")
    relations_from = relationship("Relation", foreign_keys="Relation.from_person_id", back_populates="from_person", cascade="all, delete-orphan")
    relations_to = relationship("Relation", foreign_keys="Relation.to_person_id", back_populates="to_person", cascade="all, delete-orphan")
    person_circles = relationship("PersonCircle", back_populates="person", cascade="all, delete-orphan")

    @property
    def profile(self):
        return json.loads(self.profile_json)

    @profile.setter
    def profile(self, value):
        self.profile_json = json.dumps(value, ensure_ascii=False)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    date = Column(String, nullable=False)
    location = Column(String, nullable=True)
    description = Column(String, nullable=False)
    source = Column(String, nullable=False, default='user')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    person = relationship("Person", back_populates="events")

class Relation(Base):
    __tablename__ = "relations"

    id = Column(Integer, primary_key=True, index=True)
    from_person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    to_person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    relation_type = Column(String, nullable=False)
    confirmed_by_user = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    from_person = relationship("Person", foreign_keys=[from_person_id], back_populates="relations_from")
    to_person = relationship("Person", foreign_keys=[to_person_id], back_populates="relations_to")

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    time = Column(String, nullable=False)
    location = Column(String, nullable=True)
    description = Column(String, nullable=False)
    source = Column(String, nullable=False, default='user')
    confirmed_by_user = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    person = relationship("Person", back_populates="annotations")

class Development(Base):
    __tablename__ = "developments"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    content = Column(String, nullable=False)
    type = Column(String, nullable=False, default='resource')
    source = Column(String, nullable=False, default='user')
    confirmed_by_user = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    person = relationship("Person", back_populates="developments")

class Circle(Base):
    __tablename__ = "circles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    color = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    person_circles = relationship("PersonCircle", back_populates="circle", cascade="all, delete-orphan")

class PersonCircle(Base):
    __tablename__ = "person_circles"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    circle_id = Column(Integer, ForeignKey("circles.id"), nullable=False)
    assigned_by_user = Column(Boolean, nullable=False, default=True)

    person = relationship("Person", back_populates="person_circles")
    circle = relationship("Circle", back_populates="person_circles")

class GraphLayout(Base):
    __tablename__ = "graph_layout"

    user_id = Column(String, primary_key=True, default='default')
    layout_json = Column(Text, nullable=False, default='{}')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
