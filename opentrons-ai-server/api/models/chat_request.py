from typing import Annotated, Any, Dict, List, Literal, Optional

from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from api.models.file_attachment import FileReference
from api.models.protocol_format import ProtocolFormat


class Chat(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    role: str
    content: str
    attachments: Optional[List[FileReference]] = Field(None, description="File attachments in this message")


FakeKeys = Literal[
    "reagent transfer",
    "reagent transfer flex",
    "pcr",
    "pcr flex",
    "no markdown",
    "empty reply",
    "pd serial diliution",
]
FakeKeyType = Annotated[
    Optional[FakeKeys], Field(None, description="The key to use for the fake response. If not provided, the default is used.")
]

HistoryType = Annotated[
    Optional[List[ChatCompletionMessageParam]],
    Field(None, description="Chat history in the form of a list of messages. Type is from OpenAI's ChatCompletionMessageParam"),
]

ChatOptions = Literal["update", "create"]
ChatOptionType = Annotated[Optional[ChatOptions], Field("create", description="which chat pathway did the user enter: create or update")]


class ChatRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    message: str = Field(..., description="The latest message to be processed.")
    history: HistoryType
    fake: bool = Field(True, description="When set to true, the response will be a fake. OpenAI API is not used.")
    fake_key: FakeKeyType
    chat_options: ChatOptionType
    pd_protocol_content: Optional[Dict[str, Any]] = Field(None, description="PD protocol that was previously generated")
    protocol_format: ProtocolFormat = ProtocolFormat.PYTHON
    attachments: Optional[List[FileReference]] = Field(None, description="File attachments to include in the message")
