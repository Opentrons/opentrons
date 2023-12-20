"""Ultima High Viscosity Fluid Lifetest."""
import argparse
import asyncio
from asyncio import sleep

from typing import List, Optional
from opentrons.hardware_control.ot3api import OT3API
from opentrons.config.defaults_ot3 import (
    DEFAULT_RUN_CURRENT,
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
)
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError
from opentrons_shared_data.labware import load_definition

from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument

from hardware_testing.gravimetric.config import _get_liquid_probe_settings
from opentrons.hardware_control.types import InstrumentProbeType

from hardware_testing.data import get_git_description
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVSection,
    CSVLine,
)
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    CriticalPoint,
    Point,
    OT3AxisKind,
)
from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3

from opentrons.config.advanced_settings import set_adv_setting

asyncio.run(set_adv_setting('disableOverpressureDetection', True))

FLOW_TO_SPEED = 1.0/15.9 # mm/uL
DEFAULT_FLOW = 700
DEFAULT_TRIALS = 10

VOLUME_OFFSET = 300/15.9 #300uL in mm of plunger travel

TIP_RACK_LABWARE = f"opentrons_flex_96_tiprack_1000ul"
TIP_RACK_SLOT = 6
TIP_VOLUME = 1000

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"
RESERVOIR_SLOT = 5

OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)

TEMP_DECK_LABWARE = "nest_12_reservoir_15ml"
TEMP_DECK_SLOT = 1
# OFFSET_FOR_TEMP_DECK = Point(x=23, y=9 * 7 * 0.5, z=-4.5) #ultima
# OFFSET_FOR_TEMP_DECK = Point(x=1, y=9 * 7 * 0.5, z=-9) #nest 12 well
OFFSET_FOR_TEMP_DECK = Point(x=1, y=9 * 7 * 0.5, z=-25) #nest 12 well no temp
# Temp deck temp of 36C keeps fluid at ~32

# DISPENSE_OFFSET = 20 #ultima
DISPENSE_OFFSET = 8 #nest 12 well

NUM_PRESSURE_READINGS = 10
SECONDS_BETWEEN_READINGS = 0.25

DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.P]
FLOW_ACCELERATION = 24000.0/15.9

def _get_test_tag(flow: float, trial: int) -> str:
    return f"flow-{flow}-trial-{trial}"


def _build_csv_report(flow: float, trials: List) -> CSVReport:
    """Build the CSVReport object to record data."""
    _report = CSVReport(
        test_name="ultima-lifetest",
        sections=[
            CSVSection(
                title=OT3Mount.LEFT.name,
                lines=[CSVLine(_get_test_tag(flow, trial), [int]) for trial in trials],
            ),
            CSVSection(
                title=OT3Mount.RIGHT.name,
                lines=[CSVLine(_get_test_tag(flow, trial), [int]) for trial in trials],
            ),
        ],
    )
    return _report



async def _get_next_pipette_mount(api: OT3API) -> OT3Mount:
    await api.cache_instruments()
    found = [
        OT3Mount.from_mount(m) for m, p in api.hardware_pipettes.items() if p
    ]
    if not found:
        return await _get_next_pipette_mount(api)
    return found[0]


def get_reservoir_nominal() -> Point:
    """Get nominal reservoir position."""
    reservoir_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        RESERVOIR_SLOT, RESERVOIR_LABWARE
    )
    # center the 96ch of the 1-well labware
    reservoir_a1_nominal += OFFSET_FOR_1_WELL_LABWARE
    return reservoir_a1_nominal

def get_temp_reservoir_nominal() -> Point:
    """Get nominal reservoir position."""
    reservoir_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TEMP_DECK_SLOT, TEMP_DECK_LABWARE
    )
    # center the 96ch of the 1-well labware
    reservoir_a1_nominal += OFFSET_FOR_TEMP_DECK
    return reservoir_a1_nominal


