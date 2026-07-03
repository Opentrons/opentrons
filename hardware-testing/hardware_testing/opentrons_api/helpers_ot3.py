"""Opentrons helper methods."""
import asyncio
import atexit
import logging
import struct

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from math import pi
from subprocess import run, Popen
from time import time
from typing import (
    Callable,
    Coroutine,
    Dict,
    List,
    Optional,
    Tuple,
    Union,
    cast,
    Sequence,
    Any,
)
import json
from opentrons.config import IS_ROBOT
from opentrons.protocol_api import ProtocolContext
from opentrons_hardware.drivers.can_bus import DriverSettings, build, CanMessenger
from opentrons_hardware.drivers.can_bus import settings as can_bus_settings
from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons_hardware.sensors import sensor_driver, sensor_types
from opentrons_hardware.drivers.eeprom.types import (
    PropType,
    MAX_DATA_LEN,
    EEPROMData,
    FORMAT_VERSION,
)

from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.labware import load_definition as load_labware

from opentrons.config.robot_configs import build_config_ot3, load_ot3 as load_ot3_config
from opentrons.config.advanced_settings import set_adv_setting
from opentrons.hardware_control.types import SubSystem
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import (
    sensor_node_for_mount,
)

# TODO (lc 10-27-2022) This should be changed to an ot3 pipette object once we
# have that well defined.
from opentrons.hardware_control.instruments.ot2.pipette import Pipette as PipetteOT2
from opentrons.hardware_control.instruments.ot3.pipette import Pipette as PipetteOT3
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import SyncHardwareAPI, SynchronousAdapter
from opentrons.hardware_control.types import HardwareFeatureFlags

from ..data import get_git_description, csv_report
from opentrons.config.types import GantryLoad, PerPipetteAxisSettings
from opentrons.hardware_control.types import (
    Axis,
    OT3Mount,
    CriticalPoint,
)
from opentrons.types import Point


# Supress logging.exception messages as they can be confusing when running scripts.
class StripExceptionMessageHandler(logging.StreamHandler):
    """Custom StreamHandler to strip logging.exception messages."""

    def emit(self, record: logging.LogRecord) -> None:
        """Emit a record, but supress logging.exception logs."""
        if record.exc_info:
            # Remove the msg, traceback if it's an exception
            record.msg = ""
            record.exc_info = None
        super().emit(record)


logger = logging.getLogger()
logger.addHandler(StripExceptionMessageHandler())

# TODO: use values from shared data, so we don't need to update here again
TIP_LENGTH_OVERLAP = 10.5
TIP_LENGTH_LOOKUP = {50: 57.9, 200: 58.35, 1000: 95.6}

RESET_DELAY_SECONDS = 2


@dataclass
class CalibrationSquare:
    """Calibration Square."""

    top_left_offset: Point
    width: float
    height: float
    depth: float


@dataclass
class CalibrationProbe:
    """Calibration Probe."""

    length: float
    diameter: float


# values are from "Robot Extents" sheet
CALIBRATION_SQUARE_OFFSET_EVT = Point(x=64, y=-43, z=-0.25)
CALIBRATION_SQUARE_EVT = CalibrationSquare(
    top_left_offset=CALIBRATION_SQUARE_OFFSET_EVT, width=20, height=20, depth=3
)
CALIBRATION_PROBE_EVT = CalibrationProbe(length=44.5, diameter=4.0)


def get_system_langauge() -> str:
    """Return the language setting of the robot."""
    if IS_ROBOT:
        try:
            with open("/data/ODD/config.json", "r") as f:
                app_config = json.load(f)
            return app_config["language"]["appLanguage"]
        except Exception:
            pass
    return "en-US"


LOCALIZE = get_system_langauge() == "zh-CN"


def stop_server_ot3() -> None:
    """Stop opentrons-robot-server on the OT3."""
    print('Stopping "opentrons-robot-server"...')
    run(["systemctl", "stop", "opentrons-robot-server"])
    atexit.register(restart_server_ot3)


def restart_server_ot3() -> None:
    """Start opentrons-robot-server on the OT3."""
    print('Starting "opentrons-robot-server"...')
    Popen(["systemctl restart opentrons-robot-server &"], shell=True)


def start_server_ot3() -> None:
    """Start opentrons-robot-server on the OT3."""
    print('Starting "opentrons-robot-server"...')
    run(["systemctl", "start", "opentrons-robot-server"])


def restart_canbus_ot3() -> None:
    """Restart opentrons-ot3-canbus on the OT3."""
    print('Restarting "opentrons-ot3-canbus"...')
    run(["systemctl", "restart", "opentrons-ot3-canbus"])


def stop_on_device_display_ot3() -> None:
    """Stop opentrons on-device-display on the OT3."""
    run(["systemctl", "stop", "opentrons-robot-app"])


def _create_fake_pipette_id(mount: OT3Mount, model: Optional[str]) -> Optional[str]:
    if model is None:
        return None
    items = model.split("_")
    assert len(items) == 3
    match items[0]:
        case "p1000":
            size = "P1K"
            version = 35
        case "p50":
            size = "P50"
            version = 35
        case "p200":
            size = "P2H"
            version = 30
    if items[1] == "single":
        channels = "S"
    elif items[1] == "multi":
        channels = "M"
    else:
        channels = "H"
    date = datetime.now().strftime("%y%m%d")
    unique_number = 1 if mount == OT3Mount.LEFT else 2
    return f"{size}{channels}V{version}{date}A0{unique_number}"


def _create_attached_instruments_dict(
    pipette_left: Optional[str] = None,
    pipette_right: Optional[str] = None,
    gripper: Optional[str] = None,
) -> Dict[OT3Mount, Dict[str, Optional[str]]]:
    fake_id_left = _create_fake_pipette_id(OT3Mount.LEFT, pipette_left)
    fake_id_right = _create_fake_pipette_id(OT3Mount.RIGHT, pipette_right)
    fake_id_gripper = (
        "GRPV1020221101A02" if gripper else None
    )  # FIXME: EVT grippers all have same ID
    sim_pip_left = {"model": pipette_left, "id": fake_id_left}
    sim_pip_right = {"model": pipette_right, "id": fake_id_right}
    sim_gripper = {"model": gripper, "id": fake_id_gripper}
    return {
        OT3Mount.LEFT: sim_pip_left,
        OT3Mount.RIGHT: sim_pip_right,
        OT3Mount.GRIPPER: sim_gripper,
    }


