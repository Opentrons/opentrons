def _get_object_tree(obj, path):
    is_class_type = hasattr(obj, '__dict__')

    # If we have ourself in path, it's a circular reference
    # we are terminating it with Nothing
    if is_class_type and obj in path: return None
    
    path += [obj]

    payload = None

    if isinstance(obj, (list, tuple)):
        payload = [_get_object_tree(o, path) for o in obj]
    elif isinstance(obj, dict):
        payload = { k: _get_object_tree(v, path) for k, v in obj.items() }
    elif not is_class_type:
        payload = obj
    else:
        payload = { k: _get_object_tree(v, path) for k, v in obj.__dict__.items()  }
    
    meta = { '$meta': { 'that': (id(obj), obj) } } if is_class_type else {}

    return { **meta, obj.__class__.__name__ : payload }


def extract_references(tree):
    results = []
    if isinstance(tree, dict):
        results = sum([extract_references(v) for v in tree.values()], [])

    if isinstance(tree, (list, tuple)):
        results = sum([extract_references(i) for i in tree], [])

    if isinstance(tree, dict) and '$meta' in tree:
        _id, obj = tree['$meta']['that']
        tree['$meta']['that'] = _id
        results += [(_id, obj)]

    return results


def get_object_tree(obj):
    tree = _get_object_tree(obj, [])
    return (tree, dict(extract_references(tree)))
