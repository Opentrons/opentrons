"""Tip IQC OT3."""
from asyncio import run, sleep
from typing import List, Union, Optional

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.drivers import list_ports_and_select
from hardware_testing.drivers.pressure_fixture import (
    PressureFixture,
    SimPressureFixture,
)

from hardware_testing.data.csv_report import CSVReport, CSVSection, CSVLine, CSVResult
from hardware_testing.data import ui, get_git_description
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Point, OT3Mount


SLOT_TIP_RACK = 3
SLOT_FIXTURE = 2

DEFAULT_PRESSURE_FIXTURE_READ_INTERVAL_SECONDS = 0.25
DEFAULT_NUM_SAMPLES = int(3.0 / DEFAULT_PRESSURE_FIXTURE_READ_INTERVAL_SECONDS) + 1

WELL_NAMES = [f"{row}{col}" for row in "ABCDEFGH" for col in range(1, 13)]
TEST_SECTIONS = {
    "hovered": DEFAULT_NUM_SAMPLES,
    "submerged": DEFAULT_NUM_SAMPLES,
    "aspirated": int(13.0 / DEFAULT_PRESSURE_FIXTURE_READ_INTERVAL_SECONDS) + 1,
    "dispensed": DEFAULT_NUM_SAMPLES,
}


def _get_test_tag(tip: str, section: str, sample: int) -> str:
    return f"{tip}-{section}-{sample + 1}"


async def _find_position(api: OT3API, mount: OT3Mount, nominal: Point) -> Point:
    if api.is_simulator:
        return nominal + Point()
    else:
        await api.move_to(mount, nominal + Point(z=30))
        await helpers_ot3.jog_mount_ot3(api, mount)
        return await api.gantry_position(mount)


def _connect_to_fixture(simulate: bool) -> PressureFixture:
    if not simulate:
        _port = list_ports_and_select("pressure-fixture")
        fixture = PressureFixture.create(port=_port, slot_side="left")
    else:
        fixture = SimPressureFixture()  # type: ignore[assignment]
    fixture.connect()
    return fixture


async def _read_pressure_data(
    fixture: Union[PressureFixture, SimPressureFixture],
    num_samples: int,
    interval: float = DEFAULT_PRESSURE_FIXTURE_READ_INTERVAL_SECONDS,
) -> List[float]:
    d = []
    for i in range(num_samples):
        data = fixture.read_all_pressure_channel()
        d.append(data[0])
        if not isinstance(fixture, SimPressureFixture):
            print(f"  {round(d[-1], 1)} Pa")
            await sleep(interval)
    return d


async def _read_and_store_pressure_data(
    report: CSVReport,
    tip: str,
    section: str,
    fixture: Union[PressureFixture, SimPressureFixture],
) -> None:
    num_samples = TEST_SECTIONS[section.lower()]
    data_hover = await _read_pressure_data(fixture, num_samples)
    for i, pascals in enumerate(data_hover):
        report(tip, _get_test_tag(tip, section, i), [pascals])


def _get_tip_offset_in_rack(tip_name: str) -> Point:
    assert 1 < len(tip_name) < 4
    row = "ABCDEFGH".index(tip_name[:1])
    col = int(tip_name[1:]) - 1
    row_mm = row * 9
    col_mm = col * 9
    # NOTE: y axis is negative
    return Point(x=col_mm, y=-row_mm)


async def _main(is_simulating: bool, volume: float) -> None:
    ui.print_title("TIP IQC")

    # CREATE CSV REPORT
    report = CSVReport(
        test_name="tip-iqc-ot3",
        sections=[
            CSVSection(
                title=tip,
                lines=[
                    CSVLine(_get_test_tag(tip, section, i), [float])
                    for section, num_samples in TEST_SECTIONS.items()
                    for i in range(num_samples)
                ],
            )
            for tip in WELL_NAMES
        ],
    )
    version = get_git_description()
    report.set_version(version)
    print(f"version: {version}")
    if is_simulating:
        report.set_operator("simulation")
        report.set_tag("simulation")
        report.set_device_id("simulation", CSVResult.PASS)
    else:
        report.set_operator(input("enter OPERATOR: ").strip())
        tag = input("enter TAG: ").strip()
        report.set_tag(tag)
        report.set_device_id(tag, CSVResult.from_bool(bool(tag)))

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_single_v3.3",
        gripper="GRPV1120230323A01",
    )
    report.set_firmware(api.fw_version)
    robot_id = helpers_ot3.get_robot_serial_ot3(api)
    print(f"robot serial: {robot_id}")
    report.set_robot_id(robot_id)
    mount = OT3Mount.LEFT

    # SETUP DECK
    if not api.is_simulator:
        ui.get_user_ready(f"add tip-rack to slot #{SLOT_TIP_RACK}")
        ui.get_user_ready(f"add pressure-fixture to slot #{SLOT_FIXTURE}")
        ui.get_user_ready("connect pressure-fixture to OT3 over USB")
    fixture = _connect_to_fixture(is_simulating)

    # NOMINAL POSITIONS
    fixture_nominal = helpers_ot3.get_slot_bottom_left_position_ot3(
        SLOT_FIXTURE
    ) + fixture.position_in_slot("left")
    tip_rack_nominal = helpers_ot3.get_theoretical_a1_position(
        SLOT_TIP_RACK, f"opentrons_flex_96_tiprack_{fixture.tip_volume}ul"
    )
    tip_length = helpers_ot3.get_default_tip_length(fixture.tip_volume)

    print("homing")
    await api.home()

    tip_rack_actual: Optional[Point] = None
    fixture_actual: Optional[Point] = None

    for tip in WELL_NAMES:
        ui.print_header(tip.upper())

        # FIND TIP-RACK
        if tip_rack_actual is None:
            print("find position of tip-rack")
            tip_rack_actual = await _find_position(api, mount, tip_rack_nominal)

        # PICK-UP TIP
        print("picking up tip")
        tip_pos = tip_rack_actual + _get_tip_offset_in_rack(tip)
        await helpers_ot3.move_to_arched_ot3(
            api, mount, tip_pos, safe_height=tip_pos.z + 10
        )
        await api.pick_up_tip(mount, tip_length)

        print("raise tip")
        await helpers_ot3.move_to_arched_ot3(
            api, mount, tip_pos, safe_height=tip_pos.z + 20
        )

        # FIND FIXTURE
        if fixture_actual is None:
            print("find position of pressure fixture")
            fixture_actual = await _find_position(api, mount, fixture_nominal)

        # TEST TIP
        print("testing pressure while HOVERED")
        await _read_and_store_pressure_data(report, tip, "hovered", fixture)
        await helpers_ot3.move_to_arched_ot3(
            api, mount, fixture_actual, safe_height=fixture_actual.z + 30
        )
        print("testing pressure while SUBMERGED")
        await api.move_to(mount, fixture_actual + Point(z=-fixture.depth))
        await _read_and_store_pressure_data(report, tip, "submerged", fixture)
        await api.aspirate(mount, volume)
        print("testing pressure while ASPIRATED")
        await _read_and_store_pressure_data(report, tip, "aspirated", fixture)
        await api.dispense(mount)
        print("testing pressure while DISPENSED")
        await _read_and_store_pressure_data(report, tip, "dispensed", fixture)
        await api.move_to(mount, fixture_actual)

        # RETURN TIP
        print("returning tip")
        await helpers_ot3.move_to_arched_ot3(
            api, mount, tip_pos, safe_height=tip_pos.z + 10
        )
        await api.drop_tip(mount)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--volume", type=float, default=1.0)
    args = parser.parse_args()
    run(_main(args.simulate, args.volume))
