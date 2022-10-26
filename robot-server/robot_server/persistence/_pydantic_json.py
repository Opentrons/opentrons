"""A SQL column type to store Pydantic models."""

from __future__ import annotations

from typing import Generic, Optional, Type, TypeVar
from pydantic import BaseModel
import sqlalchemy
import sqlalchemy.ext.compiler


_PydanticModelT = TypeVar("_PydanticModelT", bound=BaseModel)


class UnparsedPydanticJSON(Generic[_PydanticModelT]):
    """
    Raw JSON string, paired with the Python model that the JSON string conforms to.
    """

    def __init__(self, declared_model: Type[_PydanticModelT], raw_json: str) -> None:
        self._declared_model = declared_model
        self._raw_json = raw_json


class PydanticJSON(
    Generic[_PydanticModelT],
    sqlalchemy.types.TypeDecorator[UnparsedPydanticJSON[_PydanticModelT]],
):
    # Make SQLAlchemy insert the data into the SQLite as a string,
    # and use Python `str`s for passing data between our code and SQLAlchemy.
    #
    # We deliberately avoid using sqlalchemy.JSON. It would use JSON-like `dict`s for
    # passing data between our code and SQLAlchemy, which is problematic:
    #
    #   * It's difficult to robustly convert Pydantic models to and from JSON-like
    #     `dict`s. https://github.com/pydantic/pydantic/issues/1409
    #   * SQLAlchemy would internally do the conversion between `dict`s and raw JSON
    #     strings. This would do heavy compute work inside the SQLAlchemy transaction,
    #     holding SQLite's database lock open for too long.
    impl = sqlalchemy.String

    cache_ok = True

    def __init__(self, model: Type[_PydanticModelT]) -> None:
        self._model = model
        super().__init__()

    def process_bind_param(
        self,
        value: Optional[UnparsedPydanticJSON[_PydanticModelT]],
        dialect: object,
    ) -> Optional[str]:
        """Prepare to insert via SQLAlchemy."""
        if value is None:
            return None  # Inserting a SQL NULL value.
        else:
            assert isinstance(value, UnparsedPydanticJSON)
            # TODO: Should we loosen the type annotation of value?
            # TODO: Assert message.
            assert value._declared_model == self._model
            return value._raw_json

    def process_result_value(
        self,
        value: Optional[str],
        dialect: object,
    ) -> Optional[UnparsedPydanticJSON[_PydanticModelT]]:
        """Fix up a string extracted from SQLAlchemy."""
        if value is None:
            return None  # Extracting a SQL NULL value.
        else:
            return UnparsedPydanticJSON(
                declared_model=self._model,
                raw_json=value,
            )


# Use `BLOB` as the raw SQL-level column type, as opposed to `VARCHAR`.
#
# This is to match sqlalchemy.PickleType and sqlalchemy.LargeBinary,
# making it a little bit easier to migrate from them--
# we only have to migrate the data, not change the column type.
@sqlalchemy.ext.compiler.compiles(PydanticJSON)  # type: ignore[misc]
def _compile_as_blob(type_: object, compiler: object, **kwargs: object) -> str:
    return "BLOB"


def sql_to_pydantic(
    model: Type[_PydanticModelT],
    sql_value: object,
) -> _PydanticModelT:
    """
    Warning: Heavy parsing from JSON to dict and from dict to Pydantic.
    Do this outside of a SQL transaction and in its own process.
    """
    assert isinstance(sql_value, UnparsedPydanticJSON)
    assert sql_value._declared_model == model
    return model.parse_raw(sql_value._raw_json)


def pydantic_to_sql(data: _PydanticModelT) -> UnparsedPydanticJSON[_PydanticModelT]:
    return UnparsedPydanticJSON(
        declared_model=type(data),
        raw_json=data.json(
            by_alias=True,
            # TODO: exclude_none, etc.?
        ),
    )
