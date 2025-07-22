from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """Response model for file upload"""

    id: str = Field(..., description="Unique file identifier from Anthropic")
    filename: str = Field(..., description="Original filename")
    mime_type: str = Field(..., description="File MIME type")
    size_bytes: int = Field(..., description="File size in bytes")
    user_id: str = Field(..., description="User who uploaded the file")
    file_type: str = Field(..., description="File type: 'pdf', 'csv', 'python'")
    created_at: datetime = Field(..., description="Upload timestamp")
    downloadable: bool = Field(default=False, description="Whether file can be downloaded")


class FileReference(BaseModel):
    """Reference to an uploaded file for use in chat messages"""

    id: str = Field(..., description="File ID from upload response")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type: 'pdf', 'csv', 'python'")
    content: Optional[str] = Field(None, description="File content for local processing")
    media_type: Optional[str] = Field(None, description="Media type of the content")


class FileMetadata(BaseModel):
    """Metadata stored with uploaded files"""

    user_id: str = Field(..., description="User who uploaded the file")
    original_name: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="Processed file type")
    content: str = Field(..., description="Original file content")
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatAttachment(BaseModel):
    """File attachment in chat messages"""

    id: str = Field(..., description="File ID")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type")
    size_bytes: int = Field(..., description="File size")