def get_tiprack_nominal() -> Point:
    """Get nominal tiprack position for pick-up."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_SLOT, TIP_RACK_LABWARE
    )
    return tip_rack_a1_nominal


async def _reset_gantry(api: OT3API) -> None:
    await api.home(
        [
            Axis.Z_L,
            Axis.Z_R,
            Axis.X,
            Axis.Y,
        ]
    )
    home_pos = await api.gantry_position(
        OT3Mount.RIGHT, CriticalPoint.MOUNT
    )


async def move_twin_plunger_absolute_ot3(
    api: OT3API,
    position: List[float],
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
    expect_stalls: bool = False,
) -> None:
    """Move OT3 plunger position to an absolute position."""
    _move_coro = api._move(
        target_position={Axis.P_L: position[0],
                         Axis.P_R: position[1]},  # type: ignore[arg-type]
        speed=speed,
        expect_stalls=expect_stalls,
    )
    if motor_current is None:
        await _move_coro
    else:
        async with api._backend.motor_current(
            run_currents={Axis.P_L: motor_current,
                          Axis.P_R: motor_current}
        ):
            await _move_coro


async def twin_z_move(
    api: OT3API,
    position: List[float]
) -> None:
    await helpers_ot3.move_to_arched_ot3(
        api, OT3Mount.LEFT, position
    )

    gantry_z = await api.gantry_position(OT3Mount.LEFT)
    await api._move({Axis.X:api._current_position[Axis.X],
                     Axis.Y:api._current_position[Axis.Y],
                     Axis.Z_R:api._current_position[Axis.Z_L]})


async def test_cycle(
    api: OT3API,
    positions: List[List[float]],
    flow: float,
    starting_cycle: int,
    cycles: int,
    bottom_position: List[float],
) -> None:

    speed = flow * FLOW_TO_SPEED

    for i in range(cycles):
        await move_twin_plunger_absolute_ot3(api, positions[0], speed=speed)
        await twin_z_move(api, bottom_position + Point(z=DISPENSE_OFFSET))
        await move_twin_plunger_absolute_ot3(api, positions[1], speed=speed)
        await twin_z_move(api, bottom_position)
        starting_cycle += 1


async def _read_from_sensor(
    api: OT3API,
    sensor_id: SensorId,
    num_readings: int,
    robot_mount: OT3Mount,
) -> float:
    readings: List[float] = []
    sequential_failures = 0
    while len(readings) != num_readings:
        try:
            r = await helpers_ot3.get_pressure_ot3(api, robot_mount, sensor_id)
            sequential_failures = 0
            readings.append(r)
            print(f"\t{r}")
            if not api.is_simulator:
                await sleep(SECONDS_BETWEEN_READINGS)
        except helpers_ot3.SensorResponseBad as e:
            sequential_failures += 1
            if sequential_failures == 3:
                raise e
            else:
                continue
    return sum(readings) / num_readings


async def _main(is_simulating: bool, trials: int, flow: float,
                liquid_probe: bool, continue_after_stall: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_multi_v3.4",
        pipette_right="p50_single_v3.4",
    )

    # test each attached pipette
    mount = await _get_next_pipette_mount(api)
    print(mount)

    trial_list = []
    for i in range(trials):
        trial_list.append(i)


    report = _build_csv_report(flow=flow, trials=trial_list)
    dut = helpers_ot3.DeviceUnderTest.by_mount(mount)
    # helpers_ot3.set_csv_report_meta_data_ot3(api, report, dut)
    report.set_operator("Ultima")
    robot_serial = helpers_ot3.get_robot_serial_ot3(api)
    dut_str = helpers_ot3._get_serial_for_dut(api, dut)
    report.set_tag(dut_str)
    report.set_device_id(dut_str, dut_str)
    report.set_robot_id(robot_serial)
    report.set_firmware(api.fw_version)
    report.set_version(get_git_description())

    sn = helpers_ot3.get_pipette_serial_ot3(api.hardware_pipettes[OT3Mount.LEFT.to_mount()])
    print(f"Serial Left: {sn}")
    sn = helpers_ot3.get_pipette_serial_ot3(api.hardware_pipettes[OT3Mount.RIGHT.to_mount()])
    print(f"Serial Right: {sn}")

    try:
        # home and move to a safe position
        await _reset_gantry(api)
        await api.home([Axis.P_L, Axis.P_R])



        # Pick up tips
        tip_len = helpers_ot3.get_default_tip_length(TIP_VOLUME)
        left_tips = get_tiprack_nominal()
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, left_tips)
        # input("Pick up tip? Press Enter" )
        await api.pick_up_tip(OT3Mount.LEFT, tip_length=tip_len)

        right_tips = left_tips + Point(x=9)
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.RIGHT, right_tips)
        # input("Pick up tip? Press Enter" )
        await api.pick_up_tip(OT3Mount.RIGHT, tip_length=tip_len)

        # Move to reservoir
        await api.home([Axis.Z_L, Axis.Z_R])
        z_home = await api.gantry_position(OT3Mount.LEFT)


        mounts = [OT3Mount.LEFT, OT3Mount.RIGHT]
        pip_top = [helpers_ot3.get_plunger_positions_ot3(api, mounts[0])[0] + VOLUME_OFFSET,
                   helpers_ot3.get_plunger_positions_ot3(api, mounts[1])[0] + VOLUME_OFFSET]
        pip_bot = [helpers_ot3.get_plunger_positions_ot3(api, mounts[0])[1],
                   helpers_ot3.get_plunger_positions_ot3(api, mounts[1])[1]]
        pip_blow = [helpers_ot3.get_plunger_positions_ot3(api, mounts[0])[2],
                   helpers_ot3.get_plunger_positions_ot3(api, mounts[1])[2]]
        pip_drop = [helpers_ot3.get_plunger_positions_ot3(api, mounts[0])[3],
                   helpers_ot3.get_plunger_positions_ot3(api, mounts[1])[3]]

        # print(pip_top)
        # print(pip_bot)

        # Liquid probe
        if liquid_probe:
            reservoir_a1_nominal = get_reservoir_nominal()
            reservoir_a1_home = reservoir_a1_nominal._replace(z=z_home.z)
            await helpers_ot3.move_to_arched_ot3(
                api, OT3Mount.LEFT, reservoir_a1_home
            )

            for m in mounts:
                for _probe in InstrumentProbeType:
                    sensor_id = sensor_id_for_instrument(_probe)
                    print(f"Mount: {m}")
                    sn = helpers_ot3.get_pipette_serial_ot3(api.hardware_pipettes[m.to_mount()])
                    print(f"Serial: {sn}")
                    print(f"Sensor: {_probe}")
                    open_pa = 0.0
                    try:
                        open_pa = await _read_from_sensor(api, sensor_id, NUM_PRESSURE_READINGS, m)
                    except helpers_ot3.SensorResponseBad:
                        ui.print_error(f"{_probe} pressure sensor not working, skipping")
                        continue
                    print(f"open-pa: {open_pa}")
            # input("move to pre position...")
            # await helpers_ot3.move_to_arched_ot3(
            #     api, OT3Mount.LEFT, reservoir_a1_nominal + Point(z=8)
            # )
            probe_settings = api.config.liquid_sense
            probe_settings.starting_mount_height = (reservoir_a1_nominal + Point(z=8)).z
            print(probe_settings)

            select = input("Primary (p) or Secondary (s): p/s")
            if select == 'p':
                print("sense liquid left primary...")
                sensed_z = round(
                    await api.liquid_probe(OT3Mount.LEFT, probe_settings, InstrumentProbeType.PRIMARY), 3
                )
                print(f"SENSED LIQUID Z: {sensed_z}")

                print("sense liquid right primary...")
                sensed_z = round(
                    await api.liquid_probe(OT3Mount.RIGHT, probe_settings, InstrumentProbeType.PRIMARY), 3
                )
                print(f"SENSED LIQUID Z: {sensed_z}")
            else:
                print("sense liquid left secondary...")
                sensed_z = round(
                    await api.liquid_probe(OT3Mount.LEFT, probe_settings, InstrumentProbeType.SECONDARY), 3
                )
                print(f"SENSED LIQUID Z: {sensed_z}")

                print("sense liquid right secondary...")
                sensed_z = round(
                    await api.liquid_probe(OT3Mount.RIGHT, probe_settings, InstrumentProbeType.SECONDARY), 3
                )
                print(f"SENSED LIQUID Z: {sensed_z}")

            await helpers_ot3.move_to_arched_ot3(
                api, OT3Mount.LEFT, reservoir_a1_home
            )

        # Descend into temp deck reservoir
        temp_reservoir_a1_nominal = get_temp_reservoir_nominal()
        temp_reservoir_a1_nominal_home = temp_reservoir_a1_nominal + Point(z=30)
        await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, temp_reservoir_a1_nominal_home
        )

        # input("Descend?")

        # await api.home([Axis.P_L, Axis.P_R])
        await move_twin_plunger_absolute_ot3(api, pip_bot)

        # await helpers_ot3.move_to_arched_ot3(
        #     api, OT3Mount.LEFT, temp_reservoir_a1_nominal
        # )
        #
        # gantry_z = await api.gantry_position(OT3Mount.LEFT)
        # await api._move({Axis.X:api._current_position[Axis.X],
        #                  Axis.Y:api._current_position[Axis.Y],
        #                  Axis.Z_R:api._current_position[Axis.Z_L]})
        await twin_z_move(api, temp_reservoir_a1_nominal)


        total_cycles = 0
        cycles_per_trial = 100
        blow_inc = 10
        # cycles_per_trial = 2
        # blow_inc = 10
        for t in range(trials):
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api,
                Axis.P_L,
                default_max_speed=DEFAULT_SPEED,
                acceleration=FLOW_ACCELERATION,
            )
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api,
                Axis.P_R,
                default_max_speed=DEFAULT_SPEED,
                acceleration=FLOW_ACCELERATION,
            )
            await test_cycle(api, [pip_top, pip_bot], flow,
                             total_cycles, cycles_per_trial,
                             temp_reservoir_a1_nominal)
            if t%blow_inc == 0:
                print("Blow Out")
                await test_cycle(api, [pip_blow, pip_bot], flow,
                                 0, 1,
                                 temp_reservoir_a1_nominal)
            total_cycles += cycles_per_trial
            print(total_cycles)
            report(OT3Mount.LEFT.name, _get_test_tag(flow, t), [total_cycles])
            report(OT3Mount.RIGHT.name, _get_test_tag(flow, t), [total_cycles])

        report.save_to_disk()
        # report.print_results()

        # Drop Tips
        await api.home([Axis.Z_L, Axis.Z_R])
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT,
                                             left_tips + Point(z=10))
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT,
                                             left_tips - Point(z=tip_len/3))
        await api.drop_tip(OT3Mount.LEFT)

        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.RIGHT,
                                             right_tips - Point(z=tip_len/3))
        await api.drop_tip(OT3Mount.RIGHT)

        ui.print_title("DONE")
    except KeyboardInterrupt:
        print("Cancelled")
    finally:
        await api.clean_up()
        report.save_to_disk()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trials", type=int, default=DEFAULT_TRIALS)
    parser.add_argument("--flow", type=float, default=DEFAULT_FLOW)
    parser.add_argument("--probe", action="store_true")
    parser.add_argument("--continue-after-stall", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.trials, args.flow,
                      args.probe, args.continue_after_stall))
