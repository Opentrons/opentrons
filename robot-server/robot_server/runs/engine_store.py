"""In-memory storage of ProtocolEngine instances."""
from typing import NamedTuple, Optional

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_runner import ProtocolRunner
from opentrons.protocol_engine import (
    ProtocolEngine,
    ProtocolRunData,
    create_protocol_engine,
)


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

    run_id: str
    runner: ProtocolRunner
    engine: ProtocolEngine


# TODO (tz, 2022-04-28) change name after storing it all in the DB.
#  check if this is even needed after Db access
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

    @property
    def current_run_id(self) -> Optional[str]:
        """Get the run identifier associated with the current engine/runner pair."""
        return (
            self._runner_engine_pair.run_id
            if self._runner_engine_pair is not None
            else None
        )

    # TODO(mc, 2022-03-21): this resource locking is insufficient;
    # come up with something more sophisticated without race condition holes.
    async def get_default_engine(self) -> ProtocolEngine:
        """Get a "default" ProtocolEngine to use outside the context of a run.

        Raises:
            EngineConflictError: if a run-specific engine is active.
        """
        if self._runner_engine_pair is not None:
            raise EngineConflictError("An engine for a run is currently active")

        engine = self._default_engine

        if engine is None:
            # TODO(mc, 2022-03-21): potential race condition
            engine = await create_protocol_engine(self._hardware_api)
            self._default_engine = engine

        return engine

    async def create(self, run_id: str) -> ProtocolRunData:
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

        self._runner_engine_pair = RunnerEnginePair(
            run_id=run_id, runner=runner, engine=engine
        )

        return engine.state_view.get_protocol_run_data()

    async def clear(self) -> None:
        """Remove the persisted ProtocolEngine, if present, no-op otherwise.

        Raises:
            EngineConflictError: The current runner/engine pair is not idle, so
            they cannot be cleared.
        """
        if self._runner_engine_pair is not None:
            if self.engine.state_view.commands.get_is_okay_to_clear():
                await self.engine.finish(drop_tips_and_home=False, set_run_status=False)
            else:
                raise EngineConflictError("Current run is not idle or stopped.")

        self._runner_engine_pair = None