async def update_firmware(
    api: OT3API, force: bool = False, subsystems: Optional[Sequence[SubSystem]] = None
) -> None:
    """Update firmware of OT3."""
    if not api.is_simulator:
        await asyncio.sleep(RESET_DELAY_SECONDS)
    subsystems_on_boot = api.attached_subsystems
    progress_tracker: Dict[SubSystem, List[int]] = {}

    def _print_update_progress() -> None:
        msg = ""
        for _sub_sys, (_ver, _prog) in progress_tracker.items():
            if msg:
                msg += ", "
            msg += f"{_sub_sys.name}: v{_ver} ({_prog}%)"
        print(msg)

    if not subsystems:
        subsystems = []
    is_updating = False
    async for update in api.update_firmware(set(subsystems), force=force):
        is_updating = True
        fw_version = subsystems_on_boot[update.subsystem].next_fw_version
        if update.subsystem not in progress_tracker:
            progress_tracker[update.subsystem] = [fw_version, 0]
        if update.progress != progress_tracker[update.subsystem][1]:
            progress_tracker[update.subsystem][1] = update.progress
            _print_update_progress()
    if is_updating and not api.is_simulator:
        await asyncio.sleep(1)


async def wait_for_instrument_presence(
    api: OT3API, mount: OT3Mount, presence: bool
) -> bool:
    """Wait for instrument presence."""
    is_gripper = mount == OT3Mount.GRIPPER
    instr_str = "gripper" if is_gripper else "pipette"
    verb = "attach" if presence else "remove"
    direction = "to" if presence else "from"
    if not api.is_simulator:
        input(
            f"WAIT: {verb} a {instr_str} {direction} the {mount.name} mount: "
            f"press ENTER when ready"
        )
    await reset_api(api)
    await api.cache_instruments()
    if is_gripper:
        found = api.has_gripper()
    else:
        found = api.hardware_pipettes[mount.to_mount()] is not None
    if found == presence:
        print(f"{instr_str} {verb} {direction} {mount.name}\n")
        return True
    else:
        print(
            f"ERROR: unable to detect {instr_str} was {verb}d"
            f"{direction} {mount.name} mount"
        )
        if not api.is_simulator and "y" in input("QUESTION: try again? (y/n): "):
            return await wait_for_instrument_presence(api, mount, presence)
        return False


async def reset_api(api: OT3API) -> None:
    """Reset OT3API."""
    print(f"Firmware: v{api.fw_version}")
    if not api.is_simulator:
        backend = cast(OT3Controller, api._backend)
        await backend.engage_sync()
        await backend.release_estop()
        await update_firmware(api)
        await backend.probe_network()
    await api.cache_instruments()
    await api.refresh_positions()


async def build_async_ot3_hardware_api(
    is_simulating: Optional[bool] = False,
    use_defaults: Optional[bool] = True,
    pipette_left: Optional[str] = None,
    pipette_right: Optional[str] = None,
    gripper: Optional[str] = None,
    loop: Optional[asyncio.AbstractEventLoop] = None,
    stall_detection_enable: Optional[bool] = None,
) -> OT3API:
    """Built an OT3 Hardware API instance."""
    if stall_detection_enable is not None:
        try:
            await set_adv_setting(
                "disableStallDetection", False if stall_detection_enable else True
            )
        except ValueError as e:
            print(e)
    config = build_config_ot3({}) if use_defaults else load_ot3_config()
    kwargs = {"config": config, "feature_flags": HardwareFeatureFlags.build_from_ff()}
    if is_simulating:
        # This Callable type annotation works around mypy complaining about slight mismatches
        # between the signatures of build_hardware_simulator() and build_hardware_controller().
        builder: Callable[
            ..., Coroutine[None, None, OT3API]
        ] = OT3API.build_hardware_simulator
        sim_pips = _create_attached_instruments_dict(
            pipette_left, pipette_right, gripper
        )
        kwargs["attached_instruments"] = sim_pips  # type: ignore[assignment]
    else:
        builder = OT3API.build_hardware_controller
        stop_server_ot3()
        restart_canbus_ot3()
        kwargs["use_usb_bus"] = True  # type: ignore[assignment]
    try:
        api = await builder(loop=loop, **kwargs)  # type: ignore[arg-type]
    except Exception as e:
        if is_simulating:
            raise e
        print(e)
        kwargs["use_usb_bus"] = False  # type: ignore[assignment]
        api = await builder(loop=loop, **kwargs)  # type: ignore[arg-type]
    await reset_api(api)
    return api


class DeviceUnderTest(Enum):
    """Device Under Test."""

    ROBOT = "robot"
    PIPETTE_LEFT = "pipette-left"
    PIPETTE_RIGHT = "pipette-right"
    GRIPPER = "gripper"
    OTHER = "other"

    @classmethod
    def by_mount(cls, mount: OT3Mount) -> "DeviceUnderTest":
        """Get DUT by mount."""
        lookup = {
            OT3Mount.LEFT: cls.PIPETTE_LEFT,
            OT3Mount.RIGHT: cls.PIPETTE_RIGHT,
            OT3Mount.GRIPPER: cls.GRIPPER,
        }
        return lookup[mount]


def _get_serial_for_dut(
    api: Union[OT3API, SyncHardwareAPI], dut: DeviceUnderTest
) -> str:
    if dut == DeviceUnderTest.ROBOT:
        return get_robot_serial_ot3(api)
    elif dut == DeviceUnderTest.PIPETTE_LEFT or dut == DeviceUnderTest.PIPETTE_RIGHT:
        mnt = OT3Mount.LEFT if dut == DeviceUnderTest.PIPETTE_LEFT else OT3Mount.RIGHT
        pipette = api.hardware_pipettes[mnt.to_mount()]
        assert pipette
        return get_pipette_serial_ot3(pipette)
    elif dut == DeviceUnderTest.GRIPPER:
        gripper = api.attached_gripper
        assert gripper
        return str(gripper["gripper_id"])
    elif api.is_simulator:
        return dut.value
    else:
        return input("enter ID for test: ")


async def _scan_barcode(self) -> Optional[str]:  # noqa: ANN001
    scanner = self.attached_peripherals[0]
    return await scanner.scan_barcode()


def get_device_barcode(
    ctx: ProtocolContext,
    api: SyncHardwareAPI,
    dut: DeviceUnderTest = DeviceUnderTest.ROBOT,
) -> str:
    """Have the user scan a devices barcode."""
    OT3API._scan_barcode = _scan_barcode  # type: ignore[attr-defined]
    for i in range(3):
        ctx.pause(
            f"将扫描仪对准 {dut.value} 条形码"
            if LOCALIZE
            else f"Point scanner at {dut.value} barcode"
        )
        result = api._scan_barcode()
        if result:
            return result
        ctx.pause("扫描失败，请重试" if LOCALIZE else "Failed to scan, try again.")

    raise RuntimeError("Error scanning barcode.")


