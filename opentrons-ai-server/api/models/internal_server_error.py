from pydantic import BaseModel


class InternalServerError(BaseModel):
    message: str = "Internal server error"
    exception_message: str = ""

    def __init__(self, *, exception_message: str = "", exception_object: Exception | None = None, **kwargs: object) -> None:
        kwargs_copy = dict(kwargs)
        kwargs_copy.pop("exception_object", None)
        if exception_object is not None:
            super().__init__(exception_message=str(exception_object), **kwargs_copy)
        else:
            super().__init__(exception_message=exception_message, **kwargs_copy)
