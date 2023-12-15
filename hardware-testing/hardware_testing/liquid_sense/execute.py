"""Logic for running a single liquid probe test."""
from hardware_testing.data.csv_report import CSVReport
from typing import Optional, Any
from hardware_testing.gravimetric.measurement.record import GravimetricRecorder
from hardware_testing.drivers import asair_sensor
from opentrons.protocol_api import InstrumentContext, ProtocolContext


def build_ls_report() -> CSVReport:
    """Placeholder generate a CSV Report."""
    return CSVReport(
        test_name="test name",
        sections=[],
        run_id="run_id",
        start_time=0.0,
    )


def run(
    tip: float,
    run_id: str,
    pipette: InstrumentContext,
    pipette_tag: str,
    git_description: str,
    robot_serial: str,
    recorder: Optional[GravimetricRecorder],
    pipette_volume: int,
    pipette_channels: int,
    name: str,
    environment_sensor: asair_sensor.AsairSensorBase,
    trials: int,
    ctx: ProtocolContext,
    protocol_cfg: Any,
    test_report: CSVReport,
) -> None:
    """Run a liquid probe test."""
    print(f"Running liquid probe test with tip {tip}")