def set_csv_report_meta_data_ot3(
    api: Union[OT3API, SyncHardwareAPI],
    report: csv_report.CSVReport,
    operator: str,
    dut: DeviceUnderTest = DeviceUnderTest.ROBOT,
    tag: str = "",
    ctx: Optional[ProtocolContext] = None,
) -> None:
    """Set CSVReport meta-data given an OT3."""
    # operator should be entered first
    report.set_operator(operator)

    # default DUT to be the robot serial
    # and only scan barcode if we're not simulating
    robot_serial = get_robot_serial_ot3(api)
    dut_str = _get_serial_for_dut(api, dut)
    print(f"device under test: {dut_str}")
    barcode = dut_str
    if dut != DeviceUnderTest.OTHER:
        # always confirm barcode for robot/pipette/gripper
        if isinstance(api, SynchronousAdapter):
            # if we're running with one of protocol engine's adapters we're running in a protocol and
            # need to use the ctx to grab the barcode scanner instead of users typing input.
            assert ctx
            barcode = get_device_barcode(ctx, api, dut)
        elif not api.is_simulator:
            barcode = input("SCAN device barcode: ").strip()
    print(f"barcode: {barcode}")
    # default the CSV tag to be the DUT
    report.set_tag(tag if tag else dut_str)
    report.set_device_id(dut_str, barcode)
    report.set_robot_id(robot_serial)
    report.set_firmware(api.fw_version)
    if not (ctx and ctx.is_simulating()):
        report.set_version(get_git_description())


def set_gantry_per_axis_setting_ot3(
    settings: PerPipetteAxisSettings, axis: Axis, load: GantryLoad, value: float
) -> None:
    """Set a value in an OT3 Gantry's per-axis-settings."""
    axis_kind = Axis.to_kind(axis)
    match load:
        case GantryLoad.HIGH_THROUGHPUT_1000:
            settings.high_throughput_1000[axis_kind] = value
        case GantryLoad.HIGH_THROUGHPUT_1000:
            settings.high_throughput_200[axis_kind] = value
        case GantryLoad.LOW_THROUGHPUT:
            settings.low_throughput[axis_kind] = value


def get_gantry_per_axis_setting_ot3(
    settings: PerPipetteAxisSettings, axis: Axis, load: GantryLoad
) -> float:
    """Set a value in an OT3 Gantry's per-axis-settings."""
    axis_kind = Axis.to_kind(axis)
    match load:
        case GantryLoad.HIGH_THROUGHPUT_1000:
            return settings.high_throughput_1000[axis_kind]
        case GantryLoad.HIGH_THROUGHPUT_200:
            return settings.high_throughput_200[axis_kind]
        case GantryLoad.LOW_THROUGHPUT:
            return settings.low_throughput[axis_kind]


def _set_gantry_load_per_axis_current_settings_common(
    api: Union[OT3API, SyncHardwareAPI],
    axis: Axis,
    load: Optional[GantryLoad] = None,
    hold_current: Optional[float] = None,
    run_current: Optional[float] = None,
) -> GantryLoad:
    if load is None:
        load = api.gantry_load
    if hold_current is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.current_settings.hold_current,
            axis=axis,
            load=load,
            value=hold_current,
        )
    if run_current is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.current_settings.run_current,
            axis=axis,
            load=load,
            value=run_current,
        )
    return load


async def set_gantry_load_per_axis_current_settings_ot3(
    api: OT3API,
    axis: Axis,
    load: Optional[GantryLoad] = None,
    hold_current: Optional[float] = None,
    run_current: Optional[float] = None,
) -> None:
    """Update an OT3 axis current settings."""
    checked_load = _set_gantry_load_per_axis_current_settings_common(
        api, axis, load, hold_current, run_current
    )
    # make sure new currents are sent to hardware controller
    await api.set_gantry_load(checked_load)


def set_gantry_load_per_axis_current_settings_ot3_sync(
    api: SyncHardwareAPI,
    axis: Axis,
    load: Optional[GantryLoad] = None,
    hold_current: Optional[float] = None,
    run_current: Optional[float] = None,
) -> None:
    """Update an OT3 axis current settings."""
    checked_load = _set_gantry_load_per_axis_current_settings_common(
        api, axis, load, hold_current, run_current
    )
    # make sure new currents are sent to hardware controller
    api.set_gantry_load(checked_load)


def _set_gantry_load_per_axis_motion_settings_ot3_common(
    api: Union[OT3API, SyncHardwareAPI],
    axis: Axis,
    load: Optional[GantryLoad] = None,
    default_max_speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    direction_change_speed_discontinuity: Optional[float] = None,
) -> GantryLoad:
    if load is None:
        load = api.gantry_load
    if default_max_speed is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.default_max_speed,
            axis=axis,
            load=load,
            value=default_max_speed,
        )
    if acceleration is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.acceleration,
            axis=axis,
            load=load,
            value=acceleration,
        )
    if max_speed_discontinuity is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.max_speed_discontinuity,
            axis=axis,
            load=load,
            value=max_speed_discontinuity,
        )
    if direction_change_speed_discontinuity is not None:
        set_gantry_per_axis_setting_ot3(
            settings=api.config.motion_settings.direction_change_speed_discontinuity,
            axis=axis,
            load=load,
            value=direction_change_speed_discontinuity,
        )
    return load


async def set_gantry_load_per_axis_motion_settings_ot3(
    api: OT3API,
    axis: Axis,
    load: Optional[GantryLoad] = None,
    default_max_speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    direction_change_speed_discontinuity: Optional[float] = None,
) -> None:
    """Update an OT3 axis motion settings."""
    checked_load = _set_gantry_load_per_axis_motion_settings_ot3_common(
        api,
        axis,
        load,
        default_max_speed,
        acceleration,
        max_speed_discontinuity,
        direction_change_speed_discontinuity,
    )
    # make sure new currents are sent to hardware controller
    await api.set_gantry_load(checked_load)


def set_gantry_load_per_axis_motion_settings_ot3_sync(
    api: SyncHardwareAPI,
    axis: Axis,
    load: Optional[GantryLoad] = None,
    default_max_speed: Optional[float] = None,
    acceleration: Optional[float] = None,
    max_speed_discontinuity: Optional[float] = None,
    direction_change_speed_discontinuity: Optional[float] = None,
) -> None:
    """Update an OT3 axis motion settings."""
    checked_load = _set_gantry_load_per_axis_motion_settings_ot3_common(
        api,
        axis,
        load,
        default_max_speed,
        acceleration,
        max_speed_discontinuity,
        direction_change_speed_discontinuity,
    )
    # make sure new currents are sent to hardware controller
    api.set_gantry_load(checked_load)


@dataclass
class GantryLoadSettings:
    """Gantry Load Settings."""

    max_speed: float  # mm/sec
    acceleration: float  # mm/sec**2
    max_start_stop_speed: float  # mm/sec
    max_change_dir_speed: float  # mm/sec
    hold_current: float  # amps
    run_current: float  # amps


