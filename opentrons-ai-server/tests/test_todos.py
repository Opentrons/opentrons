import pytest
from api.domain.todo import map_todos
from api.models.todo import Todo, Todos
from pydantic import ValidationError


@pytest.mark.parametrize(
    "data",
    [
        {"userId": "not-an-int", "id": 1, "title": "Test Todo", "completed": False},  # Invalid userId
        {"userId": 1, "id": 1, "title": None, "completed": False},  # Null title
        {"userId": 1, "id": 1, "title": "Test Todo", "completed": "nope"},  # Invalid completed
    ],
)
@pytest.mark.unit
def test_todo_item_validation_errors(data) -> None:
    with pytest.raises(ValidationError):
        Todo(**data)


@pytest.mark.parametrize(
    "todos, expected",
    [
        # Test case 1: Empty list
        ([], []),
        # Test case 2: Single todo
        ([{"id": 1, "title": "Todo 1", "completed": False, "userId": 101}], [Todo(id=1, title="Todo 1", completed=False, userId=101)]),
        # Test case 3: Multiple todos
        (
            [
                {"id": 1, "title": "Todo 1", "completed": False, "userId": 101},
                {"id": 2, "title": "Todo 2", "completed": True, "userId": 102},
                {"id": 3, "title": "Todo 3", "completed": False, "userId": 103},
            ],
            [
                Todo(id=1, title="Todo 1", completed=False, userId=101),
                Todo(id=2, title="Todo 2", completed=True, userId=102),
                Todo(id=3, title="Todo 3", completed=False, userId=103),
            ],
        ),
    ],
)
@pytest.mark.unit
def test_map_todos_parameterized(todos, expected) -> None:
    todos: Todos = map_todos(todos)
    assert todos == expected
