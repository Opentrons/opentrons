import functools
import types

def _get_object_tree(shallow, path, refs, depth, obj):
    # If shallow serialization, go only one level deep
    if depth > 0 and shallow: return None

    is_class_type = hasattr(obj, '__dict__')

    # If we have ourself in path, it's a circular reference
    # we are terminating it with Nothing
    if is_class_type and id(obj) in path: return None
    
    path += [id(obj)]

    payload = None
    meta = {}
    object_tree = functools.partial(_get_object_tree, shallow, path, refs, depth+1)

    if isinstance(obj, (list, tuple)):
        payload = [object_tree(o) for o in obj]
    elif isinstance(obj, dict):
        payload = { str(k): object_tree(v) for k, v in obj.items() }
    elif isinstance(obj, (str, int, bool, float, complex)) or obj is None:
        payload = obj
    elif hasattr(obj, '__dict__'):
        payload = { k: object_tree(v) for k, v in obj.__dict__.items() }
        refs[id(obj)] = obj
        meta = { '$meta': { 'that': id(obj) } }
    else:
        return None
    
    # If shallow, don't output the attributes of the object
    if depth == 0 and shallow: payload = {}

    return { **meta, obj.__class__.__name__: payload }


def get_object_tree(obj, shallow=False):
    refs = {}
    tree = _get_object_tree(shallow, [], refs, 0, obj)
    return (tree, refs)