def get_gantry_load_per_axis_motion_settings_ot3(
    api: Union[OT3API, SyncHardwareAPI],
    axis: Axis,
    load: Optional[GantryLoad] = None,
) -> GantryLoadSettings:
    """Get the gantry-load settings, per Axis."""
    if load is None:
        load = api.gantry_load
    ax_kind = Axis.to_kind(axis)
    m_cfg = api.config.motion_settings
    c_cfg = api.config.current_settings

    def _default_motion(a: str) -> float:
        try:
            return getattr(m_cfg, a)[load][ax_kind]
        except KeyError:
            return getattr(m_cfg, a)[GantryLoad.LOW_THROUGHPUT][ax_kind]

    def _default_current(a: str) -> float:
        try:
            return getattr(c_cfg, a)[load][ax_kind]
        except KeyError:
            return getattr(c_cfg, a)[GantryLoad.LOW_THROUGHPUT][ax_kind]

    return GantryLoadSettings(
        max_speed=_default_motion("default_max_speed"),
        acceleration=_default_motion("acceleration"),
        max_start_stop_speed=_default_motion("max_speed_discontinuity"),
        max_change_dir_speed=_default_motion("direction_change_speed_discontinuity"),
        hold_current=_default_current("hold_current"),
        run_current=_default_current("run_current"),
    )


async def set_gantry_load_per_axis_settings_ot3(
    api: OT3API,
    settings: Dict[Axis, GantryLoadSettings],
    load: Optional[GantryLoad] = None,
) -> None:
    """Set motion/current settings, per-axis, per-gantry-load."""
    if load is None:
        load = api.gantry_load
    for ax, stg in settings.items():
        await set_gantry_load_per_axis_motion_settings_ot3(
            api,
            ax,
            load,
            default_max_speed=stg.max_speed,
            acceleration=stg.acceleration,
            max_speed_discontinuity=stg.max_start_stop_speed,
            direction_change_speed_discontinuity=stg.max_change_dir_speed,
        )
        await set_gantry_load_per_axis_current_settings_ot3(
            api, ax, load, hold_current=stg.hold_current, run_current=stg.run_current
        )
    if load == api.gantry_load:
        await api.set_gantry_load(gantry_load=load)


async def home_ot3(api: OT3API, axes: Optional[List[Axis]] = None) -> None:
    """Home OT3 gantry."""
    default_home_speed = 10.0
    default_home_speed_xy = 40.0

    homing_speeds: Dict[Axis, float] = {
        Axis.X: default_home_speed_xy,
        Axis.Y: default_home_speed_xy,
        Axis.Z_L: default_home_speed,
        Axis.Z_R: default_home_speed,
        Axis.Z_G: default_home_speed,
        Axis.P_L: default_home_speed,
        Axis.P_R: default_home_speed,
    }

    # save our current script's settings
    cached_discontinuities: Dict[Axis, float] = {
        ax: api.config.motion_settings.max_speed_discontinuity[api.gantry_load].get(
            Axis.to_kind(ax), homing_speeds[ax]
        )
        for ax in homing_speeds
    }
    # overwrite current settings with API settings
    for ax, val in homing_speeds.items():
        await set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, max_speed_discontinuity=val
        )
    # actually home
    await api.home(axes=axes)
    # revert back to our script's settings
    for ax, val in cached_discontinuities.items():
        await set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, max_speed_discontinuity=val
        )


def _get_pipette_from_mount(
    api: Union[OT3API, SyncHardwareAPI], mount: OT3Mount
) -> PipetteOT3:
    pipette = api.hardware_pipettes[mount.to_mount()]
    if pipette is None:
        raise RuntimeError(f"No pipette currently attaced to mount {mount}")
    return pipette


def get_plunger_positions_ot3(
    api: Union[OT3API, SyncHardwareAPI], mount: OT3Mount
) -> Tuple[float, float, float, float]:
    """Update plunger current."""
    pipette = _get_pipette_from_mount(api, mount)
    return (
        pipette.plunger_positions.top,
        pipette.plunger_positions.bottom,
        pipette.plunger_positions.blow_out,
        pipette.plunger_positions.drop_tip,
    )


def update_pick_up_current(
    api: Union[OT3API, SyncHardwareAPI], mount: OT3Mount, current: float = 0.125
) -> None:
    """Update pick-up-tip current."""
    pipette = _get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations.press_fit
    for map_key in config_model.configuration_by_nozzle_map.keys():
        for tip_type in config_model.configuration_by_nozzle_map[map_key].keys():
            config_model.configuration_by_nozzle_map[map_key][
                tip_type
            ].current = current
    pipette.pick_up_configurations.press_fit = config_model


async def update_pick_up_distance(
    api: OT3API, mount: OT3Mount, distance: float = 17.0
) -> None:
    """Update pick-up-tip distance."""
    pipette = _get_pipette_from_mount(api, mount)
    config_model = pipette.pick_up_configurations.press_fit
    for map_key in config_model.configuration_by_nozzle_map.keys():
        for tip_type in config_model.configuration_by_nozzle_map[map_key].keys():
            config_model.configuration_by_nozzle_map[map_key][
                tip_type
            ].distance = distance
    pipette.pick_up_configurations.press_fit = config_model


async def move_plunger_absolute_ot3(
    api: OT3API,
    mount: OT3Mount,
    position: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
    expect_stalls: bool = False,
) -> None:
    """Move OT3 plunger position to an absolute position."""
    if not api.hardware_pipettes[mount.to_mount()]:
        raise RuntimeError(f"No pipette found on mount: {mount}")
    plunger_axis = Axis.of_main_tool_actuator(mount)
    _move_coro = api._move(
        target_position={plunger_axis: position},  # type: ignore[arg-type]
        speed=speed,
        expect_stalls=expect_stalls,
    )
    if motor_current is None:
        await _move_coro
    else:
        async with api._backend.motor_current(
            run_currents={Axis.of_main_tool_actuator(mount): motor_current}
        ):
            await _move_coro


async def _move_plunger_absolute_ot3_patch(
    self,  # noqa: ANN001
    mount: OT3Mount,
    position: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
    expect_stalls: bool = False,
) -> None:
    """Move OT3 plunger position to an absolute position."""
    if not self.hardware_pipettes[mount.to_mount()]:
        raise RuntimeError(f"No pipette found on mount: {mount}")
    plunger_axis = Axis.of_main_tool_actuator(mount)
    _move_coro = self._move(
        target_position={plunger_axis: position},  # type: ignore[arg-type]
        speed=speed,
        expect_stalls=expect_stalls,
    )
    if motor_current is None:
        await _move_coro
    else:
        async with self._backend.motor_current(
            run_currents={Axis.of_main_tool_actuator(mount): motor_current}
        ):
            await _move_coro


def move_plunger_absolute_ot3_sync(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    position: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
    expect_stalls: bool = False,
) -> None:
    """Move OT3 plunger position to an absolute position."""
    OT3API._move_plunger_absolute_ot3 = _move_plunger_absolute_ot3_patch  # type: ignore[attr-defined]

    api._move_plunger_absolute_ot3(mount, position, motor_current, speed, expect_stalls)


async def home_tip_motors(api: OT3API, back_off: bool = True) -> None:
    """Homes the tip motors with backoff option broken out."""
    await api._backend.home_tip_motors(distance=50, velocity=5, back_off=back_off)


