from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class EmptyRequestError(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    error: str = "Empty request"
    message: str
    error_type: str = "BadRequestError"
