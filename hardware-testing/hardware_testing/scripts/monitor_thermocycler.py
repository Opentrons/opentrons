"""Set various ramp rates to visualize.

To use this script plug the thermocycler gen2 directly into your computer and run make test-tc from
the hardware-testing directory.

"""
from serial.tools.list_ports import comports  # type: ignore[import-untyped]
import asyncio
from dataclasses import dataclass
import time
from matplotlib import pyplot as plt
from typing import List, Tuple, Optional
from opentrons.drivers.thermocycler.driver import (
    ThermocyclerDriverV2,
    ThermocyclerDriverFactory,
    TC_COMMAND_TERMINATOR,
    BLOCK_TARGET_MAX,
    BLOCK_TARGET_MIN,
    DEFAULT_COMMAND_RETRIES,
)
from opentrons.drivers.utils import (
    parse_key_values,
    parse_number,
    TC_GCODE_ROUNDING_PRECISION,
)
from opentrons.drivers.command_builder import CommandBuilder
from opentrons.hardware_control.modules.plate_temp_status import PlateTemperatureStatus
from opentrons.hardware_control.modules.types import TemperatureStatus


@dataclass
class DebugPlateTemperature:
    """All the data returned by get temp debug gcode message."""

    heatsink: float
    front_right: float
    front_left: float
    front_center: float
    back_right: float
    back_left: float
    back_center: float
    heatsink_adc: float
    front_right_adc: float
    front_left_adc: float
    front_center_adc: float
    back_right_adc: float
    back_left_adc: float
    back_center_adc: float


@dataclass
class DebugPower:
    """All the data returned by get power debug gcode message."""

    left: float
    center: float
    right: float
    heater: float
    fan: float
    tach1: float
    tach2: float


def parse_temperature_response_debug(temp_str: str) -> DebugPlateTemperature:
    """Parse debug resposne example below.

    M105.D HST:%0.2f FRT:%0.2f FLT:%0.2f FCT:%0.2f
    BRT:%0.2f BLT:%0.2f BCT:%0.2f HSA:%d FRA:%d
    FLA:%d FCA:%d BRA:%d BLA:%d BCA:%d OK
    """
    values = parse_key_values(temp_str)
    heatsink = parse_number(values["HST"], TC_GCODE_ROUNDING_PRECISION)
    front_right = parse_number(values["FRT"], TC_GCODE_ROUNDING_PRECISION)
    front_left = parse_number(values["FLT"], TC_GCODE_ROUNDING_PRECISION)
    front_center = parse_number(values["FCT"], TC_GCODE_ROUNDING_PRECISION)
    back_right = parse_number(values["BRT"], TC_GCODE_ROUNDING_PRECISION)
    back_left = parse_number(values["BLT"], TC_GCODE_ROUNDING_PRECISION)
    back_center = parse_number(values["BCT"], TC_GCODE_ROUNDING_PRECISION)
    heatsink_adc = parse_number(values["HSA"], TC_GCODE_ROUNDING_PRECISION)
    front_right_adc = parse_number(values["FRA"], TC_GCODE_ROUNDING_PRECISION)
    front_left_adc = parse_number(values["FLA"], TC_GCODE_ROUNDING_PRECISION)
    front_center_adc = parse_number(values["FCA"], TC_GCODE_ROUNDING_PRECISION)
    back_right_adc = parse_number(values["BRA"], TC_GCODE_ROUNDING_PRECISION)
    back_left_adc = parse_number(values["BLA"], TC_GCODE_ROUNDING_PRECISION)
    back_center_adc = parse_number(values["BCA"], TC_GCODE_ROUNDING_PRECISION)

    return DebugPlateTemperature(
        heatsink,
        front_right,
        front_left,
        front_center,
        back_right,
        back_left,
        back_center,
        heatsink_adc,
        front_right_adc,
        front_left_adc,
        front_center_adc,
        back_right_adc,
        back_left_adc,
        back_center_adc,
    )


def parse_power_response_debug(pwr_str: str) -> DebugPower:
    """Parse debug resposne example below.

    "M103.D L:%0.2f C:%0.2f R:%0.2f H:%0.2f F:%0.2f T1:%3.2f T2:%3.2f OK",
    """
    values = parse_key_values(pwr_str)
    left = parse_number(values["L"], TC_GCODE_ROUNDING_PRECISION)
    center = parse_number(values["C"], TC_GCODE_ROUNDING_PRECISION)
    right = parse_number(values["R"], TC_GCODE_ROUNDING_PRECISION)
    heater = parse_number(values["H"], TC_GCODE_ROUNDING_PRECISION)
    fan = parse_number(values["F"], TC_GCODE_ROUNDING_PRECISION)
    tach1 = parse_number(values["T1"], TC_GCODE_ROUNDING_PRECISION)
    tach2 = parse_number(values["T2"], TC_GCODE_ROUNDING_PRECISION)

    return DebugPower(left, right, center, heater, fan, tach1, tach2)


async def _get_temperature_debug(
    connection: ThermocyclerDriverV2,
) -> DebugPlateTemperature:
    c = CommandBuilder(terminator=TC_COMMAND_TERMINATOR).add_gcode(gcode="M105.D")
    response = await connection._connection.send_command(
        command=c, retries=DEFAULT_COMMAND_RETRIES
    )
    return parse_temperature_response_debug(response)


