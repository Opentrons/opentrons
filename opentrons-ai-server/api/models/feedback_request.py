from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class FeedbackRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    feedback_text: str = Field(..., description="The feedback message content")
    fake: Optional[bool] = Field(False, description="Indicates if this is a fake feedback entry")

    @field_validator("feedback_text")
    def feedback_text_must_not_be_empty(cls, value: str) -> str:
        if not value or value.strip() == "":
            raise ValueError("feedback_text must be populated and not empty")
        return value
