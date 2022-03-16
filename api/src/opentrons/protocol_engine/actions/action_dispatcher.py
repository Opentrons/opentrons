"""Action pipeline module."""
from typing import List

from .action_handler import ActionHandler
from .actions import Action


class ActionDispatcher:
    """A pipeline, with an endpoint, that actions can be dispatched into."""

    def __init__(self, sink: ActionHandler) -> None:
        """Initialize the ActionDispatcher and action pipeline.

        Arguments:
            sink: The action handler that all actions in the pipeline
                are sent to.
        """
        self._handlers: List[ActionHandler] = []
        self._sink = sink

    def add_handler(self, handler: ActionHandler) -> None:
        """Add an action handler to the pipeline before the sink."""
        self._handlers.append(handler)

    def dispatch(self, action: Action) -> None:
        """Dispatch an action into the pipeline."""
        for handler in self._handlers:
            handler.handle_action(action)

        self._sink.handle_action(action)
