"""Gravimetric QC protocol."""

from typing import List, Dict, Tuple
from dataclasses import dataclass
import os
import sys
from time import time
import importlib
import copy
import json

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Liquid,
    LiquidClass,
    OFF_DECK,
)
from opentrons import version
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    Coordinate,
    PositionReference,
)
from opentrons.protocol_api.core.engine import (
    transfer_components_executor as tx_comps_executor,
    pipette_movement_conflict,
)
from opentrons.config import infer_config_base_dir, IS_ROBOT
from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEED_DISCONTINUITY
from opentrons.hardware_control.types import OT3AxisKind, OT3Mount, Axis
from opentrons.types import Point, DeckSlotName, Location
from opentrons.protocol_api._nozzle_layout import NozzleLayout
from opentrons.protocols.advanced_control.transfers import common as tx_ctl_lib

metadata = {"protocolName": "Gravimetric QC"}
requirements = {"robotType": "Flex", "apiLevel": "2.25"}

SCALE_SECONDS_TO_TRUE_STABILIZE = 60 * 3


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

from hardware_testing.data import create_run_id, get_git_description  # noqa: E402
from hardware_testing.data.ui import (  # noqa: F401, E402
    set_output_file,
    print_info,
    print_title,
    print_header,
    print_warning,
    print_error,
)
from hardware_testing.gravimetric.measurement import (  # noqa: E402
    create_measurement_tag,
    record_measurement_data,
    calculate_change_in_volume,
    MeasurementType,
    MeasurementData,
    SupportedLiquid,
)
from hardware_testing.gravimetric.measurement.scale import Scale  # noqa: E402
from hardware_testing.gravimetric.measurement.environment import (  # noqa: E402
    get_min_reading,
    get_max_reading,
)

