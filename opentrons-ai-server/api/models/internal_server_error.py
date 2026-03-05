from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class InternalServerError(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    message: str = "Internal server error"
    exception_message: str = ""
    error_type: str = "InternalServerError"

    def __init__(self, *, exception_message: str = "", exception_object: Exception | None = None, **kwargs: object) -> None:
        if exception_object is not None:
            super().__init__(exception_message=str(exception_object), **kwargs)
        else:
            super().__init__(exception_message=exception_message, **kwargs)
