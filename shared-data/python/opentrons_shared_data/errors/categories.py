"""Error categories."""

from enum import Enum
from dataclasses import dataclass
import json
from functools import lru_cache
from typing import Dict

from ..load import load_shared_data


CATEGORIES: Dict[str, Dict[str, str]] = json.loads(
    load_shared_data("errors/definitions/1/errors.json")
)["categories"]


@dataclass(frozen=True)
class ErrorCategory:
    """Individual error category data."""

    name: str
    detail: str
    code_prefix: str


def _category_from_dict_entry(entry_name: str) -> ErrorCategory:
    return ErrorCategory(
        name=entry_name,
        detail=CATEGORIES[entry_name]["detail"],
        code_prefix=CATEGORIES[entry_name]["codePrefix"],
    )


class ErrorCategories(Enum):
    """All enuemrated error categories."""

    HARDWARE_COMMUNICATION_ERROR = _category_from_dict_entry(
        "hardwareCommunicationError"
    )
    ROBOTICS_CONTROL_ERROR = _category_from_dict_entry("roboticsControlError")
    ROBOTICS_INTERACTION_ERROR = _category_from_dict_entry("roboticsInteractionError")
    GENERAL_ERROR = _category_from_dict_entry("generalError")

    @classmethod
    @lru_cache(4)
    def by_category_name(cls, category_name: str) -> "ErrorCategories":
        """Get a subsystem by its category name."""
        for entry in cls:
            if entry.value.name == category_name:
                return entry
        raise KeyError(category_name)

    @classmethod
    @lru_cache(4)
    def by_code_prefix(cls, prefix: str) -> "ErrorCategories":
        """Get an error category by its code prefix."""
        for entry in cls:
            if entry.value.code_prefix == prefix:
                return entry
        raise KeyError(prefix)