async def _home_tip_motors_patch(self, back_off: bool = True) -> None:  # noqa: ANN001
    """Homes the tip motors with backoff option broken out."""
    await self._backend.home_tip_motors(distance=50, velocity=5, back_off=back_off)


def home_tip_motors_sync(api: SyncHardwareAPI, back_off: bool = True) -> None:
    """Homes the tip motors with backoff option broken out."""
    if not api.is_simulator:
        OT3API._home_tip_motors = _home_tip_motors_patch  # type: ignore[attr-defined]
        api._backend._home_tip_motors(back_off)


async def move_tip_motor_relative_ot3(
    api: OT3API,
    distance: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
) -> None:
    """Move 96ch tip-motor (Q) to an absolute position."""
    if not api.hardware_pipettes[OT3Mount.LEFT.to_mount()]:
        raise RuntimeError("No pipette found on LEFT mount")

    current_gear_pos = api._backend.gear_motor_position or 0.0
    target_pos = current_gear_pos + distance

    # if speed is not None and distance < 0:
    #     speed *= -1

    _move_coro = api._backend.tip_action(current_gear_pos, [(target_pos, speed or 400)])
    if motor_current is None:
        await _move_coro
    else:
        async with api._backend.motor_current(run_currents={Axis.Q: motor_current}):
            await _move_coro


async def _move_tip_motor_relative_ot3_patch(
    self,  # noqa: ANN001
    distance: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
) -> None:
    """Move 96ch tip-motor (Q) to an absolute position."""
    if not self.hardware_pipettes[OT3Mount.LEFT.to_mount()]:
        raise RuntimeError("No pipette found on LEFT mount")

    current_gear_pos = self._backend.gear_motor_position or 0.0
    target_pos = current_gear_pos + distance

    # if speed is not None and distance < 0:
    #     speed *= -1

    _move_coro = self._backend.tip_action(
        current_gear_pos, [(target_pos, speed or 400)]
    )
    if motor_current is None:
        await _move_coro
    else:
        async with self._backend.motor_current(run_currents={Axis.Q: motor_current}):
            await _move_coro


def move_tip_motor_relative_ot3_sync(
    api: SyncHardwareAPI,
    distance: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
) -> None:
    """Move 96ch tip-motor (Q) to an absolute position."""
    OT3API._move_tip_motor_relative_ot3 = _move_tip_motor_relative_ot3_patch  # type: ignore[attr-defined]
    api._move_tip_motor_relative_ot3(distance, motor_current, speed)


async def move_plunger_relative_ot3(
    api: OT3API,
    mount: OT3Mount,
    delta: float,
    motor_current: Optional[float] = None,
    speed: Optional[float] = None,
) -> None:
    """Move OT3 plunger position in a relative direction."""
    current_pos = await api.current_position_ot3(mount=mount)
    plunger_axis = Axis.of_main_tool_actuator(mount)
    plunger_pos = current_pos[plunger_axis]
    return await move_plunger_absolute_ot3(
        api, mount, plunger_pos + delta, motor_current, speed
    )


async def move_gripper_jaw_relative_ot3(api: OT3API, delta: float) -> None:
    """Move the gripper jaw by a relative distance."""
    # FIXME: this should be in relative distances
    #        but the api isn't setup for reporting current position yet
    print("FIXME: Not using relative distances for gripper, using absolute...")
    await api.hold_jaw_width(int(delta))


def get_endstop_position_ot3(
    api: Union[OT3API, SyncHardwareAPI], mount: OT3Mount
) -> Dict[Axis, float]:
    """Get the endstop's position per mount."""
    carriage_pos = api.get_deck_from_machine(api._backend.home_position())
    pos_at_home = api._effector_pos_from_carriage_pos(
        OT3Mount.from_mount(mount), carriage_pos, None
    )
    return {ax: val for ax, val in pos_at_home.items()}


def get_gantry_homed_position_ot3(api: OT3API, mount: OT3Mount) -> Point:
    """Get the homed coordinate by mount."""
    axes_pos = get_endstop_position_ot3(api, mount)
    return Point(
        x=axes_pos[Axis.X],
        y=axes_pos[Axis.Y],
        z=axes_pos[Axis.by_mount(mount)],
    )


class OT3JogTermination(Exception):
    """Jogging terminated."""

    pass


class OT3JogNoInput(Exception):
    """No jogging input from user."""

    pass


def _jog_read_user_input(terminator: str, home_key: str) -> Tuple[str, float, bool]:
    user_input = input(f'\tJog eg: x-10.5 (ENTER to repeat, "{terminator}" to stop): ')
    user_input = user_input.strip().replace(" ", "")
    if user_input == terminator:
        raise OT3JogTermination()
    if not user_input:
        raise OT3JogNoInput()
    if home_key in user_input:
        user_input = user_input.replace(home_key, "")
        do_home = True
        distance = 0.0
    else:
        do_home = False
        distance = float(user_input[1:])
    axis = user_input[0].upper()
    if axis not in "XYZPG":
        raise ValueError(f'Unexpected axis: "{axis}"')
    return axis, distance, do_home


async def _jog_axis_some_distance(
    api: OT3API,
    mount: OT3Mount,
    axis: str,
    distance: float,
    speed: Optional[float],
) -> None:
    if not axis or distance == 0.0:
        return
    elif axis == "G":
        await move_gripper_jaw_relative_ot3(api, distance)
    elif axis == "P":
        await move_plunger_relative_ot3(api, mount, distance, speed=speed)
    else:
        delta = Point(**{axis.lower(): distance})
        await api.move_rel(mount=mount, delta=delta, speed=speed)


async def _jog_print_current_position(
    api: OT3API, mount: OT3Mount, critical_point: Optional[CriticalPoint] = None
) -> None:
    z_axis = Axis.by_mount(mount)
    instr_axis = Axis.of_main_tool_actuator(mount)
    motors_pos = await api.current_position_ot3(
        mount=mount, critical_point=critical_point
    )
    enc_pos = await api.encoder_current_position_ot3(
        mount=mount, critical_point=critical_point
    )
    mx, my, mz, mp = [
        round(motors_pos[ax], 2) for ax in [Axis.X, Axis.Y, z_axis, instr_axis]
    ]
    ex, ey, ez, ep = [
        round(enc_pos[ax], 2) for ax in [Axis.X, Axis.Y, z_axis, instr_axis]
    ]
    print(f"\tDeck Coordinate: X={mx}, Y={my}, Z={mz}, Instr={mp}")
    print(f"\tEnc. Coordinate: X={ex}, Y={ey}, Z={ez}, Instr={ep}")


