import json
import datetime
from pathlib import Path


def _read_file(filepath: str):
    # TODO(6/16): We should use tagged unions for
    # both the calibration and tip length dicts to better
    # categorize the Typed Dicts used here.
    # This can be done when the labware endpoints
    # are refactored to grab tip length calibration
    # from the correct locations.
    with open(filepath, 'r') as f:
        calibration_data = json.load(f)
    return calibration_data


def _read_cal_file(filepath: str, decoder=None) -> dict:
    with open(filepath, 'r') as f:
        calibration_data = json.load(f, cls=decoder)
    for value in calibration_data.values():
        if value.get('lastModified'):
            assert isinstance(value['lastModified'], datetime.datetime), \
                "invalid decoded value type for lastModified: got " \
                f"{type(value['lastModified']).__name__}, expected datetime"
    return calibration_data


def save_to_file(filepath: Path, data: dict, encoder=None):
    with filepath.open('w') as f:
        json.dump(data, f, cls=encoder)
