from opentrons.config import reset as reset_util

from ...runs.run_store import RunStore


class ResetOptionsManager:
    """Collaborator to manage logic between api lever reset and run_store reset.

    Provides a facade to both an reset_util (opentrons layer) and a RunStore

    Args:
        run_store: Persistentance reset layer.
    """

    def __init__(self, run_store: RunStore) -> None:
        self._run_Store=run_store
        self._reset_options = reset_util.reset_options().items()