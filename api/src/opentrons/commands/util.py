from typing import Any, Dict, Iterator, List, Tuple
from opentrons.api.dev_types import CommandShortId


def from_list(commands: List[CommandShortId]) -> List[Dict[str, Any]]:
    """
    Given a list of tuples of form (depth, text)
    that represents a DFS traversal of a command tree,
    returns a dictionary representing command tree.
    """

    def subtrees(
        commands: List[CommandShortId], level: int
    ) -> Iterator[Tuple[CommandShortId, List[CommandShortId]]]:
        if not commands:
            return

        acc = []
        parent, *commands = commands

        for command in commands:
            if command["level"] > level:
                acc.append(command)
            else:
                yield (parent, acc)
                parent = command
                acc.clear()
        yield (parent, acc)

    def walk(commands: List[CommandShortId], level: int = 0) -> List[Dict[str, Any]]:
        return [
            {
                "description": key["description"],
                "children": walk(subtree, level + 1),
                "id": key["id"],
            }
            for key, subtree in subtrees(commands, level)
        ]

    return walk(commands)
