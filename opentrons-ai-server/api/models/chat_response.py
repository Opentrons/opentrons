from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ChatResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    reply: str
    fake: bool
    protocol_content: Optional[Dict[str, Any]] = None
    file_token_warning: Optional[str] = None
