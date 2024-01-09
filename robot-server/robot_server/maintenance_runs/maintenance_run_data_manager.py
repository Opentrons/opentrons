"""Manage current maintenance run data."""
from datetime import datetime
from typing import List, Optional

from opentrons.protocol_engine import (
    EngineStatus,
    LabwareOffsetCreate,
    StateSummary,
    CommandSlice,
    CurrentCommand,
    Command,
)

from .maintenance_engine_store import MaintenanceEngineStore
from .maintenance_run_models import MaintenanceRun, MaintenanceRunNotFoundError

from opentrons.protocol_engine.types import DeckConfigurationType

import json
from robot_server.mqtt_example import client as mqtt_client


def _build_run(
    run_id: str,
    created_at: datetime,
    state_summary: Optional[StateSummary],
) -> MaintenanceRun:
    state_summary = state_summary or StateSummary.construct(
        status=EngineStatus.IDLE,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
        liquids=[],
    )
    return MaintenanceRun.construct(
        id=run_id,
        createdAt=created_at,
        status=state_summary.status,
        actions=[],  # TODO (spp, 2023-04-23): wire up actions once they are allowed
        errors=state_summary.errors,
        labware=state_summary.labware,
        labwareOffsets=state_summary.labwareOffsets,
        pipettes=state_summary.pipettes,
        modules=state_summary.modules,
        current=True,
        completedAt=state_summary.completedAt,
        startedAt=state_summary.startedAt,
        liquids=state_summary.liquids,
    )


class RunNotCurrentError(ValueError):
    """Error raised when a requested run is not the current run."""


class MaintenanceRunDataManager:
    """Collaborator to manage current maintenance run data.

    Provides a facade to a MaintenanceEngineStore.
    Returns `MaintenanceRun` response models to the router.

    Args:
        engine_store: In-memory store of the current run's ProtocolEngine.
    """

    def __init__(self, engine_store: MaintenanceEngineStore) -> None:
        self._engine_store = engine_store

    @property
    def current_run_id(self) -> Optional[str]:
        """The identifier of the current run, if any."""
        return self._engine_store.current_run_id

    async def create(
        self,
        run_id: str,
        created_at: datetime,
        labware_offsets: List[LabwareOffsetCreate],
        deck_configuration: DeckConfigurationType,
    ) -> MaintenanceRun:
        """Create a new, current maintenance run.

        Args:
            run_id: Identifier to assign the new run.
            created_at: Creation datetime.
            labware_offsets: Labware offsets to initialize the engine with.

        Returns:
            The run resource.
        """
        if self._engine_store.current_run_id is not None:
            await self._engine_store.clear()

        state_summary = await self._engine_store.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=labware_offsets,
            deck_configuration=deck_configuration,
        )

        maintenance_run_data = _build_run(
            run_id=run_id,
            created_at=created_at,
            state_summary=state_summary,
        )

        #TOME: Send here!
        print('SENDING MR DATA')
        mqtt_client.publish('robot-server/maintenance_runs', payload=json.dumps({"data": maintenance_run_data.json()}), qos=1, retain=True)

        return maintenance_run_data

    def get(self, run_id: str) -> MaintenanceRun:
        """Get a maintenance run resource.

        Args:
            run_id: The identifier of the run to return.

        Returns:
            The run resource.

        Raises:
            RunNotCurrentError: The given run identifier does not exist.
        """
        current_id = self._engine_store.current_run_id
        if current_id != run_id:
            raise MaintenanceRunNotFoundError(run_id=run_id)
        created_at = self._engine_store.current_run_created_at
        state_summary = self._get_state_summary(run_id=run_id)

        return _build_run(
            run_id=run_id,
            created_at=created_at,
            state_summary=state_summary,
        )

    async def delete(self, run_id: str) -> None:
        """Delete a maintenance run.

        Args:
            run_id: The identifier of the run to remove.

        Raises:
            EngineConflictError: If deleting the current run, the current run
                is not idle and cannot be deleted.
            RunNotFoundError: The given run identifier was not found.
        """
        if run_id == self._engine_store.current_run_id:
            await self._engine_store.clear()
            print('SENDING MR DATA')
            mqtt_client.publish('robot-server/maintenance_runs', payload=json.dumps(None), qos=1, retain=True)
        else:
            raise MaintenanceRunNotFoundError(run_id=run_id)

    def get_commands_slice(
        self,
        run_id: str,
        cursor: Optional[int],
        length: int,
    ) -> CommandSlice:
        """Get a slice of maintenance run commands.

        Args:
            run_id: ID of the run.
            cursor: Requested index of first command in the returned slice.
            length: Length of slice to return.

        Raises:
            RunNotCurrentError: The given run identifier doesn't belong to a current run.
        """
        if run_id != self._engine_store.current_run_id:
            raise MaintenanceRunNotFoundError(run_id=run_id)
        the_slice = self._engine_store.engine.state_view.commands.get_slice(
            cursor=cursor, length=length
        )
        return the_slice

    def get_current_command(self, run_id: str) -> Optional[CurrentCommand]:
        """Get the currently executing command, if any.

        Args:
            run_id: ID of the run.
        """
        if self._engine_store.current_run_id == run_id:
            return self._engine_store.engine.state_view.commands.get_current()
        return None

    def get_command(self, run_id: str, command_id: str) -> Command:
        """Get a run's command by ID.

        Args:
            run_id: ID of the run.
            command_id: ID of the command.

        Raises:
            RunNotCurrentError: The given run identifier doesn't belong to the current run.
            CommandNotFoundError: The given command identifier was not found.
        """
        if run_id != self._engine_store.current_run_id:
            raise MaintenanceRunNotFoundError(run_id=run_id)
        return self._engine_store.engine.state_view.commands.get(command_id=command_id)

    def _get_state_summary(self, run_id: str) -> Optional[StateSummary]:

        return self._engine_store.engine.state_view.get_summary()
