from pydantic import BaseModel


class InternalServerError(BaseModel):
    message: str = "Internal server error"
    exception_object: Exception

    class Config:
        arbitrary_types_allowed = True
