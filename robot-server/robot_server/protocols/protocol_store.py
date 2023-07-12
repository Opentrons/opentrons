"""Store and retrieve information about uploaded protocols."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from logging import getLogger
from pathlib import Path
from typing import Dict, List, Optional, Set

from anyio import Path as AsyncPath, create_task_group
import sqlalchemy

from opentrons.protocol_reader import ProtocolReader, ProtocolSource
from robot_server.persistence import (
    analysis_table,
    protocol_table,
    run_table,
    sqlite_rowid,
)


_CACHE_ENTRIES = 32


_log = getLogger(__name__)


@dataclass(frozen=True)
class ProtocolResource:
    """Represents an uploaded protocol."""

    protocol_id: str
    created_at: datetime
    source: ProtocolSource
    protocol_key: Optional[str]


@dataclass(frozen=True)
class ProtocolUsageInfo:
    """Information about whether a particular protocol is being used by any runs.

    See `ProtocolStore.get_usage_info()`.
    """

    protocol_id: str
    """This protocol's ID."""

    is_used_by_run: bool
    """Whether any currently existing run uses this protocol.

    A protocol counts as "used" even if the run that uses it is no longer active.
    """


class ProtocolNotFoundError(KeyError):
    """Error raised when a protocol ID was not found in the store."""

    def __init__(self, protocol_id: str) -> None:
        super().__init__(f"Protocol {protocol_id} was not found.")


class ProtocolUsedByRunError(ValueError):
    """Error raised if a protocol can't be deleted because it's used by a run."""

    def __init__(self, protocol_id: str) -> None:
        super().__init__(
            f"Protocol {protocol_id} is used by a run and cannot be deleted."
        )


class SubdirectoryMissingError(Exception):
    """Raised if expected protocol subdirectories are missing when rehydrating.

    We never expect this to happen if the system is working correctly.
    It might happen if someone's tampered with the file storage.
    """


