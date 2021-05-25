"""Session run input and controls."""

from .session_inputs import SessionInput


class SessionRunner:
    """Methods for managing the lifecycle of a session."""

    def trigger_input_effects(self, input: SessionInput) -> None:
        """Trigger side-effects for an incoming input resource.

        Arguments:
            input: The session input resource to react to.
        """
        raise NotImplementedError()
