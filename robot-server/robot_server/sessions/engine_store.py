"""In-memory storage of ProtocolEngine instances."""
from typing import Optional, NamedTuple

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine, create_protocol_engine
from opentrons.protocol_runner import ProtocolRunner


class EngineConflictError(RuntimeError):
    """An error raised if the runner already has an engine initialized."""

    pass


class EngineMissingError(RuntimeError):
    """An error raised if the engine somehow hasn't been initialized.

    If this error is raised, it's almost certainly due to a software bug.
    """

    pass


class RunnerEnginePair(NamedTuple):
    """A stored ProtocolRunner/ProtocolEngine pair."""

    runner: ProtocolRunner
    engine: ProtocolEngine


# TODO(mc, 2021-05-28): evaluate multi-engine logic, which this does not support
class EngineStore:
    """Factory and in-memory storage for ProtocolEngine."""

    def __init__(self, hardware_api: HardwareAPI) -> None:
        """Initialize an engine storage interface.

        Arguments:
            hardware_api: Hardware control API instance used for ProtocolEngine
                construction.
        """
        self._hardware_api = hardware_api
        self._runner_engine_pair: Optional[RunnerEnginePair] = None

    @property
    def engine(self) -> ProtocolEngine:
        """Get the persisted ProtocolEngine.

        Raises:
            EngineMissingError: Engine has not yet been created and persisted.
        """
        if self._runner_engine_pair is None:
            raise EngineMissingError("Engine not yet created.")

        return self._runner_engine_pair.engine

    @property
    def runner(self) -> ProtocolRunner:
        """Get the persisted ProtocolRunner.

        Raises:
            EngineMissingError: Runner has not yet been created and persisted.
        """
        if self._runner_engine_pair is None:
            raise EngineMissingError("Runner not yet created.")

        return self._runner_engine_pair.runner

    async def create(self) -> RunnerEnginePair:
        """Create and store a ProtocolRunner and ProtocolEngine.

        Returns:
            The created and stored ProtocolRunner / ProtocolEngine pair.

        Raises:
            EngineConflictError: a ProtocolEngine is already present.
        """
        # NOTE: this async. creation happens before the `self._engine`
        # check intentionally to avoid a race condition where `self._engine` is
        # set after the check but before the engine has finished getting created,
        # at the expense of having to potentially throw away an engine instance
        engine = await create_protocol_engine(hardware_api=self._hardware_api)
        runner = ProtocolRunner(protocol_engine=engine, hardware_api=self._hardware_api)

        if self._runner_engine_pair is not None:
            raise EngineConflictError("Cannot load multiple sessions simultaneously.")

        self._runner_engine_pair = RunnerEnginePair(runner=runner, engine=engine)

        return self._runner_engine_pair

    def clear(self) -> None:
        """Remove the persisted ProtocolEngine, if present, no-op otherwise."""
        self._runner_engine_pair = None
