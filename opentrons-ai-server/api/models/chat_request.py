from pydantic import BaseModel
from openai.types.chat import ChatCompletionMessageParam

from typing import List, Optional

class Chat(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatCompletionMessageParam]] = None
    fake: bool