async def _jog_do_print_then_input_then_move(
    api: OT3API,
    mount: OT3Mount,
    critical_point: Optional[CriticalPoint],
    axis: str,
    distance: float,
    do_home: bool,
    display: Optional[bool] = True,
    speed: Optional[float] = None,
) -> Tuple[str, float, bool]:
    try:
        if display:
            await _jog_print_current_position(api, mount, critical_point)
        axis, distance, do_home = _jog_read_user_input(
            terminator="stop", home_key="home"
        )
    except OT3JogNoInput:
        pass
    if do_home:
        str_to_axes = {
            "X": Axis.X,
            "Y": Axis.Y,
            "Z": Axis.by_mount(mount),
            "P": Axis.of_main_tool_actuator(mount),
            "G": Axis.G,
            "Q": Axis.Q,
        }
        await api.home([str_to_axes[axis]])
    else:
        await _jog_axis_some_distance(api, mount, axis, distance, speed)
    return axis, distance, do_home


async def jog_mount_ot3(
    api: OT3API,
    mount: OT3Mount,
    critical_point: Optional[CriticalPoint] = None,
    display: Optional[bool] = True,
    speed: Optional[float] = None,
) -> Dict[Axis, float]:
    """Jog an OT3 mount's gantry XYZ and pipettes axes."""
    if api.is_simulator:
        return await api.current_position_ot3(
            mount=mount, critical_point=critical_point
        )
    axis: str = ""
    distance: float = 0.0
    do_home: bool = False
    print("jogging")
    while True:
        try:
            axis, distance, do_home = await _jog_do_print_then_input_then_move(
                api,
                mount,
                critical_point,
                axis,
                distance,
                do_home,
                display=display,
                speed=speed,
            )
        except ValueError as e:
            print(e)
            continue
        except OT3JogTermination:
            print("done jogging")
            return await api.current_position_ot3(
                mount=mount, critical_point=critical_point
            )


def jog_mount_ot3_sync(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    critical_point: Optional[CriticalPoint] = None,
    display: Optional[bool] = True,
    speed: Optional[float] = None,
) -> Dict[Axis, float]:
    """Jog an OT3 mount's gantry XYZ and pipettes axes."""
    assert False
    return api.current_position_ot3(mount=mount, critical_point=critical_point)
    """
    if api.is_simulator:
        return await api.current_position_ot3(
            mount=mount, critical_point=critical_point
        )
    axis: str = ""
    distance: float = 0.0
    do_home: bool = False
    print("jogging")
    while True:
        try:
            axis, distance, do_home = await _jog_do_print_then_input_then_move(
                api,
                mount,
                critical_point,
                axis,
                distance,
                do_home,
                display=display,
                speed=speed,
            )
        except ValueError as e:
            print(e)
            continue
        except OT3JogTermination:
            print("done jogging")
            return await api.current_position_ot3(
                mount=mount, critical_point=critical_point
            )
    """


async def move_to_arched_ot3(
    api: OT3API,
    mount: OT3Mount,
    abs_position: Point,
    speed: Optional[float] = None,
    safe_height: float = -100.0,
) -> None:
    """Move OT3 gantry in an arched path."""
    z_ax = Axis.by_mount(mount)
    max_z = get_endstop_position_ot3(api, mount)[z_ax]
    here = await api.gantry_position(mount=mount, refresh=True)
    arch_z = min(max(here.z, abs_position.z, safe_height), max_z)
    points = [
        here._replace(z=arch_z),
        abs_position._replace(z=arch_z),
        abs_position,
    ]
    for p in points:
        await api.move_to(mount=mount, abs_position=p, speed=speed)


def move_to_arched_ot3_sync(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    abs_position: Point,
    speed: Optional[float] = None,
    safe_height: float = -100.0,
) -> None:
    """Move OT3 gantry in an arched path."""
    z_ax = Axis.by_mount(mount)
    max_z = get_endstop_position_ot3(api, mount)[z_ax]
    here = api.gantry_position(mount=mount, refresh=True)
    arch_z = min(max(here.z, abs_position.z, safe_height), max_z)
    points = [
        here._replace(z=arch_z),
        abs_position._replace(z=arch_z),
        abs_position,
    ]
    for p in points:
        api.move_to(mount=mount, abs_position=p, speed=speed)


class SensorResponseBad(Exception):
    """Sensor Response is Bad."""

    pass


async def _get_temp_humidity(
    messenger: CanMessenger,
    mount: OT3Mount,
    sensor_id: SensorId = SensorId.S0,
) -> Tuple[float, float]:
    node_id = sensor_node_for_mount(mount)
    environment = sensor_types.EnvironmentSensor.build(sensor_id, node_id)
    s_driver = sensor_driver.SensorDriver()
    data = await s_driver.read(
        messenger, environment, offset=False, timeout=2  # type: ignore[union-attr]
    )
    if data is None:
        raise SensorResponseBad("no response from sensor")
    return data.temperature.to_float(), data.humidity.to_float()  # type: ignore[union-attr]


async def get_temperature_humidity_ot3(
    api: OT3API,
    mount: OT3Mount,
    sensor_id: SensorId = SensorId.S0,
) -> Tuple[float, float]:
    """Get the temperature/humidity reading from the pipette."""
    if api.is_simulator:
        return 25.0, 50.0
    messenger = cast(OT3Controller, api._backend)._messenger
    return await _get_temp_humidity(messenger, mount, sensor_id)


def get_temperature_humidity_outside_api_ot3(
    mount: OT3Mount,
    is_simulating: bool = False,
    sensor_id: SensorId = SensorId.S0,
) -> Tuple[float, float]:
    """Get the temperature/humidity reading from the pipette outside of a protocol."""
    settings = DriverSettings(
        interface=can_bus_settings.DEFAULT_INTERFACE,
        port=can_bus_settings.DEFAULT_PORT,
        host=can_bus_settings.DEFAULT_HOST,
        bit_rate=can_bus_settings.DEFAULT_BITRATE,
        channel=can_bus_settings.DEFAULT_CHANNEL,
    )

    async def _run() -> Tuple[float, float]:
        if is_simulating:
            return 25.0, 50.0
        async with build.driver(settings) as driver:
            messenger = CanMessenger(driver=driver)
            messenger.start()
            ret = await _get_temp_humidity(messenger, mount, sensor_id)
            await messenger.stop()
            return ret

    loop = asyncio.get_event_loop()
    task = loop.create_task(_run())
    loop.run_until_complete(task)
    return task.result()


async def get_capacitance_ot3(
    api: OT3API, mount: OT3Mount, sensor_id: SensorId = SensorId.S0
) -> float:
    """Get the capacitance reading from the pipette."""
    if api.is_simulator:
        return 0.0
    node_id = sensor_node_for_mount(mount)
    capacitive = sensor_types.CapacitiveSensor.build(sensor_id, node_id)
    s_driver = sensor_driver.SensorDriver()
    data = await s_driver.read(
        cast(OT3Controller, api._backend)._messenger,
        capacitive,
        offset=False,
        timeout=2,
    )
    if data is None:
        raise SensorResponseBad("no response from sensor")
    return data.to_float()  # type: ignore[union-attr]


