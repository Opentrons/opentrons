from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class InternalServerError(BaseModel):
    """Generic 500 payload for clients. Details belong in server logs only."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    message: str = "Internal server error"
    error_type: str = "InternalServerError"
