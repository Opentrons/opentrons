from pydantic import BaseModel


class ChatResponse(BaseModel):
    reply: str
    fake: bool