from hardware_testing.gravimetric.measurement.record import (  # noqa: E402
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.drivers import asair_sensor as AsairDriver  # noqa: E402
from hardware_testing.gravimetric import helpers, report, tips, config  # noqa: E402
from hardware_testing.opentrons_api.helpers_ot3 import (  # noqa: E402
    clear_pipette_ul_per_mm,
)  # noqa: E402
from hardware_testing.gravimetric.tips import MULTI_CHANNEL_TEST_ORDER  # noqa: E402

_MEASUREMENTS: List[Tuple[str, MeasurementData]] = list()

fast_simulate_measurement = MeasurementData(
    grams_average=10,
    grams_cv=1.0,
    grams_min=9.9,
    samples_start_time=10,
    grams_max=10.1,
    samples_duration=10,
    samples_count=10,
    celsius_pipette=25,
    humidity_pipette=50,
    celsius_air=25,
    humidity_air=50,
    pascals_air=1000,
    celsius_liquid=25,
)


@dataclass
class FixtureSettings:
    """Dataclass to hold all the options for a gravimetric script."""

    ctx: ProtocolContext
    name: str
    increment: bool
    run_id: str
    mount: str
    pipette: InstrumentContext
    pipette_volume: int
    pipette_channels: int
    tip_sizes: List[int]
    trials: int
    channels: list[int]
    return_tip: bool
    touch_tip: bool
    liquid_name: str
    liquid: Liquid
    liquid_class: LiquidClass
    tips: Dict[int, List[str]]
    liquid_source: Well
    volumes: Dict[int, List[float]]
    extra_volumes: Dict[int, List[float]]
    scale: Scale
    recorder: GravimetricRecorder
    env_sensor: AsairDriver.AsairSensorBase
    robot_serial: str
    scale_serial: str
    env_serial: str
    pipette_tag: str
    test_report: report.CSVReport
    scale_delay: int
    blank_trials: int
    submerge_depth: float
    retracted_offset: float
    isolate_volumes: bool
    extra: bool
    labware_on_scale: str
    slot_scale: str
    fast_simulate: bool
    retract_discontinuity: float
    disc_ver_cuttoff: int
    lld_every_tip: bool

    @classmethod
    def build(cls, ctx: ProtocolContext) -> "FixtureSettings":
        """Parse the CSV file and build the fixture settings."""

        def lookup_key(key: str, csv: List[List[str]]) -> List[str]:
            for line in csv:
                if line[0] == key:
                    return [e for e in line[1:] if e != ""]
            raise ValueError(f"{key} is not defined in the csv params.")

        csv_params = (
            ctx.params.qc_test_profile.parse_as_csv()  # type: ignore [attr-defined]
        )
        name = lookup_key("name", csv_params)[0]
        if ctx.is_simulating():
            name = f"{name}-simulate"
        increment = bool(lookup_key("increment", csv_params)[0] == "TRUE")
        mount = lookup_key("mount", csv_params)[0]
        pipette_volume = int(lookup_key("pipette", csv_params)[0])
        pipette_channels = int(lookup_key("pipette", csv_params)[1])
        if pipette_channels == 8 and not increment:
            channels = MULTI_CHANNEL_TEST_ORDER
        else:
            channels = [0]
        tip_sizes = [int(tip) for tip in lookup_key("tips", csv_params)]
        trials = int(lookup_key("trials", csv_params)[0])
        return_tip = bool(lookup_key("return_tip", csv_params)[0] == "TRUE")
        touch_tip = bool(lookup_key("touch_tip", csv_params)[0] == "TRUE")
        liquid_name = lookup_key("liquid", csv_params)[0]
        liquid_desc = lookup_key("liquid", csv_params)[1]
        liquid_col = lookup_key("liquid", csv_params)[2]
        liquid_vol_estimate = float(lookup_key("liquid", csv_params)[3])
        tipracks_20ul = [slot for slot in lookup_key("tipracks_20ul", csv_params)]
        tipracks_50ul = [slot for slot in lookup_key("tipracks_50ul", csv_params)]
        tipracks_200ul = [slot for slot in lookup_key("tipracks_200ul", csv_params)]
        tipracks_1000ul = [slot for slot in lookup_key("tipracks_1000ul", csv_params)]
        labware_on_scale = lookup_key("labware_on_scale", csv_params)[0]
        labware_on_scale_well_name = lookup_key("labware_on_scale", csv_params)[1]
        slot_scale = lookup_key("slot_scale", csv_params)[0]
        scale_delay = int(lookup_key("scale_delay", csv_params)[0])
        blank_trials = int(lookup_key("blank_trials", csv_params)[0])
        submerge_depth = float(lookup_key("submerge_depth", csv_params)[0])
        retracted_offset = 5.0
        # TODO maybe make this a CSV option
        # retracted_offset = float(lookup_key("retracted_offset", csv_params)[0])
        volumes_to_test_20ul = [
            float(volume) for volume in lookup_key("volumes_to_test_20ul", csv_params)
        ]
        volumes_to_test_50ul = [
            float(volume) for volume in lookup_key("volumes_to_test_50ul", csv_params)
        ]
        volumes_to_test_200ul = [
            float(volume) for volume in lookup_key("volumes_to_test_200ul", csv_params)
        ]
        volumes_to_test_1000ul = [
            float(volume) for volume in lookup_key("volumes_to_test_1000ul", csv_params)
        ]
        extra_volumes_to_test_20ul = [
            float(volume)
            for volume in lookup_key("extra_volumes_to_test_20ul", csv_params)
        ]
        extra_volumes_to_test_50ul = [
            float(volume)
            for volume in lookup_key("extra_volumes_to_test_50ul", csv_params)
        ]
        extra_volumes_to_test_200ul = [
            float(volume)
            for volume in lookup_key("extra_volumes_to_test_200ul", csv_params)
        ]
        extra_volumes_to_test_1000ul = [
            float(volume)
            for volume in lookup_key("extra_volumes_to_test_1000ul", csv_params)
        ]
        extra = bool(lookup_key("is_extra", csv_params)[0] == "TRUE")

        retract_discontinuity = float(
            lookup_key("retract_discontinuity", csv_params)[0]
        )
        disc_ver_cuttoff = int(lookup_key("disc_ver_cuttoff", csv_params)[0])
        gantry_speed = int(lookup_key("gantry_speed", csv_params)[0])
        lld_every_tip = bool(lookup_key("lld_every_tip", csv_params)[0] == "TRUE")
        volumes = {
            20: volumes_to_test_20ul,
            50: volumes_to_test_50ul,
            200: volumes_to_test_200ul,
            1000: volumes_to_test_1000ul,
        }
        volumes_flat = (
            volumes_to_test_20ul
            + volumes_to_test_50ul
            + volumes_to_test_200ul
            + volumes_to_test_1000ul
            + extra_volumes_to_test_20ul
            + extra_volumes_to_test_50ul
            + extra_volumes_to_test_200ul
            + extra_volumes_to_test_1000ul
        )

        extra_volumes = {
            20: extra_volumes_to_test_20ul,
            50: extra_volumes_to_test_50ul,
            200: extra_volumes_to_test_200ul,
            1000: extra_volumes_to_test_1000ul,
        }

        tips = {
            20: tipracks_20ul,
            50: tipracks_50ul,
            200: tipracks_200ul,
            1000: tipracks_1000ul,
        }

        source_well = ctx.load_labware(labware_on_scale, slot_scale)[
            labware_on_scale_well_name
        ]
        liquid_class = ctx.get_liquid_class(liquid_name)
        liquid = ctx.define_liquid(liquid_name, liquid_desc, liquid_col)
        source_well.load_liquid(liquid, liquid_vol_estimate)

        pipette = ctx.load_instrument(
            f"flex_{pipette_channels}channel_{pipette_volume}", mount
        )
        pipette.default_speed = gantry_speed
        simulating = ctx.is_simulating()
        pipette_movement_conflict.check_safe_for_pipette_movement = (
            helpers._override_check_safe_for_pipette_movement
        )
        if simulating:
            pipette_tag = "pipette"
        else:
            pipette_tag = helpers._get_tag_from_pipette(pipette, increment, False)
        run_id = create_run_id()
        fast_simulate = IS_ROBOT and simulating

        test_report = report.create_csv_test_report(
            volumes=volumes_flat,
            pipette_channels=pipette_channels,
            increment=increment,
            trials=trials,
            name=name,
            run_id=run_id,
            dont_write_to_disk=fast_simulate,
        )
        os.makedirs(f"{test_report.parent}", exist_ok=True)
        set_output_file(f"{test_report.parent}/run_output.txt")

        print_info(f"volumes flat {volumes_flat}")
        print_info(f"channels {pipette_channels}")
        print_info(f"increment {increment}")
        print_info(f"trials {trials}")
        print_info(f"name {name}")

        print_info(str(importlib.util.find_spec("hardware_testing")))
        print_info(f"Running on bot {IS_ROBOT}")
        print_info(f"Fast simulate {fast_simulate}")
        scale = Scale.build(simulating)
        recorder = GravimetricRecorder(
            GravimetricRecorderConfig(
                test_name=name,
                run_id=run_id,
                tag=pipette_tag,
                start_time=time(),
                duration=0,
                frequency=1000 if simulating else 5,
                stable=False,
            ),
            scale,
            simulate=simulating,
            start_graph=False,
        )
        scale_serial = scale.read_serial_number()
        if simulating:
            recorder.set_simulation_mass(10)
        recorder.record(in_thread=True)
        env_sensor = AsairDriver.BuildAsairSensor(simulating)
        env_serial = env_sensor.get_serial()
        ot3api = ctx._core.get_hardware()
        robot_serial = str(ot3api.get_serial_number())
        fw_version = ot3api.fw_version
        git_description = get_git_description()
        operator_name = ctx.params.operator  # type: ignore [attr-defined]
        robot_name = "Simulating"
        if IS_ROBOT:
            try:
                with open("/data/ODD/discovery.json", "r") as disc:
                    robot_name = json.load(disc)["robots"][0]["name"]
            except Exception:
                robot_name = "Error Reading Robot Name"

        test_report.set_tag(pipette_tag)
        test_report.set_operator(operator_name)
        test_report.set_version(git_description)
        test_report.set_firmware(fw_version)
        t50_str = f"{ctx.params.cavity_50}"  # type: ignore [attr-defined]
        if ctx.params.cavity_50 != "Unused":  # type: ignore [attr-defined]
            t50_str += f"{ctx.params.tip_batch_50}"  # type: ignore [attr-defined]
        t200_str = f"{ctx.params.cavity_200}"  # type: ignore [attr-defined]
        if ctx.params.cavity_200 != "Unused":  # type: ignore [attr-defined]
            t50_str += f"{ctx.params.tip_batch_200}"  # type: ignore [attr-defined]
        t1000_str = f"{ctx.params.cavity_1000}"  # type: ignore [attr-defined]
        if ctx.params.cavity_1000 != "Unused":  # type: ignore [attr-defined]
            t50_str += f"{ctx.params.tip_batch_1000}"  # type: ignore [attr-defined]
        report.store_serial_numbers(
            test_report,
            robot=robot_name,
            pipette=pipette_tag,
            tips={
                "tips_50ul": t50_str,
                "tips_200ul": t200_str,
                "tips_1000ul": t1000_str,
            },
            scale=recorder.serial_number,
            environment=env_serial,
            liquid=liquid_name,
        )
        # todo fix set serial to take robot name and serial separate
        # do this after the set serial to overwrite where the name.
        test_report.set_robot_id(robot_serial)
        ctx.load_trash_bin("A3")
        return cls(
            ctx=ctx,
            name=name,
            increment=increment,
            run_id=run_id,
            mount=mount,
            pipette=pipette,
            pipette_volume=pipette_volume,
            pipette_channels=pipette_channels,
            tip_sizes=tip_sizes,
            trials=trials,
            channels=channels,
            return_tip=return_tip,
            touch_tip=touch_tip,
            liquid_name=liquid_name,
            liquid=liquid,
            liquid_class=liquid_class,
            tips=tips,
            liquid_source=source_well,
            volumes=volumes,
            extra_volumes=extra_volumes,
            scale=scale,
            recorder=recorder,
            env_sensor=env_sensor,
            robot_serial=robot_serial,
            scale_serial=scale_serial,
            env_serial=env_serial,
            pipette_tag=pipette_tag,
            test_report=test_report,
            scale_delay=scale_delay,
            blank_trials=blank_trials,
            submerge_depth=submerge_depth,
            retracted_offset=retracted_offset,
            isolate_volumes=False,
            extra=extra,
            labware_on_scale=labware_on_scale,
            slot_scale=slot_scale,
            fast_simulate=fast_simulate,
            retract_discontinuity=retract_discontinuity,
            disc_ver_cuttoff=disc_ver_cuttoff,
            lld_every_tip=lld_every_tip,
        )

    def validate_settings(self) -> bool:
        """Make sure all the settings are valid."""
        # TODO validate settings
        # - Enough tips to handle all the volumes/trials
        # - Tips fit on the given pipette

        return True


def _store_config_as_old_style(fixture_settings: FixtureSettings) -> None:
    old_style = config.GravimetricConfig(
        name=fixture_settings.name,
        pipette_volume=fixture_settings.pipette_volume,
        pipette_channels=fixture_settings.pipette_channels,
        pipette_mount=fixture_settings.mount,
        tip_volume=fixture_settings.tip_sizes[0],
        trials=fixture_settings.trials,
        slots_tiprack=[
            DeckSlotName.from_primitive(slot).as_int()
            for slot in fixture_settings.tips[fixture_settings.tip_sizes[0]]
        ],
        increment=fixture_settings.increment,
        return_tip=fixture_settings.return_tip,
        mix=False,
        user_volumes=False,
        kind=config.ConfigType.gravimetric,
        extra=fixture_settings.extra,
        jog=False,
        same_tip=False,
        ignore_fail=True,
        mode="",
        labware_on_scale=fixture_settings.labware_on_scale,
        slot_scale=DeckSlotName.from_primitive(fixture_settings.slot_scale).as_int(),
        blank=True,
        gantry_speed=config.GANTRY_MAX_SPEED,
        scale_delay=fixture_settings.scale_delay,
        isolate_channels=[],
        isolate_volumes=[],
        liquid=fixture_settings.liquid_name,
    )
    report.store_config_gm(fixture_settings.test_report, old_style)


def _get_tips_for_test_single_multi(
    fixture_settings: FixtureSettings, tip: int, channel: int
) -> List[Well]:
    wells = []
    loaded_labwares = fixture_settings.ctx.loaded_labwares
    used_slots = [
        str(DeckSlotName.from_primitive(slot).to_ot3_equivalent())
        for slot in loaded_labwares.keys()
    ]
    partially_used = [slot for slot in fixture_settings.tips[tip] if slot in used_slots]
    tipracks_lw = [
        fixture_settings.ctx.load_labware(f"opentrons_flex_96_tiprack_{tip}uL", slot)
        for slot in fixture_settings.tips[tip]
        if slot not in partially_used
    ]
    if fixture_settings.pipette_channels == 8:
        if fixture_settings.increment:
            a_row_tips = tips.get_tips_for_all_channels_on_multi(
                fixture_settings.ctx, tip
            )
            return [t for t in a_row_tips if t.has_tip]
        else:
            return tips.get_tips_for_individual_channel_on_multi(
                fixture_settings.ctx, channel, tip, fixture_settings.pipette_volume
            )

    wells += tips.get_unused_tips(fixture_settings.ctx, tip)
    for rack in tipracks_lw:
        wells += rack.wells()
    return wells


def _get_tips_for_test_96(
    fixture_settings: FixtureSettings, tip: int, blank: bool = False
) -> List[Well]:
    adapter = "opentrons_flex_96_tiprack_adapter"
    loaded_labwares = fixture_settings.ctx.loaded_labwares
    used_slots = [
        str(DeckSlotName.from_primitive(slot).to_ot3_equivalent())
        for slot in loaded_labwares.keys()
    ]
    need_to_swap = [slot for slot in fixture_settings.tips[tip] if slot in used_slots]
    if len(need_to_swap) != 0:
        fixture_settings.pipette._retract()
        fixture_settings.ctx.pause(f"Replace slots {need_to_swap} with {tip}ul tips")
        for slot in need_to_swap:
            old_adapter = loaded_labwares[
                DeckSlotName.from_primitive(slot).as_int()
            ].parent
            fixture_settings.ctx._core.move_labware(
                loaded_labwares[DeckSlotName.from_primitive(slot).as_int()]._core,
                new_location=OFF_DECK,
                use_gripper=False,
                pause_for_manual_move=False,
                pick_up_offset=None,
                drop_offset=None,
            )
            fixture_settings.ctx._core.move_labware(
                old_adapter._core,  # type: ignore [union-attr, arg-type]
                new_location=OFF_DECK,
                use_gripper=False,
                pause_for_manual_move=False,
                pick_up_offset=None,
                drop_offset=None,
            )
    if blank:
        tipracks_lw = [
            fixture_settings.ctx.load_labware(
                f"opentrons_flex_96_tiprack_{tip}uL",
                fixture_settings.tips[tip][0],
                adapter=adapter,
            )
        ]

    else:
        tipracks_lw = [
            fixture_settings.ctx.load_labware(
                f"opentrons_flex_96_tiprack_{tip}uL", slot, adapter=adapter
            )
            for slot in fixture_settings.tips[tip]
        ]
    wells = []
    for rack in tipracks_lw:
        wells += [rack.wells()[0]]
    return wells


def _get_tips_for_test(
    fixture_settings: FixtureSettings, tip: int, blank: bool = False, channel: int = 0
) -> List[Well]:
    if fixture_settings.pipette_channels == 96:
        return _get_tips_for_test_96(fixture_settings, tip, blank)
    return _get_tips_for_test_single_multi(fixture_settings, tip, channel)


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_csv_file("QC test profile", "qc_test_profile")

    parameters.add_str(
        display_name="Operator",
        variable_name="operator",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "Haiyan",
                "Jiqing",
                "Yanglin",
                "Yangyin",
                "Hejie",
                "Zhihua",
                "Huanjun",
                "Chengkun",
                "Xiongjian",
                "Zhougui",
                "Zhiwei",
                "TE",
            ]
        ],
        description="Operator for this QC run",
    )

    parameters.add_str(
        display_name="Tip Cavity for 50ul tips",
        variable_name="cavity_50",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
            ]
        ],
        description="Set the target temperature for the pre-heat",
    )

    parameters.add_int(
        display_name="Tip Batch for 50ul tips",
        variable_name="tip_batch_50",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )

    parameters.add_str(
        display_name="Tip Cavity for 200ul tips",
        variable_name="cavity_200",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
            ]
        ],
        description="Set the target temperature for the pre-heat",
    )

    parameters.add_int(
        display_name="Tip Batch for 200ul tips",
        variable_name="tip_batch_200",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )

    parameters.add_str(
        display_name="Tip Cavity for 1000ul tips",
        variable_name="cavity_1000",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
            ]
        ],
        description="Set the target temperature for the pre-heat",
    )

    parameters.add_int(
        display_name="Tip Batch for 1000ul tips",
        variable_name="tip_batch_1000",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )


