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
        raise NotImplementedError()