async def get_pressure_ot3(
    api: OT3API, mount: OT3Mount, sensor_id: SensorId = SensorId.S0
) -> float:
    """Get the pressure reading from the pipette."""
    if api.is_simulator:
        return 0.0
    node_id = sensor_node_for_mount(mount)
    pressure = sensor_types.PressureSensor.build(sensor_id, node_id)
    s_driver = sensor_driver.SensorDriver()
    data = await s_driver.read(
        cast(OT3Controller, api._backend)._messenger, pressure, offset=False, timeout=2
    )
    if data is None:
        raise SensorResponseBad("no response from sensor")
    return data.to_float()  # type: ignore[union-attr]


async def wait_for_stable_capacitance_ot3(
    api: OT3API,
    mount: OT3Mount,
    threshold_pf: float,
    duration: float,
    retries: int = 10,
) -> None:
    """Wait for the pipette capacitance to be stable."""
    if api.is_simulator:
        return
    data = list()

    async def _read() -> None:
        cap_val = await get_capacitance_ot3(api, mount)
        data.append(
            (
                time(),
                cap_val,
            )
        )

    def _data_duration() -> float:
        if len(data) < 2:
            return 0.0
        return data[-1][0] - data[0][0]

    def _data_stats() -> Tuple[float, float]:
        cap_data = [d[1] for d in data]
        avg = sum(cap_data) / len(cap_data)
        var = max(cap_data) - min(cap_data)
        return avg, var

    print(f"Waiting for {duration} seconds of stable capacitance, please wait...")
    while _data_duration() < duration:
        await _read()

    average, variance = _data_stats()
    print(
        f"Read {len(data)} samples in {_data_duration()} seconds "
        f"(average={average}, variance={variance})"
    )
    if variance > threshold_pf or variance == 0.0:
        if retries <= 0:
            raise RuntimeError("Unable to get stable capacitance reading")
        print("Unstable, repeating...")
        await wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf, duration, retries - 1
        )


def get_pipette_offset_ot3(api: OT3API, mount: OT3Mount) -> Point:
    """Get pipette offset OT3."""
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette, f"No pipette found on mount: {mount}"
    return pipette._pipette_offset.offset + Point()


def set_pipette_offset_ot3(api: OT3API, mount: OT3Mount, offset: Point) -> None:
    """Set pipette offset OT3."""
    pipette = api.hardware_pipettes[mount.to_mount()]
    assert pipette, f"No pipette found on mount: {mount}"
    pipette._pipette_offset.offset = offset


def get_gripper_offset_ot3(api: OT3API) -> Point:
    """Get gripper offset OT3."""
    assert api.has_gripper(), "No gripper found"
    return api._gripper_handler._gripper._calibration_offset.offset  # type: ignore[union-attr]


def set_gripper_offset_ot3(api: OT3API, offset: Point) -> None:
    """Set gripper offset OT3."""
    assert api.has_gripper(), "No gripper found"
    api._gripper_handler._gripper._calibration_offset.offset = offset  # type: ignore[union-attr]