async def _get_power_debug(
    connection: ThermocyclerDriverV2,
) -> DebugPower:
    c = CommandBuilder(terminator=TC_COMMAND_TERMINATOR).add_gcode(gcode="M103.D")
    response = await connection._connection.send_command(
        command=c, retries=DEFAULT_COMMAND_RETRIES
    )
    return parse_power_response_debug(response)


async def _loop_til_temp(
    connection: ThermocyclerDriverV2, set_temp: float, ramp_rate: Optional[float]
) -> None:
    status = PlateTemperatureStatus()
    start_temp = await connection.get_plate_temperature()
    await connection.set_plate_temperature(set_temp, ramp_rate=ramp_rate)
    start = time.time()
    status.update(await connection.get_plate_temperature())
    temp_debug_info: List[Tuple[DebugPlateTemperature, float]] = []
    power_debug_info: List[Tuple[DebugPower, float]] = []
    time_to_hit = 0.0
    max_displacement = start_temp.current
    fig, axs = plt.subplots(2)
    temp_ax = axs[0]
    power_ax = axs[1]
    temp_ax.set_title("Temperature")
    power_ax.set_title("Power")
    if ramp_rate is not None:
        theoretical_time = abs(start_temp.current - set_temp) / ramp_rate
    else:
        theoretical_time = 1000
    while (
        status.status is TemperatureStatus.COOLING
        or status.status is TemperatureStatus.HEATING
    ):
        time_this = time.time()
        temp_debug_info.append((await _get_temperature_debug(connection), time_this))
        power_debug_info.append((await _get_power_debug(connection), time_this))
        next_temp = await connection.get_plate_temperature()
        print(f"target {set_temp} current {next_temp.current}")
        if abs(set_temp - next_temp.current) < 1 and time_to_hit == 0.0:
            print("Hit it")
            time_to_hit = time.time() - start
        if status.status is TemperatureStatus.COOLING:
            max_displacement = min(max_displacement, next_temp.current)
        else:
            max_displacement = max(max_displacement, next_temp.current)
        status.update(next_temp)
        times = [d[1] - start for d in temp_debug_info]
        ramp_factor = (
            -1 if start_temp.current > set_temp and ramp_rate is not None else 1
        )
        ideal = [
            ramp_factor * t * ramp_rate + start_temp.current
            if ramp_rate is not None
            else 0
            for t in times
            if t <= theoretical_time
        ]
        target = [set_temp for _ in range(len(times))]
        # hs = [d[0].heatsink for d in temp_debug_info]
        fr = [d[0].front_right for d in temp_debug_info]
        fl = [d[0].front_left for d in temp_debug_info]
        fc = [d[0].front_center for d in temp_debug_info]
        br = [d[0].back_right for d in temp_debug_info]
        bl = [d[0].back_left for d in temp_debug_info]
        bc = [d[0].back_center for d in temp_debug_info]

        left = [d[0].left for d in power_debug_info]
        center = [d[0].center for d in power_debug_info]
        right = [d[0].right for d in power_debug_info]
        # heater = [d[0].heater for d in power_debug_info]
        # fan = [d[0].fan for d in power_debug_info]
        # tach1 = [d[0].tach1 for d in power_debug_info]
        # tach2 = [d[0].tach2 for d in power_debug_info]

        temp_ax.clear()
        power_ax.clear()

        temp_ax.set_ylim(BLOCK_TARGET_MIN - 5, BLOCK_TARGET_MAX + 5)
        power_ax.set_ylim(-1, 1)

        temp_ax.plot(times, target, linestyle=":")
        # plt.plot(times, hs)
        temp_ax.plot(times, fr, label="Front right")
        temp_ax.plot(times, fl, label="Front left")
        temp_ax.plot(times, fc, label="Front center")
        temp_ax.plot(times, bl, label="back left")
        temp_ax.plot(times, br, label="back right")
        temp_ax.plot(times, bc, label="back center")

        power_ax.plot(times, left, label="Left")
        power_ax.plot(times, center, label="Center")
        power_ax.plot(times, right, label="Right")

        abbrv_times = times[: len(ideal)]
        temp_ax.plot(abbrv_times, ideal, linestyle="--")
        temp_ax.legend()
        power_ax.legend()
        plt.pause(0.05)

    print(
        f"Start temp {start_temp.current} time to hit it {time_to_hit} effective ramp rate {abs((start_temp.current - set_temp) / time_to_hit)} overshoot {abs(max_displacement - set_temp)}"
    )
    plt.show()


async def _main() -> None:
    ports = comports()
    port_name = ""
    for port in ports:
        if port.vid == 0x0483 and port.pid == 0xED8D:
            port_name = port.device
            break
    if port_name == "":
        print("Could not find thermocycler gen 2 to connect to.")
        return

    TC = await ThermocyclerDriverFactory.create(port_name, loop=None)
    looping = True
    try:
        while looping:
            set_temp = float(
                input(
                    f"Pick a set temp between {BLOCK_TARGET_MIN} and {BLOCK_TARGET_MAX}: "
                )
            )
            ramp_rate: Optional[float] = float(input("Pick a ramp rate or 0 for Max: "))
            if ramp_rate == 0:
                ramp_rate = None
            await _loop_til_temp(TC, set_temp, ramp_rate)  # type: ignore [arg-type]
            looping = input("press y to set a new temp.") == "y"
    finally:
        await TC.deactivate_all()
        await TC.disconnect()


if __name__ == "__main__":
    asyncio.run(_main())
