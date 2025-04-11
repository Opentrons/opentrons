from pydantic import BaseModel


class ChatResponse(BaseModel):
    reply: str
    fake: bool
    protocol_content: str
