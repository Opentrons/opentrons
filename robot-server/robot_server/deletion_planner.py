"""Plan auto-deletions of old SQL resources to make room for new ones."""


from dataclasses import dataclass
from typing import List, Set


@dataclass(frozen=True)
class ProtocolSpec:
    """Minimal info about a protocol in the SQL database.

    Just enough for the deletion planner to do its job.
    """

    protocol_id: str
    """This protocol's ID."""

    is_used_by_run: bool
    """Whether this protocol is used by any run."""


class ProtocolDeletionPlanner:  # noqa: D101
    def __init__(self, maximum_unused_protocols: int) -> None:
        self._maximum_unused_protocols = maximum_unused_protocols

    def plan_for_new_protocol(
        self,
        existing_protocols: List[ProtocolSpec],
    ) -> Set[str]:
        """Choose which resources to delete in order to make room for a new protocol.

        Args:
            existing_protocols: Information about all protocols that currently exist
                the database. Must be in order from oldest first!
            maximum_protocols: The maximum allowed number of protocols.
        """
        raise NotImplementedError()


class RunDeletionPlanner:  # noqa: D101
    def __init__(self, maximum_runs: int) -> None:
        self._maximum_runs = maximum_runs

    def plan_deletions_for_new_run(
        self,
        existing_runs: List[str],
    ) -> Set[str]:
        """Choose which resources to delete in order to make room for a new run.

        Arguments are the same as for`plan_deletions_for_new_protocol()`.
        """
        runs_upper_limit = self._maximum_runs - 1
        if runs_upper_limit < 0:
            runs_upper_limit = 0

        if len(existing_runs) > runs_upper_limit:
            num_runs_to_delete = len(existing_runs) - runs_upper_limit

            # Prefer to delete oldest runs first.
            runs_to_delete = existing_runs[0:num_runs_to_delete]
            return set(runs_to_delete)

        return set()