# TODO(mm, 2022-03-29): When we confirm we can use SQLAlchemy 1.4 on the OT-2,
# convert all methods to use an async engine.
# https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html
class ProtocolStore:
    """Store and retrieve information about uploaded protocols."""

    def __init__(
        self,
        *,
        _sql_engine: sqlalchemy.engine.Engine,
        _sources_by_id: Dict[str, ProtocolSource],
    ) -> None:
        """Do not call directly.

        Use `create_empty()` or `rehydrate()` instead.
        """
        self._sql_engine = _sql_engine
        self._sources_by_id = _sources_by_id

    @classmethod
    def create_empty(
        cls,
        sql_engine: sqlalchemy.engine.Engine,
    ) -> ProtocolStore:
        """Return a new, empty ProtocolStore.

        Params:
            sql_engine: A reference to the database that this ProtocolStore should
                use as its backing storage.
                This is expected to already have the proper tables set up;
                see `add_tables_to_db()`.
                This should have no protocol data currently stored.
                If there is data, use `rehydrate()` instead.
        """
        return cls(_sql_engine=sql_engine, _sources_by_id={})

    @classmethod
    async def rehydrate(
        cls,
        sql_engine: sqlalchemy.engine.Engine,
        protocols_directory: Path,
        protocol_reader: ProtocolReader,
    ) -> ProtocolStore:
        """Return a new ProtocolStore, picking up where a former one left off.

        If `sql_engine` and `protocols_directory` match a prior instance of this class
        (probably from a prior boot), the new instance will pick up where it left off.
        They are allowed to contain no data, in which case this is equivalent to
        `create_empty()`.

        Params:
            sql_engine: A reference to the database that this ProtocolStore should
                use as its backing storage.
                This is expected to already have the proper tables set up;
                see `add_tables_to_db()`.
            protocols_directory: Where to look for protocol files while rehydrating.
                This is expected to have one subdirectory per protocol,
                named after its protocol ID.
            protocol_reader: An interface to compute `ProtocolSource`s from protocol
                files while rehydrating.
        """
        # The SQL database is the canonical source of which protocols
        # have been added successfully.
        expected_ids = set(
            r.protocol_id for r in cls._sql_get_all_from_engine(sql_engine=sql_engine)
        )

        sources_by_id = await _compute_protocol_sources(
            expected_protocol_ids=expected_ids,
            protocols_directory=AsyncPath(protocols_directory),
            protocol_reader=protocol_reader,
        )

        return ProtocolStore(
            _sql_engine=sql_engine,
            _sources_by_id=sources_by_id,
        )

    def insert(self, resource: ProtocolResource) -> None:
        """Insert a protocol resource into the store.

        The resource must have a unique ID.
        """
        self._sql_insert(
            resource=_DBProtocolResource(
                protocol_id=resource.protocol_id,
                created_at=resource.created_at,
                protocol_key=resource.protocol_key,
            )
        )
        self._sources_by_id[resource.protocol_id] = resource.source
        self._clear_caches()

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get(self, protocol_id: str) -> ProtocolResource:
        """Get a single protocol by ID.

        Raises:
            ProtocolNotFoundError
        """
        sql_resource = self._sql_get(protocol_id=protocol_id)
        return ProtocolResource(
            protocol_id=sql_resource.protocol_id,
            created_at=sql_resource.created_at,
            protocol_key=sql_resource.protocol_key,
            source=self._sources_by_id[sql_resource.protocol_id],
        )

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get_all(self) -> List[ProtocolResource]:
        """Get all protocols currently saved in this store."""
        all_sql_resources = self._sql_get_all()
        return [
            ProtocolResource(
                protocol_id=r.protocol_id,
                created_at=r.created_at,
                protocol_key=r.protocol_key,
                source=self._sources_by_id[r.protocol_id],
            )
            for r in all_sql_resources
        ]

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def get_all_ids(self) -> List[str]:
        """Get all protocol ids currently saved in this store."""
        select_ids = sqlalchemy.select(protocol_table.c.id).order_by(sqlite_rowid)
        with self._sql_engine.begin() as transaction:
            protocol_ids = transaction.execute(select_ids).scalars().all()
        return protocol_ids

    def get_id_by_hash(self, hash: str) -> Optional[str]:
        """Get all protocol hashes keyed by protocol id."""
        for p in self.get_all():
            if p.source.content_hash == hash:
                return p.protocol_id
        return None

    @lru_cache(maxsize=_CACHE_ENTRIES)
    def has(self, protocol_id: str) -> bool:
        """Check for the presence of a protocol ID in the store."""
        statement = sqlalchemy.select(protocol_table).where(
            protocol_table.c.id == protocol_id
        )

        with self._sql_engine.begin() as transaction:
            result = transaction.execute(statement).one_or_none()

        return result is not None

    def remove(self, protocol_id: str) -> None:
        """Remove a `ProtocolResource` from the store.

        After removing it from the store, attempt to delete all files that it
        referred to.

        Returns:
            The `ProtocolResource` as it appeared just before removing it.
            Note that the files it refers to will no longer exist.

        Raises:
            ProtocolNotFoundError: the given protocol ID was not in the store
            ProtocolUsedByRunError: the protocol could not be deleted because
                there is a run currently referencing the protocol.
        """
        self._sql_remove(protocol_id=protocol_id)

        deleted_source = self._sources_by_id.pop(protocol_id)
        protocol_dir = deleted_source.directory

        for source_file in deleted_source.files:
            source_file.path.unlink()
        if protocol_dir:
            protocol_dir.rmdir()

        self._clear_caches()

    # Note that this is NOT cached like the other getters because we would need
    # to invalidate the cache whenever the runs table changes, which is not something
    # that this class can easily monitor.
    def get_usage_info(self) -> List[ProtocolUsageInfo]:
        """Return information about which protocols are currently being used by runs.

        See the `runs` module for information about runs.

        Results are ordered with the oldest-added protocol first.
        """
        select_all_protocol_ids = sqlalchemy.select(protocol_table.c.id).order_by(
            sqlite_rowid
        )
        select_used_protocol_ids = sqlalchemy.select(run_table.c.protocol_id).where(
            run_table.c.protocol_id.is_not(None)
        )

        with self._sql_engine.begin() as transaction:
            all_protocol_ids: List[str] = (
                transaction.execute(select_all_protocol_ids).scalars().all()
            )
            used_protocol_ids: Set[str] = set(
                transaction.execute(select_used_protocol_ids).scalars().all()
            )

        # It's probably inefficient to do this processing in Python
        # instead of as part of the SQL query.
        # But the number of runs and protocols is on the order of 20, so it's fine.
        usage_info = [
            ProtocolUsageInfo(
                protocol_id=protocol_id,
                is_used_by_run=(protocol_id in used_protocol_ids),
            )
            for protocol_id in all_protocol_ids
        ]

        return usage_info

    def get_referencing_run_ids(self, protocol_id: str) -> List[str]:
        """Return a list of run ids that reference a particular protocol.

        See the `runs` module for information about runs.

        Results are ordered with the oldest-added (NOT created) run first.
        """
        select_referencing_run_ids = sqlalchemy.select(run_table.c.id).where(
            run_table.c.protocol_id == protocol_id
        )

        with self._sql_engine.begin() as transaction:
            referencing_run_ids = (
                transaction.execute(select_referencing_run_ids).scalars().all()
            )
        return referencing_run_ids

    def _sql_insert(self, resource: _DBProtocolResource) -> None:
        statement = sqlalchemy.insert(protocol_table).values(
            _convert_dataclass_to_sql_values(resource=resource)
        )
        with self._sql_engine.begin() as transaction:
            transaction.execute(statement)

    def _sql_get(self, protocol_id: str) -> _DBProtocolResource:
        statement = sqlalchemy.select(protocol_table).where(
            protocol_table.c.id == protocol_id
        )
        with self._sql_engine.begin() as transaction:
            try:
                matching_row = transaction.execute(statement).one()
            except sqlalchemy.exc.NoResultFound as e:
                raise ProtocolNotFoundError(protocol_id=protocol_id) from e
        return _convert_sql_row_to_dataclass(sql_row=matching_row)

    def _sql_get_all(self) -> List[_DBProtocolResource]:
        return self._sql_get_all_from_engine(sql_engine=self._sql_engine)

    @staticmethod
    def _sql_get_all_from_engine(
        sql_engine: sqlalchemy.engine.Engine,
    ) -> List[_DBProtocolResource]:
        statement = sqlalchemy.select(protocol_table)
        with sql_engine.begin() as transaction:
            all_rows = transaction.execute(statement).all()
        return [_convert_sql_row_to_dataclass(sql_row=row) for row in all_rows]

    def _sql_remove(self, protocol_id: str) -> None:
        delete_analyses_statement = sqlalchemy.delete(analysis_table).where(
            analysis_table.c.protocol_id == protocol_id
        )
        delete_protocol_statement = sqlalchemy.delete(protocol_table).where(
            protocol_table.c.id == protocol_id
        )

        with self._sql_engine.begin() as transaction:
            # TODO(mm, 2022-04-28): Deleting analyses from the table is enough to
            # avoid a SQL foreign key conflict. But, if this protocol had any *pending*
            # analyses, they'll be left behind in the AnalysisStore, orphaned,
            # since they're stored independently of this SQL table.
            #
            # To fix this, we'll need to either:
            #
            # * Merge the Store classes or otherwise give them access to each other.
            # * Switch from SQLAlchemy Core to ORM and use cascade deletes.
            try:
                transaction.execute(delete_analyses_statement)
                result = transaction.execute(delete_protocol_statement)
            except sqlalchemy.exc.IntegrityError as e:
                raise ProtocolUsedByRunError(protocol_id=protocol_id) from e

        if result.rowcount < 1:
            raise ProtocolNotFoundError(protocol_id=protocol_id)

    def _clear_caches(self) -> None:
        self.get.cache_clear()
        self.get_all_ids.cache_clear()
        self.get_all.cache_clear()
        self.has.cache_clear()


