from typing import Any, List


def session_listify(location: Any) -> List:
    if isinstance(location, list):
        try:
            return session_listify(location[0])
        except IndexError:
            return [location]
    else:
        return [location]


def from_list(commands):
    """
    Given a list of tuples of form (depth, text)
    that represents a DFS traversal of a command tree,
    returns a dictionary representing command tree.
    """
    def subtrees(commands, level):
        if not commands:
            return

        acc = []
        parent, *commands = commands

        for command in commands:
            if command['level'] > level:
                acc.append(command)
            else:
                yield (parent, acc)
                parent = command
                acc.clear()
        yield (parent, acc)

    def walk(commands, level=0):
        return [
            {
                'description': key['description'],
                'children': walk(subtree, level + 1),
                'id': key['id']
            }
            for key, subtree in subtrees(commands, level)
        ]

    return walk(commands)
