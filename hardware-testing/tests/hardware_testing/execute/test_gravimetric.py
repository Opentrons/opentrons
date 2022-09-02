"""Parse."""
from pathlib import Path

from hardware_testing.measure.weight import GravimetricRecording
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.pipette.timestamp import load_pipette_timestamps
from hardware_testing.execute.gravimetric import _analyze_recording_and_timestamps

GRAV_FILE_NAME = (
    "ot2-p300-single-channel-gravimetric_run-"
    "220727152927_GravimetricRecorder-P3HSV212021030505.csv"
)
PIP_FILE_NAME = (
    "ot2-p300-single-channel-gravimetric_run-"
    "220727152927_PipetteLiquidClass-P3HSV212021030505.csv"
)
GRAV_PATH = Path(__file__).parent / "example_data" / GRAV_FILE_NAME
PIP_PATH = Path(__file__).parent / "example_data" / PIP_FILE_NAME


def test_analyze_recording_and_timestamps():
    ctx = get_api_context("2.12", is_simulating=False, connect_to_smoothie=False)
    recording = GravimetricRecording.load(str(GRAV_PATH.resolve()))
    timestamps = load_pipette_timestamps(str(PIP_PATH.resolve()))
    _analyze_recording_and_timestamps(ctx, recording, timestamps)
