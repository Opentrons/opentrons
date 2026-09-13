"""Completed analysis storage and access."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from logging import getLogger
from typing import Any, Dict, List, Mapping, Optional, Type, TypeVar, Union

import anyio.to_thread
import sqlalchemy
from pydantic import BaseModel, TypeAdapter, ValidationError

from opentrons.protocol_engine import (
    ErrorOccurrence,
    Liquid,
    LoadedLabware,
    LoadedModule,
    LoadedPipette,
)
from opentrons.protocol_engine.types import CommandPreconditions, RunTimeParameter
from opentrons.protocols.parameters.types import PrimitiveAllowedTypes
from opentrons_shared_data.robot.types import RobotType

from .analysis_memcache import MemoryCache
from .analysis_models import (
    AnalysisPreview,
    AnalysisResult,
    AnalysisStatus,
    AnalysisSummary,
    CompletedAnalysis,
)
from .analysis_preview import (
    PREVIEW_COMMAND_TYPES,
    ExtractedCommand,
    required_addressable_areas,
    uses_gripper,
)
from .rtp_resources import CSVParameterResource, PrimitiveParameterResource
from robot_server.persistence.database import sqlite_rowid
from robot_server.persistence.pydantic import json_to_pydantic, pydantic_to_json
from robot_server.persistence.tables import (
    analysis_csv_rtp_table,
    analysis_primitive_type_rtp_table,
    analysis_table,
)

_log = getLogger(__name__)

MAX_ANALYSES_TO_STORE = 5
_PREVIEW_CACHE_MAX_SIZE = 5

_ERROR_LIST_ADAPTER = TypeAdapter(List[ErrorOccurrence])
_PIPETTE_LIST_ADAPTER = TypeAdapter(List[LoadedPipette])
_MODULE_LIST_ADAPTER = TypeAdapter(List[LoadedModule])
_LABWARE_LIST_ADAPTER = TypeAdapter(List[LoadedLabware])
_LIQUID_LIST_ADAPTER = TypeAdapter(List[Liquid])
_RTP_LIST_ADAPTER = TypeAdapter(List[RunTimeParameter])

_ModelT = TypeVar("_ModelT", bound=BaseModel)


class UnreadableAnalysisError(ValueError):
    """Exception raised if a given analysis is not readable."""

    def __init__(self, analysis_id: str, error_msg: str) -> None:
        """Initialize the error's message."""
        super().__init__(f'Analysis "{analysis_id}" cannot be parsed: {error_msg}')


@dataclass
class CompletedAnalysisResource:
    """A protocol analysis that's been completed, storable in a SQL database.

    See `CompletedAnalysisStore`.
    """

    id: str  # Already in completed_analysis, but pulled out for efficient querying.
    protocol_id: str
    analyzer_version: str
    completed_analysis: CompletedAnalysis

    async def to_sql_values(self) -> Dict[str, object]:
        """Return this data as a dict that can be passed to a SQLALchemy insert.

        This potentially involves heavy serialization, so it's offloaded
        to a worker thread.

        Do not modify anything while serialization is ongoing in its worker thread.

        Avoid calling this from inside a SQL transaction, since it might be slow.
        """

        def serialize_completed_analysis() -> str:
            return pydantic_to_json(self.completed_analysis)

        serialized_analysis = await anyio.to_thread.run_sync(
            serialize_completed_analysis,
            # Cancellation may orphan the worker thread,
            # but that should be harmless in this case.
            abandon_on_cancel=True,
        )
        return {
            "id": self.id,
            "protocol_id": self.protocol_id,
            "analyzer_version": self.analyzer_version,
            "completed_analysis": serialized_analysis,
        }

    @classmethod
    async def from_sql_row(
        cls, sql_row: sqlalchemy.engine.Row, current_analyzer_version: str
    ) -> CompletedAnalysisResource:
        """Extract the data from a SQLAlchemy row object.

        This potentially involves heavy parsing, so it's offloaded to a worker thread.

        Avoid calling this from inside a SQL transaction, since it might be slow.
        """
        analyzer_version = sql_row.analyzer_version
        if analyzer_version != current_analyzer_version:
            _log.warning(
                f'Analysis in database was created under version "{analyzer_version}",'
                f' but we are version "{current_analyzer_version}".'
                f" This may cause compatibility problems."
            )
        assert isinstance(analyzer_version, str)

        id = sql_row.id
        assert isinstance(id, str)

        protocol_id = sql_row.protocol_id
        assert isinstance(protocol_id, str)

        def parse_completed_analysis() -> CompletedAnalysis:
            try:
                parsed_analysis = json_to_pydantic(
                    CompletedAnalysis, sql_row.completed_analysis
                )
            except ValidationError as e:
                raise UnreadableAnalysisError(id, str(e)) from e
            return parsed_analysis

        completed_analysis = await anyio.to_thread.run_sync(
            parse_completed_analysis,
            # Cancellation may orphan the worker thread,
            # but that should be harmless in this case.
            abandon_on_cancel=True,
        )

        return cls(
            id=id,
            protocol_id=protocol_id,
            analyzer_version=analyzer_version,
            completed_analysis=completed_analysis,
        )


