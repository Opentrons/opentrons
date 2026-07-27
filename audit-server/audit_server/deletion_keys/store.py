"""Deletion-key store – pure data access layer for deletion-key persistence."""

import secrets
from datetime import datetime, timezone
from typing import Annotated

import fastapi
from sqlalchemy.engine import Engine as SQLEngine
from sqlalchemy.orm import Session, sessionmaker

from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

from audit_server.deletion_keys.types import DeletionKeyForeignType
from audit_server.persistence.fastapi_dependencies import get_sql_engine
from audit_server.persistence.orm_models import DeletionKey

# Number of random bytes behind each deletion key. urlsafe encoding produces a
# longer string than this byte count.
_DELETION_KEY_BYTES = 32


class DeletionKeyStore:
    """Manages deletion-key persistence against the database."""

    def __init__(self, sql_engine: SQLEngine) -> None:
        """Initialize with a SQLAlchemy engine."""
        self._sql_engine = sql_engine
        self._session_factory = sessionmaker(
            bind=sql_engine,
            expire_on_commit=False,
        )

    def _session(self) -> Session:
        return self._session_factory()

    def create_deletion_key(
        self,
        foreign_id: int,
        foreign_type: DeletionKeyForeignType,
    ) -> str:
        """Mint and persist a new deletion key for the given record.

        Each call inserts a new key; keys previously issued for the same record
        remain valid. Returns the generated key.
        """
        key = secrets.token_urlsafe(_DELETION_KEY_BYTES)
        with self._session() as session:
            session.add(
                DeletionKey(
                    deletion_key=key,
                    foreign_id=foreign_id,
                    foreign_type=foreign_type,
                    created_at=datetime.now(timezone.utc),
                )
            )
            session.commit()
        return key


_accessor = AppStateAccessor[DeletionKeyStore]("deletion_key_store")


def install_deletion_key_store(
    app_state: AppState, deletion_key_store: DeletionKeyStore
) -> None:
    """Place the server's singleton DeletionKeyStore in server state.

    This should be called once at server startup. Retrieve it later with
    ``get_deletion_key_store()``.
    """
    _accessor.set_on(app_state, deletion_key_store)


def get_deletion_key_store(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
    sql_engine: Annotated[SQLEngine, fastapi.Depends(get_sql_engine)],
) -> DeletionKeyStore:
    """Return the server's singleton DeletionKeyStore."""
    deletion_key_store = _accessor.get_from(app_state)
    assert deletion_key_store is not None, (
        "Forgot to initialize deletion key store as part of server startup?"
    )
    return deletion_key_store
