"""Values shared by the vacuum QC sections."""

from hardware_testing.data.csv_report import CSVReport

# A hold that starts already under vacuum is not a pull from atmosphere.
# Wait this long after opening the vent before calling the chamber repressurized.
ATMOSPHERE_WAIT_S = 20.0

VENT_SECTION = "VENT"
VENT_BLEED_TAG = "vent-bleed"


def vent_bleed_failed(report: CSVReport) -> bool:
    """True when the vent section already failed its bleed check."""
    try:
        line = report[VENT_SECTION][VENT_BLEED_TAG]
    except ValueError:
        return False
    return bool(line.stored and line.result_passed is False)
