"""In-memory storage of ProtocolEngine instances."""
from typing import Optional

from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine


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

    @property
    def engine(self) -> ProtocolEngine:
        """Get the persisted ProtocolEngine.

        Raises:
            EngineMissingError: Engine has not yet been created and persisted.
        """
        if self._engine is None:
            raise EngineMissingError("Engine not yet created.")

        return self._engine

    async def create(self) -> ProtocolEngine:
        """Create and store a ProtocolEngine.

        Returns:
            The created and stored ProtocolEngine.

        Raises:
            EngineConflictError: a ProtocolEngine is already present.
        """
        engine = await ProtocolEngine.create(hardware=self._hardware_api)

        if self._engine is not None:
            raise EngineConflictError("Cannot load multiple sessions simultaneously.")

        self._engine = engine

        return engine

    def clear(self) -> None:
        """Remove the persisted ProtocolEngine, if present, no-op otherwise."""
        self._engine = None
