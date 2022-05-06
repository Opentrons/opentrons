"""Auto-deletion of old SQL resources to make room for new ones."""


from dataclasses import dataclass
from typing import List, Optional, Set


@dataclass(frozen=True)
class RunSpec:
    run_id: str
    protocol_id: Optional[str]


@dataclass(frozen=True)
class DeletionPlan:
    runs_to_delete: Set[str]
    protocols_to_delete: Set[str]


class DeletionPlanner:
    def plan_deletions_for_new_protocol(
        self,
        existing_protocols: List[str],
        existing_runs: List[RunSpec],
    ) -> DeletionPlan:
        """Choose which resources to delete in order to make room for a new protocol.

        Args:
            existing_protocols: The IDs of all protocols that currently exist
                the database, oldest first.
            existing_runs: Information about all runs that currently exist
                in the database, oldest first.
        """
        raise NotImplementedError()

    def plan_deletions_for_new_run(
        self,
        existing_protocols: List[str],
        existing_runs: List[RunSpec],
    ) -> DeletionPlan:
        """Choose which resources to delete in order to make room for a new run.

        Args:
            existing_protocols: The IDs of all protocols that currently exist
                the database, oldest first.
            existing_runs: Information about all runs that currently exist
                in the database, oldest first.
        """
        raise NotImplementedError()
