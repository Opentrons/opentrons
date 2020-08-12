import typing


def deep_get(obj: typing.Union[typing.Dict, typing.List, typing.Tuple],
             key: typing.Union[str, typing.Sequence[typing.Any]],
             default=None):
    """
    Utility to get deeply nested element in a list, tuple or dict without
     resorting to some_dict.get('k1', {}).get('k2', {}).get('k3', {})....etc.

    :param obj: A dict, list, or tuple
    :param key: collection of keys or a string of keys separated by '.'
    :param default: the default to return on error
    :return: value or default
    """
    if not key:
        return default

    if isinstance(key, str):
        key = key.split('.')

    for k in key:
        if isinstance(obj, dict):
            try:
                obj = obj[k]
            except KeyError:
                return default
        elif isinstance(obj, (list, tuple,)):
            try:
                # Convert to int only if key is a string.
                k = int(k) if isinstance(k, str) else k
                obj = obj[k]
            except (TypeError, IndexError):
                return default
        else:
            return default

    return obj
