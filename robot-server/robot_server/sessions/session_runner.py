"""Session run input and controls."""
from datetime import datetime

from .session_inputs import SessionInput, CreateSessionInputData


class SessionRunner:
    """Methods for managing the lifecycle of a session."""

    def handle_input(
        self,
        session_id: str,
        input_id: str,
        created_at: datetime,
        input_data: CreateSessionInputData,
    ) -> SessionInput:
        """Handle an input event.

        Arguments:
            session_id: Session the input is targeting.
            input_id: ID to assign to the input event resource.
            created_at: Timestamp to assign to the input event resource.
            input_data: Input event payload

        Returns:
            A resource model representing the input event.
        """
        raise NotImplementedError()
