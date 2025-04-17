from pydantic import BaseModel
from typing import Optional


class ChatResponse(BaseModel):
    reply: str
    fake: bool
    protocol_content: Optional[dict] = None