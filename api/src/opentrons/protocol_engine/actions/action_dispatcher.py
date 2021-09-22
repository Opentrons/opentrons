"""Action pipeline module."""
from .action_handler import ActionHandler
from .actions import Action


class ActionDispatcher:
    """A pipeline, with an endpoint, that actions cna be dispatched into."""

    def __init__(self, sink: ActionHandler) -> None:
        """Intialize the ActionDispatcher and action pipeline.

        Arguments:
            sink: The action handler that all actions in the pipeline
                are sent to.
        """
        self._sink = sink

    def dispatch(self, action: Action) -> None:
        """Dispatch an action into the pipeline."""
        self._sink.handle_action(action)
