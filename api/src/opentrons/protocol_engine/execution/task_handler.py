"""Task handling."""


import logging
from ..state.state import StateStore
from ..resources import ModelUtils

log = logging.getLogger(__name__)


class TaskHandler:
    """Implementation logic for fask concurrency."""

    _state_store: StateStore
    _model_utils: ModelUtils

    def __init__(
        self, state_store: StateStore, model_utils: ModelUtils | None = None
    ) -> None:
        """Initialize a TaskHandler instance."""
        self._state_store = state_store
        self._model_utils = model_utils if model_utils is not None else ModelUtils()
