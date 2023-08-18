"""Pipette Sensors OT3."""
import argparse
import asyncio
from typing import Optional, Dict, List

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.instruments.ot3.pipette import Pipette

from opentrons_hardware.firmware_bindings.constants import SensorId, SensorType

from hardware_testing.opentrons_api.types import OT3Mount
from hardware_testing.opentrons_api import helpers_ot3


READ_INTERVAL_SECONDS = 0.5


async def _read_sensor(
    api: OT3API, mount: OT3Mount, sensor_type: SensorType, sensor_id: SensorId
) -> List[float]:
    if sensor_type == SensorType.capacitive:
        val = await helpers_ot3.get_capacitance_ot3(api, mount, sensor_id)
        vals = [val]
    elif sensor_type == SensorType.pressure:
        val = await helpers_ot3.get_pressure_ot3(api, mount, sensor_id)
        vals = [val]
    elif sensor_type == SensorType.environment:
        vals_tuple = await helpers_ot3.get_temperature_humidity_ot3(
            api, mount, sensor_id
        )
        vals = list(vals_tuple)
    else:
        raise ValueError(f"unexpected sensor type: {sensor_type.name}")
    return [round(v, 1) for v in vals]


async def _read_sensors_in_while_loop(
    api: OT3API,
    mount: OT3Mount,
    sensors: Dict[SensorType, List[SensorId]],
    tip_sensor: bool = False,
) -> None:
    while True:
        print("======================================================")
        for s_type, s_chnl in sensors.items():
            for s_id in s_chnl:
                vals = await _read_sensor(api, mount, s_type, s_id)
                print(f"{s_type.name}: {s_id.name} = {vals}")
        if tip_sensor:
            # TODO: implement tip-sensor readings after added to helpers_ot3
            # TODO: how do we handle 2x tip-sensors in firmware? (for 96ch)
            pass
        await asyncio.sleep(READ_INTERVAL_SECONDS)


async def _handle_gripper(api: OT3API) -> None:
    assert api.has_gripper(), "no gripper found"
    sensors: Dict[SensorType, List[SensorId]] = {
        SensorType.capacitive: [SensorId.S0, SensorId.S1],
    }
    await _read_sensors_in_while_loop(api, OT3Mount.GRIPPER, sensors)


async def _handle_pipette(api: OT3API, mount: OT3Mount) -> None:
    pip: Optional[Pipette] = api.hardware_pipettes[mount.to_mount()]
    assert pip, f"no pipette found on {mount.name}"
    num_channels = pip.channels
    if num_channels == 1:
        capacitive_channels = [SensorId.S0]
        pressure_channels = [SensorId.S0]
        environment_channels = [SensorId.S0]
    elif num_channels == 8:
        # NOTE: on 8ch, capacitive is 1x IC using 2x channels
        capacitive_channels = [SensorId.S0, SensorId.S1]
        pressure_channels = [SensorId.S0, SensorId.S1]
        environment_channels = [SensorId.S0]
    elif num_channels == 96:
        capacitive_channels = [SensorId.S0, SensorId.S1]
        pressure_channels = [SensorId.S0, SensorId.S1]
        environment_channels = [SensorId.S0, SensorId.S1]
    else:
        raise ValueError(f"unexpected number of channels: {num_channels}")
    sensors: Dict[SensorType, List[SensorId]] = {
        SensorType.capacitive: capacitive_channels,
        SensorType.pressure: pressure_channels,
        SensorType.environment: environment_channels,
    }
    await _read_sensors_in_while_loop(api, mount, sensors, tip_sensor=True)


async def _main(is_simulating: bool, mount: OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    if mount == OT3Mount.GRIPPER:
        await _handle_gripper(api)
    else:
        await _handle_pipette(api, mount)


if __name__ == "__main__":
    mount_options = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    args = parser.parse_args()
    _mount = mount_options[args.mount]
    asyncio.run(_main(args.simulate, _mount))
