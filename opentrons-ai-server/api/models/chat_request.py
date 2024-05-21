from pydantic import BaseModel
from typing import List

class Chat(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    chat_history: List[Chat]
    fake: bool