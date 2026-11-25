"""Values shared by the vacuum QC sections."""

from typing import List, Optional, Sequence

from hardware_testing.data.csv_report import CSVReport

# A hold that starts already under vacuum is not a pull from atmosphere.
# Wait this long after opening the vent before calling the chamber repressurized.
ATMOSPHERE_WAIT_S = 25.0

VENT_SECTION = "VENT"
VENT_BLEED_TAG = "vent-bleed"


# Rest readings farther apart than this are a bad sensor, not a trim.
# Normal units sit within about 6 mbar.
SENSOR_OFFSET_LIMIT_MBAR = 8.0

_SENSOR_NAMES = {
    "a": "absolute sensor A",
    "b": "absolute sensor B",
    "atm": "atmosphere sensor",
}


def _mean(samples: Sequence[float]) -> Optional[float]:
    """Mean of readings that actually came back. Zero is a dead sensor."""
    present = [sample for sample in samples if sample]
    if not present:
        return None
    return sum(present) / len(present)


def resting_sensor_faults(
    abs_a: Sequence[float], abs_b: Sequence[float], atm: Sequence[float]
) -> List[str]:
    """Return the rest-reading outlier among absolute A, absolute B, and atmosphere.

    One sensor far from the other two is the bad one. When A and B agree and
    both miss atmosphere, the atmosphere sensor is the outlier.
    """
    mean_a = _mean(abs_a)
    mean_b = _mean(abs_b)
    mean_atm = _mean(atm)
    if mean_a is None or mean_b is None or mean_atm is None:
        return []
    a_off = abs(mean_a - mean_atm) > SENSOR_OFFSET_LIMIT_MBAR
    b_off = abs(mean_b - mean_atm) > SENSOR_OFFSET_LIMIT_MBAR
    if a_off and b_off and abs(mean_a - mean_b) <= SENSOR_OFFSET_LIMIT_MBAR:
        return ["atm"]
    faults: List[str] = []
    if a_off:
        faults.append("a")
    if b_off:
        faults.append("b")
    return faults


def sensor_replace_message(
    faults: Sequence[str],
    abs_a: Sequence[float],
    abs_b: Sequence[float],
    atm: Sequence[float],
) -> str:
    """Tell the operator which sensor to replace, with the rest offsets."""
    mean_a = _mean(abs_a)
    mean_b = _mean(abs_b)
    mean_atm = _mean(atm)
    assert mean_a is not None and mean_b is not None and mean_atm is not None
    names = " and ".join(_SENSOR_NAMES[fault] for fault in faults)
    details = (
        f"A {mean_a - mean_atm:+.1f} mbar, "
        f"B {mean_b - mean_atm:+.1f} mbar from atmosphere"
    )
    return (
        f"Replace the {names}. Rest offset is past "
        f"{SENSOR_OFFSET_LIMIT_MBAR:.0f} mbar ({details})."
    )


def vent_bleed_failed(report: CSVReport) -> bool:
    """True when the vent section already failed its bleed check."""
    try:
        line = report[VENT_SECTION][VENT_BLEED_TAG]
    except ValueError:
        return False
    return bool(line.stored and line.result_passed is False)
