from datetime import datetime, timezone
from typing import Mapping, Optional, Sequence, Union, TypeVar

ReturnT = TypeVar("ReturnT")


# TODO(mc, 2022-02-22): this utility isn't used; is it needed?
def deep_get(
    obj: Union[Mapping[str, ReturnT], Sequence[ReturnT]],
    key: Sequence[Union[str, int]],
    default: Optional[ReturnT] = None,
) -> Optional[ReturnT]:
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

    return obj  # type: ignore[return-value]


def utc_now() -> datetime:
    """Return the UTC time with timezone"""
    return datetime.now(tz=timezone.utc)
