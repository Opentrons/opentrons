"""ORM table definitions and supporting column types."""

import json
from typing import Any

from sqlalchemy import Column, Integer, String, TypeDecorator
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    """ORM model for user accounts."""

    __tablename__ = "user"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"


class JsonValue(TypeDecorator[object]):
    """Transparently serializes Python values to/from JSON strings in the DB."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value: object | None, dialect: Any) -> str | None:
        """Python → DB: json.dumps before writing."""
        return json.dumps(value)

    def process_result_value(self, value: str | None, dialect: Any) -> object | None:
        """DB → Python: json.loads after reading."""
        if value is not None:
            result: object = json.loads(value)
            return result
        return None


class Setting(Base):
    """ORM model for a single setting."""

    __tablename__ = "setting"

    key = Column(String, primary_key=True)
    # todo(tz, 2026-03-25): change type to Json https://docs.sqlalchemy.org/en/21/core/type_basics.html#sqlalchemy.types.JSON
    value = Column(JsonValue, nullable=False)
