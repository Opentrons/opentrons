"""Store Pydantic objects in the SQL database."""

import json
from typing import Type, TypeVar, List, Sequence, Any, overload
from pydantic import BaseModel, TypeAdapter, parse_obj_as


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


# TODO: It would be nice to type this function as (Type[_BasemodelT] | TypeAdapter[_BaseModelT]) -> _BaseModelT,
# but TypeAdapters are "typing special forms" and can't be used in an type context. We need [PEP747](https://peps.python.org/pep-0747)
# for this (see also https://github.com/python/mypy/issues/9773 ). We may be able to special case support for either
# a model or union of models using variadic generics, but that needs mypy 1.9. For now, loosen the constraints and cast.
@overload
def json_to_pydantic(model: Type[_BaseModelT], json_str: str) -> _BaseModelT:
    ...


@overload
def json_to_pydantic(model: Any, json_str: str) -> Any:
    ...


def json_to_pydantic(
    model: Type[_BaseModelT] | TypeAdapter[_BaseModelT], json_str: str
) -> _BaseModelT:
    """Parse a Pydantic object stored in the SQL database."""
    if isinstance(model, TypeAdapter):
        return model.validate_json(json_str)
    else:
        return model.model_validate_json(json_str)


def json_to_pydantic_list(model: Type[_BaseModelT], json_str: str) -> List[_BaseModelT]:
    """Parse a list of Pydantic objects stored in the SQL database."""
    return [parse_obj_as(model, obj_dict) for obj_dict in json.loads(json_str)]
