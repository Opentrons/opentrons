"""Store Pydantic objects in the SQL database."""

from typing import Type, TypeVar
from pydantic import BaseModel, parse_raw_as


_BaseModelT = TypeVar("_BaseModelT", bound=BaseModel)


def pydantic_to_json(obj: BaseModel) -> str:
    """Serialize a Pydantic object for storing in the SQL database."""
    return obj.json(
        # by_alias and exclude_none should match how
        # FastAPI + Pydantic + our customizations serialize these objects
        by_alias=True,
        exclude_none=True,
    )


def json_to_pydantic(model: Type[_BaseModelT], json: str) -> _BaseModelT:
    """Parse a Pydantic object stored in the SQL database."""
    return parse_raw_as(model, json)