# TODO(mm, 2022-04-18):
# Restructure to degrade gracefully in the face of ProtocolReader failures.
#
# * ProtocolStore.get_all() should omit protocols for which it failed to compute
#   a ProtocolSource.
# * ProtocolStore.get(id) should continue to raise an exception if it failed to compute
#   that protocol's ProtocolSource.
async def _compute_protocol_sources(
    expected_protocol_ids: Set[str],
    protocols_directory: AsyncPath,
    protocol_reader: ProtocolReader,
) -> Dict[str, ProtocolSource]:
    """Compute `ProtocolSource` objects from protocol source files.

    We don't store these `ProtocolSource` objects in the SQL database because
    they're big, deep, complex, and unstable, so migrations and compatibility
    would be painful. Instead, we compute them based on the stored files,
    and keep them in memory.

    Params:
        expected_protocol_ids: The ID of every protocol for which to compute a
            `ProtocolSource`.
        protocols_directory: A directory containing one subdirectory per protocol
            named by protocol ID. Scanned for files to pass to `protocol_reader`.
        protocol_reader: An interface to use to compute `ProtocolSource`s.

    Returns:
        A map from protocol ID to computed `ProtocolSource`.

    Raises:
        Exception: This is not expected to raise anything,
            but it might if a software update makes ProtocolReader reject files
            that it formerly accepted.
    """
    sources_by_id: Dict[str, ProtocolSource] = {}

    directory_members = [m async for m in protocols_directory.iterdir()]
    directory_member_names = set(m.name for m in directory_members)
    extra_members = directory_member_names - expected_protocol_ids
    missing_members = expected_protocol_ids - directory_member_names

    if extra_members:
        # Extra members may be left over from prior interrupted writes
        # and other kinds of failed insertions.
        _log.warning(
            f"Unexpected files or directories inside protocol storage directory:"
            f" {extra_members}."
            f" Ignoring them."
        )

    if missing_members:
        raise SubdirectoryMissingError(
            f"Missing subdirectories for protocols: {missing_members}"
        )

    async def compute_source(
        protocol_id: str, protocol_subdirectory: AsyncPath
    ) -> None:
        # Given that the expected protocol subdirectory exists,
        # we trust that the files in it are correct.
        # No extra files, and no files missing.
        #
        # This is a safe assumption as long as:
        #  * Nobody has tampered with file the storage.
        #  * We don't try to compute the source of any protocol whose insertion
        #    failed halfway through and left files behind.
        protocol_files = [Path(f) async for f in protocol_subdirectory.iterdir()]
        protocol_source = await protocol_reader.read_saved(
            files=protocol_files,
            directory=Path(protocol_subdirectory),
            files_are_prevalidated=True,
        )
        sources_by_id[protocol_id] = protocol_source

    async with create_task_group() as task_group:
        # Use a TaskGroup instead of asyncio.gather() so,
        # if any task raises an unexpected exception,
        # it cancels every other task and raises an exception to signal the bug.
        for protocol_id in expected_protocol_ids:
            protocol_subdirectory = protocols_directory / protocol_id
            task_group.start_soon(compute_source, protocol_id, protocol_subdirectory)

    for id in expected_protocol_ids:
        assert id in sources_by_id

    return sources_by_id


@dataclass(frozen=True)
class _DBProtocolResource:
    """The subset of a ProtocolResource that's stored in the SQL database."""

    protocol_id: str
    created_at: datetime
    protocol_key: Optional[str]


def _convert_sql_row_to_dataclass(
    sql_row: sqlalchemy.engine.Row,
) -> _DBProtocolResource:
    protocol_id = sql_row.id
    protocol_key = sql_row.protocol_key
    created_at = sql_row.created_at

    assert isinstance(protocol_id, str), f"Protocol ID {protocol_id} not a string"
    assert protocol_key is None or isinstance(
        protocol_key, str
    ), f"Protocol Key {protocol_key} not a string or None"

    return _DBProtocolResource(
        protocol_id=protocol_id,
        created_at=created_at,
        protocol_key=protocol_key,
    )


def _convert_dataclass_to_sql_values(
    resource: _DBProtocolResource,
) -> Dict[str, object]:
    return {
        "id": resource.protocol_id,
        "created_at": resource.created_at,
        "protocol_key": resource.protocol_key,
    }
