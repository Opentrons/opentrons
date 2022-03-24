"""Methods for saving and retrieving protocol files."""
from dataclasses import dataclass
from datetime import datetime
from logging import getLogger
from typing import Any, Dict, List

import sqlalchemy

from opentrons.protocol_reader import ProtocolSource


log = getLogger(__name__)


_metadata = sqlalchemy.MetaData()

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
)


# TODO: This won't scale when we have multiple store
# classes each with their own table. We'll need a way of merging every store's
# Table into a single MetaData, I think?
# TODO: Make async, probably.
def create_memory_db() -> sqlalchemy.engine.Engine:
    # https://docs.sqlalchemy.org/en/14/core/engines.html#sqlite
    # TODO: I want this to make a new in-memory DB every time it's called.
    # Multiple calls shouldn't reuse the same in-memory DB.
    # Is this what actually happens?
    return sqlalchemy.create_engine(
        "sqlite://",
        # TODO: This feels like a hack. Can we avoid this by better controlling which
        # thread this happens in? It's easy to avoid concurrent multithreaded requests
        # to this DB (and we do), but it's hard to ensure that the thread that
        # called this function is the same as the thread that runs the request, because
        # of FastAPI depends.
        connect_args={"check_same_thread": False},
        # https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#using-a-memory-database-in-multiple-threads
        poolclass=sqlalchemy.pool.StaticPool,
    )


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


class ProtocolStore:
    """Methods for storing and retrieving protocol files."""

    def __init__(self) -> None:
        """Initialize the ProtocolStore."""

        # TODO: This leaks the SQL engine. We should probably have it passed in
        # instead of creating it ourselves.
        sql_engine = create_memory_db()
        add_tables_to_db(sql_engine)
        self._record_store = ProtocolRecordStore(sql_engine=sql_engine)

        # TODO: Upon cold boot, when rehydrating the list of protocol records,
        # find a way to reassociate their source files.
        self._source_by_id: Dict[str, ProtocolSource] = {}

    def insert(self, resource: ProtocolResource) -> None:
        """Insert a protocol resource into the store."""
        # TODO: Handle ID conflicts, somehow, and add a test for them.
        self._record_store.insert(
            ProtocolRecord(
                protocol_id=resource.protocol_id, created_at=resource.created_at
            )
        )
        self._source_by_id[resource.protocol_id] = resource.source

    def get(self, protocol_id: str) -> ProtocolResource:
        """Get a single protocol by ID."""
        record = self._record_store.get(protocol_id=protocol_id)
        return ProtocolResource(
            protocol_id=record.protocol_id,
            created_at=record.created_at,
            source=self._source_by_id[record.protocol_id],
        )

    def get_all(self) -> List[ProtocolResource]:
        """Get all protocols currently saved in this store."""
        all_records = self._record_store.get_all()
        return [
            ProtocolResource(
                protocol_id=record.protocol_id,
                created_at=record.created_at,
                source=self._source_by_id[record.protocol_id],
            )
            for record in all_records
        ]

    def remove(self, protocol_id: str) -> ProtocolResource:
        """Remove a protocol from the store."""
        record_to_delete = self._record_store.get(protocol_id=protocol_id)
        source = self._source_by_id[record_to_delete.protocol_id]
        resource_to_delete = ProtocolResource(
            protocol_id=record_to_delete.protocol_id,
            created_at=record_to_delete.created_at,
            source=source,
        )

        self._record_store.remove(protocol_id=protocol_id)

        try:
            protocol_dir = resource_to_delete.source.directory
            for file_path in resource_to_delete.source.files:
                (protocol_dir / file_path.name).unlink()
            protocol_dir.rmdir()
        except Exception as e:
            log.warning(
                f"Unable to delete all files for protocol {protocol_id}",
                exc_info=e,
            )

        return resource_to_delete


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
            id=protocol_record.protocol_id, created_at=protocol_record.created_at
        )
        with self._sql_engine.begin() as transaction:
            # TODO: How do we catch an ID-already-used conflict here?
            # TODO: Will this raise if there was a problem with the insert, or do I
            #       have to inspect the result somehow?
            transaction.execute(statement)

    def get(self, protocol_id: str) -> ProtocolRecord:
        statement = sqlalchemy.select(_protocol_table).where(
            _protocol_table.c.id == protocol_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                matching_row = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise ProtocolNotFoundError(protocol_id=protocol_id) from e
        return self._row_to_record(sql_row=matching_row)

    def get_all(self) -> List[ProtocolRecord]:
        statement = sqlalchemy.select(_protocol_table)
        with self._sql_engine.begin() as transaction:
            all_rows = transaction.execute(statement).all()
        # TODO: We're iterating over result rows after the transaction has been closed.
        # Is this legal and safe? Is the results list built eagerly?
        return [self._row_to_record(sql_row=row) for row in all_rows]

    def remove(self, protocol_id: str) -> ProtocolRecord:
        select_statement = sqlalchemy.select(_protocol_table).where(
            _protocol_table.c.id == protocol_id
        )
        delete_statement = sqlalchemy.delete(_protocol_table).where(
            _protocol_table.c.id == protocol_id
        )
        with self._sql_engine.begin() as transaction:
            # TODO: Verify that we'll safely be able to access this engine
            # from multiple tasks.
            row_to_delete = transaction.execute(select_statement).one()
            transaction.execute(delete_statement)
        return self._row_to_record(sql_row=row_to_delete)

    @staticmethod
    def _row_to_record(sql_row: sqlalchemy.engine.Row) -> ProtocolRecord:
        # TODO: Any way these types can be inferred? Investigate sqlalchemy[2]-stubs,
        # reconsider if light ORM use would be good for us.
        protocol_id = sql_row.id
        assert isinstance(protocol_id, str)
        created_at = sql_row.created_at
        assert isinstance(created_at, datetime)
        return ProtocolRecord(protocol_id=protocol_id, created_at=created_at)
