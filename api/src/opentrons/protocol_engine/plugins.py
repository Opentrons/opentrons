"""Protocol engine plugin interface."""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import TypeVar

from .actions import Action, ActionDispatcher, ActionHandler
from .state import StateView


PluginT = TypeVar("PluginT", bound="AbstractPlugin")


class AbstractPlugin(ActionHandler, ABC):
    """An ProtocolEngine plugin to customize engine behavior.

    A plugin may customize behavior in one of two ways:

    1. It can react to actions as they flow through the action pipeline,
       before they hit the StateStore.
    2. It can dispatch new actions into the pipeline.
    """

    @property
    def state(self) -> StateView:
        """Get the current ProtocolEngine state."""
        return self._state

    def dispatch(self, action: Action) -> None:
        """Dispatch an action into the action pipeline."""
        return self._action_dispatcher.dispatch(action)

    @abstractmethod
    def handle_action(self, action: Action) -> None:
        """React to an action going through the pipeline.

        When reacting to an action, `self.state` will not yet
        reflect the change represented by the action, because
        plugins receive actions before the StateStore.
        """
        ...

    # NOTE: while this could be accomplished as a factory function,
    # using a "protected" method allows for better typing of private
    # plugin properties without having to declare them on the class
    def _configure(
        self: PluginT,
        state: StateView,
        action_dispatcher: ActionDispatcher,
    ) -> PluginT:
        """Insert a StateView and ActionDispatcher into the plugin.

        This is a protected method that should only be called internally
        by the ProtocolEngine during plugin setup.
        """
        self._state = state
        self._action_dispatcher = action_dispatcher
        return self
