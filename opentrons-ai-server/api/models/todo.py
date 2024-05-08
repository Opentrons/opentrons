from typing import List

from pydantic import BaseModel


class Todo(BaseModel):
    userId: int
    id: int
    title: str
    completed: bool


class Todos(List[Todo]):
    pass
