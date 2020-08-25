from typing import Dict, Any
from typing_extensions import TypedDict


class NextStepLink(TypedDict):
    url: str
    params: Dict[str, Any]


class NextSteps(TypedDict):
    links: Dict[str, NextStepLink]
