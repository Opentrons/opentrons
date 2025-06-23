from typing import Literal, Optional

from pydantic import BaseModel, Field


class UpdateProtocol(BaseModel):
    prompt: str = Field(..., description="Prompt")
    protocol_text: Optional[str] = Field(None, description="Text of the protocol")
    regenerate: bool = Field(..., description="Flag to indicate if regeneration is needed")
    update_type: Literal["adapt_python_protocol", "change_labware", "change_pipettes", "add_runtime_parameters", "other"] = Field(
        ..., description="Type of update"
    )
    update_details: str = Field(..., description="Details of the update")
    fake: Optional[bool] = Field(False, description="Fake response?")
    fake_key: Optional[int] = Field(None, description="type of response")
