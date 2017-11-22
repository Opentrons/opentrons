from typing import List, Tuple


def children(value, path=None) -> List[Tuple[tuple, object]]:
    """
    Returns list of tuples containing the full path to the value
    and the value itself
    """
    path = path or []

    return sum([
        children(value=value, path=path+[key])
        for key, value in value.items()
    ], []) if isinstance(value, dict) and value else [
        (tuple(path), value)
    ]


def build(pairs: List[Tuple[tuple, object]]) -> dict:
    """
    Builds a tree out of key-value pairs consisting of full
    path to the value and the value itself
    """
    tree = {}

    def append(tree, path, value):
        if not path:
            return

        key, *tail = path

        if tail:
            tree[key] = tree.get(key, {})
            append(tree[key], tail, value)
        else:
            tree[key] = value

    for path, value in pairs:
        append(tree, path, value)

    return tree


def merge(trees: List[dict]) -> dict:
    """
    Merges trees observing the order,
    adding new elements and overriding existing ones
    """
    return build(sum([children(tree) for tree in trees], []))