def remove_tip(fixture_settings: FixtureSettings) -> None:
    """Either return or drop tip(s)."""
    if fixture_settings.return_tip:
        fixture_settings.pipette.return_tip()
    else:
        fixture_settings.pipette.drop_tip()


def _get_offset_for_channel(
    fixture_settings: FixtureSettings, channel: int, submerge_depth: float = 0
) -> Coordinate:
    offset = Coordinate(x=0, y=0, z=submerge_depth)
    if fixture_settings.pipette_channels == 8 and not fixture_settings.increment:
        if channel in [0, 1, 2, 3]:
            offset.y = channel * 9.0
        else:
            offset.y = (channel - 7) * 9.0
    return offset


def pick_up_tip_for_channel(
    fixture_settings: FixtureSettings, tip: Well, channel: int
) -> None:
    """Do channel offset if needed."""
    offset = _get_offset_for_channel(fixture_settings, channel)
    point_offset = Point(x=offset.x, y=offset.y, z=offset.z)
    print_info(
        f"Picking up tip {tip.well_name} of rack {tip.parent.parent} with channel {channel} and offset {offset}"
    )
    fixture_settings.pipette.pick_up_tip(tip.top().move(point_offset))
    if fixture_settings.increment and not fixture_settings.ctx.is_simulating():
        print_info("clearing pipette ul-per-mm table to be linear")
        clear_pipette_ul_per_mm(
            fixture_settings.ctx._core.get_hardware()._obj_to_adapt,  # type: ignore[arg-type]
            OT3Mount.LEFT if fixture_settings.mount == "left" else OT3Mount.RIGHT,
        )


