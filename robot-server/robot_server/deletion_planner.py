"""Plan auto-deletions of old SQL resources to make room for new ones."""


from dataclasses import dataclass
from typing import List, Optional, Set


@dataclass(frozen=True)
class RunSpec:
    """Minimal info about a run in the SQL database.

    Just enough for the `DeletionPlanner` to do its job.
    """

    run_id: str
    """This run's ID."""

    protocol_id: Optional[str]
    """The ID of the protocol that this run is linked to, if any."""


@dataclass(frozen=True)
class DeletionPlan:
    """A plan for what SQL resources to delete.

    Since runs may depend on protocols, you must delete all runs
    before deleting any protocols.
    """

    runs_to_delete: Set[str]
    """The IDs of all runs that you should delete."""

    protocols_to_delete: Set[str]
    """The IDs of all protocols that you should delete.

    Note that each protocol may have analyses that need their own deletion.
    """


class DeletionPlanner:  # noqa: D101
    def plan_deletions_for_new_protocol(
        self,
        existing_protocols: List[str],
        existing_runs: List[RunSpec],
        maximum_protocols: int,
        maximum_runs: int,
    ) -> DeletionPlan:
        """Choose which resources to delete in order to make room for a new protocol.

        Args:
            existing_protocols: The IDs of all protocols that currently exist
                the database. Must be in order from oldest first!
            existing_runs: Information about all runs that currently exist
                in the database. Must be in order from oldest first!
            maximum_protocols: The maximum allowed number of protocols.
            maximum_runs: The maximum allowed number of runs.
        """
        raise NotImplementedError()

    def plan_deletions_for_new_run(
        self,
        existing_protocols: List[str],
        existing_runs: List[RunSpec],
        maximum_protocols: int,
        maximum_runs: int,
    ) -> DeletionPlan:
        """Choose which resources to delete in order to make room for a new run.

        Arguments are the same as for`plan_deletions_for_new_protocol()`.
        """
        runs_upper_limit = maximum_runs - 1
        if runs_upper_limit < 0:
            runs_upper_limit = 0

        if len(existing_runs) > runs_upper_limit:
            num_runs_to_delete = len(existing_runs) - runs_upper_limit

            # Prefer to delete oldest runs first.
            runs_to_delete = existing_runs[0:num_runs_to_delete]

            return DeletionPlan(
                runs_to_delete=set(r.run_id for r in runs_to_delete),
                protocols_to_delete=set()
            )

        return DeletionPlan(
            runs_to_delete=set(),
            protocols_to_delete=set()
        )
