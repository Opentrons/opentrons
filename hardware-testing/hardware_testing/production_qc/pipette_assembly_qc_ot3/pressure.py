"""Pressure Fixture Configs."""
from dataclasses import dataclass
import enum
from typing import Dict

from hardware_testing.opentrons_api.types import Point


LOCATION_A1_LEFT = Point(x=14.4, y=74.5, z=96)
LOCATION_A1_RIGHT = LOCATION_A1_LEFT._replace(x=128 - LOCATION_A1_LEFT.x)

PRESSURE_FIXTURE_TIP_VOLUME = 50  # always 50ul


class PressureEvent(enum.Enum):
    """Pressure Event."""

    PRE = "pre"
    INSERT = "insert"
    ASPIRATE_P50 = "holding"
    ASPIRATE_P1000 = "holding"
    DISPENSE = "dispensed"
    POST = "post"


@dataclass
class PressureEventConfig:
    """PressureEventConfig."""

    min: float
    max: float
    stability_delay: float
    stability_threshold: float
    sample_count: int
    sample_delay: float


PRESSURE_FIXTURE_ASPIRATE_VOLUME = {50: 11.0, 1000: 12.0}
PRESSURE_FIXTURE_INSERT_DEPTH = {50: 28.5, 1000: 33.0}

DEFAULT_PRESSURE_SAMPLE_DELAY = 0.25
DEFAULT_PRESSURE_SAMPLE_COUNT = 10
# FIXME: reduce once firmware latency is reduced
DEFAULT_STABILIZE_SECONDS = 1
# NOTE: number of samples during aspirate ideally creates ~2 minutes of data
# but we want to keep the number of samples constant between test runs,
# so that is why we don't specify a sample duration (b/c frequency is unpredictable)
DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE = int(
    (1 * 60) / DEFAULT_PRESSURE_SAMPLE_DELAY
)
PRESSURE_NONE = PressureEventConfig(
    min=-10.0,
    max=10.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=2.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_INSERTED = PressureEventConfig(
    min=3000.0,
    max=8000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=50.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_ASPIRATED_P50 = PressureEventConfig(
    min=2000.0,
    max=7000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=200.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_ASPIRATED_P1000 = PressureEventConfig(
    min=2000.0,
    max=7000.0,
    stability_delay=DEFAULT_STABILIZE_SECONDS,
    stability_threshold=200.0,
    sample_count=DEFAULT_PRESSURE_SAMPLE_COUNT_DURING_ASPIRATE,
    sample_delay=DEFAULT_PRESSURE_SAMPLE_DELAY,
)
PRESSURE_FIXTURE_EVENT_CONFIGS: Dict[PressureEvent, PressureEventConfig] = {
    PressureEvent.PRE: PRESSURE_NONE,
    PressureEvent.INSERT: PRESSURE_INSERTED,
    PressureEvent.ASPIRATE_P50: PRESSURE_ASPIRATED_P50,
    PressureEvent.ASPIRATE_P1000: PRESSURE_ASPIRATED_P1000,
    PressureEvent.DISPENSE: PRESSURE_INSERTED,
    PressureEvent.POST: PRESSURE_NONE,
}


def pressure_fixture_a1_location(side: str) -> Point:
    """Get the A1 position of the pressure fixture within a slot."""
    assert side in ["left", "right"], "pressure fixture side must be left or right"
    if side == "left":
        return LOCATION_A1_LEFT
    else:
        return LOCATION_A1_RIGHT
