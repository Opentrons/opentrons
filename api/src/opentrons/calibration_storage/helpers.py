""" opentrons.calibration_storage.helpers: various miscellaneous
functions

This module has functions that you can import to save robot or
labware calibration to its designated file location.
"""
from typing import Any, Union, List, Dict
from dataclasses import is_dataclass, asdict


DictionaryFactoryType = Union[List, Dict]


def dict_filter_none(data: DictionaryFactoryType) -> Dict[str, Any]:
    """
    Helper function to filter out None keys from a dataclass
    before saving to file.
    """
    return dict(item for item in data if item[1] is not None)


def convert_to_dict(obj: Any) -> Dict[str, Any]:
    # The correct way to type this is described here:
    # https://github.com/python/mypy/issues/6568
    # Unfortunately, since it's not currently supported I have an
    # assert check instead.
    assert is_dataclass(obj), "This function is intended for dataclasses only"
    return asdict(obj, dict_factory=dict_filter_none)
