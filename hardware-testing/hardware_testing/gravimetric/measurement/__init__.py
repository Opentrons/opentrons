"""Measure."""
from dataclasses import dataclass
from enum import Enum
from time import sleep
from typing import Optional

from opentrons.protocol_api import ProtocolContext

from .record import GravimetricRecorder, GravimetricRecording
from .environment import read_environment_data, EnvironmentData


class MeasurementType(str, Enum):
    """Measurements."""

    INIT = "measure-init"
    ASPIRATE = "measure-aspirate"
    DISPENSE = "measure-dispense"


DELAY_FOR_MEASUREMENT = {
    MeasurementType.INIT: 1,
    MeasurementType.ASPIRATE: 1,
    MeasurementType.DISPENSE: 1,
}


@dataclass
class MeasurementData(EnvironmentData):
    """Measurement data."""

    grams_average: float
    grams_cv: float
    grams_min: float
    grams_max: float
    samples_start_time: float
    samples_duration: float
    samples_count: int

    @property
    def environment(self) -> EnvironmentData:
        """Environment."""
        return EnvironmentData(
            celsius_pipette=self.celsius_pipette,
            celsius_air=self.celsius_air,
            humidity_air=self.humidity_air,
            pascals_air=self.pascals_air,
            celsius_liquid=self.celsius_liquid,
        )


def create_measurement_tag(t: str, volume: Optional[float], trial: int) -> str:
    """Create measurement tag."""
    if volume is None:
        vol_in_tag = "blank"
    else:
        vol_in_tag = str(round(volume, 2))
    return f"{t}-{vol_in_tag}-ul-{trial + 1}"


def _build_measurement_data(
    recorder: GravimetricRecorder, tag: str, e_data: EnvironmentData
) -> MeasurementData:
    recording_slice = GravimetricRecording(
        [sample for sample in recorder.recording if sample.tag and sample.tag == tag]
    )
    recording_grams_as_list = recording_slice.grams_as_list

    return MeasurementData(
        celsius_pipette=e_data.celsius_pipette,
        celsius_air=e_data.celsius_air,
        humidity_air=e_data.humidity_air,
        pascals_air=e_data.pascals_air,
        celsius_liquid=e_data.celsius_liquid,
        grams_average=recording_slice.average,
        grams_cv=recording_slice.calculate_cv(),
        grams_min=min(recording_grams_as_list),
        grams_max=max(recording_grams_as_list),
        samples_start_time=recording_slice.start_time,
        samples_duration=recording_slice.duration,
        samples_count=len(recording_grams_as_list),
    )


def record_measurement_data(
    ctx: ProtocolContext,
    tag: str,
    m_type: MeasurementType,
    recorder: GravimetricRecorder,
) -> MeasurementData:
    """Record measurement data."""
    env_data = read_environment_data()
    # NOTE: we need to delay some amount, to give the scale time to accumulate samples
    with recorder.samples_of_tag(tag):
        if ctx.is_simulating():
            # NOTE: give a bit of time during simulation, so some fake data can be stored
            sleep(0.1)
        else:
            ctx.delay(DELAY_FOR_MEASUREMENT[m_type])
    return _build_measurement_data(recorder, tag, env_data)


def calculate_change_in_volume(
    before: MeasurementData, after: MeasurementData
) -> float:
    """Calculate volume of water."""
    # TODO: actually calculate volume
    return abs(after.grams_average - before.grams_average)
