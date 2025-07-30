from typing import Optional

from pydantic import BaseModel, Field


class FileReference(BaseModel):
    """Reference to a file with content included for local processing"""

    id: str = Field(..., description="File ID (locally generated)")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type: 'pdf', 'csv', 'python'")
    content: Optional[str] = Field(None, description="File content for local processing")
    media_type: Optional[str] = Field(None, description="Media type of the content")
