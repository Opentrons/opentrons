

def deep_get(obj, key, default):
    """

    :param obj:
    :param key:
    :param default:
    :return:
    """
    if isinstance(key, str):
        key = key.split('.')

    for k in key:
        if isinstance(obj, dict):
            try:
                obj = obj[k]
            except KeyError:
                return default
        elif isinstance(obj, list):
            try:
                obj = obj[int(k)]
            except (TypeError, IndexError):
                return default
        else:
            return default

    return obj
