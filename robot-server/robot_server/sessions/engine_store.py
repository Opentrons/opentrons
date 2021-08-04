"""In-memory storage of ProtocolEngine instances."""
from typing import Optional

from opentrons.hardware_control import API as HardwareAPI
from opentrons.file_runner import AbstractFileRunner, ProtocolFile, create_file_runner
from opentrons.protocol_engine import ProtocolEngine, create_protocol_engine
from robot_server.protocols import ProtocolResource


class EngineConflictError(RuntimeError):
    """An error raised if the runner already has an engine initialized."""

    pass


class EngineMissingError(RuntimeError):
    """An error raised if the engine somehow hasn't been initialized.

    If this error is raised, it's almost certainly due to a software bug.
    """

    pass


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
        self._engine: Optional[ProtocolEngine] = None
        self._runner: Optional[AbstractFileRunner] = None

    @property
    def engine(self) -> ProtocolEngine:
        """Get the persisted ProtocolEngine.

        Raises:
            EngineMissingError: Engine has not yet been created and persisted.
        """
        if self._engine is None:
            raise EngineMissingError("Engine not yet created.")

        return self._engine

    @property
    def runner(self) -> AbstractFileRunner:
        """Get the persisted AbstractFileRunner.

        Raises:
            EngineMissingError: Runner has not yet been created and persisted.
        """
        if self._runner is None:
            raise EngineMissingError("Runner not yet created.")

        return self._runner

    async def create(self, protocol: Optional[ProtocolResource]) -> ProtocolEngine:
        """Create and store a ProtocolEngine.

        Returns:
            The created and stored ProtocolEngine.

        Raises:
            EngineConflictError: a ProtocolEngine is already present.
        """
        # NOTE: this async. creation happens before the `self._engine`
        # check intentionally to avoid a race condition where `self._engine` is
        # set after the check but before the engine has finished getting created,
        # at the expense of having to potentially throw away an engine instance
        engine = await create_protocol_engine(hardware_api=self._hardware_api)
        runner = None

        if self._engine is not None:
            raise EngineConflictError("Cannot load multiple sessions simultaneously.")

        if protocol is not None:
            # TODO(mc, 2021-06-11): add multi-file support. As written, other
            # parts of the API will make sure len(files) == 0, but this will
            # not remain true as engine sessions are built out
            protocol_file = ProtocolFile(
                file_path=protocol.files[0],
                file_type=protocol.protocol_type,
            )
            runner = create_file_runner(
                protocol_file=protocol_file,
                engine=engine,
            )

            # TODO(mc, 2021-06-11): serparating load from creation is a potentially
            # two-phase initialization. Revisit this, but for now keep the weirdness
            # contained here in this factory method
            runner.load()

        self._engine = engine
        self._runner = runner

        return engine

    def clear(self) -> None:
        """Remove the persisted ProtocolEngine, if present, no-op otherwise."""
        self._engine = None
