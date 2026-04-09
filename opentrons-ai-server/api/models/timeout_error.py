from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class TimeoutError(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    detail: str
    message: str
    error_type: str = "request_timeout"
    timeout_seconds: int
