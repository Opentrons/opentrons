"""Plan auto-deletions of old resources to make room for new ones.

Over a robot's lifetime, clients can create thousands of protocols and runs.
To save memory, filesystem space, and compute time, we need to stop these resources
from accumulating indefinitely. Especially since we persist them across reboots.

Our strategy is:

1. Automatically delete stuff whenever a client tries to add something new, if needed.
   Auto-deletion keeps things easy for the client.

2. Delete the oldest things first.
   They're least likely to be relevant to what the user is doing right now.

3. Never delete a protocol that a run is currently linking to.
   A client should be able to assume that if it follows a link from a run to a protocol,
   that protocol will be there.

   (Our SQL layer also enforces this, with foreign key constraints.)

Note that (2) and (3) conflict. We can't always delete the oldest protocol,
because a run (not necessarily the oldest run) might be using it.

To work around this conflict, we must either delete every run that links to the
oldest protocol, or delete the oldest *unused* protocol instead.
We choose the latter because preserving a linear history of runs
is more important than preserving a linear history of protocols.

This module only handles the abstract planning of what to delete.
Actual storage access is handled elsewhere.
"""


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

            After deleting these protocols, there will be at least one slot free
            to add a new protocol without going over the configured limit.
        """
        unused_protocols = [p for p in existing_protocols if not p.is_used_by_run]

        # The caller wants to add a new protocol.
        # If they added it now, how many unused protocols would there be, total?
        num_after_new_addition = len(unused_protocols) + 1

        if num_after_new_addition > self._maximum_unused_protocols:
            num_deletions_required = (
                num_after_new_addition - self._maximum_unused_protocols
            )
        else:
            num_deletions_required = 0

        protocols_to_delete = unused_protocols[:num_deletions_required]
        return set(p.protocol_id for p in protocols_to_delete)


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

            After deleting these runs, there will be at least one slot free
            to add a new run without going over the configured limit.
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
