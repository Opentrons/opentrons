"""Heat up and wait for a 96ch to reach the desired temperature."""

from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis
from opentrons_hardware.sensors.sensor_driver import SensorDriver
from opentrons_hardware.sensors.sensor_types import EnvironmentSensor
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorId


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_int(
        display_name="model type",
        variable_name="model_type",
        default=200,
        choices=[
            {"display_name": "200", "value": 200},
            {"display_name": "1000", "value": 1000},
        ],
        description="Select model type.",
    )

    parameters.add_float(
        display_name="Target Temperature",
        variable_name="temp",
        default=27.0,
        minimum=20.0,
        maximum=35.0,
        description="Set the target temperature for the pre-heat",
    )


metadata = {"protocolName": "96ch Pre-heating protocol keep temp"}

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

def dis_motors_hot(ot3api: SynchronousAdapter) -> None:
    """Release motor."""
    axis_settings = [Axis.P_L, Axis.Q]
    ot3api.disengage_axes(axis_settings)


def run(ctx: ProtocolContext) -> None:
    """Run."""
    ot3api = ctx._core.get_hardware()
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
        f"flex_96channel_{ctx.params.model_type}", "left"  # type: ignore [attr-defined]
    )
    if not ctx.is_simulating():
        current_temp_1 = ot3api.read_sensor(primary)
        current_temp_2 = ot3api.read_sensor(secondary)
        get_motors_hot(ot3api)  # type: ignore [arg-type]
        avg_temp = (current_temp_1 + current_temp_2) / 2
        target = ctx.params.temp  # type: ignore [attr-defined]
        targetflag = 1
        while True:
            #获取电机状态
            #enabled = ot3api._backend.is_motor_engaged(Axis.P_L)
            current_temp_1 = ot3api.read_sensor(primary)
            current_temp_2 = ot3api.read_sensor(secondary)
            avg_temp = (current_temp_1 + current_temp_2) / 2
            ctx.delay(seconds=15, msg=f"加热中或散热,移液器温度 {avg_temp} 目标温度={target}")
            if avg_temp > target:
                if targetflag == 1:
                    dis_motors_hot(ot3api=ot3api)
                    targetflag = 2
                    ctx.delay(seconds=15, msg=f"释放加热,移液器温度 {avg_temp} 目标温度={target}")
            elif avg_temp < target:
                if targetflag == 2:
                    get_motors_hot(ot3api)
                    targetflag = 1
                    for i in range(20):
                        current_temp_1 = ot3api.read_sensor(primary)
                        current_temp_2 = ot3api.read_sensor(secondary)
                        avg_temp = (current_temp_1 + current_temp_2) / 2
                        ctx.delay(seconds=15, msg=f"保持温度中,确认温度是否到达,自行停止, 移液器温度 {avg_temp} 目标温度={target}")
                        if avg_temp >= target:
                            break
            else:
                current_temp_1 = ot3api.read_sensor(primary)
                current_temp_2 = ot3api.read_sensor(secondary)
                avg_temp = (current_temp_1 + current_temp_2) / 2
                ctx.delay(seconds=15, msg=f"保持温度中, 移液器温度={avg_temp} 目标温度={target}")

                    

            
