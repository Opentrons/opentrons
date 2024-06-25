from typing import List, Optional

from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel, Field


class Chat(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="The latest message to be processed.")
    history: Optional[List[ChatCompletionMessageParam]] = Field(
        None, description="Chat history in the form of a list of messages.  Type is from OpenAI's ChatCompletionMessageParam"
    )
    fake: bool = Field(True, description="When set to true, the response will be a fake. OpenAI API is not used.")