class CompletedAnalysisStore:
    """A SQL-persistent and memory-cached store of protocol analyses that are completed.

    To make accesses to analyses faster, this class does its own in-memory caching of
    completed analyses. This is an annoying thing to have to do, but we can't use an LRU
    cache because the access methods are async, and lru_cache doesn't work with those.
    """

    _sql_engine: sqlalchemy.engine.Engine
    _current_analyzer_version: str

    # Parsing and validating blobs from the database into CompletedAnalysisResources
    # is a major compute bottleneck. It can take minutes for long protocols.
    # Caching it can speed up the overall HTTP response time by ~10x (after the first request).
    _memcache: MemoryCache[str, CompletedAnalysisResource]
    _preview_cache: MemoryCache[str, AnalysisPreview]
    _preview_cache_lock: asyncio.Lock

    # This is a lock for performance, not correctness.
    #
    # If multiple clients request the same resources all at once, we want to handle the requests
    # serially to take the most advantage of _memcache. Otherwise, two concurrent requests for the
    # same uncached CompletedAnalysisResource would each do their own work to parse it, which would
    # be redundant and waste compute time.
    #
    # Handling requests serially does not harm overall throughput because even if we handled them
    # concurrently, we'd be bottlenecked by Python's GIL. It will, however, increase latency for
    # a small request if it gets blocked behind a big request.
    _memcache_lock: asyncio.Lock

    def __init__(
        self,
        sql_engine: sqlalchemy.engine.Engine,
        memory_cache: MemoryCache[str, CompletedAnalysisResource],
        current_analyzer_version: str,
    ) -> None:
        self._sql_engine = sql_engine
        self._current_analyzer_version = current_analyzer_version
        self._memcache = memory_cache
        self._memcache_lock = asyncio.Lock()
        self._preview_cache = MemoryCache(_PREVIEW_CACHE_MAX_SIZE, str, AnalysisPreview)
        self._preview_cache_lock = asyncio.Lock()

    async def get_by_id(self, analysis_id: str) -> Optional[CompletedAnalysisResource]:
        """Return the analysis with the given ID, if it exists."""
        async with self._memcache_lock:
            try:
                return self._memcache.get(analysis_id)
            except KeyError:
                pass

            statement = sqlalchemy.select(analysis_table).where(
                analysis_table.c.id == analysis_id
            )
            with self._sql_engine.begin() as transaction:
                try:
                    result = transaction.execute(statement).one()
                except sqlalchemy.exc.NoResultFound:
                    return None

            resource = await CompletedAnalysisResource.from_sql_row(
                result, self._current_analyzer_version
            )
            self._memcache.insert(resource.id, resource)

            return resource

    async def get_by_id_as_document(self, analysis_id: str) -> Optional[str]:
        """Return the analysis with the given ID, if it exists.

        This is like `get_by_id()`, except it returns the analysis as a pre-serialized JSON
        document.
        """
        statement = sqlalchemy.select(analysis_table.c.completed_analysis).where(
            analysis_table.c.id == analysis_id
        )

        with self._sql_engine.begin() as transaction:
            try:
                document: str = transaction.execute(statement).scalar_one()
            except sqlalchemy.exc.NoResultFound:
                # No analysis with this ID.
                return None

        return document

    async def get_preview(self, analysis_id: str) -> Optional[AnalysisPreview]:
        """Return a commands-free preview of the analysis, if it exists."""
        async with self._preview_cache_lock:
            try:
                return self._preview_cache.get(analysis_id)
            except KeyError:
                pass

            try:
                preview = await anyio.to_thread.run_sync(
                    self._get_preview_sync,
                    analysis_id,
                    abandon_on_cancel=True,
                )
            except ValidationError as error:
                raise UnreadableAnalysisError(analysis_id, str(error)) from error

            if preview is not None:
                self._preview_cache.insert(analysis_id, preview)
            return preview

    def _get_preview_sync(self, analysis_id: str) -> Optional[AnalysisPreview]:
        with self._sql_engine.begin() as transaction:
            try:
                fields_row = transaction.execute(
                    _preview_fields_statement(analysis_id)
                ).one()
            except sqlalchemy.exc.NoResultFound:
                return None
            command_rows = transaction.execute(
                _preview_command_rows_statement(analysis_id)
            ).all()

        extracted_commands = [
            ExtractedCommand(
                command_type=row.command_type,
                strategy=row.strategy,
                new_location_slot=row.new_location_slot,
                new_location_aa=row.new_location_aa,
                location_slot=row.location_slot,
                location_aa=row.location_aa,
                load_name=row.load_name,
                module_model=row.module_model,
                addressable_area_name=row.addressable_area_name,
            )
            for row in command_rows
            if row.command_type is not None
        ]

        robot_type: Optional[RobotType] = fields_row.robot_type
        labware = _parse_json_list(_LABWARE_LIST_ADAPTER, fields_row.labware)
        command_count = fields_row.command_count
        if command_count is None:
            command_count = 0

        if fields_row.result is None:
            raise UnreadableAnalysisError(
                analysis_id, "completed analysis is missing result"
            )

        return AnalysisPreview(
            id=fields_row.id,
            status=AnalysisStatus.COMPLETED,
            result=AnalysisResult(fields_row.result),
            robotType=robot_type,
            errors=_parse_json_list(_ERROR_LIST_ADAPTER, fields_row.errors),
            pipettes=_parse_json_list(_PIPETTE_LIST_ADAPTER, fields_row.pipettes),
            modules=_parse_json_list(_MODULE_LIST_ADAPTER, fields_row.modules),
            labware=labware,
            liquids=_parse_json_list(_LIQUID_LIST_ADAPTER, fields_row.liquids),
            runTimeParameters=_parse_json_list(
                _RTP_LIST_ADAPTER, fields_row.run_time_parameters
            ),
            commandPreconditions=_parse_optional_model(
                CommandPreconditions, fields_row.command_preconditions
            ),
            usesGripper=uses_gripper(extracted_commands),
            requiredAddressableAreas=required_addressable_areas(
                extracted_commands, labware, robot_type
            ),
            commandCount=int(command_count),
        )

    async def get_by_protocol(
        self, protocol_id: str
    ) -> List[CompletedAnalysisResource]:
        """Return all analyses associated with the given protocol, oldest-added first.

        If protocol_id doesn't point to a valid protocol, returns an empty list;
        doesn't raise an error.
        """
        async with self._memcache_lock:
            id_statement = (
                sqlalchemy.select(analysis_table.c.id)
                .where(analysis_table.c.protocol_id == protocol_id)
                .order_by(sqlite_rowid)
            )
            with self._sql_engine.begin() as transaction:
                ordered_analyses_for_protocol = [
                    row.id for row in transaction.execute(id_statement).all()
                ]

            analysis_set = set(ordered_analyses_for_protocol)
            cached_analyses = {
                analysis_id
                for analysis_id in ordered_analyses_for_protocol
                if self._memcache.contains(analysis_id)
            }
            uncached_analyses = analysis_set - cached_analyses

            # Because we'll be loading whatever resources are not currently cached from sql
            # using an async method, if this method is called reentrantly then inserting those
            # newly-fetched resources into the memcache could race and eject resources we just
            # added and were about to return. To prevent this, we'll make a second memcache just
            # for this coroutine - since we don't care about size limitations we can just use a
            # dict.
            local_memcache: Dict[str, CompletedAnalysisResource] = {}

            for key in cached_analyses:
                local_memcache[key] = self._memcache.get(key)

            if uncached_analyses:
                statement = (
                    sqlalchemy.select(analysis_table)
                    .where(analysis_table.c.id.in_(uncached_analyses))
                    .order_by(sqlite_rowid)
                )
                with self._sql_engine.begin() as transaction:
                    results = transaction.execute(statement).all()
                for r in results:
                    resource = await CompletedAnalysisResource.from_sql_row(
                        r, self._current_analyzer_version
                    )
                    local_memcache[resource.id] = resource
                    self._memcache.insert(resource.id, resource)

            # note: we want to iterate through ordered_analyseS_for_protocol rather than
            # just the local_memcache dict to preserve total ordering
            return [
                local_memcache[analysis_id]
                for analysis_id in ordered_analyses_for_protocol
            ]

    def get_ids_by_protocol(self, protocol_id: str) -> List[str]:
        """Like `get_by_protocol()`, but return only the ID of each analysis."""
        statement = (
            sqlalchemy.select(analysis_table.c.id)
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()

        result_ids: List[str] = []
        for row in results:
            assert isinstance(row.id, str)
            result_ids.append(row.id)

        return result_ids

    def get_summaries_by_protocol(self, protocol_id: str) -> List[AnalysisSummary]:
        """Like `get_by_protocol()`, but return only the summary of each analysis."""
        statement = (
            sqlalchemy.select(
                analysis_table.c.id,
                sqlalchemy.func.json_extract(
                    analysis_table.c.completed_analysis, "$.result"
                ).label("result"),
            )
            .where(analysis_table.c.protocol_id == protocol_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()

        summaries: List[AnalysisSummary] = []
        for row in results:
            summary = AnalysisSummary.model_construct(
                id=row.id,
                status=AnalysisStatus.COMPLETED,
                result=AnalysisResult(row.result) if row.result is not None else None,
            )
            summaries.append(summary)

        return summaries

    def get_primitive_rtps_by_analysis_id(
        self, analysis_id: str
    ) -> Dict[str, PrimitiveAllowedTypes]:
        """Get the saved primitive RTP values from database."""
        statement = (
            sqlalchemy.select(analysis_primitive_type_rtp_table)
            .where(analysis_primitive_type_rtp_table.c.analysis_id == analysis_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()

        param_resources = [
            PrimitiveParameterResource.from_sql_row(row) for row in results
        ]
        rtps = {
            param.parameter_variable_name: param.parameter_value
            for param in param_resources
        }
        return rtps

    def get_csv_rtps_by_analysis_id(
        self,
        analysis_id: str,
    ) -> Mapping[str, Union[str, None]]:
        """Get the saved CSV RTP file IDs from database."""
        statement = (
            sqlalchemy.select(analysis_csv_rtp_table)
            .where(analysis_csv_rtp_table.c.analysis_id == analysis_id)
            .order_by(sqlite_rowid)
        )
        with self._sql_engine.begin() as transaction:
            results = transaction.execute(statement).all()

        csv_rtps: Dict[str, Optional[str]] = {}
        for row in results:
            param = CSVParameterResource.from_sql_row(row)
            csv_rtps.update({param.parameter_variable_name: param.file_id})
        return csv_rtps

    async def make_room_and_add(
        self,
        completed_analysis_resource: CompletedAnalysisResource,
        primitive_rtp_resources: List[PrimitiveParameterResource],
        csv_rtp_resources: List[CSVParameterResource],
    ) -> None:
        """Make room and add a resource to the store.

        Removes the oldest analyses in store if the number of analyses exceed
        the max allowed, and then adds the new analysis.
        """
        analyses_ids = self.get_ids_by_protocol(completed_analysis_resource.protocol_id)

        # Delete all analyses exceeding max number allowed,
        # plus an additional one to create room for the new one.
        # Most existing databases will not have multiple extra analyses per protocol
        # but there would be some internally that added multiple analyses before
        # we started capping the number of analyses.
        analyses_to_delete = analyses_ids[: -MAX_ANALYSES_TO_STORE + 1]
        for analysis_id in analyses_to_delete:
            self._memcache.remove(analysis_id)
            self._preview_cache.remove(analysis_id)

        # Delete the RTP table rows that reference the analyses being deleted
        delete_primitive_rtp_statement = (
            analysis_primitive_type_rtp_table.delete().where(
                analysis_primitive_type_rtp_table.c.analysis_id.in_(analyses_to_delete)
            )
        )
        delete_csv_rtp_statement = analysis_csv_rtp_table.delete().where(
            analysis_csv_rtp_table.c.analysis_id.in_(analyses_to_delete)
        )
        delete_statement = analysis_table.delete().where(
            analysis_table.c.id.in_(analyses_to_delete)
        )

        insert_statement = analysis_table.insert().values(
            await completed_analysis_resource.to_sql_values()
        )
        insert_rtp_statement = analysis_primitive_type_rtp_table.insert()
        insert_csv_rtp_statement = analysis_csv_rtp_table.insert()

        with self._sql_engine.begin() as transaction:
            transaction.execute(delete_primitive_rtp_statement)
            transaction.execute(delete_csv_rtp_statement)
            transaction.execute(delete_statement)
            transaction.execute(insert_statement)
            for param in primitive_rtp_resources:
                transaction.execute(
                    insert_rtp_statement,
                    param.to_sql_values(),
                )
            for csv_param in csv_rtp_resources:
                transaction.execute(
                    insert_csv_rtp_statement,
                    csv_param.to_sql_values(),
                )
        self._memcache.insert(
            completed_analysis_resource.id, completed_analysis_resource
        )


def _json_extract(source: Any, path: str) -> Any:
    """SQLite json_extract."""
    return sqlalchemy.func.json_extract(source, path)


def _preview_fields_statement(analysis_id: str) -> Any:
    """Select small analysis fields without loading $.commands into Python."""
    blob = analysis_table.c.completed_analysis
    return sqlalchemy.select(
        analysis_table.c.id,
        _json_extract(blob, "$.status").label("status"),
        _json_extract(blob, "$.result").label("result"),
        _json_extract(blob, "$.robotType").label("robot_type"),
        _json_extract(blob, "$.errors").label("errors"),
        _json_extract(blob, "$.pipettes").label("pipettes"),
        _json_extract(blob, "$.modules").label("modules"),
        _json_extract(blob, "$.labware").label("labware"),
        _json_extract(blob, "$.liquids").label("liquids"),
        _json_extract(blob, "$.runTimeParameters").label("run_time_parameters"),
        _json_extract(blob, "$.commandPreconditions").label("command_preconditions"),
        sqlalchemy.func.json_array_length(_json_extract(blob, "$.commands")).label(
            "command_count"
        ),
    ).where(analysis_table.c.id == analysis_id)


def _preview_command_rows_statement(analysis_id: str) -> Any:
    """Walk $.commands in SQLite and return only the fragments preview flags need."""
    commands_json = sqlalchemy.func.coalesce(
        _json_extract(analysis_table.c.completed_analysis, "$.commands"),
        "[]",
    )
    cmd = sqlalchemy.func.json_each(commands_json).table_valued(
        "value", name="cmd", joins_implicitly=True
    )
    command_value = cmd.c.value
    command_type = _json_extract(command_value, "$.commandType")
    return (
        sqlalchemy.select(
            command_type.label("command_type"),
            _json_extract(command_value, "$.params.strategy").label("strategy"),
            _json_extract(command_value, "$.params.newLocation.slotName").label(
                "new_location_slot"
            ),
            _json_extract(
                command_value, "$.params.newLocation.addressableAreaName"
            ).label("new_location_aa"),
            _json_extract(command_value, "$.params.location.slotName").label(
                "location_slot"
            ),
            _json_extract(command_value, "$.params.location.addressableAreaName").label(
                "location_aa"
            ),
            _json_extract(command_value, "$.params.loadName").label("load_name"),
            _json_extract(command_value, "$.params.model").label("module_model"),
            _json_extract(command_value, "$.params.addressableAreaName").label(
                "addressable_area_name"
            ),
        )
        .select_from(analysis_table)
        .where(analysis_table.c.id == analysis_id)
        .where(command_type.in_(PREVIEW_COMMAND_TYPES))
    )


def _parse_json_list(
    adapter: TypeAdapter[List[_ModelT]], raw: Optional[object]
) -> List[_ModelT]:
    if raw is None:
        return []
    if isinstance(raw, str):
        return adapter.validate_json(raw)
    return adapter.validate_python(raw)


def _parse_optional_model(
    model: Type[_ModelT], raw: Optional[object]
) -> Optional[_ModelT]:
    if raw is None:
        return None
    if isinstance(raw, str):
        return model.model_validate_json(raw)
    return model.model_validate(raw)
