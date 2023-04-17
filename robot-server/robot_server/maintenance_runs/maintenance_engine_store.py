"""In-memory storage of ProtocolEngine instances."""
from typing import List, NamedTuple, Optional

from opentrons_shared_data.robot.dev_types import RobotType

from opentrons.config import feature_flags
from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_runner import LiveRunner, RunResult
from opentrons.protocol_engine import (
    ProtocolEngine,
    Config as ProtocolEngineConfig,
    StateSummary,
    LabwareOffsetCreate,
    create_protocol_engine,
)


class EngineConflictError(RuntimeError):
    """An error raised if an active engine is already initialized.

    The store will not create a new engine unless the "current" runner/engine
    pair is idle.
    """


class RunnerEnginePair(NamedTuple):
    """A stored ProtocolRunner/ProtocolEngine pair."""

    run_id: str
    runner: LiveRunner
    engine: ProtocolEngine


class MaintenanceEngineStore:
    """Factory and in-memory storage for ProtocolEngine."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        robot_type: RobotType,
    ) -> None:
        """Initialize an engine storage interface.

        Arguments:
            hardware_api: Hardware control API instance used for ProtocolEngine
                construction.
            robot_type: Passed along to `opentrons.protocol_engine.Config`.
        """
        self._hardware_api = hardware_api
        self._robot_type = robot_type
        self._runner_engine_pair: Optional[RunnerEnginePair] = None

    @property
    def engine(self) -> ProtocolEngine:
        """Get the "current" persisted ProtocolEngine."""
        assert self._runner_engine_pair is not None, "Engine not yet created."
        return self._runner_engine_pair.engine

    @property
    def runner(self) -> LiveRunner:
        """Get the "current" persisted ProtocolRunner."""
        assert self._runner_engine_pair is not None, "Runner not yet created."
        return self._runner_engine_pair.runner

    @property
    def current_run_id(self) -> Optional[str]:
        """Get the run identifier associated with the current engine/runner pair."""
        return (
            self._runner_engine_pair.run_id
            if self._runner_engine_pair is not None
            else None
        )

    async def create(
        self,
        run_id: str,
        labware_offsets: List[LabwareOffsetCreate],
    ) -> StateSummary:
        """Create and store a ProtocolRunner and ProtocolEngine for a given Run.

        Args:
            run_id: The run resource the engine is assigned to.
            labware_offsets: Labware offsets to create the engine with.
            protocol: The protocol to load the runner with, if any.

        Returns:
            The initial equipment and status summary of the engine.
        """
        # Because we will be clearing engine store before creating a new one,
        # the runner-engine pair should be None at this point.
        assert self._runner_engine_pair is None, (
            "There is an active maintenance run" " that was not deleted correctly."
        )
        engine = await create_protocol_engine(
            hardware_api=self._hardware_api,
            config=ProtocolEngineConfig(
                robot_type=self._robot_type,
                block_on_door_open=feature_flags.enable_door_safety_switch(),
            ),
        )
        runner = LiveRunner(protocol_engine=engine, hardware_api=self._hardware_api)

        # TODO (spp): set live runner start func

        for offset in labware_offsets:
            engine.add_labware_offset(offset)

        self._runner_engine_pair = RunnerEnginePair(
            run_id=run_id,
            runner=runner,
            engine=engine,
        )

        return engine.state_view.get_summary()

    async def clear(self) -> RunResult:
        """Remove the persisted ProtocolEngine.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            they cannot be cleared.
        """
        engine = self.engine
        state_view = engine.state_view

        if state_view.commands.get_is_okay_to_clear():
            await engine.finish(drop_tips_and_home=False, set_run_status=False)
        else:
            raise EngineConflictError("Current run is not idle or stopped.")

        run_data = state_view.get_summary()
        commands = state_view.commands.get_all()
        self._runner_engine_pair = None

        return RunResult(state_summary=run_data, commands=commands)
