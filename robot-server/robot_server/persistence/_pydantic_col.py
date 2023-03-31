"""A custom SQLAlchemy column type to store serialized Pydantic models."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Type, TypeVar
from pydantic import BaseModel
import sqlalchemy


def pydantic_to_sql(value: BaseModel) -> SerializedPydanticModel:
    """Prepare a Pydantic object to be stored into SQLAlchemy.

    Args:
        value: The value that you want to store.

    Returns:
        A serialized object that you can insert into a `PydanticCol` SQLAlchemy column.

    Warning:
        This does JSON serialization, which can be heavy.
        Call this from outside any SQL transactions to avoid hogging the SQLite lock,
        and offload this to a worker to avoid blocking the event loop.
    """
    return SerializedPydanticModel(
        _model=type(value),
        _serialized_json=value.json(
            by_alias=True,  # For consistency with how models are serialized over HTTP.
        ).encode("utf-8"),
    )


_ModelToExtract = TypeVar("_ModelToExtract", bound=BaseModel)


def sql_to_pydantic(
    sql_value: object,
    model: Type[_ModelToExtract],
) -> _ModelToExtract:
    """Parse a value that you've just extracted from SQLAlchemy as a Pydantic object.

    Args:
        sql_value: The value that you extracted from SQLAlchemy. This must come from
            a `PydanticCol` column, and it must not be `None`.
        model: The `pydantic.BaseModel` class to parse into.

    Returns:
        The parsed and validated Pydantic object.

    Raises:
        TypeError: If there's a mismatch between the `model` that you're trying to
            extract into, and the SQLAlchemy column that you're trying to extract from.
            Or, if `sql_value` is `None`.

    Warning:
        This does JSON parsing, which can be heavy.
        Call this from outside any SQL transactions to avoid hogging the SQLite lock,
        and offload this to a worker to avoid blocking the event loop.
    """
    if isinstance(sql_value, SerializedPydanticModel):
        if sql_value._model == model:
            return model.parse_raw(sql_value._serialized_json, encoding="utf-8")
        else:
            raise TypeError(
                f"This value came from a SQL column declared to contain"
                f" {sql_value._model}, but you're trying to read it as"
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


@dataclass(frozen=True)
class SerializedPydanticModel:
    """A Pydantic model that's just been extracted from, or is ready to be stored
    into, SQLAlchemy.
    """

    _model: Type[BaseModel]
    _serialized_json: bytes


class PydanticCol(  # noqa: D101
    sqlalchemy.types.TypeDecorator[SerializedPydanticModel]
):
    # Make SQLAlchemy insert the data into the SQLite database as a BLOB,
    # and use Python `bytes` objects for passing data between our code and SQLAlchemy.
    #
    # We deliberately avoid using sqlalchemy.JSON. It would use JSON-like `dict`s for
    # passing data between our code and SQLAlchemy, which is problematic:
    #
    #   * It's difficult to robustly convert Pydantic models to and from JSON-like
    #     `dict`s. https://github.com/pydantic/pydantic/issues/1409
    #   * SQLAlchemy would internally do the conversion between `dict`s and raw JSON
    #     strings. This would do heavy compute work inside the SQLAlchemy transaction,
    #     holding SQLite's database lock open for too long.
    impl = sqlalchemy.LargeBinary

    cache_ok = True

    def __init__(self, model: Type[BaseModel]) -> None:
        """A custom SQLAlchemy column type to store serialized Pydantic models.

        This should be preferred over lower-level column types like `sqlalchemy.JSON` or
        `sqlalchemy.String` because it's more type-safe and it avoids certain performance
        pitfalls.

        Args:
            model: The Pydantic model that this column will hold.
        """
        self._model = model
        super().__init__()

    def process_bind_param(
        self,
        value: Optional[SerializedPydanticModel],
        dialect: object,
    ) -> Optional[bytes]:
        """Prepare a value to be inserted via SQLAlchemy."""
        if isinstance(value, SerializedPydanticModel):
            if value._model == self._model:
                return value._serialized_json
            else:
                raise TypeError(
                    f"This SQL column is declared to contain serialized {self._model}"
                    f" objects, but you're trying to insert a serialized"
                    f" {value._model} object."
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
        value: Optional[bytes],
        dialect: object,
    ) -> Optional[SerializedPydanticModel]:
        """Wrap a raw serialized value extracted by SQLAlchemy."""
        if value is None:
            return None  # Extracting a SQL NULL value.
        else:
            return SerializedPydanticModel(
                _model=self._model,
                _serialized_json=value,
            )
