"""Test Instruments."""
from typing import List, Tuple

from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import CSVReport, CSVResult, CSVLine
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount

PLUNGER_TOLERANCE_MM = 0.2

Z_PROBE_DISTANCE_MM = 100
Z_PROBE_TIME_SECONDS = 5
PROBE_SETTINGS = CapacitivePassSettings(
    prep_distance_mm=Z_PROBE_DISTANCE_MM,
    max_overrun_distance_mm=0,
    speed_mm_per_s=Z_PROBE_DISTANCE_MM / Z_PROBE_TIME_SECONDS,
    sensor_threshold_pf=1.0,
)


PIPETTE_TESTS = {
    "id": [str, str, CSVResult],
    "plunger-home": [float, float, CSVResult],
    "plunger-max": [float, float, CSVResult],
    "plunger-min": [float, float, CSVResult],
    "probe-distance": [float, float, CSVResult],
}
GRIPPER_TESTS = {
    "id": [str, str, CSVResult],
    "no-skip": [CSVResult],
    "jaw-grip": [float, CSVResult],
    "jaw-ungrip": [float, CSVResult],
    "probe-distance-front": [float, CSVResult],
    "probe-distance-rear": [float, CSVResult],
}


def build_csv_lines() -> List[CSVLine]:
    """Build CSV Lines."""
    tests: List[CSVLine] = []
    for t, d in PIPETTE_TESTS.items():
        for m in ["left", "right"]:
            tests.append(CSVLine(f"{m}-{t}", d))
    for t, d in GRIPPER_TESTS.items():
        tests.append(CSVLine(f"gripper-{t}", d))
    return tests


async def _get_pip_mounts(api: OT3API) -> List[OT3Mount]:
    await api.cache_instruments()
    return [OT3Mount.from_mount(_m) for _m, _p in api.hardware_pipettes.items() if _p]


async def _get_plunger_positions(api: OT3API, mount: OT3Mount) -> Tuple[float, float]:
    axis = OT3Axis.of_main_tool_actuator(mount)
    estimates = await api.current_position_ot3(mount)
    encoders = await api.encoder_current_position_ot3(mount)
    return estimates[axis], encoders[axis]


async def _test_current_position_and_record_result(
    api: OT3API, mount: OT3Mount, report: CSVReport, section: str, tag: str
) -> None:
    estimate, encoder = await _get_plunger_positions(api, mount)
    result = CSVResult.from_bool(abs(estimate - encoder) < PLUNGER_TOLERANCE_MM)
    print(f"{tag}: {str(result)}")
    report(section, tag, [estimate, encoder, result])


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    while not api.is_simulator and (_get_pip_mounts(api) or api.has_gripper()):
        input("remove all attached instruments, then press ENTER:")
    await api.home()

    for mount in [OT3Mount.LEFT, OT3Mount.RIGHT]:
        mnt_tag = mount.name.lower()
        while not api.is_simulator and mount not in _get_pip_mounts(api):
            input(f"attached a pipette to the {mount.name} mount, then press ENTER")

        pip = api.hardware_pipettes[mount.to_mount()]
        pip_id = helpers_ot3.get_pipette_serial_ot3(pip)
        pip_ax = OT3Axis.of_main_tool_actuator(mount)
        z_ax = OT3Axis.by_mount(mount)
        top, _, _, drop_tip = helpers_ot3.get_plunger_positions_ot3(api, mount)

        # PIPETTE-ID
        if not api.is_simulator:
            user_id = input("scan pipette serial number: ").strip()
        else:
            user_id = str(pip_id)
        result = CSVResult.from_bool(pip_id == user_id.strip())
        print(f"{mnt_tag} pipette id: {str(result)}")
        report(section, f"{mnt_tag}-id", [pip_id, user_id, result])

        # PLUNGER-HOME
        print("homing plunger...")
        await api.home([pip_ax])
        await _test_current_position_and_record_result(
            api, mount, report, section, f"{mnt_tag}-plunger-home"
        )
        # PLUNGER-MAX
        print(f"moving to 1mm above drop_tip ({drop_tip - 1}mm)")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_tip - 1)
        await _test_current_position_and_record_result(
            api, mount, report, section, f"{mnt_tag}-plunger-max"
        )
        # PLUNGER-MIN
        print(f"moving to 1mm below top ({top + 1}mm)")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, top + 1)
        await _test_current_position_and_record_result(
            api, mount, report, section, f"{mnt_tag}-plunger-min"
        )

        # PROBE-DISTANCE
        await api.home([z_ax])
        pos = await api.gantry_position(mount)
        height_of_probe_full_travel = pos.z - Z_PROBE_DISTANCE_MM
        if not api.is_simulator:
            input("attach calibration probe, then press ENTER:")
        await api.add_tip(mount, helpers_ot3.CALIBRATION_PROBE_EVT.length)
        height_of_probe_stopped = await api.capacitive_probe(
            mount, z_ax, height_of_probe_full_travel, PROBE_SETTINGS
        )
        height_diff = height_of_probe_stopped - height_of_probe_full_travel
        result = CSVResult.from_bool(abs(height_diff) > 1)
        print(f"{mnt_tag} probe distance: {str(result)}")
        results = [
            float(height_of_probe_full_travel),
            float(height_of_probe_stopped),
            result,
        ]
        report(section, f"{mnt_tag}-probe-distance", results)
        if not api.is_simulator:
            input("remove calibration probe, then press ENTER:")
        await api.remove_tip(mount)
