"""Management interface for ProtocolEngine instances."""
from opentrons.protocol_engine import StateView


class EngineNotFoundError(ValueError):
    """Error raised when a engine cannot be found."""

    def __init__(self, session_id: str) -> None:
        """Initialize the error message from the session ID."""
        super().__init__(f"No engine found for {session_id}.")


class EngineStore:
    """Manage the ProtocolEngine used in sessions."""

    def get_state(self, session_id: str) -> StateView:
        """Get the engine state for a given session ID.

        Arguments:
            session_id: Unique identifier of the engine's associated Session

        Returns:
            The ProtocolEngine state.

        Raises:
            EngineNotFound: No ProtocolEngine exists for the given session ID.
        """
        raise NotImplementedError()
