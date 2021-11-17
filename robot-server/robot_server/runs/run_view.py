"""Run response model factory."""
from dataclasses import replace
from datetime import datetime
from typing import List, Tuple

from opentrons.protocol_engine import (
    Command as ProtocolEngineCommand,
    EngineStatus,
    LoadedLabware,
    LoadedPipette,
    LabwareOffset,
)

from .run_store import RunResource
from .action_models import RunAction, RunActionCreate
from .run_models import Run, RunUpdate, RunCommandSummary


class RunView:
    """Interface to build run model instances from data.

    Resources consumed and returned by this class will be treated as
    immutable.
    """

    @staticmethod
    def with_update(run: RunResource, update: RunUpdate) -> RunResource:
        """Update a run resource with update request data.

        Arguments:
            run: Existing run resource.
            update: Run update data.

        Returns:
            The updated run resource.
        """
        is_current = update.current if update.current is not None else run.is_current
        return replace(run, is_current=is_current)

    @staticmethod
    def with_action(
        run: RunResource,
        action_id: str,
        action_data: RunActionCreate,
        created_at: datetime,
    ) -> Tuple[RunAction, RunResource]:
        """Create a new run control action resource instance.

        Arguments:
            run: The run resource to add the action to.
            action_id: Unique ID to assign to the action resource.
            action_data: Data used to create the action resource.
            created_at: Resource creation timestamp.

        Returns:
            A tuple of the created RunAction resource and an
            updated copy of the passed in RunResource.

        """
        actions = RunAction(
            id=action_id,
            createdAt=created_at,
            actionType=action_data.actionType,
        )

        updated_run = replace(
            run,
            actions=run.actions + [actions],
        )

        return actions, updated_run

    @staticmethod
    def as_response(
        run: RunResource,
        commands: List[ProtocolEngineCommand],
        pipettes: List[LoadedPipette],
        labware: List[LoadedLabware],
        labware_offsets: List[LabwareOffset],
        engine_status: EngineStatus,
    ) -> Run:
        """Transform a run resource into its public response model.

        Args:
            run: Internal resource representation of the run.
            commands: Commands from ProtocolEngine state.
            pipettes: Pipettes from ProtocolEngine state.
            labware: Labware from ProtocolEngine state.
            labware_offsets: Labware offsets from ProtocolEngine state.
            engine_status: Status from ProtocolEngine state.

        Returns:
            Run response model representing the same resource.
        """
        command_summaries = [
            RunCommandSummary(id=c.id, commandType=c.commandType, status=c.status)
            for c in commands
        ]

        return Run(
            id=run.run_id,
            protocolId=run.protocol_id,
            createdAt=run.created_at,
            current=run.is_current,
            actions=run.actions,
            commands=command_summaries,
            pipettes=pipettes,
            labware=labware,
            labwareOffsets=labware_offsets,
            status=engine_status,
        )
