from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class FileReference(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str = Field(..., description="File ID (locally generated)")
    filename: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type: 'pdf', 'csv', 'python'")
    content: Optional[str] = Field(None, description="File content for local processing")
    media_type: Optional[str] = Field(None, description="Media type of the content")