def _update_environment_first_last_min_max(test_report: report.CSVReport) -> None:
    # update this regularly, because the script may exit early
    env_data_list = [m.environment for tag, m in _MEASUREMENTS]
    first_data = env_data_list[0]
    last_data = env_data_list[-1]
    min_data = get_min_reading(env_data_list)
    max_data = get_max_reading(env_data_list)
    report.store_environment(
        test_report, report.EnvironmentReportState.FIRST, first_data
    )
    report.store_environment(test_report, report.EnvironmentReportState.LAST, last_data)
    report.store_environment(test_report, report.EnvironmentReportState.MIN, min_data)
    report.store_environment(test_report, report.EnvironmentReportState.MAX, max_data)


def retract_and_wait(
    fixture_settings: FixtureSettings,
    mode: MeasurementType,
    tip: int,
    volume: float,
    trial: int,
    channel: int = 0,  # TODO hookup
    blank: bool = False,
) -> MeasurementData:
    """Retract away from the scale and record the weight."""
    if fixture_settings.fast_simulate:
        # just simulate the physical movement and return to speed up the analysis
        fixture_settings.pipette._retract()
        return_val = copy.deepcopy(fast_simulate_measurement)
        if not blank:
            if mode == MeasurementType.ASPIRATE:
                return_val.grams_average += volume * -0.001
            elif mode == MeasurementType.DISPENSE:
                return_val.grams_average += volume * 0.001
        return return_val

    m_tag = create_measurement_tag(mode, None if blank else volume, channel, trial)
    fixture_settings.pipette._retract()
    if fixture_settings.recorder and not blank and fixture_settings.ctx.is_simulating():
        if mode == MeasurementType.ASPIRATE:
            fixture_settings.recorder.add_simulation_mass(volume * -0.001)
        elif mode == MeasurementType.DISPENSE:
            fixture_settings.recorder.add_simulation_mass(volume * 0.001)
    m_data = record_measurement_data(
        fixture_settings.ctx,
        m_tag,
        fixture_settings.recorder,
        fixture_settings.mount,
        True,  # Stable is always true
        fixture_settings.env_sensor,
        False,  # Shorten is always false
        fixture_settings.scale_delay,
    )
    report.store_measurement(fixture_settings.test_report, m_tag, m_data)
    _MEASUREMENTS.append(
        (
            m_tag,
            m_data,
        )
    )
    _update_environment_first_last_min_max(fixture_settings.test_report)
    return m_data


