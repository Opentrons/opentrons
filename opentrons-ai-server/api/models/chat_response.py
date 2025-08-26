from typing import Any, Dict, Optional

from pydantic import BaseModel


class ChatResponse(BaseModel):
    reply: str
    fake: bool
    protocol_content: Optional[Dict[str, Any]] = None
    file_token_warning: Optional[str] = None
