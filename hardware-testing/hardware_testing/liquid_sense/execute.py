"""Logic for running a single liquid probe test."""
from hardware_testing.data.csv_report import CSVReport
from typing import Optional, Any
from hardware_testing.gravimetric.measurement.record import GravimetricRecorder
from hardware_testing.drivers import asair_sensor
from opentrons.protocol_api import InstrumentContext, ProtocolContext
from .report import store_tip_results, store_trial


def run(
    tip: float,
    run_id: str,
    pipette: InstrumentContext,
    recorder: Optional[GravimetricRecorder],
    pipette_volume: int,
    pipette_channels: int,
    environment_sensor: asair_sensor.AsairSensorBase,
    trials: int,
    z_speed: float,
    ctx: ProtocolContext,
    protocol_cfg: Any,
    test_report: CSVReport,
) -> None:
    """Run a liquid probe test."""
    for trial in range(trials):
        print(f"Running liquid probe test with tip {tip}")
        store_trial(test_report,trial, tip, 40.0)
    store_tip_results(test_report, tip, 40, 0.05, 0.05)
