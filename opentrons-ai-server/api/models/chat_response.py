from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ChatResponse(BaseModel):
    reply: str
    fake: bool
    protocol_content: Optional[Dict[str, Any]] = None
    file_token_warning: Optional[str] = None
    # When fake=True and request had file uploads (e.g. completion-multipart), list of received filenames
    received_files: Optional[List[str]] = None
