from typing import List, Optional

from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel


class Chat(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatCompletionMessageParam]] = None
    fake: bool
