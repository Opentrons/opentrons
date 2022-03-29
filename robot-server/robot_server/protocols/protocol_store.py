"""Methods for saving and retrieving protocol files."""


from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from typing import Dict, List

import sqlalchemy

from opentrons.protocol_reader import ProtocolSource


_log = getLogger(__name__)


_metadata = sqlalchemy.MetaData()

# Column and table names here match:
#   * _sql_row_to_resource()
#   * _resource_to_sql_values()
#   * Various .where() constructs inside ProtocolStore
#
# TODO: Any way these types can be inferred? Investigate sqlalchemy[2]-stubs,
# reconsider if light ORM use would be good for us.
_protocol_table = sqlalchemy.Table(
    "protocol",
    _metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    ),
    sqlalchemy.Column(
        "source",
        sqlalchemy.PickleType,
        nullable=False,
    ),
)


def _convert_sql_row_to_resource(sql_row: sqlalchemy.engine.Row) -> ProtocolResource:
    protocol_id = sql_row.id
    assert isinstance(protocol_id, str)

    created_at = sql_row.created_at
    assert isinstance(created_at, datetime)

    source = sql_row.source
    assert isinstance(source, ProtocolSource)

    return ProtocolResource(
        protocol_id=protocol_id, created_at=created_at, source=source
    )


def _convert_resource_to_sql_values(resource: ProtocolResource) -> Dict[str, object]:
    return {
        "id": resource.protocol_id,
        "created_at": resource.created_at,
        "source": resource.source,
    }


# TODO: This won't scale when we have multiple store
# classes each with their own table. We'll need a way of merging every store's
# Table into a single MetaData, I think?
# TODO: Make async, probably.
# TODO: What happens if the database already has tables?
#       Trying to recreate them should probably be an error.
#       Can we detect the conflict?
def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    _metadata.create_all(sql_engine)


@dataclass(frozen=True)
class ProtocolResource:
    """An entry in the protocol store, used to construct response models."""

    protocol_id: str
    created_at: datetime
    source: ProtocolSource


class ProtocolNotFoundError(KeyError):
    """Error raised when a protocol ID was not found in the store."""

    def __init__(self, protocol_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Protocol {protocol_id} was not found.")


# TODO: Make all methods async, probably.
class ProtocolStore:
    """Methods for storing and retrieving protocol files."""

    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        """Initialize the ProtocolStore.

        Params:
            sql_engine: A reference to the database that this ProtocolStore should
                use as its backing storage.
                This is expected to already have the proper tables set up;
                see `add_tables_to_db()`.
        """
        self._sql_engine = sql_engine

    def insert(self, resource: ProtocolResource) -> None:
        """Insert a protocol resource into the store."""
        # TODO: Handle ID conflicts, somehow, and add a test for them.
        statement = sqlalchemy.insert(_protocol_table).values(
            _convert_resource_to_sql_values(resource=resource)
        )
        with self._sql_engine.begin() as transaction:
            # TODO: How do we catch an ID-already-used conflict here?
            # TODO: Will this raise if there was a problem with the insert, or do I
            #       have to inspect the result somehow?
            transaction.execute(statement)

    def get(self, protocol_id: str) -> ProtocolResource:
        """Get a single protocol by ID."""
        statement = sqlalchemy.select(_protocol_table).where(
            _protocol_table.c.id == protocol_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                matching_row = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise ProtocolNotFoundError(protocol_id=protocol_id) from e
        return _convert_sql_row_to_resource(sql_row=matching_row)

    def get_all(self) -> List[ProtocolResource]:
        """Get all protocols currently saved in this store."""
        statement = sqlalchemy.select(_protocol_table)
        with self._sql_engine.begin() as transaction:
            all_rows = transaction.execute(statement).all()
        return [_convert_sql_row_to_resource(sql_row=row) for row in all_rows]

    def remove(self, protocol_id: str) -> ProtocolResource:
        """Remove a `ProtocolResource` from the store.

        After removing it from the store, attempt to delete all files that it
        referred to.

        Returns:
            The `ProtocolResource` as it appeared just before removing it.
            Note that the files it refers to will no longer exist.
        """
        select_statement = sqlalchemy.select(_protocol_table).where(
            _protocol_table.c.id == protocol_id
        )
        delete_statement = sqlalchemy.delete(_protocol_table).where(
            _protocol_table.c.id == protocol_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                # SQLite <3.35.0 doesn't support a RETURNING clause,
                # so we DIY it with a separate SELECT.
                row_to_delete = transaction.execute(select_statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise ProtocolNotFoundError(protocol_id=protocol_id) from e
            transaction.execute(delete_statement)

        deleted_resource = _convert_sql_row_to_resource(sql_row=row_to_delete)

        protocol_dir = deleted_resource.source.directory
        for file_path in deleted_resource.source.files:
            (protocol_dir / file_path.name).unlink()
        protocol_dir.rmdir()

        return deleted_resource
