from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, DateTime

Base = declarative_base()
metadata = Base.metadata

class Protocol(Base):

    __tablename__ = 'protocol'

    id = Column(String(255), primary_key=True)
    created_at = Column(DateTime, nullable=False)