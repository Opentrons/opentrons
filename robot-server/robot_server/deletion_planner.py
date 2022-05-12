"""Plan auto-deletions of old SQL resources to make room for new ones."""


from typing import Sequence, Set
from typing_extensions import Protocol as InterfaceShape


class ProtocolSpec(InterfaceShape):
    """Minimal info about a protocol in the SQL database.

    Just enough for the deletion planner to do its job.
    """

    @property
    def protocol_id(self) -> str:
        """This protocol's ID."""

    @property
    def is_used_by_run(self) -> bool:
        """Whether this protocol is used by any run."""


class ProtocolDeletionPlanner:  # noqa: D101
    def __init__(self, maximum_unused_protocols: int) -> None:
        """Return a configured protocol deletion planner.

        Args:
            maximum_unused_protocols: The maximum number of "unused protocols"
                to allow. An "unused protocol" is one that isn't currently linked
                to any run. Must be at least 1.
        """
        self._maximum_unused_protocols = maximum_unused_protocols

    def plan_for_new_protocol(
        self,
        existing_protocols: Sequence[ProtocolSpec],
    ) -> Set[str]:
        """Choose which protocols to delete in order to make room for a new one.

        Args:
            existing_protocols: Information about all protocols that currently exist.
                Must be in order from oldest first!

        Returns:
            IDs of protocols to delete.

            After deleting these protocols, the number of unused protocols
            will be at least one less than the maximum,
            allowing an additional unused protocol to be added
            without going over the limit.
        """
        raise NotImplementedError()


class RunDeletionPlanner:  # noqa: D101
    def __init__(self, maximum_runs: int) -> None:
        """Return a configured run deletion planner.

        Args:
            maximum_runs: The maximum number of runs to allow.
                Must be at least 1.
        """
        self._maximum_runs = maximum_runs

    def plan_for_new_run(
        self,
        existing_runs: Sequence[str],
    ) -> Set[str]:
        """Choose which runs to delete in order to make room for a new one.

        Args:
            existing_runs: The IDs of all runs that currently exist.
                Must be in order from oldest first!

        Returns:
            The IDs of runs to delete.

            After deleting these runs, the number of runs
            will be at least one less than the maximum,
            allowing an additional run to be added without going over the limit.
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
