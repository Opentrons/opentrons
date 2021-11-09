"""Runs' in-memory store."""
from dataclasses import dataclass, replace
from datetime import datetime
from typing import Dict, List, Optional

from .action_models import RunAction


@dataclass(frozen=True)
class RunResource:
    """An entry in the run store, used to construct response models.

    This represents all run state that cannot be derived from another
    location, such as a ProtocolEngine instance.
    """

    run_id: str
    protocol_id: Optional[str]
    created_at: datetime
    actions: List[RunAction]
    is_current: bool


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
            run: Run resource to store. Reads `run.id` to
                determine identity in storage.

        Returns:
            The resource that was added to the store.
        """
        if run.is_current is True:
            for target_id, target in self._runs_by_id.items():
                if target.is_current and target_id != run.run_id:
                    self._runs_by_id[target_id] = replace(target, is_current=False)

        self._runs_by_id[run.run_id] = run

        return run

    def get(self, run_id: str) -> RunResource:
        """Get a specific run entry by its identifier.

        Arguments:
            run_id: Unique identifier of run entry to retrieve.

        Returns:
            The retrieved run entry from the store.
        """
        try:
            return self._runs_by_id[run_id]
        except KeyError as e:
            raise RunNotFoundError(run_id) from e

    def get_all(self) -> List[RunResource]:
        """Get all known run resources.

        Returns:
            All stored run entries.
        """
        return list(self._runs_by_id.values())

    def remove(self, run_id: str) -> RunResource:
        """Remove a run by its unique identifier.

        Arguments:
            run_id: The run's unique identifier.

        Returns:
            The run entry that was deleted.

        Raises:
            RunNotFoundError: The specified run ID was not found.
        """
        try:
            return self._runs_by_id.pop(run_id)
        except KeyError as e:
            raise RunNotFoundError(run_id) from e
