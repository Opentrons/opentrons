"""Methods for saving and retrieving protocol files."""
from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from typing import Any, Dict, List

import sqlalchemy

from opentrons.protocol_reader import ProtocolSource


log = getLogger(__name__)


# TODO: Exposing metadata from this module won't scale when we have multiple store
# classes each with their own table. We'll need a way of merging every store's
# Table into a single MetaData, I think?
metadata = sqlalchemy.MetaData()

_protocol_table = sqlalchemy.Table(
    "protocol",
    metadata,
    sqlalchemy.Column(
        "id",
        sqlalchemy.String,
        primary_key=True,
    ),
    sqlalchemy.Column(
        "created_at",
        sqlalchemy.DateTime,
        nullable=False,
    )
)


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


class ProtocolStore:
    """Methods for storing and retrieving protocol files."""

    def __init__(self) -> None:
        """Initialize the ProtocolStore."""
        self._protocols_by_id: Dict[str, ProtocolResource] = {}

    def upsert(self, resource: ProtocolResource) -> None:
        """Upsert a protocol resource into the store."""
        self._protocols_by_id[resource.protocol_id] = resource

    def get(self, protocol_id: str) -> ProtocolResource:
        """Get a single protocol by ID."""
        try:
            return self._protocols_by_id[protocol_id]
        except KeyError as e:
            raise ProtocolNotFoundError(protocol_id) from e

    def get_all(self) -> List[ProtocolResource]:
        """Get all protocols currently saved in this store."""
        return list(self._protocols_by_id.values())

    def remove(self, protocol_id: str) -> ProtocolResource:
        """Remove a protocol from the store."""
        try:
            entry = self._protocols_by_id.pop(protocol_id)
        except KeyError as e:
            raise ProtocolNotFoundError(protocol_id) from e

        try:
            protocol_dir = entry.source.directory
            for file_path in entry.source.files:
                (protocol_dir / file_path.name).unlink()
            protocol_dir.rmdir()
        except Exception as e:
            log.warning(
                f"Unable to delete all files for protocol {protocol_id}",
                exc_info=e,
            )

        return entry


@dataclass(frozen=True)
class ProtocolRecord:
    protocol_id: str
    created_at: datetime


# TODO: Make all methods async, probably.
class ProtocolRecordStore:
    def __init__(self, sql_engine: sqlalchemy.engine.Engine) -> None:
        # TODO:
        # 1) As a first step, spin up an isolated in-memory DB and make the table in it
        # 2) Make that a FastAPI dependency, probably
        self._sql_engine = sql_engine

    def insert(self, protocol_record: ProtocolRecord) -> None:
        statement = sqlalchemy.insert(_protocol_table).values(
            id=protocol_record.protocol_id,
            created_at=protocol_record.created_at
        )
        with self._sql_engine.begin() as transaction:
            # TODO: How do we catch an ID-already-used conflict here?
            # TODO: Will this raise if there was a problem with the insert, or do I
            #       have to inspect the result somehow?
            transaction.execute(statement)

    def get(self, protocol_id: str) -> ProtocolRecord:
        # TODO: Could I use _protocol_table.c.id here instead of _id_column,
        # or would that lose us some refactor safety?
        statement = sqlalchemy.select(_protocol_table).where(_protocol_table.c.id==protocol_id)
        with self._sql_engine.begin() as transaction:
            try:
                result = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise ProtocolNotFoundError(protocol_id=protocol_id) from e
        return self._to_record(sql_result=result)

    def get_all(self, protocol_id: str) -> List[ProtocolRecord]:
        statement = sqlalchemy.select(_protocol_table)
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()
        # TODO: We're iterating over result rows after the transaction has been closed.
        # Is this legal and safe? Is the results list built eagerly?
        return [self._to_record(result) for result in results]

    def _to_record(self, sql_result: sqlalchemy.engine.Row) -> ProtocolRecord:
        # TODO: Any way these types can be inferred? Investigate sqlalchemy[2]-stubs,
        # reconsider if light ORM use would be good for us.
        protocol_id = sql_result.id
        assert isinstance(protocol_id, str)
        created_at = sql_result.created_at
        assert isinstance(created_at, datetime)
        return ProtocolRecord(protocol_id=protocol_id, created_at=created_at)


class ProtocolFileStore:
    pass


