from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ErrorResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    message: str
    error_type: str = "unknown"
