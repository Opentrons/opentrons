"""Run response model factory."""
from dataclasses import replace
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from opentrons.protocol_engine import (
    Command as ProtocolEngineCommand,
    EngineStatus,
    LoadedLabware,
    LoadedPipette,
)

from .run_store import RunResource
from .action_models import RunAction, RunActionCreateData
from .run_models import (
    Run,
    RunCreateData,
    BasicRun,
    BasicRunCreateData,
    ProtocolRun,
    ProtocolRunCreateData,
    RunCommandSummary,
)


class RunView:
    """Interface to build run model instances from data.

    Resources consumed and returned by this class will be treated as
    immutable.
    """

    @staticmethod
    def as_resource(
        run_id: str,
        created_at: datetime,
        create_data: Optional[RunCreateData],
    ) -> RunResource:
        """Create a new run resource instance from its create data.

        Arguments:
            run_id: Unique identifier.
            created_at: Resource creation timestamp.
            create_data: Data used to create the run.

        Returns:
            The run in its internal resource representation, for use in
                the `RunStore` and other classes.
        """
        return RunResource(
            run_id=run_id,
            created_at=created_at,
            create_data=create_data or BasicRunCreateData(),
            actions=[],
        )

    @staticmethod
    def with_action(
        run: RunResource,
        action_id: str,
        action_data: RunActionCreateData,
        created_at: datetime,
    ) -> Tuple[RunAction, RunResource]:
        """Create a new run control action resource instance.

        Arguments:
            run: The run resource to add the command to.
            action_id: Unique ID to assign to the command resource.
            action_data: Data used to create the command resource.
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
        engine_status: EngineStatus,
    ) -> Run:
        """Transform a run resource into its public response model.

        Arguments:
            run: Internal resource representation of the run.

        Returns:
            Run response model representing the same resource.
        """
        create_data = run.create_data
        command_summaries = [
            RunCommandSummary(id=c.id, commandType=c.commandType, status=c.status)
            for c in commands
        ]

        response_fields: Dict[str, Any] = {
            "id": run.run_id,
            "createdAt": run.created_at,
            "actions": run.actions,
            "commands": command_summaries,
            "pipettes": pipettes,
            "labware": labware,
            "status": engine_status,
        }

        if isinstance(create_data, BasicRunCreateData):
            return BasicRun(**response_fields)

        if isinstance(create_data, ProtocolRunCreateData):
            response_fields["createParams"] = create_data.createParams
            return ProtocolRun(**response_fields)

        raise ValueError(f"Invalid run resource {run}")
