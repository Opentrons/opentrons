def children(value, path=None):
    path = path or []

    return sum([
        children(value=value, path=path+[key])
        for key, value in value.items()
    ], []) if isinstance(value, dict) and value else [
        (tuple(path), value)
    ]


def build(pairs):
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


def merge(trees):
    return build(sum([children(tree) for tree in trees], []))