def get_slot_size() -> Point:
    """Get OT3 Slot Size."""
    deck = load_deck("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]
    bounding_box = slots[0]["boundingBox"]
    return Point(
        x=bounding_box["xDimension"],
        y=bounding_box["yDimension"],
        z=bounding_box["zDimension"],
    )


def get_default_tip_length(volume: int) -> float:
    """Get default tip length for specified volume of tip."""
    return TIP_LENGTH_LOOKUP[volume] - TIP_LENGTH_OVERLAP


def get_slot_bottom_left_position_ot3(slot: int) -> Point:
    """Get slot bottom-left position.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    deck = load_deck("ot3_standard", version=3)
    slots = deck["locations"]["orderedSlots"]

    # Assume that the OT-3 deck definition has the same number of slots, and in the same order,
    # as the OT-2.
    # TODO(mm, 2023-05-22): This assumption will break down when the OT-3 has staging area slots.
    # https://opentrons.atlassian.net/browse/RLAB-345
    s = slots[slot - 1]

    return Point(*s["position"])


def get_slot_top_left_position_ot3(slot: int) -> Point:
    """Get slot top-left position.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    bottom_left = get_slot_bottom_left_position_ot3(slot)
    slot_size = get_slot_size()
    return bottom_left + Point(y=slot_size.y)


def get_theoretical_a1_position(slot: int, labware: str) -> Point:
    """Get the theoretical A1 position of a labware in a slot.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    labware_def = load_labware(loadname=labware, version=1)
    dims = labware_def["dimensions"]
    well_a1 = labware_def["wells"]["A1"]
    a1_pos = Point(x=well_a1["x"], y=well_a1["y"], z=dims["zDimension"])
    slot_pos = get_slot_bottom_left_position_ot3(slot)
    y_shift_from_clips = (get_slot_size().y - dims["yDimension"]) * 0.5
    return slot_pos + a1_pos + Point(y=y_shift_from_clips)


def get_slot_calibration_square_position_ot3(slot: int) -> Point:
    """Get slot calibration block position.

    Params:
        slot: The OT-3 slot, specified as an OT-2-style slot number.
            For example, specify 5 to get slot C2.
    """
    slot_top_left = get_slot_top_left_position_ot3(slot)
    calib_sq_offset = CALIBRATION_SQUARE_EVT.top_left_offset
    return slot_top_left + calib_sq_offset


def get_pipette_serial_ot3(pipette: Union[PipetteOT2, PipetteOT3]) -> str:
    """Get pipette serial number."""
    model = pipette.model
    volume = model.split("_")[0].replace("p", "")
    # volume = "1K" if volume == "1000" else volume
    if volume == "1000":
        volume = "1K"
    elif volume == "200":
        volume = "2H"
    channels = "S" if "single" in model else "M"
    if "96" in model:
        channels = "H"
    version = model.split("v")[-1].strip().replace(".", "")
    assert pipette.pipette_id, f"no pipette_id found for pipette: {pipette}"
    if "P" in pipette.pipette_id:
        id = pipette.pipette_id[7:]  # P1KSV33yyyymmddAxx
    else:
        id = pipette.pipette_id
    return f"P{volume}{channels}V{version}{id}"


def get_robot_serial_ot3(api: Union[OT3API, SyncHardwareAPI]) -> str:
    """Get robot serial number."""
    if api.is_simulator:
        return "FLXA1000000000000"
    robot_id = cast(OT3Controller, api._backend).eeprom_data.serial_number
    if not robot_id:
        robot_id = ""
    return robot_id


def clear_pipette_ul_per_mm(api: OT3API, mount: OT3Mount) -> None:
    """Clear pipette ul-per-mm."""

    def _ul_per_mm_of_shaft_diameter(diameter: float) -> float:
        return pi * pow(diameter / 2, 2)

    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip
    if "p50" in pip.model.lower():
        pip_nominal_ul_per_mm = _ul_per_mm_of_shaft_diameter(1)
    elif "p1000" in pip.model.lower():
        pip_nominal_ul_per_mm = _ul_per_mm_of_shaft_diameter(4.5)
    elif "p200" in pip.model.lower():
        pip_nominal_ul_per_mm = _ul_per_mm_of_shaft_diameter(2)
    else:
        raise RuntimeError(f"unexpected pipette model: {pip.model}")
    # 10000 is an arbitrarily large volume that none of our pipettes can reach
    # so, it is guaranteed that all test volumes will be less than this
    ul_per_mm = [
        (
            0,
            0.0,
            pip_nominal_ul_per_mm,
        ),
        (
            10000,
            0.0,
            pip_nominal_ul_per_mm,
        ),
    ]
    pip._active_tip_settings.aspirate.default["1"] = ul_per_mm  # type: ignore[assignment]
    pip._active_tip_settings.dispense.default["1"] = ul_per_mm  # type: ignore[assignment]
    pip.ul_per_mm.cache_clear()
    assert pip.ul_per_mm(1, "aspirate") == pip_nominal_ul_per_mm
    assert pip.ul_per_mm(pip.working_volume, "aspirate") == pip_nominal_ul_per_mm
    assert pip.ul_per_mm(1, "dispense") == pip_nominal_ul_per_mm
    assert pip.ul_per_mm(pip.working_volume, "dispense") == pip_nominal_ul_per_mm


class DirectPropId(Enum):
    """The hardware-testing equivalent of a unique property id for a property."""

    INVALID = 0xFF
    FORMAT_VERSION = 1
    SERIAL_NUMBER = 2
    SKU = 3


DIRECT_PROP_ID_TYPES = {
    DirectPropId.FORMAT_VERSION: PropType.BYTE,
    DirectPropId.SERIAL_NUMBER: PropType.STR,
    DirectPropId.SKU: PropType.STR,
}


def _generate_packet(prop_id: DirectPropId, value: Any) -> Optional[bytes]:
    data = _encode_data(prop_id, value)
    if data and len(data) <= MAX_DATA_LEN:
        return struct.pack("!BB", prop_id.value, len(data)) + data
    return None


def _encode_data(prop_id: DirectPropId, value: Any) -> Optional[bytes]:
    if prop_id == DirectPropId.INVALID:
        return None
    encoded_data: bytes = b""
    try:
        prop_id = DirectPropId(prop_id)
        data_type = DIRECT_PROP_ID_TYPES[prop_id]
        if data_type == PropType.BYTE:
            encoded_data = struct.pack("!B", value)
        elif data_type == PropType.CHAR:
            encoded_data = struct.pack("!B", ord(value))
        elif data_type == PropType.SHORT:
            encoded_data = struct.pack("!h", value)
        elif data_type == PropType.INT:
            encoded_data = struct.pack("!i", value)
        elif data_type == PropType.STR:
            encoded_data = f"{value}".encode("utf-8")
        elif data_type == PropType.BIN:
            encoded_data = bytes(value)
        return encoded_data
    except (ValueError, TypeError, struct.error):
        return None


@dataclass
class DirectEEPROMData:
    """Hardware testing equivalent of dataclass that represents the serialized data from the eeprom."""

    format_version: int = FORMAT_VERSION
    serial_number: Optional[str] = None
    machine_type: Optional[str] = None
    machine_version: Optional[str] = None
    programmed_date: Optional[datetime] = None
    unit_number: Optional[int] = None
    sku: Optional[str] = None

    def to_set(self) -> set[tuple[DirectPropId, str | int]]:
        """Hardware testing equivalent of an eeprom utility that returns a set of expected data values paired with a property id."""
        eeprom_set: set[tuple[DirectPropId, str | int]] = set()
        eeprom_set.add((DirectPropId.FORMAT_VERSION, self.format_version))
        if self.serial_number:
            eeprom_set.add((DirectPropId.SERIAL_NUMBER, self.serial_number))
        if self.sku:
            eeprom_set.add((DirectPropId.SKU, self.sku))
        return eeprom_set


def direct_property_write(
    api: OT3API, properties: set[tuple[DirectPropId, str | int]]
) -> set[DirectPropId]:
    """Hardware testing equivalent of the eeprom property write. Write the given properties to the eeprom, returning a set of the successful ones."""
    written_props: set[DirectPropId] = set()
    # sort the properties so they are written in ascending order
    properties = set(sorted(properties, key=lambda prop: prop[0].value))
    data: bytes = b""
    for prop_id, value in properties:
        packet = _generate_packet(prop_id, value)
        if packet:
            written_props.add(prop_id)
            data += packet
    if data:
        try:
            api._backend.eeprom_driver._gpio.activate_eeprom_wp()  # type: ignore
            api._backend.eeprom_driver._write(data)  # type: ignore
        except RuntimeError:
            # something went wrong, clear written props
            written_props = set()
        finally:
            api._backend.eeprom_driver._gpio.deactivate_eeprom_wp()  # type: ignore
    return written_props


def direct_eeprom_data(data: EEPROMData) -> DirectEEPROMData:
    """Returns the hardware testing equivalent of the eeprom data return."""
    return DirectEEPROMData(
        format_version=data.format_version,
        serial_number=data.serial_number,
        machine_type=data.machine_type,
        programmed_date=data.programmed_date,
        unit_number=data.unit_number,
        sku=getattr(data, "sku", None),
    )


def get_user_answer(ctx: ProtocolContext, api: SyncHardwareAPI, prompt: str) -> bool:
    """Have the user answer a yes/no question."""
    OT3API._scan_barcode = _scan_barcode  # type: ignore[attr-defined]
    for i in range(3):
        ctx.pause(
            f"将扫描仪对准“是”或“否”： {prompt}"
            if LOCALIZE
            else f"Point Scanner at Yes or No: {prompt}"
        )
        result = api._scan_barcode()
        if result:
            return "yes" in result.lower()
        ctx.pause("扫描失败，请重试" if LOCALIZE else "Failed to scan, try again.")

    raise RuntimeError("Error scanning barcode.")


def get_input_number(
    ctx: ProtocolContext, api: SyncHardwareAPI, prompt: str, default: Union[int, float]
) -> Union[int, float]:
    """Have the user input a value."""
    OT3API._scan_barcode = _scan_barcode  # type: ignore[attr-defined]

    def _is_float(s: str) -> bool:
        try:
            float(s)
            return True
        except ValueError:
            return False

    def _is_int(s: str) -> bool:
        try:
            int(s)
            return True
        except ValueError:
            return False

    for i in range(3):
        ctx.pause(
            f"将扫描仪对准数字：{prompt}" if LOCALIZE else f"Point Scanner at number: {prompt}"
        )
        result = api._scan_barcode()
        if result:
            if _is_int(result):
                return int(result)
            elif _is_float(result):
                return float(result)
            ctx.pause(
                f"{result} 不是数字，请重试"
                if LOCALIZE
                else f"{result} is not a number, try again."
            )
        else:
            ctx.pause("扫描失败，请重试" if LOCALIZE else "Failed to scan, try again.")
    return default