def _should_alter_discontinuity(fixture_settings: FixtureSettings) -> bool:
    if not fixture_settings.ctx.is_simulating():
        pip_version = int(fixture_settings.pipette_tag[5:7])
        return pip_version <= fixture_settings.disc_ver_cuttoff
    return False


def override_retract_discontinuity(fixture_settings: FixtureSettings) -> None:
    """Update the Z discontinuity to a desired Setting."""
    if _should_alter_discontinuity(fixture_settings):
        hw_api = fixture_settings.ctx._core.get_hardware()
        if fixture_settings.pipette_channels == 96:
            hw_api.config.motion_settings.max_speed_discontinuity.high_throughput[
                OT3AxisKind.Z
            ] = fixture_settings.retract_discontinuity
        else:
            hw_api.config.motion_settings.max_speed_discontinuity.low_throughput[
                OT3AxisKind.Z
            ] = fixture_settings.retract_discontinuity


def reset_retract_discontinuity(fixture_settings: FixtureSettings) -> None:
    """Reset the Z discontinuity to default."""
    if _should_alter_discontinuity(fixture_settings):
        hw_api = fixture_settings.ctx._core.get_hardware()
        if fixture_settings.pipette_channels == 96:
            hw_api.config.motion_settings.max_speed_discontinuity.high_throughput[
                OT3AxisKind.Z
            ] = DEFAULT_MAX_SPEED_DISCONTINUITY.high_throughput[OT3AxisKind.Z]
        else:
            hw_api.config.motion_settings.max_speed_discontinuity.low_throughput[
                OT3AxisKind.Z
            ] = DEFAULT_MAX_SPEED_DISCONTINUITY.low_throughput[OT3AxisKind.Z]


def aspirate_with_liquid_class(
    fixture_settings: FixtureSettings,
    tip: int,
    volume: float,
    trial: int,
    channel: int,
    transfer_properties: TransferProperties,
) -> List[tx_comps_executor.LiquidAndAirGapPair]:
    """Aspirate with liquid class."""
    print_info(f"transfer props {transfer_properties}")
    fixture_settings.recorder.set_sample_tag(
        create_measurement_tag("aspirate", volume, channel, trial)
    )
    override_retract_discontinuity(fixture_settings)
    contents = fixture_settings.pipette._core.aspirate_liquid_class(  # type: ignore [attr-defined]
        volume=volume,
        source=(
            fixture_settings.liquid_source.top(),
            fixture_settings.liquid_source._core,
        ),
        transfer_properties=transfer_properties,
        transfer_type=tx_comps_executor.TransferType.ONE_TO_ONE,
        tip_contents=[
            tx_comps_executor.LiquidAndAirGapPair(
                liquid=0,
                air_gap=0,
            )
        ],
        volume_for_pipette_mode_configuration=None,
    )
    reset_retract_discontinuity(fixture_settings)
    return contents


def dispense_with_liquid_class(
    fixture_settings: FixtureSettings,
    tip: int,
    volume: float,
    trial: int,
    channel: int,
    transfer_properties: TransferProperties,
    contents: List[tx_comps_executor.LiquidAndAirGapPair],
    final_air_gap: bool = True,
) -> None:
    """Dispense with Liquid Class."""
    fixture_settings.recorder.set_sample_tag(
        create_measurement_tag("dispense", volume, channel, trial)
    )
    override_retract_discontinuity(fixture_settings)
    fixture_settings.pipette._core.dispense_liquid_class(  # type: ignore [attr-defined]
        volume=volume,
        dest=(
            fixture_settings.liquid_source.top(),
            fixture_settings.liquid_source._core,
        ),
        source=None,
        transfer_properties=transfer_properties,
        transfer_type=tx_comps_executor.TransferType.ONE_TO_ONE,
        tip_contents=contents,
        add_final_air_gap=final_air_gap,
        trash_location=fixture_settings.pipette.trash_container,
    )
    reset_retract_discontinuity(fixture_settings)


