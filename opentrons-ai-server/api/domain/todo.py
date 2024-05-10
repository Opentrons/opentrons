from typing import Any, List

from httpx import Response

from api.integration.jsonplaceholder import JSONPlaceholder
from api.models.todo import Todo, Todos


def handle_todos_response(response: Response) -> None | Any:
    if response.status_code == 200:
        return response.json()
    return None


def map_todos(todos: List[dict[Any, Any]]) -> Todos:
    # limit to 5
    return Todos([Todo(**todo) for todo in todos][:5])


def retrieve_todos() -> Todos:
    response = JSONPlaceholder().get_todos()
    todos = handle_todos_response(response)
    return map_todos(todos) if todos else Todos([])
