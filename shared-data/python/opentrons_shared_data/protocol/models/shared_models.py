from typing import Optional
from pydantic import BaseModel

class Liquid(BaseModel):
    displayName: str
    description: str
    displayColor: Optional[str]

class Labware(BaseModel):
    displayName: Optional[str]
    definitionId: str