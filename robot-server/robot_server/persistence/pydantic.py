"""Store Pydantic objects in the SQL database."""

from typing import Type, TypeVar
from pydantic import BaseModel


_BaseModelT = TypeVar("_BaseModelT", bound=BaseModel)


def pydantic_to_json(obj: BaseModel) -> str:
    """Serialize a Pydantic object for storing in the SQL database."""
    return obj.json(
        # by_alias and exclude_none should match how
        # FastAPI + Pydantic + our customizations serialize these objects
        by_alias=True,
        exclude_none=True,
    )


def pydantic_list_to_json(obj_list: Sequence[BaseModel]) -> str:
    """Serialize a list of Pydantic objects for storing in the SQL database."""
    return json.dumps([obj.dict(by_alias=True, exclude_none=True) for obj in obj_list])


def json_to_pydantic(model: Type[_BaseModelT], json_str: str) -> _BaseModelT:
    """Parse a Pydantic object stored in the SQL database."""
    return model.model_validate_json(json_str)


def json_to_pydantic_list(model: Type[_BaseModelT], json_str: str) -> List[_BaseModelT]:
    """Parse a list of Pydantic objects stored in the SQL database."""
    return [parse_obj_as(model, obj_dict) for obj_dict in json.loads(json_str)]
