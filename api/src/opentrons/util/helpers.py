import typing


def deep_get(obj: typing.Union[typing.Mapping, typing.Sequence],
             key: typing.Sequence[typing.Union[str, int]],
             default=None):
    """
    Utility to get deeply nested element in a list, tuple or dict without
     resorting to some_dict.get('k1', {}).get('k2', {}).get('k3', {})....etc.

    :param obj: A dict, list, or tuple
    :param key: collection of keys
    :param default: the default to return on error
    :return: value or default
    """
    if not key:
        return default

    for k in key:
        try:
            obj = obj[k]  # type: ignore
        except (KeyError, TypeError, IndexError):
            return default

    return obj
