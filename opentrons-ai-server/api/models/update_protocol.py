from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class UpdateProtocol(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    prompt: str = Field(..., description="Prompt")
    protocol_text: str = Field(..., description="Text of the protocol")
    regenerate: bool = Field(..., description="Flag to indicate if regeneration is needed")
    update_type: Literal[
        "adapt_python_protocol", "add_flex_stackers", "change_labware", "change_pipettes", "add_runtime_parameters", "other"
    ] = Field(..., description="Type of update")
    update_details: str = Field(..., description="Details of the update")
    fake: Optional[bool] = Field(False, description="Fake response?")
    fake_key: Optional[str] = Field(None, description="Fake response key for testing")
