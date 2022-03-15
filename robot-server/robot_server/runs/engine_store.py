"""In-memory storage of ProtocolEngine instances."""
from typing import Dict, NamedTuple, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine import ProtocolEngine, StateView, create_protocol_engine
from opentrons.protocol_runner import ProtocolRunner


class EngineMissingError(RuntimeError):
    """An error raised if the engine somehow hasn't been initialized.

    If this error is raised, it's almost certainly due to a software bug.
    """


class EngineConflictError(RuntimeError):
    """An error raised if an active engine is already initialized.

    The store will not create a new engine unless the "current" runner/engine
    pair is idle.
    """


class RunnerEnginePair(NamedTuple):
    """A stored ProtocolRunner/ProtocolEngine pair."""

    runner: ProtocolRunner
    engine: ProtocolEngine


# TODO(mc, 2021-05-28): evaluate multi-engine logic, which this does not support
class EngineStore:
    """Factory and in-memory storage for ProtocolEngine."""

    def __init__(self, hardware_api: HardwareControlAPI) -> None:
        """Initialize an engine storage interface.

        Arguments:
            hardware_api: Hardware control API instance used for ProtocolEngine
                construction.
        """
        self._hardware_api = hardware_api
        self._default_engine: Optional[ProtocolEngine] = None
        self._runner_engine_pair: Optional[RunnerEnginePair] = None
        self._engines_by_run_id: Dict[str, ProtocolEngine] = {}

    @property
    def engine(self) -> ProtocolEngine:
        """Get the "current" persisted ProtocolEngine.

        Raises:
            EngineMissingError: Engine has not yet been created and persisted.
        """
        if self._runner_engine_pair is None:
            raise EngineMissingError("Engine not yet created.")

        return self._runner_engine_pair.engine

    @property
    def runner(self) -> ProtocolRunner:
        """Get the "current" persisted ProtocolRunner.

        Raises:
            EngineMissingError: Runner has not yet been created and persisted.
        """
        if self._runner_engine_pair is None:
            raise EngineMissingError("Runner not yet created.")

        return self._runner_engine_pair.runner

    async def get_default_engine(self) -> ProtocolEngine:
        if self._runner_engine_pair is not None:
            raise EngineConflictError("An engine for a run is currently active")

        engine = self._default_engine

        if engine is None:
            engine = await create_protocol_engine(self._hardware_api)
            self._default_engine = engine

        return engine

    async def create(self, run_id: str) -> StateView:
        """Create and store a ProtocolRunner and ProtocolEngine for a given Run.

        Args:
            run_id: The run resource the engine is assigned to.

        Returns:
            The state view for the new ProtocolEngine.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            a new set may not be created.
        """
        engine = await create_protocol_engine(hardware_api=self._hardware_api)
        runner = ProtocolRunner(protocol_engine=engine, hardware_api=self._hardware_api)

        await self.clear()

        self._runner_engine_pair = RunnerEnginePair(runner=runner, engine=engine)
        self._engines_by_run_id[run_id] = engine

        return engine.state_view

    def get_state(self, run_id: str) -> StateView:
        """Get a run's ProtocolEngine state.

        Args:
            run_id: The run resource to retrieve engine state from.

        Raises:
            EngineMissingError: No engine found for the given run ID.
        """
        try:
            return self._engines_by_run_id[run_id].state_view
        except KeyError:
            raise EngineMissingError(f"No engine state found for run {run_id}")

    async def clear(self) -> None:
        """Remove the persisted ProtocolEngine, if present, no-op otherwise.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            they cannot be cleared.
        """
        if self._runner_engine_pair is not None:
            if self.engine.state_view.commands.get_is_okay_to_clear():
                await self.engine.finish(drop_tips_and_home=False)
            else:
                raise EngineConflictError("Current run is not idle or stopped.")

        self._runner_engine_pair = None
