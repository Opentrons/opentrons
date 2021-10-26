"""Sessions in-memory store."""
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from .run_models import RunCreateData
from .action_models import RunAction


@dataclass(frozen=True)
class RunResource:
    """An entry in the session store, used to construct response models.

    This represents all session state that cannot be derived from another
    location, such as a ProtocolEngine instance.
    """

    run_id: str
    create_data: RunCreateData
    created_at: datetime
    actions: List[RunAction]


class RunNotFoundError(ValueError):
    """Error raised when a given Run ID is not found in the store."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(f"Run {run_id} was not found.")


class RunStore:
    """Methods for storing and retrieving run resources."""

    def __init__(self) -> None:
        """Initialize a RunStore and its in-memory storage."""
        self._runs_by_id: Dict[str, RunResource] = {}

    def upsert(self, run: RunResource) -> RunResource:
        """Insert or update a run resource in the store.

        Arguments:
            run: Session resource to store. Reads `session.id` to
                determine identity in storage.

        Returns:
            The resource that was added to the store.
        """
        self._runs_by_id[run.run_id] = run

        return run

    def get(self, run_id: str) -> RunResource:
        """Get a specific session entry by its identifier.

        Arguments:
            run_id: Unique identifier of session entry to retrieve.

        Returns:
            The retrieved session entry from the store.
        """
        try:
            return self._runs_by_id[run_id]
        except KeyError as e:
            raise RunNotFoundError(run_id) from e

    def get_all(self) -> List[RunResource]:
        """Get all known session resources.

        Returns:
            All stored session entries.
        """
        return list(self._runs_by_id.values())

    def remove(self, run_id: str) -> RunResource:
        """Remove a session by its unique identifier.

        Arguments:
            run_id: The session's unique identifier.

        Returns:
            The session entry that was deleted.

        Raises:
            RunNotFoundError: The specified session ID was not found.
        """
        try:
            return self._runs_by_id.pop(run_id)
        except KeyError as e:
            raise RunNotFoundError(run_id) from e
