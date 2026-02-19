"""ORM table definitions and supporting column types."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

import sqlalchemy
import sqlalchemy.types as types
from sqlalchemy import Column, Enum, Integer, String

from server_utils.auth.scopes import Scope

from auth_server.persistence.database import Base


class ScopeListType(types.TypeDecorator[Any]):
    """Store a ``list[Scope]`` as a JSON array of scope API-name strings."""

    impl = types.JSON
    cache_ok = True

    def process_bind_param(
        self, value: Any, dialect: sqlalchemy.engine.Dialect
    ) -> list[str]:
        if not value:
            return []
        return sorted(s.api_name for s in value)

    def process_result_value(
        self, value: Any, dialect: sqlalchemy.engine.Dialect
    ) -> list[Scope]:
        if not value:
            return []
        return [Scope.from_api_name(s) for s in value]


class AccountType(StrEnum):
    """The type of account."""

    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"
    SERVICE = "service"


class User(Base):  # type: ignore[misc]
    """ORM model for user accounts."""

    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, autoincrement=True)  # type: ignore[assignment]
    username: str = Column(String, unique=True, nullable=False)  # type: ignore[assignment]
    hashed_password: str = Column(String, nullable=False)  # type: ignore[assignment]
    full_name: str = Column(String, nullable=False)  # type: ignore[assignment]
    account_type: AccountType = Column(Enum(AccountType), nullable=False)  # type: ignore[assignment]
    scopes: list[Scope] = Column(ScopeListType, nullable=False)  # type: ignore[assignment]

    def __repr__(self) -> str:  # noqa: D105
        return f"<User(username={self.username!r})>"
