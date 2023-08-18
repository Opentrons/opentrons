"""Measure."""
from dataclasses import dataclass
from enum import Enum
from time import sleep
from typing import Optional
from typing_extensions import Final

from opentrons.protocol_api import ProtocolContext

from .record import GravimetricRecorder, GravimetricRecording
from .environment import read_environment_data, EnvironmentData, get_average_reading
from hardware_testing.drivers import asair_sensor

RELATIVE_DENSITY_WATER: Final = 1.0

CONSTANT_SCALE_CALIBRATED_DENSITY_KG_M3: Final = 7950  # from certificate
CONSTANT_TEMPERATURE_TA0: Final = 273.15
CONSTANT_DEW_POINT: Final = {"a": 17.625, "b": 243.04}
CONSTANT_AIR_DENSITY_K: Final = {"1": 0.34844, "2": -0.00252, "3": 0.020582}
CONSTANT_AIR_DENSITY_ESO: Final = 6.1078
CONSTANT_AIR_DENSITY_C: Final = [
    0.99999683,
    -0.0090826951,
    0.000078736169,
    -0.00000061117958,
    0.0000000043884187,
    -2.9883885e-11,
    2.1874425e-13,
    -1.7892321e-15,
    1.1112018e-17,
    -3.0994571e-20,
]
CONSTANT_AIR_DENSITY_R: Final = {"d": 287.0531, "v": 461.4964}
CONSTANT_WATER_DENSITY: Final = {
    "1": 999.85308,
    "2": 6.32693,
    "3": -8.523829,
    "4": 6.943248,
    "5": -3.821216,
}


class MeasurementType(str, Enum):
    """Measurements."""

    INIT = "measure-init"
    ASPIRATE = "measure-aspirate"
    DISPENSE = "measure-dispense"


DELAY_FOR_MEASUREMENT = 10
MIN_DURATION_STABLE_SEGMENT = 1


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
            humidity_pipette=self.humidity_pipette,
            celsius_air=self.celsius_air,
            humidity_air=self.humidity_air,
            pascals_air=self.pascals_air,
            celsius_liquid=self.celsius_liquid,
        )


def create_measurement_tag(
    t: str, volume: Optional[float], channel: int, trial: int
) -> str:
    """Create measurement tag."""
    if volume is None:
        vol_in_tag = "blank"
    else:
        vol_in_tag = str(round(volume, 2))
    return f"{t}-{vol_in_tag}-ul-channel_{channel + 1}-trial-{trial + 1}"


class UnstableMeasurementError(Exception):
    """Unstable measurement error."""

    pass


def _build_measurement_data(
    recorder: GravimetricRecorder,
    tag: str,
    e_data: EnvironmentData,
    stable: bool = True,
    simulating: bool = False,
) -> MeasurementData:
    # gather only samples of the specified tag
    segment = GravimetricRecording(
        [sample for sample in recorder.recording if sample.tag and sample.tag == tag]
    )
    if simulating and len(segment) == 1:
        segment.append(segment[0])
    if stable and not simulating:
        # try to isolate only "stable" scale readings if sample length >= 2
        stable_only = GravimetricRecording(
            [sample for sample in segment if sample.stable]
        )
        if len(stable_only) >= 2:
            segment = stable_only

    recording_grams_as_list = segment.grams_as_list
    return MeasurementData(
        celsius_pipette=e_data.celsius_pipette,
        humidity_pipette=e_data.humidity_pipette,
        celsius_air=e_data.celsius_air,
        humidity_air=e_data.humidity_air,
        pascals_air=e_data.pascals_air,
        celsius_liquid=e_data.celsius_liquid,
        grams_average=segment.average,
        grams_cv=segment.calculate_cv(),
        grams_min=min(recording_grams_as_list),
        grams_max=max(recording_grams_as_list),
        samples_start_time=segment.start_time,
        samples_duration=segment.duration,
        samples_count=len(recording_grams_as_list),
    )


def record_measurement_data(
    ctx: ProtocolContext,
    tag: str,
    recorder: GravimetricRecorder,
    mount: str,
    stable: bool,
    env_sensor: asair_sensor.AsairSensorBase,
    shorten: bool = False,
    delay_seconds: int = DELAY_FOR_MEASUREMENT,
) -> MeasurementData:
    """Record measurement data."""
    env_data = read_environment_data(mount, ctx.is_simulating(), env_sensor)
    # NOTE: we need to delay some amount, to give the scale time to accumulate samples
    with recorder.samples_of_tag(tag):
        if ctx.is_simulating():
            # NOTE: give a bit of time during simulation, so some fake data can be stored
            sleep(0.1)
        elif shorten:
            ctx.delay(1)
        else:
            print(f"delaying {delay_seconds} seconds for measurement, please wait...")
            ctx.delay(delay_seconds)
    return _build_measurement_data(
        recorder, tag, env_data, stable=stable, simulating=ctx.is_simulating()
    )


def calculate_change_in_volume(
    before: MeasurementData, after: MeasurementData
) -> float:
    """Calculate volume of water."""
    # TODO: actually calculate volume
    avg_env = get_average_reading([before.environment, after.environment])
    water_density_at_this_temperature_kg_m3 = sum(
        [
            CONSTANT_WATER_DENSITY["1"],
            CONSTANT_WATER_DENSITY["2"] * pow(10, -2) * pow(avg_env.celsius_liquid, 1),
            CONSTANT_WATER_DENSITY["3"] * pow(10, -3) * pow(avg_env.celsius_liquid, 2),
            CONSTANT_WATER_DENSITY["4"] * pow(10, -5) * pow(avg_env.celsius_liquid, 3),
            CONSTANT_WATER_DENSITY["5"] * pow(10, -7) * pow(avg_env.celsius_liquid, 4),
        ]
    )
    liquid_density_kg_m3 = (
        RELATIVE_DENSITY_WATER * water_density_at_this_temperature_kg_m3
    )
    # equations in ISO use hPa, so sticking with that
    air_pressure_hpa = avg_env.pascals_air / 100
    air_density_kg_m3 = (
        (CONSTANT_AIR_DENSITY_K["1"] * air_pressure_hpa)
        + (
            avg_env.humidity_air
            * (
                (CONSTANT_AIR_DENSITY_K["2"] * avg_env.celsius_air)
                + CONSTANT_AIR_DENSITY_K["3"]
            )
        )
    ) / (avg_env.celsius_air + CONSTANT_TEMPERATURE_TA0)
    z_factor = (
        (1.0 / CONSTANT_SCALE_CALIBRATED_DENSITY_KG_M3)
        * (
            (CONSTANT_SCALE_CALIBRATED_DENSITY_KG_M3 - air_density_kg_m3)
            / (liquid_density_kg_m3 - air_density_kg_m3)
        )
        * 1000.0
    )
    liquid_grams = abs(before.grams_average - after.grams_average)
    liquid_micro_liters = liquid_grams * z_factor * 1000.0
    return liquid_micro_liters
