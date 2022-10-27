"""A SQL column type to store Pydantic models."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
import sqlalchemy
import sqlalchemy.ext.compiler


@dataclass(frozen=True)
class UnparsedPydanticJSON:
    """
    Raw JSON string, paired with the Python model that the JSON string conforms to.
    """

    declared_model: Type[BaseModel]
    raw_json: str


class PydanticJSON(sqlalchemy.types.TypeDecorator[UnparsedPydanticJSON]):
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

    def __init__(self, model: Type[BaseModel]) -> None:
        self._model = model
        super().__init__()

    def process_bind_param(
        self,
        value: Optional[UnparsedPydanticJSON],
        dialect: object,
    ) -> Optional[str]:
        """Prepare a value to be inserted via SQLAlchemy."""
        if isinstance(value, UnparsedPydanticJSON):
            if value.declared_model == self._model:
                return value.raw_json
            else:
                raise TypeError(
                    f"This SQL column is declared to contain serialized {self._model}"
                    f" objects, but you're trying to insert a serialized"
                    f" {value.declared_model} object."
                )
        elif value is None:
            return None  # Inserting a SQL NULL value.
        else:
            raise TypeError(
                f"This SQL column is declared to contain serialized {self._model}"
                f" objects, but you're trying to insert a {type(value)} object."
                f" Forgot to use pydantic_to_sql()?"
            )

    def process_result_value(
        self,
        value: Optional[str],
        dialect: object,
    ) -> Optional[UnparsedPydanticJSON]:
        """Fix up a string value extracted by SQLAlchemy."""
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


_ModelToExtract = TypeVar("_ModelToExtract", bound=BaseModel)


def sql_to_pydantic(
    model: Type[_ModelToExtract],
    sql_value: UnparsedPydanticJSON,
) -> _ModelToExtract:
    """
    Warning: Heavy parsing from JSON to dict and from dict to Pydantic.
    Do this outside of a SQL transaction and in its own process.
    """
    if isinstance(sql_value, UnparsedPydanticJSON):
        if sql_value.declared_model == model:
            return model.parse_raw(sql_value.raw_json)
        else:
            raise TypeError(
                f"This value came from a SQL column declared to contain"
                f" {sql_value.declared_model}, but you're trying to read it as"
                f" {model}."
            )
    elif sql_value is None:
        raise TypeError("Value from SQL is None. Maybe the column is nullable?")
    else:
        raise TypeError(
            f"This value, of type {type(sql_value)},"
            f" did not come from a SQL column that's declared"
            f" to contain Pydantic objects."
        )


def pydantic_to_sql(data: BaseModel) -> UnparsedPydanticJSON:
    return UnparsedPydanticJSON(
        declared_model=type(data),
        raw_json=data.json(
            by_alias=True,  # For consistency with how models are serialized over HTTP.
        ),
    )
