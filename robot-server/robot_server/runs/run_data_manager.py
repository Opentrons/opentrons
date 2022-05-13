"""Manage current and historical run data."""
from datetime import datetime
from typing import List, Optional
from typing_extensions import Literal

from opentrons.protocol_engine import (
    EngineStatus,
    LabwareOffsetCreate,
    ProtocolRunData,
    CommandSlice,
    CurrentCommand,
    Command,
)

from robot_server.protocols import ProtocolResource
from robot_server.service.task_runner import TaskRunner

from .engine_store import EngineStore
from .run_store import RunResource, RunStore, RunNotFoundError
from .run_models import Run


def _build_run(
        run_resource: RunResource,
        run_data: Optional[ProtocolRunData],
        current: bool,
) -> Run:
    run_data = run_data or ProtocolRunData.construct(
        status=EngineStatus.STOPPED,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
    )
    return Run.construct(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=run_data.status,
        errors=run_data.errors,
        labware=run_data.labware,
        labwareOffsets=run_data.labwareOffsets,
        pipettes=run_data.pipettes,
        current=current,
    )


class RunNotCurrentError(ValueError):
    """Error raised when a requested run is not the current run."""


class RunDataManager:
    """Collaborator to manage current and historical run data.

    Provides a facade to both an EngineStore (current run) and a RunStore
    (historical runs). Returns `Run` response models to the router.

    Args:
        engine_store: In-memory store the current run's ProtocolEngine.
        run_store: Persistent database of current and historical run data.
    """

    def __init__(
            self, engine_store: EngineStore, run_store: RunStore, task_runner: TaskRunner
    ) -> None:
        self._engine_store = engine_store
        self._run_store = run_store
        self._task_runner = task_runner

    @property
    def current_run_id(self) -> Optional[str]:
        """The identifier of the current run, if any."""
        return self._engine_store.current_run_id

    async def create(
            self,
            run_id: str,
            created_at: datetime,
            labware_offsets: List[LabwareOffsetCreate],
            protocol: Optional[ProtocolResource],
    ) -> Run:
        """Create a new, current run.

        Args:
            run_id: Identifier to assign the new run.
            created_at: Creation datetime.
            labware_offsets: Labware offsets to initialize the engine with.

        Returns:
            The run resource.

        Raise:
            EngineConflictError: There is a currently active run that cannot
                be superceded by this new run.
        """
        prev_run_id = self._engine_store.current_run_id
        if prev_run_id is not None:
            prev_run_result = await self._engine_store.clear()
            self._run_store.update_run_state(
                run_id=prev_run_id,
                run_data=prev_run_result.data,
                commands=prev_run_result.commands,
            )

        run_data = await self._engine_store.create(
            run_id=run_id,
            labware_offsets=labware_offsets,
        )
        run_resource = self._run_store.insert(
            run_id=run_id,
            created_at=created_at,
            protocol_id=protocol.protocol_id if protocol is not None else None,
        )

        return _build_run(run_resource=run_resource, run_data=run_data, current=True)

    def get(self, run_id: str) -> Run:
        """Get a run resource.

        This method will pull from the current run or the historical runs,
        depending on if `run_id` refers to the current run.

        Args:
            run_id: The identifier of the run to return.

        Returns:
            The run resource.

        Raises:
            RunNotFoundError: The given run identifier does not exist.
        """
        run_resource = self._run_store.get(run_id)
        run_data = self._get_run_data(run_id)
        current = run_id == self._engine_store.current_run_id

        return _build_run(run_resource, run_data, current)

    def get_all(self) -> List[Run]:
        """Get current and stored run resources.

        Returns:
            All run resources.
        """
        return [
            _build_run(
                run_resource=run_resource,
                run_data=self._get_run_data(run_resource.run_id),
                current=run_resource.run_id == self._engine_store.current_run_id,
            )
            for run_resource in self._run_store.get_all()
        ]

    async def delete(self, run_id: str) -> None:
        """Delete a current or historical run.

        Args:
            run_id: The identifier of the run to remove.

        Raises:
            EngineConflictError: If deleting the current run, the current run
                is not idle and cannot be deleted.
            RunNotFoundError: The given run identifier was not found in the database.
        """
        if run_id == self._engine_store.current_run_id:
            await self._engine_store.clear()
        else:
            self._run_store.remove(run_id)

    async def update(self, run_id: str, current: Optional[Literal[False]]) -> Run:
        """Get and potentially archive a run.

        Args:
            run_id: The run to get and maybe archive.

        Returns:
            The updated run.

        Raises:
            RunNotFoundError: The run identifier was not found in the database.
            RunNotCurrentError: The run is not the current run.
            EngineConflictError: The run cannot be updated because it is not idle.
        """
        if run_id != self._engine_store.current_run_id:
            raise RunNotCurrentError(
                f"Cannot update {run_id} because it is not the current run."
            )

        next_current = current if current is False else True

        if next_current is False:
            commands, run_data = await self._engine_store.clear()
            run_resource = self._run_store.update_run_state(
                run_id=run_id,
                run_data=run_data,
                commands=commands,
            )
        else:
            run_data = self._engine_store.engine.state_view.get_protocol_run_data()
            run_resource = self._run_store.get(run_id=run_id)

        return _build_run(
            run_resource=run_resource,
            run_data=run_data,
            current=next_current,
        )

    def get_commands_slice(
            self,
            run_id: str,
            cursor: Optional[int],
            length: int,
    ) -> CommandSlice:
        """Get a slice of run commands.

        Args:
            run_id: ID of the run.
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
        """
        if self._engine_store.current_run_id == run_id:
            commands = self._engine_store.engine.state_view.commands.get_all()
        else:
            # Let exception propagate
            commands = self._run_store.get_run_commands(run_id)

        return self._slice_commands(cursor=cursor, length=length, commands=commands)

    def get_current_command(self, run_id: str) -> Optional[CurrentCommand]:
        """Get the currently executing command, if any.

        Args:
            run_id: ID of the run.

        Raises:
            RunNotFoundError: The given run identifier was not found in the database.
        """
        raise NotImplementedError("TODO")

    def get_command(self, run_id: str, command_id: str) -> Command:
        """Get a run's command by ID.

        Args:
            run_id: ID of the run.
            command_id: ID of the command.

        Raises:
            RunNotFoundError: The given run identifier was not found.
            CommandNotFoundError: The given command identifier was not found.
        """
        raise NotImplementedError("TODO")

    def _get_run_data(self, run_id: str) -> Optional[ProtocolRunData]:
        result: Optional[ProtocolRunData]

        if run_id == self._engine_store.current_run_id:
            result = self._engine_store.engine.state_view.get_protocol_run_data()
        else:
            result = self._run_store.get_run_data(run_id)

        return result

    def _slice_commands(self, cursor: Optional[int],
                            length: int, commands: List[Command]) -> CommandSlice:
        commands_length = len(commands)

        if cursor is None:
            cursor = commands_length - length

        # start is inclusive, stop is exclusive
        actual_cursor = max(0, min(cursor, commands_length - 1))
        stop = min(commands_length, actual_cursor + length)
        sliced_commands = commands[actual_cursor:stop]

        return CommandSlice(
            cursor=actual_cursor,
            total_length=commands_length,
            commands=sliced_commands
        )