def run_blank_test(
    fixture_settings: FixtureSettings,
    tip: int,
    volume: float,
    trial: int,
    tip_well: Well,
) -> List[MeasurementData]:
    """Run a "blank" trial to measure the evaporation."""
    channel = 0
    print_info(f"Running blank trial {trial} volume {volume}")
    fixture_settings.pipette.configure_for_volume(volume)
    fixture_settings.pipette.prepare_to_aspirate()
    # this is the next tip we're gonna use we just need the uri
    tiprack_uri = tip_well.parent.uri
    transfer_properties = fixture_settings.liquid_class.get_for(
        fixture_settings.pipette.name, tip_rack=tiprack_uri
    )
    offset = _get_offset_for_channel(fixture_settings, channel, 10)
    transfer_properties.aspirate.aspirate_position.offset = offset
    transfer_properties.dispense.dispense_position.offset = offset
    transfer_properties.aspirate.aspirate_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )
    transfer_properties.dispense.dispense_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )

    fixture_settings.pipette._core.load_liquid_class(  # type: ignore [attr-defined]
        name=fixture_settings.liquid_class.name,
        transfer_properties=transfer_properties,
        tiprack_uri=tiprack_uri,
    )
    print_info("Pre-aspirate read.")
    pre_aspirate = retract_and_wait(
        fixture_settings,
        MeasurementType.INIT,
        tip,
        volume,
        trial,
        channel=channel,
        blank=True,
    )
    print_info("aspirating")
    contents = aspirate_with_liquid_class(
        fixture_settings,
        tip,
        volume,
        trial,
        channel,
        transfer_properties=transfer_properties,
    )
    print_info("Post aspirate read.")
    post_aspirate = retract_and_wait(
        fixture_settings,
        MeasurementType.ASPIRATE,
        tip,
        volume,
        trial,
        channel=channel,
        blank=True,
    )
    print_info("dispensing.")
    dispense_with_liquid_class(
        fixture_settings,
        tip,
        volume,
        trial,
        channel,
        transfer_properties,
        contents,
        final_air_gap=False,
    )
    print_info("Post dispense read.")
    post_dispense = retract_and_wait(
        fixture_settings,
        MeasurementType.DISPENSE,
        tip,
        volume,
        trial,
        channel=channel,
        blank=True,
    )
    return [pre_aspirate, post_aspirate, post_dispense]


def run_one_test(
    fixture_settings: FixtureSettings,
    tip: int,
    tip_well: Well,
    volume: float,
    trial: int,
    channel: int,
    last_measurement: MeasurementData,
) -> List[MeasurementData]:
    """Run one trial of one test."""
    print_info(f"Running trial {trial} volume {volume} channel {channel} tip {tip}")
    tiprack_uri = tip_well.parent.uri
    transfer_properties = fixture_settings.liquid_class.get_for(
        fixture_settings.pipette.name, tip_rack=tiprack_uri
    )

    submerged_offset = _get_offset_for_channel(
        fixture_settings, channel, fixture_settings.submerge_depth
    )
    retracted_offset = _get_offset_for_channel(
        fixture_settings, channel, fixture_settings.retracted_offset
    )

    # aspirate and dispense submerge start offsets.
    transfer_properties.aspirate.submerge.start_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )
    transfer_properties.dispense.submerge.start_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )
    transfer_properties.aspirate.submerge.start_position.offset = retracted_offset
    transfer_properties.dispense.submerge.start_position.offset = retracted_offset

    # aspirate and dispense offsets
    transfer_properties.aspirate.aspirate_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )
    transfer_properties.dispense.dispense_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )

    transfer_properties.aspirate.aspirate_position.offset = submerged_offset
    transfer_properties.dispense.dispense_position.offset = submerged_offset

    # aspirate and dispense retract end offsets

    transfer_properties.aspirate.retract.end_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )
    transfer_properties.dispense.retract.end_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )
    transfer_properties.aspirate.retract.end_position.offset = retracted_offset
    transfer_properties.dispense.retract.end_position.offset = retracted_offset

    fixture_settings.pipette._core.load_liquid_class(  # type: ignore [attr-defined]
        name=fixture_settings.liquid_class.name,
        transfer_properties=transfer_properties,
        tiprack_uri=tiprack_uri,
    )
    pick_up_tip_for_channel(fixture_settings, tip_well, channel)
    fixture_settings.pipette.configure_for_volume(volume)
    fixture_settings.pipette.prepare_to_aspirate()
    hw_api = fixture_settings.ctx._core.get_hardware()
    hw_mount = OT3Mount.LEFT if fixture_settings.mount == "left" else OT3Mount.RIGHT
    pip_ax = Axis.of_main_tool_actuator(hw_mount)
    estimate_bottom = hw_api.current_position_ot3(hw_mount)[pip_ax]
    encoder_bottom = hw_api.encoder_current_position_ot3(hw_mount)[pip_ax]
    well_top = fixture_settings.liquid_source.top().point
    above_scale = Point(
        well_top.x,
        well_top.y + retracted_offset.y,
        fixture_settings.pipette._get_last_location_by_api_version().point.z,  # type: ignore [union-attr]
    )
    fixture_settings.pipette.move_to(Location(above_scale, None))
    print_info("Pre-aspirate read.")
    pre_aspirate = retract_and_wait(
        fixture_settings, MeasurementType.INIT, tip, volume, trial, channel=channel
    )
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    if fixture_settings.lld_every_tip:
        fixture_settings.pipette.require_liquid_presence(fixture_settings.liquid_source)
    else:
        volume_lost_since_last_trial = calculate_change_in_volume(
            last_measurement, pre_aspirate, liq
        )
        if not fixture_settings.ctx.is_simulating():
            fixture_settings.liquid_source.load_liquid(
                fixture_settings.liquid,
                fixture_settings.liquid_source.current_liquid_volume()  # type: ignore[arg-type]
                - volume_lost_since_last_trial,
            )
    print_info("aspirating")
    contents = aspirate_with_liquid_class(
        fixture_settings, tip, volume, trial, channel, transfer_properties
    )
    print_info("Post aspirate read.")
    post_aspirate = retract_and_wait(
        fixture_settings, MeasurementType.ASPIRATE, tip, volume, trial, channel=channel
    )
    estimate_aspirated = hw_api.current_position_ot3(hw_mount)[pip_ax]
    encoder_aspirated = hw_api.encoder_current_position_ot3(hw_mount)[pip_ax]
    print_info("dispensing.")
    dispense_with_liquid_class(
        fixture_settings, tip, volume, trial, channel, transfer_properties, contents
    )
    print_info("Post dispense read.")
    post_dispense = retract_and_wait(
        fixture_settings, MeasurementType.DISPENSE, tip, volume, trial, channel=channel
    )
    remove_tip(fixture_settings)
    report.store_encoder(
        fixture_settings.test_report,
        volume,
        channel,
        trial,
        estimate_bottom,
        encoder_bottom,
        estimate_aspirated,
        encoder_aspirated,
    )
    return [pre_aspirate, post_aspirate, post_dispense]


