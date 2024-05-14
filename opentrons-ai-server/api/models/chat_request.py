from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    fake: bool
