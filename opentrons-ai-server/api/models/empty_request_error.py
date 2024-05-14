from pydantic import BaseModel


class EmptyRequestError(BaseModel):
    error: str = "Empty request"
    message: str
