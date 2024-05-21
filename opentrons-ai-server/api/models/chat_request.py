from pydantic import BaseModel
from typing import List

class Chat(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Chat]] = None
    fake: bool