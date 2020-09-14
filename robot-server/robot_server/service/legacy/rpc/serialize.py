import functools
from typing import Any, List, Dict


def _get_object_tree(max_depth, path, refs, depth, obj):  # noqa C901

    def object_container(value):
        # Save id of instance of object's type as a reference too
        # We will need it to keep track of types the same we are
        # tracking objects
        t = type(obj)
        refs[id(t)] = t
        return {'i': id(obj), 't': id(t), 'v': value}

    # TODO: what's the better way to detect primitive types?
    if isinstance(obj, (str, int, bool, float, complex)) or obj is None:
        return obj

    # If we have ourself in path, it's a circular reference
    # we are terminating it with a valid id but a value of None
    if hasattr(obj, '__dict__') and id(obj) in path:
        return object_container(None)

    # Shorthand for calling ourselves recursively
    object_tree = functools.partial(
        _get_object_tree, max_depth, path, refs, depth + 1)

    path += [id(obj)]

    # Cut-off at max_depth
    # If max_depth == 0 (evaluates to False) — keep going
    if max_depth and (depth >= max_depth):
        return {}

    if isinstance(obj, (list, tuple)):
        return [object_tree(o) for o in obj]

    def iterate(kv):
        return {str(k): object_tree(v) for k, v in kv.items()}

    if isinstance(obj, dict):
        return object_container(iterate(obj))
    elif hasattr(obj, '__dict__'):
        refs[id(obj)] = obj
        items: List[Any] = []
        # If Type is iterable we will iterate generating numeric keys and
        # and merge with the output
        try:
            items = [object_tree(o) for o in obj]
        except TypeError:
            pass
        tail = {i: v for i, v in enumerate(items)}

        # Filter out private attributes
        attributes = {
            k: v for k, v in obj.__dict__.items()
            if not k.startswith('_')}
        return object_container({**iterate(attributes), **tail})
    else:
        return object_container({})


def get_object_tree(obj, max_depth=0):
    refs: Dict[Any, Any] = {}
    tree = _get_object_tree(max_depth, [], refs, 0, obj)
    return (tree, refs)
