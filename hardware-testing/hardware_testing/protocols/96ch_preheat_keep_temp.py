"""Heat up and wait for a 96ch to reach the desired temperature."""

from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis
from opentrons_hardware.sensors.sensor_driver import SensorDriver
from opentrons_hardware.sensors.sensor_types import EnvironmentSensor
from opentrons_hardware.firmware_bindings.constants import NodeId, SensorId
from opentrons.config import infer_config_base_dir, IS_ROBOT
import os,sys
from opentrons import version
import importlib

def _download_and_extract(version_str: str, base_dir: str) -> None:
    from urllib.request import urlretrieve
    from zipfile import ZipFile

    zipfile = f"https://github.com/Opentrons/opentrons/archive/refs/tags/v{release}.zip"
    where_to_place = os.path.join(base_dir, "hardware_testing")
    urlretrieve(zipfile, os.path.join(base_dir, "source.zip"))
    zf = ZipFile(os.path.join(base_dir, "source.zip"), "r")
    files = [f for f in zf.namelist() if "hardware_testing" in f and "tests" not in f]
    files = [f for f in files if "py" in f]
    start_path = f"opentrons-{version_str}/hardware-testing/hardware_testing/"
    for f in files:
        dest_name = f.replace(start_path, "")
        dest_file = os.path.join(where_to_place, dest_name)
        dat = zf.read(f)
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        out = open(dest_file, "wb")
        out.write(dat)
        out.close()
    with open(os.path.join(where_to_place, "VERSION.txt"), "w") as ver_file:
        ver_file.write(version_str)

if not IS_ROBOT or importlib.util.find_spec("hardware_testing") is None:
    # we're simulating or there is not a vaild hardware-testing yet
    base_dir = str(infer_config_base_dir())
    release = f"{version.replace('a', '-alpha.').replace('b', '-beta.')}"
    version_file_path = os.path.join(base_dir, "hardware_testing", "VERSION.txt")
    if os.path.exists(version_file_path):
        with open(version_file_path, "r") as version_file:
            if version_file.readline() != release:
                _download_and_extract(release, base_dir)
    else:
        _download_and_extract(release, base_dir)
    sys.path.append(base_dir)
from hardware_testing.opentrons_api import helpers_ot3


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
        default=27.2,
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
    # set high throughput hold current
    DEFAULT_Z_CURRENT = 1.0
    helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        ot3api,
        Axis.Q,
        ot3api.gantry_load,
        hold_current=DEFAULT_Z_CURRENT,  # NOTE: only set this for Z axes
    )
    helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        ot3api,
        Axis.P_L,
        ot3api.gantry_load,
        hold_current=DEFAULT_Z_CURRENT,  # NOTE: only set this for Z axes
    )
    if not ctx.is_simulating():
        current_temp_1 = ot3api.read_sensor(primary)
        current_temp_2 = ot3api.read_sensor(secondary)
        get_motors_hot(ot3api)  # type: ignore [arg-type]
        avg_temp = (current_temp_1 + current_temp_2) / 2
        target = ctx.params.temp  # type: ignore [attr-defined]
        targetflag = 1
        enabled = ot3api._backend.is_motor_engaged(Axis.P_L)
        while True:
            #获取电机状态
            current_temp_1 = ot3api.read_sensor(primary)
            current_temp_2 = ot3api.read_sensor(secondary)
            avg_temp = (current_temp_1 + current_temp_2) / 2
            ctx.delay(seconds=15, msg=f"加热中或散热,移液器温度 {avg_temp} 目标温度={target},电机状态 = {enabled}")
            if avg_temp > target:
                if targetflag == 1:
                    dis_motors_hot(ot3api=ot3api)
                    targetflag = 2
                    enabled = ot3api._backend.is_motor_engaged(Axis.P_L)
                    ctx.delay(seconds=15, msg=f"释放电机散热,移液器温度 {avg_temp} 目标温度={target}")
            elif avg_temp < target:
                if targetflag == 2:
                    get_motors_hot(ot3api)
                    targetflag = 1
                    enabled = ot3api._backend.is_motor_engaged(Axis.P_L)
                    ctx.delay(seconds=15, msg=f"使能电机加热,移液器温度 {avg_temp} 目标温度={target}")
            else:
                current_temp_1 = ot3api.read_sensor(primary)
                current_temp_2 = ot3api.read_sensor(secondary)
                avg_temp = (current_temp_1 + current_temp_2) / 2
                ctx.delay(seconds=15, msg=f"保持温度中, 移液器温度={avg_temp} 目标温度={target}")

                    

            