def _configure_tip_count(fixture_settings: FixtureSettings, channel: int) -> None:
    if fixture_settings.pipette_channels == 8 and not fixture_settings.increment:
        primary = "A1"
        if channel in [4, 5, 6, 7]:
            primary = "H1"
        fixture_settings.pipette._core.configure_nozzle_layout(
            style=NozzleLayout.SINGLE,
            primary_nozzle=primary,
            front_right_nozzle=primary,
            back_left_nozzle=primary,
        )
        print_info(f"Configuring for single tip with {primary}")


def _run(ctx: ProtocolContext, fixture_settings: FixtureSettings) -> None:
    """Run."""
    first_tip = _get_tips_for_test(
        fixture_settings, fixture_settings.tip_sizes[0], True
    )[0]
    print_info("Picking up first tip.")
    _configure_tip_count(fixture_settings, 0)
    pick_up_tip_for_channel(fixture_settings, first_tip, 0)
    print_info("Detecting liquid height.")
    fixture_settings.pipette.require_liquid_presence(fixture_settings.liquid_source)
    last_probed_tip_size = fixture_settings.tip_sizes[0]
    print_info(
        f"Test source has {fixture_settings.liquid_source.current_liquid_volume()}"
    )
    fixture_settings.pipette._retract()
    blank_measurments: List[List[MeasurementData]] = []
    measurements: Dict[float, List[List[MeasurementData]]] = {}
    ctx.delay(
        seconds=SCALE_SECONDS_TO_TRUE_STABILIZE,
        msg=f"Waiting {SCALE_SECONDS_TO_TRUE_STABILIZE} for scale to stabalize",
    )
    for i in range(fixture_settings.blank_trials):
        print_header(f"Running blank trial {i}")
        blank_measurments.append(
            run_blank_test(
                fixture_settings,
                fixture_settings.tip_sizes[0],
                fixture_settings.volumes[fixture_settings.tip_sizes[0]][0],
                i,
                first_tip,
            )
        )
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    asp_evaps = [
        calculate_change_in_volume(blank[0], blank[1], liq)
        for blank in blank_measurments
    ]
    disp_evaps = [
        calculate_change_in_volume(blank[1], blank[2], liq)
        for blank in blank_measurments
    ]
    avg_asp_evap = sum(asp_evaps) / len(asp_evaps)
    avg_disp_evap = sum(disp_evaps) / len(disp_evaps)
    report.store_average_evaporation(
        fixture_settings.test_report,
        avg_asp_evap,
        avg_disp_evap,
    )
    volume_lost_during_blank = calculate_change_in_volume(
        blank_measurments[0][0], blank_measurments[-1][-1], liq
    )
    if not ctx.is_simulating():
        fixture_settings.liquid_source.load_liquid(
            fixture_settings.liquid,
            fixture_settings.liquid_source.current_liquid_volume()  # type: ignore[arg-type]
            - volume_lost_during_blank,
        )
    remove_tip(fixture_settings)

    last_measurement = blank_measurments[-1][-1]
    tip_sizes_done = []
    for tip in fixture_settings.tip_sizes:
        if tip != last_probed_tip_size:
            _configure_tip_count(fixture_settings, 0)
            probe_tip = _get_tips_for_test(fixture_settings, tip, False)[0]
            pick_up_tip_for_channel(fixture_settings, probe_tip, 0)
            fixture_settings.pipette.require_liquid_presence(
                fixture_settings.liquid_source
            )
            last_probed_tip_size = tip
            remove_tip(fixture_settings)

        volumes_to_tests = fixture_settings.volumes[tip]
        if tip in tip_sizes_done or len(fixture_settings.volumes[tip]) == 0:
            volumes_to_tests = fixture_settings.extra_volumes[tip]
        for volume in volumes_to_tests:
            trial_asp_dict: Dict[int, List[float]] = {
                t: [] for t in range(fixture_settings.trials)
            }
            trial_disp_dict: Dict[int, List[float]] = {
                t: [] for t in range(fixture_settings.trials)
            }
            actual_asp_list_all = []
            actual_disp_list_all = []
            measurements[volume] = []
            for channel in fixture_settings.channels:
                _configure_tip_count(fixture_settings, channel)
                # override pipette movement conflict checking 'cause we specially lay out our tipracks
                channel_aspriate_dict: Dict[int, List[float]]
                tips = _get_tips_for_test(fixture_settings, tip, False, channel)
                actual_asp_list_channel: List[float] = []
                actual_disp_list_channel: List[float] = []
                for trial in range(fixture_settings.trials):
                    print_header(
                        f"Running trial {trial} for channel {channel} {volume}ul with T{tip}"
                    )
                    measurements[volume].append(
                        run_one_test(
                            fixture_settings,
                            tip,
                            tips.pop(0),
                            volume,
                            trial,
                            channel,
                            last_measurement,
                        )
                    )
                    asp_with_evap = (
                        calculate_change_in_volume(
                            measurements[volume][-1][0],
                            measurements[volume][-1][1],
                            liq,
                        )
                        - avg_asp_evap
                    )
                    disp_with_evap = (
                        calculate_change_in_volume(
                            measurements[volume][-1][1],
                            measurements[volume][-1][2],
                            liq,
                        )
                        + avg_disp_evap
                    )
                    if (
                        fixture_settings.increment
                        or fixture_settings.pipette_channels == 96
                    ):
                        avg_asp_evap = avg_asp_evap / fixture_settings.pipette_channels
                        disp_with_evap = (
                            disp_with_evap / fixture_settings.pipette_channels
                        )

                    if fixture_settings.ctx.is_simulating():
                        cur_height: float = 10.0
                    else:
                        lh = fixture_settings.liquid_source.current_liquid_height()
                        cur_height = lh  # type: ignore[assignment]
                    report.store_trial(
                        fixture_settings.test_report,
                        trial,
                        volume,
                        channel,
                        asp_with_evap,
                        disp_with_evap,
                        cur_height,  # type: ignore[arg-type]
                    )
                    print_info(
                        f"Finished trial {trial} asp {asp_with_evap} disp {disp_with_evap}"
                    )
                    actual_asp_list_channel.append(asp_with_evap)
                    actual_disp_list_channel.append(disp_with_evap)
                    trial_asp_dict[trial].append(asp_with_evap)
                    trial_disp_dict[trial].append(disp_with_evap)
                    last_measurement = measurements[volume][-1][-1]
                aspirate_average, aspirate_cv, aspirate_d = helpers._calculate_stats(
                    actual_asp_list_channel, volume
                )
                dispense_average, dispense_cv, dispense_d = helpers._calculate_stats(
                    actual_disp_list_channel, volume
                )
                aspirate_data_list = [elem[1] for elem in measurements[volume]]
                dispense_data_list = [elem[2] for elem in measurements[volume]]
                # Average Celsius
                aspirate_celsius_avg = sum(
                    a_data.environment.celsius_pipette for a_data in aspirate_data_list
                ) / len(aspirate_data_list)
                dispense_celsius_avg = sum(
                    d_data.environment.celsius_pipette for d_data in dispense_data_list
                ) / len(dispense_data_list)
                # Average humidity
                aspirate_humidity_avg = sum(
                    a_data.environment.humidity_pipette for a_data in aspirate_data_list
                ) / len(aspirate_data_list)
                dispense_humidity_avg = sum(
                    d_data.environment.humidity_pipette for d_data in dispense_data_list
                ) / len(dispense_data_list)

                report.store_volume_per_channel(
                    report=fixture_settings.test_report,
                    mode="aspirate",
                    volume=volume,
                    channel=channel,
                    average=aspirate_average,
                    cv=aspirate_cv,
                    d=aspirate_d,
                    celsius=aspirate_celsius_avg,
                    humidity=aspirate_humidity_avg,
                    flag="isolated" if fixture_settings.isolate_volumes else "",
                )
                report.store_volume_per_channel(
                    report=fixture_settings.test_report,
                    mode="dispense",
                    volume=volume,
                    channel=channel,
                    average=dispense_average,
                    cv=dispense_cv,
                    d=dispense_d,
                    celsius=dispense_celsius_avg,
                    humidity=dispense_humidity_avg,
                    flag="isolated" if fixture_settings.isolate_volumes else "",
                )

                actual_asp_list_all.extend(actual_asp_list_channel)
                actual_disp_list_all.extend(actual_disp_list_channel)
            for trial in range(fixture_settings.trials):
                aspirate_average, aspirate_cv, aspirate_d = helpers._calculate_stats(
                    trial_asp_dict[trial], volume
                )
                dispense_average, dispense_cv, dispense_d = helpers._calculate_stats(
                    trial_disp_dict[trial], volume
                )
                report.store_volume_per_trial(
                    report=fixture_settings.test_report,
                    mode="aspirate",
                    volume=volume,
                    trial=trial,
                    average=aspirate_average,
                    cv=aspirate_cv,
                    d=aspirate_d,
                    flag="isolated" if fixture_settings.isolate_volumes else "",
                )
                report.store_volume_per_trial(
                    report=fixture_settings.test_report,
                    mode="dispense",
                    volume=volume,
                    trial=trial,
                    average=dispense_average,
                    cv=dispense_cv,
                    d=dispense_d,
                    flag="isolated" if fixture_settings.isolate_volumes else "",
                )
            aspirate_average, aspirate_cv, aspirate_d = helpers._calculate_stats(
                actual_asp_list_all, volume
            )
            dispense_average, dispense_cv, dispense_d = helpers._calculate_stats(
                actual_disp_list_all, volume
            )
            report.store_volume_all(
                report=fixture_settings.test_report,
                mode="aspirate",
                volume=volume,
                average=aspirate_average,
                cv=aspirate_cv,
                d=aspirate_d,
                flag="",
            )
            report.store_volume_all(
                report=fixture_settings.test_report,
                mode="dispense",
                volume=volume,
                average=dispense_average,
                cv=dispense_cv,
                d=dispense_d,
                flag="",
            )
        tip_sizes_done.append(tip)


def _override_check(
    aspirate_volume: float,
    air_gap: float,
    max_volume: float,
    current_volume: float,
) -> None:
    pass


def _adjust_settings_for_increment(fixture_settings: FixtureSettings) -> None:
    helpers._override_software_supports_high_volumes()
    tx_ctl_lib.check_valid_liquid_class_volume_parameters = _override_check


def run(ctx: ProtocolContext) -> None:
    """Pick up, aspirate, and dispense one trial and write it to the report."""
    fixture_settings = FixtureSettings.build(ctx)
    try:
        _store_config_as_old_style(fixture_settings)
        if _should_alter_discontinuity(fixture_settings):
            print_info("Adjusting z discontinuity for this pipette.")
        if fixture_settings.increment:
            _adjust_settings_for_increment(fixture_settings)
        _run(ctx, fixture_settings)
    except Exception as e:
        print_error(f"error during run {e}")
    finally:
        if fixture_settings.recorder is not None:
            print_info("ending recording")
            fixture_settings.recorder.stop()
            fixture_settings.recorder.deactivate()
            set_output_file(None)
