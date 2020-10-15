from dataclasses import dataclass
from typing import Optional

from opentrons.types import Point

from .models import ComparisonStatus

WILDCARD = '*'


@dataclass
class PointTypes:
    initial_point: Point = Point(0, 0, 0)
    final_point: Point = Point(0, 0, 0)


@dataclass
class ReferencePoints:
    height: PointTypes
    one: PointTypes
    two: PointTypes
    three: PointTypes


@dataclass
class ComparisonMap:
    inspectingTip: Optional[ComparisonStatus] = None
    comparingHeight: Optional[ComparisonStatus] = None
    comparingPointOne: Optional[ComparisonStatus] = None
    comparingPointTwo: Optional[ComparisonStatus] = None
    comparingPointThree: Optional[ComparisonStatus] = None

    def set_value(self, name: str, value: ComparisonStatus):
        setattr(self, name, value)


@dataclass
class ComparisonStatePerPipette:
    first: ComparisonMap
    second: ComparisonMap

    def set_value(self, name: str, value: ComparisonStatus):
        setattr(self, name, value)


REFERENCE_POINT_MAP = {
    '1BLC': 'one',
    '3BRC': 'two',
    '7TLC': 'three'
}
