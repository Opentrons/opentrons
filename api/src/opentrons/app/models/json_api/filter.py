from typing import TypeVar
from collections.abc import Mapping, Iterable

T = TypeVar('T')
def filter_none(thing_to_traverse: T) -> T:
    if isinstance(thing_to_traverse, dict):
        return {
            k: filter_none(v)
            for k, v in thing_to_traverse.items()
            if v is not None
        }
    elif isinstance(thing_to_traverse, list):
        return [
            filter_none(item)
            for item in thing_to_traverse
        ]
    return thing_to_traverse