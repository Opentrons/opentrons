"""Heat up and wait for a 96ch to reach the desired temperature."""

import os
import time
import csv
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis
from opentrons_hardware.sensors.sensor_driver import SensorDriver
from opentrons_hardware.sensors.sensor_types import EnvironmentSensor
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorId


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_str(
        display_name="pipette type",
        variable_name="pipette_type",
        default="flex_96channel_200",
        choices=[
            {"display_name": "flex_8channel_1000", "value": "flex_8channel_1000"},
            {"display_name": "flex_8channel_50", "value": "flex_8channel_1000"},
            {"display_name": "flex_96channel_1000", "value": "flex_96channel_1000"},
            {"display_name": "flex_96channel_200", "value": "flex_96channel_200"},
        ],
        description="Select model type.",
    )

    parameters.add_int(
        display_name="Target Temperature",
        variable_name="temp",
        default=27,
        minimum=20,
        maximum=35,
        description="Set the target temperature for the pre-heat",
    )


metadata = {"protocolName": "Pre-heating-3"}


requirements = {"robotType": "Flex", "apiLevel": "2.21"}


async def read_sensor(self, sensor: EnvironmentSensor) -> float:  # noqa: ANN001
    """Read and return the current sensor information."""
    s_driver = SensorDriver()
    sensor_data = await s_driver.read(
        can_messenger=self._backend._messenger,
        sensor=sensor,
        offset=False,
    )
    assert sensor_data.temperature is not None  # type: ignore [union-attr]
    return sensor_data.temperature.to_float()  # type: ignore [union-attr]


def get_motors_hot(ot3api: SynchronousAdapter) -> None:
    """Adjust the motor hold currents to heat quicker."""
    axis_settings = [Axis.P_L, Axis.Q]
    ot3api.engage_axes(axis_settings)
    ot3api._backend.set_hold_current({"A": 1.0})
    ot3api.home()


def dis_motors_hot(ot3api: SynchronousAdapter) -> None:
    """Release motor."""
    ot3api._backend.set_hold_current({"A": 0.1})
    axis_settings = [Axis.P_L, Axis.Q]
    ot3api.disengage_axes(axis_settings)


def run(ctx: ProtocolContext) -> None:
    """Run."""
    # hardware_api = ctx.get_hardware
    ot3api = ctx._core.get_hardware()
    if not ctx.is_simulating():
        ctx.pause(
            "set the dwelling current to 0.9A to heat up faster, then click resume"
        )
        # For OT3, use set_hold_current instead of set_dwelling_current
        ot3api._backend.set_hold_current({"A": 0.9})

    if not ctx.is_simulating():
        OT3API.read_sensor = read_sensor  # type: ignore [attr-defined]
    primary = EnvironmentSensor.build(
        sensor_id=SensorId.S0,
        node_id=NodeId.pipette_left,
    )
    secondary = EnvironmentSensor.build(
        sensor_id=SensorId.S1,
        node_id=NodeId.pipette_left,
    )

    _ = ctx.load_instrument(
        ctx.params.pipette_type, "left"  # type: ignore [attr-defined]
    )
    if not ctx.is_simulating():
        current_temp_1 = ot3api.read_sensor(primary)
        current_temp_2 = ot3api.read_sensor(secondary)
        get_motors_hot(ot3api)  # type: ignore [arg-type]
        avg_temp = (current_temp_1 + current_temp_2) / 2
        target = ctx.params.temp  # type: ignore [attr-defined]

        data_dir = "/data/testing_data"
        os.makedirs(data_dir, exist_ok=True)
        timestamp = int(time.time())
        csv_file = os.path.join(data_dir, f"pre_heat_{timestamp}.csv")
        start_time = time.time()

        with open(csv_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "timestamp",
                    "elapsed_seconds",
                    "avg_temp",
                    "target_temp",
                    "is_engaged",
                ]
            )
        is_engaged = False
        while True:
            current_temp_1 = ot3api.read_sensor(primary)
            current_temp_2 = ot3api.read_sensor(secondary)
            avg_temp = round((current_temp_1 + current_temp_2) / 2, 3)
            elapsed = round(time.time() - start_time, 1)
            ctx.delay(seconds=30, msg=f"Current temperature {avg_temp} target={target}")
            if avg_temp >= target:
                dis_motors_hot(ot3api)  # type: ignore [arg-type]
                is_engaged = False
                ctx.delay(
                    seconds=10 * 60,
                    msg=f"Waiting for 10 minutes to ensure the temperature is stable, current temperature {avg_temp}, target={target}",
                )
            else:
                get_motors_hot(ot3api)  # type: ignore [arg-type]
                is_engaged = True
            with open(csv_file, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([timestamp, elapsed, avg_temp, target, is_engaged])
