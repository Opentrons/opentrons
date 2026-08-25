"""Gravimetric QC protocol."""

from typing import Any, Dict, List, Mapping, Optional, Tuple
from dataclasses import dataclass, asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from time import sleep, time
import copy
import json
import math
import socket
import threading
import traceback
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
    Liquid,
    LiquidClass,
    OFF_DECK,
)
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    Coordinate,
    PositionReference,
)
from opentrons.protocol_api.core.engine import (
    transfer_components_executor as tx_comps_executor,
    pipette_movement_conflict,
)
from opentrons.config import IS_ROBOT
from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEED_DISCONTINUITY
from opentrons.hardware_control.types import OT3AxisKind, OT3Mount, Axis
from opentrons.types import Point, DeckSlotName, Location
from opentrons.protocol_api._nozzle_layout import NozzleLayout
from opentrons.protocols.advanced_control.transfers import common as tx_ctl_lib

from hardware_testing.data import create_run_id, get_git_description
from hardware_testing.data.ui import (  # noqa: F401
    set_output_file,
    print_info,
    print_title,
    print_header,
    print_warning,
    print_error,
)

from hardware_testing.drivers import asair_sensor as AsairDriver
from hardware_testing.drivers import ImpactProtectionV2
from hardware_testing.opentrons_api.helpers_ot3 import (
    clear_pipette_ul_per_mm,
)

from hardware_testing.drivers.data_center_client import (
    upload_data_to_google_drive,
)

# ------ TODO remove and move necessary libraries into a standard release library. ----
import importlib.util
import os
from opentrons.config import infer_config_base_dir
from opentrons import version
import sys


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


# ----- END: TODO ------


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

from hardware_testing.gravimetric import helpers, report, tips, config  # noqa: E402


metadata = {"protocolName": "Gravimetric QC V3 Manual-LLD T4"}
requirements = {"robotType": "Flex", "apiLevel": "2.29"}

SCALE_SECONDS_TO_TRUE_STABILIZE = 60 * 3

MANUAL_LLD_STATE_FILE = os.environ.get(
    "MANUAL_LLD_STATE_FILE", "/data/testing_data/manual_lld.json"
)
MANUAL_LLD_HTTP_HOST = os.environ.get("MANUAL_LLD_HTTP_HOST", "0.0.0.0")
MANUAL_LLD_HTTP_PORT = int(os.environ.get("MANUAL_LLD_HTTP_PORT", "8088"))
MANUAL_LLD_PUBLIC_HOST = os.environ.get("MANUAL_LLD_PUBLIC_HOST")
MANUAL_LLD_ROBOT_SERVER_URL = os.environ.get(
    "MANUAL_LLD_ROBOT_SERVER_URL", "http://localhost:31950"
)
MANUAL_LLD_START_OFFSET_MM = 3.0
MANUAL_LLD_POLL_INTERVAL_SECONDS = 0.1
MANUAL_LLD_MIN_HEIGHT_MM = 0.5
MANUAL_LLD_DEFAULT_JOG_STEP_MM = 0.1
MANUAL_LLD_MAX_JOG_MM = 5.0
MANUAL_LLD_ROBOT_API_VERSION = "3"

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

QC_TEST_MIN_REQUIREMENTS: Dict[
    int, Dict[int, Dict[int, Dict[float, Tuple[float, float]]]]
] = {
    # Published specs with 0.8 safety factor
    # channels: [Pipette: [tip: [Volume: (%d, Cv)]]]
    1: {
        50: {  # P50
            50: {  # T50
                1.0: (6.4, 5.6),
                10.0: (1.2, 0.4),
                50.0: (1.0, 0.32),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5.0: (4.0, 2.0),
                50.0: (0.4, 0.24),
            },
            200: {  # T200
                200.0: (0.4, 0.12),
            },
            1000: {  # T1000
                1000.0: (0.4, 0.12),
            },
        },
    },
    8: {
        50: {  # P50
            50: {  # T50
                1.0: (8.0, 6.4),
                10.0: (2.0, 0.8),
                50.0: (1.0, 0.48),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5.0: (6.4, 3.2),
                50.0: (2.0, 0.48),
            },
            200: {  # T200
                200.0: (0.8, 0.2),
            },
            1000: {  # T1000
                1000.0: (0.56, 0.12),
            },
        },
    },
    96: {
        200: {
            50: {  # T50
                1.0: (8.0, 4.8),
                5.0: (3.2, 1.6),
                50.0: (1.2, 0.8),
            },
            200: {  # T200
                200.0: (0.8, 0.8),
            },
        },
        1000: {  # P1000
            50: {  # T50
                5.0: (8.0, 4.0),
                50.0: (2.0, 1.0),
            },
            200: {  # T200
                200.0: (1.2, 1.0),
            },
            1000: {  # T1000
                1000.0: (1.2, 1.2),
            },
        },
    },
}


@dataclass(kw_only=True)
class CSVSettings:
    """All of the settings that are loaded from the CSV runtime parameter."""

    name: str
    increment: bool
    mount: str
    pipette_volume: int
    pipette_channels: int
    tip_sizes: List[int]
    trials: int
    channels: list[int]
    return_tip: bool
    touch_tip: bool
    liquid_name: str
    liquid_desc: str
    liquid_col: str
    liquid_vol_estimate: float
    tips: Dict[int, List[str]]
    volumes: Dict[int, List[float]]
    extra_volumes: Dict[int, List[float]]
    volumes_flat: List[float]
    scale_delay: int
    blank_trials: int
    submerge_depth: float
    extra: bool
    labware_on_scale: str
    labware_on_scale_well_name: str
    slot_scale: str
    retract_discontinuity: float
    disc_ver_cuttoff: int
    single_tip_96: bool
    cavity_test: bool
    touch_blank: bool
    retracted_offset: float
    gantry_speed: float
    liquid_class_test: bool
    fail_early: bool

    @classmethod
    def parse_csv(cls, csv_params: List[List[str]], simulating: bool) -> "CSVSettings":
        """Extract all of the data from the CSV runtime param."""

        def lookup_key(key: str, csv: List[List[str]]) -> List[str]:
            for line in csv:
                if line[0] == key:
                    return [e for e in line[1:] if e != ""]
            raise ValueError(f"{key} is not defined in the csv params.")

        retracted_offset = 5.0
        # TODO maybe make this a CSV option
        # retracted_offset = float(lookup_key("retracted_offset", csv_params)[0])

        name = lookup_key("name", csv_params)[0]
        if simulating:
            name = f"{name}-simulate"
        increment = bool(lookup_key("increment", csv_params)[0] == "TRUE")
        mount = lookup_key("mount", csv_params)[0]
        pipette_volume = int(lookup_key("pipette", csv_params)[0])
        pipette_channels = int(lookup_key("pipette", csv_params)[1])
        if pipette_channels == 8 and not increment:
            channels = [
                int(ch) for ch in lookup_key("multi_channels_to_test", csv_params)
            ]
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
        single_tip_96 = bool(lookup_key("single_tip_96", csv_params)[0] == "TRUE")
        cavity_test = bool(lookup_key("cavity_test", csv_params)[0] == "TRUE")
        touch_blank = bool(lookup_key("touch_blank", csv_params)[0] == "TRUE")
        liquid_class_test = bool(
            lookup_key("liquid_class_test", csv_params)[0] == "TRUE"
        )
        fail_early = bool(lookup_key("fail_early", csv_params)[0] == "TRUE")

        volumes = {
            20: volumes_to_test_20ul,
            50: volumes_to_test_50ul,
            200: volumes_to_test_200ul,
            1000: volumes_to_test_1000ul,
        }
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
        return CSVSettings(
            name=name,
            increment=increment,
            mount=mount,
            pipette_volume=pipette_volume,
            pipette_channels=pipette_channels,
            tip_sizes=tip_sizes,
            trials=trials,
            channels=channels,
            return_tip=return_tip,
            touch_tip=touch_tip,
            liquid_name=liquid_name,
            liquid_desc=liquid_desc,
            liquid_col=liquid_col,
            liquid_vol_estimate=liquid_vol_estimate,
            tips=tips,
            volumes=volumes,
            extra_volumes=extra_volumes,
            volumes_flat=volumes_flat,
            scale_delay=scale_delay,
            blank_trials=blank_trials,
            submerge_depth=submerge_depth,
            extra=extra,
            labware_on_scale=labware_on_scale,
            labware_on_scale_well_name=labware_on_scale_well_name,
            slot_scale=slot_scale,
            retract_discontinuity=retract_discontinuity,
            disc_ver_cuttoff=disc_ver_cuttoff,
            single_tip_96=single_tip_96,
            cavity_test=cavity_test,
            touch_blank=touch_blank,
            retracted_offset=retracted_offset,
            gantry_speed=gantry_speed,
            liquid_class_test=liquid_class_test,
            fail_early=fail_early,
        )


@dataclass
class FixtureSettings(CSVSettings):
    """Dataclass to hold all the options for a gravimetric script."""

    ctx: ProtocolContext
    run_id: str
    pipette: InstrumentContext
    liquid: Liquid
    liquid_class: LiquidClass
    liquid_source: Well
    scale: Scale
    recorder: GravimetricRecorder
    env_sensor: AsairDriver.AsairSensorBase
    robot_serial: str
    scale_serial: str
    env_serial: str
    pipette_tag: str
    test_report: report.CSVReport
    isolate_volumes: bool
    fast_simulate: bool
    use_impact_protection: bool
    use_lld: bool
    ImpactSerial_U: Optional[ImpactProtectionV2.ImpactProtectionBase]

    @classmethod
    def build(cls, ctx: ProtocolContext) -> "FixtureSettings":
        """Parse the CSV file and build the fixture settings."""
        csv_params = (
            ctx.params.qc_test_profile.parse_as_csv()  # type: ignore [attr-defined]
        )
        csv_settings = CSVSettings.parse_csv(csv_params, ctx.is_simulating())

        source_well = ctx.load_labware(
            csv_settings.labware_on_scale, csv_settings.slot_scale
        )[csv_settings.labware_on_scale_well_name]
        liquid_class = ctx.get_liquid_class(csv_settings.liquid_name)
        liquid = ctx.define_liquid(
            csv_settings.liquid_name, csv_settings.liquid_desc, csv_settings.liquid_col
        )
        source_well.load_liquid(liquid, csv_settings.liquid_vol_estimate)

        pipette = ctx.load_instrument(
            f"flex_{csv_settings.pipette_channels}channel_{csv_settings.pipette_volume}",
            csv_settings.mount,
        )
        pipette.default_speed = csv_settings.gantry_speed
        simulating = ctx.is_simulating()
        pipette_movement_conflict.check_safe_for_pipette_movement = (
            helpers._override_check_safe_for_pipette_movement
        )
        if simulating:
            pipette_tag = "pipette"
        else:
            pipette_tag = helpers._get_tag_from_pipette(
                pipette, csv_settings.increment, False
            )
        run_id = create_run_id()
        fast_simulate = IS_ROBOT and simulating

        test_report = report.create_csv_test_report(
            volumes=csv_settings.volumes_flat,
            pipette_channels=csv_settings.channels,
            trials=csv_settings.trials,
            name=csv_settings.name,
            run_id=run_id,
            blank_trials=csv_settings.blank_trials,
            runtime_parameters=csv_params,
            dont_write_to_disk=fast_simulate,
        )
        os.makedirs(f"{test_report.parent}", exist_ok=True)
        set_output_file(f"{test_report.parent}/run_output.txt")

        print_info(f"volumes flat {csv_settings.volumes_flat}")
        print_info(f"channels {csv_settings.pipette_channels}")
        print_info(f"increment {csv_settings.increment}")
        print_info(f"trials {csv_settings.trials}")
        print_info(f"name {csv_settings.name}")

        print_info(str(importlib.util.find_spec("hardware_testing")))
        print_info(f"Running on bot {IS_ROBOT}")
        print_info(f"Fast simulate {fast_simulate}")
        scale = Scale.build(simulating)
        recorder = GravimetricRecorder(
            GravimetricRecorderConfig(
                test_name=csv_settings.name,
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
        env_sensor, link_port = AsairDriver.BuildAsairSensorWithPort(simulating)
        env_serial = env_sensor.get_serial()
        use_impact_protection = ctx.params.use_impact_protection  # type: ignore [attr-defined]
        use_lld = ctx.params.use_lld  # type: ignore [attr-defined]
        # 链接防撞工装
        ImpactSerial = None
        if use_impact_protection:
            # 确保skip_port是字符串，即使link_port为None
            skip_port = link_port if link_port is not None else ""
            ImpactSerial = ImpactProtectionV2.BuildImpactProtection(
                simulate=simulating, skip_port=skip_port
            )
            assert ImpactSerial is not None
            ctx.delay(seconds=1, msg=f"p {ImpactSerial.port}")

        ctx.delay(seconds=3, msg=f"simulating {simulating} {type(simulating)}")

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

        # store the runtime params now.
        for param in csv_params:
            test_report("RUNTIME_PARAMS", param[0], param[1:])

        t50_str = f"{ctx.params.cavity_50}"  # type: ignore [attr-defined]
        if ctx.params.cavity_50 != "Unused":  # type: ignore [attr-defined]
            t50_str += f"{ctx.params.tip_batch_50}"  # type: ignore [attr-defined]
        t200_str = f"{ctx.params.cavity_200}"  # type: ignore [attr-defined]
        if ctx.params.cavity_200 != "Unused":  # type: ignore [attr-defined]
            t200_str += f"{ctx.params.tip_batch_200}"  # type: ignore [attr-defined]
        t1000_str = f"{ctx.params.cavity_1000}"  # type: ignore [attr-defined]
        if ctx.params.cavity_1000 != "Unused":  # type: ignore [attr-defined]
            t1000_str += f"{ctx.params.tip_batch_1000}"  # type: ignore [attr-defined]
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
            liquid=csv_settings.liquid_name,
        )
        # todo fix set serial to take robot name and serial separate
        # do this after the set serial to overwrite where the name.
        test_report.set_robot_id(robot_serial)
        ctx.load_trash_bin("A3")
        return cls(
            ctx=ctx,
            run_id=run_id,
            pipette=pipette,
            liquid=liquid,
            liquid_class=liquid_class,
            liquid_source=source_well,
            scale=scale,
            recorder=recorder,
            env_sensor=env_sensor,
            robot_serial=robot_serial,
            scale_serial=scale_serial,
            env_serial=env_serial,
            pipette_tag=pipette_tag,
            test_report=test_report,
            isolate_volumes=False,
            fast_simulate=fast_simulate,
            use_impact_protection=use_impact_protection,
            use_lld=use_lld,
            ImpactSerial_U=ImpactSerial,
            **asdict(csv_settings),
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
        kind=f"ConfigType.gravimetric.{fixture_settings.ctx.params.test_type}.{fixture_settings.ctx.params.production_type}",  # type: ignore[attr-defined]
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
    fixture_settings: FixtureSettings, tip: int, channel: int, blank: bool
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
        elif fixture_settings.cavity_test:
            # This should only ever be called once so hopefully this doesn't break anything
            # consume tips bottom to top, left to right
            if len(tipracks_lw) != 0:
                for rack in tipracks_lw:
                    for col in range(1, 13):  # H->A
                        for row in range(72, 64, -1):  # 1->12
                            wells.append(rack[f"{chr(row)}{col}"])
                return wells
            else:
                for rack_slot in partially_used:
                    rack = loaded_labwares[
                        DeckSlotName.from_primitive(rack_slot).as_int()
                    ]
                    for col in range(1, 13):  # H->A
                        for row in range(72, 64, -1):  # 1->12
                            next_tip = rack[f"{chr(row)}{col}"]
                            if next_tip.has_tip:
                                wells.append(next_tip)
                return wells

        else:
            return tips.get_tips_for_individual_channel_on_multi(
                fixture_settings.ctx, channel, tip, fixture_settings.pipette_volume
            )

    wells += tips.get_unused_tips(fixture_settings.ctx, tip)
    for rack in tipracks_lw:
        wells += rack.wells()
    return wells


def _get_tips_for_test_96_single(
    fixture_settings: FixtureSettings, tip: int, blank: bool = False
) -> List[Well]:
    wells = []
    loaded_labwares = fixture_settings.ctx.loaded_labwares
    used_slots = [
        str(DeckSlotName.from_primitive(slot).to_ot3_equivalent())
        for slot in loaded_labwares.keys()
    ]
    partially_used = [slot for slot in fixture_settings.tips[tip] if slot in used_slots]
    _ = [
        fixture_settings.ctx.load_labware(f"opentrons_flex_96_tiprack_{tip}uL", slot)
        for slot in fixture_settings.tips[tip]
        if slot not in partially_used
    ]
    wells += tips.get_unused_tips(fixture_settings.ctx, tip)
    wells = sorted(
        wells,
        reverse=True,
        key=lambda well: f"{well.well_name[0]}{chr(int(well.well_name[1:]))}",
    )
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
        if fixture_settings.single_tip_96:
            return _get_tips_for_test_96_single(fixture_settings, tip, blank)
        else:
            return _get_tips_for_test_96(fixture_settings, tip, blank)
    if fixture_settings.pipette_channels == 8 and fixture_settings.liquid_class_test:
        # Liquid class testing uses the whole tip rack with one channel so dont use the special pattern
        return _get_tips_for_test_96_single(fixture_settings, tip, blank)
    return _get_tips_for_test_single_multi(fixture_settings, tip, channel, blank)


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
        display_name="Test Type",
        variable_name="test_type",
        default="Productions",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Productions",
                "Engineering",
            ]
        ],
        description="Testing for production line or engineering's verifications",
    )

    parameters.add_str(
        display_name="Production Type",
        variable_name="production_type",
        default="Opentrons",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Opentrons",
                "Millipore",
                "Ultima",
            ]
        ],
        description="Distinguish OEM productions",
    )

    parameters.add_bool(
        display_name="Use Impact Protection",
        variable_name="use_impact_protection",
        default=True,
        description="Whether to use impact protection device during testing.",
    )

    parameters.add_bool(
        display_name="Use LLD",
        variable_name="use_lld",
        default=True,
        description=(
            "Use pressure LLD. Disable to wait for manual Z jog confirmation "
            "from the HTTP service."
        ),
    )

    parameters.add_bool(
        display_name="Upload CSV Automatically",
        variable_name="upload_csv_automatically",
        default=False,
        description="Whether to upload the CSV file automatically after testing.",
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


def maybe_close_all_gratings(fixture_settings: FixtureSettings) -> None:
    """Close all impact protection gratings if the use_impact_protection param is set."""
    if (
        not fixture_settings.ctx.is_simulating()
        and fixture_settings.use_impact_protection
    ):
        assert fixture_settings.ImpactSerial_U is not None
        impp = fixture_settings.ImpactSerial_U.close_all_gratings()
        fixture_settings.ctx.delay(
            seconds=0.1,
            msg=f"close_all_gratings state :{impp.raw_response}",
        )
        if "OK" not in impp.raw_response:
            raise RuntimeError(
                f"close all gratings Collision avoidance switch failed to activate. {impp.raw_response}"
            )


def maybe_switch_mode(fixture_settings: FixtureSettings, tip: int) -> None:
    """Switch gratings mode if the use_impact_protection param is set."""
    if (
        not fixture_settings.ctx.is_simulating()
        and fixture_settings.use_impact_protection
    ):
        swichvaldict = {
            20: "SET_LEFT_T50",
            50: "SET_LEFT_T50",
            200: "SET_LEFT_T50",
            1000: "SET_LEFT_T1000",
        }
        assert fixture_settings.ImpactSerial_U is not None
        impp = fixture_settings.ImpactSerial_U.switch_mode(swichvaldict[tip])
        fixture_settings.ctx.delay(
            seconds=0.1,
            msg=f"switch_mode state :{impp.raw_response}",
        )
        if "OK" not in impp.raw_response:
            raise RuntimeError("Collision avoidance switch failed to activate.")


def remove_tip(fixture_settings: FixtureSettings) -> None:
    """Either return or drop tip(s)."""
    maybe_close_all_gratings(fixture_settings)
    if fixture_settings.return_tip:
        fixture_settings.pipette.return_tip()
    else:
        fixture_settings.pipette.drop_tip()


def _get_offset_for_channel(
    fixture_settings: FixtureSettings, channel: int, submerge_depth: float = 0
) -> Coordinate:
    offset = Coordinate(x=0, y=0, z=submerge_depth)
    if fixture_settings.pipette_channels == 8:
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
        # Z轴离开秤的上方后，关闭所有光栅
        maybe_close_all_gratings(fixture_settings)
        return_val = copy.deepcopy(fast_simulate_measurement)
        if not blank:
            if mode == MeasurementType.ASPIRATE:
                return_val.grams_average += volume * -0.001
            elif mode == MeasurementType.DISPENSE:
                return_val.grams_average += volume * 0.001
        return return_val

    m_tag = create_measurement_tag(
        mode.value, None if blank else volume, channel, trial
    )
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
    # Z轴离开秤的上方后，关闭所有光栅
    maybe_close_all_gratings(fixture_settings)
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
            if fixture_settings.pipette_volume == 200:
                hw_api.config.motion_settings.max_speed_discontinuity.high_throughput_200[
                    OT3AxisKind.Z
                ] = fixture_settings.retract_discontinuity
            else:
                hw_api.config.motion_settings.max_speed_discontinuity.high_throughput_1000[
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
            if fixture_settings.pipette_volume == 200:
                hw_api.config.motion_settings.max_speed_discontinuity.high_throughput_200[
                    OT3AxisKind.Z
                ] = DEFAULT_MAX_SPEED_DISCONTINUITY.high_throughput_200[
                    OT3AxisKind.Z
                ]
            else:
                hw_api.config.motion_settings.max_speed_discontinuity.high_throughput_1000[
                    OT3AxisKind.Z
                ] = DEFAULT_MAX_SPEED_DISCONTINUITY.high_throughput_1000[
                    OT3AxisKind.Z
                ]
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
    # open ImpactSerial
    maybe_switch_mode(fixture_settings, tip)

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
        max_pipette_and_tip_volume=tip,
        volume_for_pipette_mode_configuration=None,
    )
    fixture_settings.recorder.clear_sample_tag()
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
    fixture_settings.recorder.clear_sample_tag()
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
    if fixture_settings.ctx.is_simulating():
        liquid_height = 10.0
    else:
        liquid_height = fixture_settings.liquid_source.current_liquid_height()  # type: ignore[assignment]
    # 移动到垃圾桶前，关闭所有光栅
    maybe_close_all_gratings(fixture_settings)
    fixture_settings.pipette.move_to(fixture_settings.pipette.trash_container)  # type: ignore[arg-type]
    fixture_settings.pipette.move_to(
        fixture_settings.pipette._last_tip_picked_up_from.top(10)  # type: ignore[union-attr]
    )
    retracted_offset = _get_offset_for_channel(
        fixture_settings, channel, fixture_settings.retracted_offset
    )
    well_top = fixture_settings.liquid_source.top().point
    above_scale = Point(
        well_top.x,
        well_top.y + retracted_offset.y,
        fixture_settings.pipette._get_last_location_by_api_version().point.z,  # type: ignore [union-attr]
    )
    if fixture_settings.touch_blank:
        # submerge depth is negative so adding it will drop it into the liquid
        blank_move_to_height = liquid_height + fixture_settings.submerge_depth
    else:
        blank_move_to_height = liquid_height - fixture_settings.submerge_depth
    fixture_settings.pipette.move_to(Location(above_scale, None))
    # Z轴在秤的上方，调用switch_mode
    maybe_switch_mode(fixture_settings, tip)
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
    fixture_settings.pipette.move_to(
        fixture_settings.liquid_source.bottom(blank_move_to_height)
    )
    fixture_settings.pipette.move_to(
        fixture_settings.liquid_source.bottom(liquid_height + 3)
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
    fixture_settings.pipette.move_to(
        fixture_settings.liquid_source.bottom(blank_move_to_height)
    )
    fixture_settings.pipette.move_to(
        fixture_settings.liquid_source.bottom(liquid_height + 3)
    )
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
    last_measurement: Optional[MeasurementData],
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
    # Z轴在秤的上方，调用switch_mode
    maybe_switch_mode(fixture_settings, tip)
    print_info("Pre-aspirate read.")
    pre_aspirate = retract_and_wait(
        fixture_settings, MeasurementType.INIT, tip, volume, trial, channel=channel
    )
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    if last_measurement:
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
    full_tip_increment = (
        len(fixture_settings.channels) == 8 and fixture_settings.increment
    )
    if (
        fixture_settings.pipette_channels == 8 and not full_tip_increment
    ) or fixture_settings.single_tip_96:
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


class _ManualLLDServiceError(Exception):
    """An expected error from the embedded manual LLD service."""


class _ManualLLDStateStore:
    """Read and atomically update the manual LLD state shared with the protocol."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.lock = threading.Lock()

    def read(self) -> Dict[str, object]:
        """Read the current calibration state."""
        with self.lock:
            return self._read_unlocked()

    def replace(self, state: Mapping[str, object]) -> None:
        """Replace the current calibration state."""
        with self.lock:
            self._write_unlocked(state)

    def _read_unlocked(self) -> Dict[str, object]:
        with self.path.open(encoding="utf-8") as state_file:
            state = json.load(state_file)
        if not isinstance(state, dict):
            raise _ManualLLDServiceError("manual_lld.json must contain a JSON object.")
        return state

    def _write_unlocked(self, state: Mapping[str, object]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = self.path.with_name(f"{self.path.name}.{uuid4().hex}.tmp")
        with temporary_path.open("w", encoding="utf-8") as state_file:
            json.dump(state, state_file, indent=2, sort_keys=True)
            state_file.flush()
            os.fsync(state_file.fileno())
        os.replace(temporary_path, self.path)


class _ManualLLDRobotServerClient:
    """Minimal client for resuming the run and submitting Z jog commands."""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def ensure_current_run_is_running(self) -> Dict[str, object]:
        """Resume the current run when it is paused by the calibration prompt."""
        current_run = self._get_current_run()
        run_status = current_run.get("status")
        if run_status == "running":
            return current_run
        if run_status != "paused":
            raise _ManualLLDServiceError(
                "The current run must be running or paused for manual jog; "
                f"current status is {run_status!r}."
            )

        run_id = self._run_id(current_run)
        self._request_json(
            "POST",
            f"/runs/{run_id}/actions",
            {"data": {"actionType": "play"}},
        )
        resume_deadline = time() + 10
        while time() < resume_deadline:
            current_run = self._get_current_run()
            if current_run.get("status") == "running":
                return current_run
            sleep(MANUAL_LLD_POLL_INTERVAL_SECONDS)
        raise _ManualLLDServiceError(
            "Timed out waiting for the protocol run to resume."
        )

    def move_relative(self, pipette_id: str, distance_mm: float) -> Dict[str, object]:
        """Jog the given pipette Z axis in the current protocol run."""
        current_run = self.ensure_current_run_is_running()
        run_id = self._run_id(current_run)
        command = self._request_json(
            "POST",
            f"/runs/{run_id}/commands?"
            + urlencode({"waitUntilComplete": "true", "timeout": 30000}),
            {
                "data": {
                    "commandType": "moveRelative",
                    "intent": "protocol",
                    "params": {
                        "pipetteId": pipette_id,
                        "axis": "z",
                        "distance": distance_mm,
                    },
                }
            },
        )
        command_data = command.get("data")
        if not isinstance(command_data, dict):
            raise _ManualLLDServiceError("Robot Server returned no jog command data.")
        command_status = command_data.get("status")
        if command_status != "succeeded":
            raise _ManualLLDServiceError(
                f"Jog command did not succeed; status is {command_status!r}."
            )
        return command_data

    @staticmethod
    def _run_id(run: Mapping[str, object]) -> str:
        run_id = run.get("id")
        if not isinstance(run_id, str) or not run_id:
            raise _ManualLLDServiceError(
                "Robot Server did not return a current run ID."
            )
        return run_id

    def _get_current_run(self) -> Dict[str, object]:
        runs = self._request_json("GET", "/runs?pageLength=1")
        links = runs.get("links")
        if not isinstance(links, dict):
            raise _ManualLLDServiceError("Robot Server returned no current-run link.")
        current = links.get("current")
        if not isinstance(current, dict):
            raise _ManualLLDServiceError("There is no current robot run.")
        href = current.get("href")
        if not isinstance(href, str) or not href:
            raise _ManualLLDServiceError("The current-run link has no href.")
        response = self._request_json("GET", href)
        run_data = response.get("data")
        if not isinstance(run_data, dict):
            raise _ManualLLDServiceError("Robot Server returned no current run data.")
        return run_data

    def _request_json(
        self,
        method: str,
        path: str,
        body: Optional[Mapping[str, object]] = None,
    ) -> Dict[str, object]:
        request_body = None if body is None else json.dumps(body).encode("utf-8")
        url = path if path.startswith(("http://", "https://")) else self.base_url + path
        request = Request(
            url,
            data=request_body,
            method=method,
            headers={
                "Opentrons-Version": MANUAL_LLD_ROBOT_API_VERSION,
                "Content-Type": "application/json",
            },
        )
        try:
            with urlopen(request, timeout=35) as response:
                response_data = json.loads(response.read())
        except HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            raise _ManualLLDServiceError(
                f"Robot Server returned HTTP {error.code}: {details}"
            ) from error
        except URLError as error:
            raise _ManualLLDServiceError(
                "Could not connect to Robot Server at "
                f"{self.base_url}: {error.reason}"
            ) from error
        if not isinstance(response_data, dict):
            raise _ManualLLDServiceError(
                "Robot Server returned a non-object JSON response."
            )
        return response_data


_MANUAL_LLD_HTML = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>手动液面高度</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: #f4f6f8; color: #182026; }
    main { max-width: 520px; margin: 0 auto; padding: 24px 16px 48px; }
    .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 8px 28px #0001; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    .hint { margin: 0 0 18px; color: #5f6b76; line-height: 1.45; }
    .status { padding: 10px 12px; border-radius: 10px; background: #e8f1ff; margin-bottom: 16px; }
    .height { text-align: center; padding: 18px 0; }
    .height strong { display: block; font-size: 42px; font-variant-numeric: tabular-nums; }
    .height span { color: #5f6b76; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    button, input { box-sizing: border-box; width: 100%; min-height: 48px; border-radius: 10px; font-size: 17px; }
    button { border: 0; background: #056de8; color: white; font-weight: 650; cursor: pointer; }
    button.secondary { background: #e8eef5; color: #17324d; }
    button.danger { background: #b42318; }
    button:disabled { opacity: .45; cursor: wait; }
    input { border: 1px solid #aab7c4; padding: 0 12px; }
    label { display: block; margin-top: 18px; color: #44515c; }
    .error { min-height: 24px; margin-top: 14px; color: #b42318; white-space: pre-wrap; }
    .details { margin-top: 16px; color: #5f6b76; font-size: 14px; line-height: 1.5; }
  </style>
</head>
<body>
<main><section class="card">
  <h1>手动液面高度</h1>
  <p class="hint">点击“开始调节”恢复协议，然后向下移动枪头。枪头刚接触液面时保存高度。</p>
  <div id="status" class="status">正在连接机器人…</div>
  <div class="height"><strong id="height">--</strong><span>距孔底高度（mm）</span></div>
  <button id="start" onclick="act('/start')">开始调节 / 恢复协议</button>
  <div class="row">
    <button id="up" class="secondary" onclick="jog('up')">↑ 向上</button>
    <button id="down" onclick="jog('down')">↓ 向下</button>
  </div>
  <label for="step">单次移动距离（mm）</label>
  <div class="row">
    <input id="step" type="number" min="0.01" max="5" step="0.01" value="0.1">
    <button class="secondary" onclick="setStep()">设置步长</button>
  </div>
  <div class="row">
    <button id="save" onclick="act('/confirm')">保存高度</button>
    <button id="cancel" class="danger" onclick="act('/cancel')">取消检测</button>
  </div>
  <div id="error" class="error"></div>
  <div id="details" class="details"></div>
</section></main>
<script>
let busy = false;
let refreshTimer = null;
let stepIsEditing = false;
const ids = ['start', 'up', 'down', 'save', 'cancel'];
const stepInput = document.getElementById('step');
stepInput.addEventListener('input', () => { stepIsEditing = true; });
function showError(message) { document.getElementById('error').textContent = message || ''; }
function render(state) {
  const statusNames = {waiting: '等待手动调节', confirmed: '高度已保存', cancelled: '检测已取消', consumed: '协议已读取高度'};
  document.getElementById('status').textContent = statusNames[state.status] || state.status || '未知状态';
  const height = Number(state.height_from_bottom_mm);
  document.getElementById('height').textContent = Number.isFinite(height) ? height.toFixed(3) : '--';
  const step = Number(state.jog_step_mm);
  if (Number.isFinite(step) && !stepIsEditing) stepInput.value = step;
  document.getElementById('details').textContent = [
    `目标体积：${state.test_volume_ul ?? '--'} µL`,
    `孔位：${state.source_well || '--'}`,
    `累计 Z 移动：${Number(state.cumulative_z_mm || 0).toFixed(3)} mm`,
    `允许范围：${state.minimum_height_from_bottom_mm || '--'} - ${state.source_well_depth_mm || '--'} mm`
  ].join(' · ');
  const waiting = state.status === 'waiting';
  ids.forEach(id => document.getElementById(id).disabled = busy || !waiting);
  if (!waiting && refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
async function request(path, body) {
  busy = true; showError('');
  try {
    const options = {method: 'POST', headers: {'Content-Type': 'application/json'}};
    if (body !== undefined) options.body = JSON.stringify(body);
    const response = await fetch(path, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    render(data); return data;
  } catch (error) { showError(error.message); throw error; }
  finally { busy = false; }
}
async function act(path) {
  try {
    const state = await request(path);
    if (state.status !== 'waiting') return;
  } catch (_) {}
  await refresh();
}
async function jog(direction) { try { await request('/jog', {direction}); } catch (_) {} await refresh(); }
async function setStep() {
  const step = Number(stepInput.value);
  try {
    const state = await request('/step', {step_mm: step});
    stepIsEditing = false;
    render(state);
  } catch (_) {}
  await refresh();
}
async function refresh() {
  if (busy) return;
  try {
    const response = await fetch('/status', {cache: 'no-store'});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    render(data);
  } catch (error) { showError(`连接失败：${error.message}`); }
}
refresh(); refreshTimer = setInterval(refresh, 750);
</script>
</body>
</html>
""".encode(
    "utf-8"
)


class _ManualLLDHTTPServer(ThreadingHTTPServer):
    """Embedded HTTP server containing manual LLD dependencies."""

    allow_reuse_address = True
    daemon_threads = True

    def __init__(
        self,
        server_address: Tuple[str, int],
        state_store: _ManualLLDStateStore,
        robot_client: _ManualLLDRobotServerClient,
        max_jog_mm: float,
    ) -> None:
        super().__init__(server_address, _ManualLLDRequestHandler)
        self.state_store = state_store
        self.robot_client = robot_client
        self.max_jog_mm = max_jog_mm


class _ManualLLDRequestHandler(BaseHTTPRequestHandler):
    """Serve the calibration page and handle jog/save actions."""

    server: _ManualLLDHTTPServer

    def do_OPTIONS(self) -> None:
        """Allow browser requests."""
        self.send_response(HTTPStatus.NO_CONTENT)
        self._send_common_headers()
        self.end_headers()

    def do_GET(self) -> None:
        """Serve the front end, health, or current state."""
        try:
            path = self.path.split("?", 1)[0]
            if path == "/":
                self._send_html()
            elif path == "/health":
                self._send_json(HTTPStatus.OK, {"status": "ok"})
            elif path == "/status":
                self._send_json(HTTPStatus.OK, self.server.state_store.read())
            elif path == "/favicon.ico":
                self.send_response(HTTPStatus.NO_CONTENT)
                self.end_headers()
            else:
                self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
        except _ManualLLDServiceError as error:
            self._send_error(HTTPStatus.CONFLICT, str(error))
        except Exception as error:
            self._send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def do_POST(self) -> None:
        """Process one manual liquid-height action."""
        try:
            path = self.path.split("?", 1)[0]
            if path == "/start":
                self._handle_start()
            elif path == "/jog":
                self._handle_jog(self._read_json_body())
            elif path == "/step":
                self._handle_step(self._read_json_body())
            elif path == "/confirm":
                self._handle_confirm()
            elif path == "/cancel":
                self._handle_cancel()
            else:
                self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
        except _ManualLLDServiceError as error:
            self._send_error(HTTPStatus.CONFLICT, str(error))
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self._send_error(HTTPStatus.BAD_REQUEST, str(error))
        except Exception as error:
            self._send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def _handle_start(self) -> None:
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            self.server.robot_client.ensure_current_run_is_running()
            state.update({"controls_started": True, "controls_started_at": time()})
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_jog(self, body: Mapping[str, object]) -> None:
        distance_value = body.get("distance_mm", body.get("distance"))
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            if distance_value is None:
                direction = body.get("direction")
                jog_step = self._numeric_state_value(state, "jog_step_mm")
                if direction == "up":
                    distance_mm = jog_step
                elif direction == "down":
                    distance_mm = -jog_step
                else:
                    raise ValueError(
                        "Provide distance_mm, or set direction to 'up' or 'down'."
                    )
            else:
                distance_mm = self._finite_number(distance_value, "distance_mm")
            if distance_mm == 0:
                raise ValueError("distance_mm must be non-zero.")
            if abs(distance_mm) > self.server.max_jog_mm:
                raise ValueError(
                    f"A single jog cannot exceed {self.server.max_jog_mm:g} mm."
                )

            cumulative_z = self._numeric_state_value(state, "cumulative_z_mm")
            start_height = self._numeric_state_value(
                state, "start_height_from_bottom_mm"
            )
            minimum_height = self._numeric_state_value(
                state, "minimum_height_from_bottom_mm"
            )
            maximum_height = self._numeric_state_value(
                state, "maximum_height_from_bottom_mm"
            )
            next_cumulative_z = cumulative_z + distance_mm
            next_height = start_height + next_cumulative_z
            if not minimum_height <= next_height <= maximum_height:
                raise _ManualLLDServiceError(
                    f"Jog would place the tip at {next_height:.3f} mm from the well "
                    f"bottom; allowed range is {minimum_height:.3f} to "
                    f"{maximum_height:.3f} mm."
                )
            pipette_id = state.get("pipette_id")
            if not isinstance(pipette_id, str) or not pipette_id:
                raise _ManualLLDServiceError("The active session has no pipette_id.")

            command = self.server.robot_client.move_relative(
                pipette_id=pipette_id, distance_mm=distance_mm
            )
            result = command.get("result")
            position = result.get("position") if isinstance(result, dict) else None
            state.update(
                {
                    "controls_started": True,
                    "cumulative_z_mm": next_cumulative_z,
                    "height_from_bottom_mm": next_height,
                    "last_jog_mm": distance_mm,
                    "last_jog_at": time(),
                    "last_robot_position": position,
                }
            )
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_step(self, body: Mapping[str, object]) -> None:
        step_value = body.get("step_mm", body.get("step"))
        step_mm = self._finite_number(step_value, "step_mm")
        if step_mm <= 0:
            raise ValueError("step_mm must be greater than zero.")
        if step_mm > self.server.max_jog_mm:
            raise ValueError(f"step_mm cannot exceed {self.server.max_jog_mm:g} mm.")

        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            state.update({"jog_step_mm": step_mm, "step_updated_at": time()})
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_confirm(self) -> None:
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            height = self._numeric_state_value(state, "height_from_bottom_mm")
            minimum_height = self._numeric_state_value(
                state, "minimum_height_from_bottom_mm"
            )
            source_well_depth = self._numeric_state_value(state, "source_well_depth_mm")
            if not minimum_height <= height <= source_well_depth:
                raise _ManualLLDServiceError(
                    f"Cannot confirm {height:.3f} mm. Jog the tip inside the well "
                    f"between {minimum_height:.3f} and {source_well_depth:.3f} mm."
                )
            self.server.robot_client.ensure_current_run_is_running()
            state.update(
                {
                    "controls_started": True,
                    "status": "confirmed",
                    "confirmed": True,
                    "confirmed_at": time(),
                }
            )
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_cancel(self) -> None:
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            self.server.robot_client.ensure_current_run_is_running()
            state.update(
                {
                    "controls_started": True,
                    "status": "cancelled",
                    "confirmed": False,
                    "cancelled_at": time(),
                }
            )
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    @staticmethod
    def _require_waiting_state(state: Mapping[str, object]) -> None:
        if state.get("status") != "waiting" or state.get("confirmed") is not False:
            raise _ManualLLDServiceError(
                "There is no active calibration waiting for input. "
                f"Current status is {state.get('status')!r}."
            )
        if not state.get("session_id"):
            raise _ManualLLDServiceError("The waiting calibration has no session_id.")

    @staticmethod
    def _finite_number(value: object, name: str) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be a number.")
        result = float(value)
        if not math.isfinite(result):
            raise ValueError(f"{name} must be finite.")
        return result

    @staticmethod
    def _numeric_state_value(state: Mapping[str, object], key: str) -> float:
        value = state.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise _ManualLLDServiceError(f"The active session has no numeric {key}.")
        return float(value)

    def _read_json_body(self) -> Dict[str, object]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0 or content_length > 65536:
            raise ValueError("Request body must contain a small JSON object.")
        body = json.loads(self.rfile.read(content_length))
        if not isinstance(body, dict):
            raise ValueError("Request body must be a JSON object.")
        return body

    def _send_html(self) -> None:
        self.send_response(HTTPStatus.OK)
        self._send_common_headers()
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(_MANUAL_LLD_HTML)))
        self.end_headers()
        self.wfile.write(_MANUAL_LLD_HTML)

    def _send_json(self, status: HTTPStatus, body: Mapping[str, object]) -> None:
        payload = json.dumps(body, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self._send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: HTTPStatus, message: str) -> None:
        self._send_json(status, {"error": message, "status": status.value})

    def _send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")

    def log_message(self, format: str, *args: Any) -> None:
        """Log requests with a stable service prefix."""
        print(f"[manual-lld] {self.address_string()} - {format % args}")


def _get_manual_lld_public_host(bind_host: str) -> str:
    """Return a browser-reachable host name or IP for the pause message."""
    if MANUAL_LLD_PUBLIC_HOST:
        return MANUAL_LLD_PUBLIC_HOST
    if bind_host not in ("", "0.0.0.0", "::"):
        return bind_host

    candidate_addresses: List[str] = []
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as network_socket:
            network_socket.connect(("8.8.8.8", 80))
            candidate_addresses.append(network_socket.getsockname()[0])
    except OSError:
        pass
    try:
        host_name = socket.gethostname()
        candidate_addresses.extend(
            address[4][0]
            for address in socket.getaddrinfo(host_name, None, socket.AF_INET)
        )
    except OSError:
        pass
    return next(
        (address for address in candidate_addresses if not address.startswith("127.")),
        "127.0.0.1",
    )


class _ManualLLDService:
    """Lifecycle wrapper for the embedded manual LLD HTTP server."""

    def __init__(
        self,
        server: _ManualLLDHTTPServer,
        thread: threading.Thread,
        url: str,
    ) -> None:
        self.server = server
        self.thread = thread
        self.url = url

    @classmethod
    def start(cls, state: Mapping[str, object]) -> "_ManualLLDService":
        """Write the active state and start serving the calibration page."""
        state_store = _ManualLLDStateStore(Path(MANUAL_LLD_STATE_FILE))
        state_store.replace(state)
        server = _ManualLLDHTTPServer(
            (MANUAL_LLD_HTTP_HOST, MANUAL_LLD_HTTP_PORT),
            state_store=state_store,
            robot_client=_ManualLLDRobotServerClient(MANUAL_LLD_ROBOT_SERVER_URL),
            max_jog_mm=MANUAL_LLD_MAX_JOG_MM,
        )
        actual_port = int(server.server_address[1])
        public_host = _get_manual_lld_public_host(MANUAL_LLD_HTTP_HOST)
        url = f"http://{public_host}:{actual_port}"
        updated_state = dict(state)
        updated_state.update({"service_url": url, "service_started_at": time()})
        state_store.replace(updated_state)
        thread = threading.Thread(
            target=server.serve_forever,
            name="manual-lld-http",
            daemon=True,
        )
        thread.start()
        return cls(server=server, thread=thread, url=url)

    def close(self) -> None:
        """Stop the embedded server and release its listening port."""
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)


def _write_manual_lld_state(state: Dict[str, object]) -> None:
    """Atomically write the shared manual LLD state file."""
    state_directory = os.path.dirname(MANUAL_LLD_STATE_FILE)
    if state_directory:
        os.makedirs(state_directory, exist_ok=True)
    temporary_path = f"{MANUAL_LLD_STATE_FILE}.{uuid4().hex}.tmp"
    with open(temporary_path, "w", encoding="utf-8") as state_file:
        json.dump(state, state_file, indent=2, sort_keys=True)
        state_file.flush()
        os.fsync(state_file.fileno())
    os.replace(temporary_path, MANUAL_LLD_STATE_FILE)


def _read_manual_lld_state() -> Dict[str, object]:
    """Read the shared manual LLD state file."""
    with open(MANUAL_LLD_STATE_FILE, encoding="utf-8") as state_file:
        state = json.load(state_file)
    if not isinstance(state, dict):
        raise RuntimeError("manual_lld.json must contain a JSON object.")
    return state


def _wait_for_manual_lld_confirmation(
    session_id: str, start_height: float, source_well_depth: float
) -> Tuple[Dict[str, object], float]:
    """Poll the shared state until the active browser session saves a height."""
    while True:
        try:
            state = _read_manual_lld_state()
        except (FileNotFoundError, json.JSONDecodeError):
            sleep(MANUAL_LLD_POLL_INTERVAL_SECONDS)
            continue

        state_session_id = state.get("session_id")
        status = state.get("status")
        if state_session_id != session_id:
            raise RuntimeError(
                "The manual LLD service reset or replaced the active calibration "
                f"session. Expected {session_id}, found {state_session_id}."
            )
        if status == "cancelled":
            raise RuntimeError("Manual liquid-height calibration was cancelled.")
        if status == "confirmed" and state.get("confirmed") is True:
            cumulative_z = state.get("cumulative_z_mm")
            if isinstance(cumulative_z, bool) or not isinstance(
                cumulative_z, (int, float)
            ):
                raise RuntimeError(
                    "manual_lld.json confirmed without a numeric cumulative_z_mm."
                )
            height_from_bottom = start_height + float(cumulative_z)
            if not (
                MANUAL_LLD_MIN_HEIGHT_MM <= height_from_bottom <= source_well_depth
            ):
                raise RuntimeError(
                    "Confirmed manual liquid height is outside the source well: "
                    f"{height_from_bottom:.3f} mm from bottom; expected "
                    f"{MANUAL_LLD_MIN_HEIGHT_MM:.3f} to "
                    f"{source_well_depth:.3f} mm."
                )
            return state, height_from_bottom
        sleep(MANUAL_LLD_POLL_INTERVAL_SECONDS)


def _manually_set_liquid_height(
    fixture_settings: FixtureSettings, test_volume: float
) -> None:
    """Start the jog UI, wait for confirmation, and update liquid tracking."""
    if fixture_settings.ctx.is_simulating():
        print_info("Simulating manual LLD with the configured source liquid volume.")
        return

    source_well = fixture_settings.liquid_source
    source_well_depth = float(source_well.depth)
    start_height = source_well_depth + MANUAL_LLD_START_OFFSET_MM
    session_id = f"{fixture_settings.run_id}-{uuid4().hex}"
    pipette_id = fixture_settings.pipette._core.pipette_id  # type: ignore[attr-defined]
    try:
        existing_jog_step = _read_manual_lld_state().get("jog_step_mm")
    except (FileNotFoundError, json.JSONDecodeError, RuntimeError):
        existing_jog_step = None
    jog_step = (
        float(existing_jog_step)
        if isinstance(existing_jog_step, (int, float))
        and not isinstance(existing_jog_step, bool)
        and existing_jog_step > 0
        else MANUAL_LLD_DEFAULT_JOG_STEP_MM
    )

    fixture_settings.pipette.move_to(source_well.top(z=MANUAL_LLD_START_OFFSET_MM))
    waiting_state: Dict[str, object] = {
        "version": 1,
        "session_id": session_id,
        "status": "waiting",
        "confirmed": False,
        "created_at": time(),
        "pipette_id": pipette_id,
        "pipette_mount": fixture_settings.mount,
        "test_volume_ul": test_volume,
        "source_labware_uri": source_well.parent.uri,
        "source_well": source_well.well_name,
        "start_height_from_bottom_mm": start_height,
        "source_well_depth_mm": source_well_depth,
        "height_from_bottom_mm": start_height,
        "cumulative_z_mm": 0.0,
        "jog_step_mm": jog_step,
        "minimum_height_from_bottom_mm": MANUAL_LLD_MIN_HEIGHT_MM,
        "maximum_height_from_bottom_mm": start_height,
        "controls_started": False,
    }
    service = _ManualLLDService.start(waiting_state)
    print_info(
        "Manual LLD HTTP service started. "
        f"Open {service.url}; session: {session_id}."
    )
    try:
        fixture_settings.ctx.pause(
            f"Manual liquid-height detection for {test_volume:g} uL: open "
            f"{service.url} in a browser. Click 'Start', jog the pipette down to "
            "the liquid surface, then save the height. / 手动液面检测：请在浏览器"
            f"打开 {service.url}，为 {test_volume:g} uL 测试点击“开始调节”，"
            "移动枪头并保存高度。"
        )
        state, height_from_bottom = _wait_for_manual_lld_confirmation(
            session_id=session_id,
            start_height=start_height,
            source_well_depth=source_well_depth,
        )
    finally:
        service.close()

    consumed_state = dict(state)
    consumed_state.update(
        {
            "status": "consumed",
            "confirmed": False,
            "consumed_at": time(),
            "height_from_bottom_mm": height_from_bottom,
        }
    )
    _write_manual_lld_state(consumed_state)

    fixture_settings.pipette.move_to(source_well.top(z=MANUAL_LLD_START_OFFSET_MM))
    liquid_volume = source_well.volume_from_height(height_from_bottom)
    if not isinstance(liquid_volume, (int, float)):
        raise RuntimeError(
            "Could not convert the confirmed manual liquid height to a volume."
        )
    source_well.load_liquid(fixture_settings.liquid, float(liquid_volume))
    print_info(
        "Manual liquid height confirmed: "
        f"{height_from_bottom:.3f} mm from well bottom "
        f"({float(liquid_volume):.3f} uL)."
    )


def _initialize_liquid_height(
    fixture_settings: FixtureSettings, test_volume: float
) -> None:
    """Calibrate source liquid height for a test volume."""
    print_info(f"Calibrating liquid height for {test_volume:g} uL.")
    if fixture_settings.use_lld:
        fixture_settings.pipette.require_liquid_presence(fixture_settings.liquid_source)
    else:
        _manually_set_liquid_height(fixture_settings, test_volume)


def _calibrate_liquid_height_for_volume(
    fixture_settings: FixtureSettings,
    tip: int,
    test_volume: float,
    *,
    tip_already_attached: bool = False,
) -> None:
    """Calibrate liquid height before testing a new volume."""
    fixture_settings.pipette.configure_for_volume(test_volume)

    if not tip_already_attached:
        _configure_tip_count(fixture_settings, 0)
        probe_tip = _get_tips_for_test(fixture_settings, tip, False)[0]
        pick_up_tip_for_channel(fixture_settings, probe_tip, 0)

    fixture_settings.pipette._retract()
    maybe_switch_mode(fixture_settings, tip)
    _initialize_liquid_height(fixture_settings, test_volume)

    if not tip_already_attached:
        fixture_settings.pipette._retract()
        remove_tip(fixture_settings)


def _calibrate_liquid_height_if_volume_changed(
    fixture_settings: FixtureSettings,
    tip: int,
    test_volume: float,
    previous_volume: Optional[float],
    *,
    tip_already_attached: bool = False,
) -> float:
    """Calibrate only when entering a different test volume."""
    if previous_volume != test_volume:
        _calibrate_liquid_height_for_volume(
            fixture_settings,
            tip,
            test_volume,
            tip_already_attached=tip_already_attached,
        )
    return test_volume


def calculate_evaporation(
    ctx: ProtocolContext,
    fixture_settings: FixtureSettings,
    liq: SupportedLiquid,
    tip: Well,
) -> Tuple[List[List[MeasurementData]], float, float]:
    """This is done at the begining of the test and during the cavity test it happens again for each cavity."""
    print_info("Calculating evaporation.")
    print_info(
        f"Test source has {fixture_settings.liquid_source.current_liquid_volume()}"
    )
    fixture_settings.pipette._retract()
    blank_measurments: List[List[MeasurementData]] = []
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
                tip,
            )
        )
    asp_evaps = [
        calculate_change_in_volume(blank[0], blank[1], liq)
        for blank in blank_measurments
    ]
    disp_evaps = [
        calculate_change_in_volume(blank[1], blank[2], liq)
        for blank in blank_measurments
    ]
    for i in range(len(asp_evaps)):
        print(f"Trial {i+1} evap: aspirate {asp_evaps[i]} dispense {disp_evaps[i]}")
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
    return blank_measurments, avg_asp_evap, avg_disp_evap


def _get_passing_requirements(
    fixture_settings: FixtureSettings, tip: int, volume: float
) -> Optional[Tuple[float, float]]:
    if fixture_settings.fail_early:
        try:
            return QC_TEST_MIN_REQUIREMENTS[fixture_settings.pipette_channels][
                fixture_settings.pipette_volume
            ][tip][volume]
        except KeyError:
            print_error(
                f"No minimum requirements for the P{fixture_settings.pipette_volume} {fixture_settings.pipette_channels}channel with tip {tip} at {volume}"
            )
    return None


def _run(ctx: ProtocolContext, fixture_settings: FixtureSettings) -> None:
    """Run."""
    # close all gratings
    maybe_close_all_gratings(fixture_settings)

    first_tip = _get_tips_for_test(
        fixture_settings, fixture_settings.tip_sizes[0], True
    )[0]
    print_info("Picking up first tip.")
    _configure_tip_count(fixture_settings, 0)
    pick_up_tip_for_channel(fixture_settings, first_tip, 0)
    first_tip_size = fixture_settings.tip_sizes[0]
    first_test_volume = fixture_settings.volumes[first_tip_size][0]
    last_calibrated_volume = _calibrate_liquid_height_if_volume_changed(
        fixture_settings,
        first_tip_size,
        first_test_volume,
        None,
        tip_already_attached=True,
    )
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    blank_measurments, avg_asp_evap, avg_disp_evap = calculate_evaporation(
        ctx, fixture_settings, liq, first_tip
    )
    remove_tip(fixture_settings)

    measurements: Dict[float, List[List[MeasurementData]]] = {}
    last_measurement: Optional[MeasurementData] = blank_measurments[-1][-1]
    tip_sizes_done = []
    for tip in fixture_settings.tip_sizes:
        volumes_to_tests = fixture_settings.volumes[tip]
        if tip in tip_sizes_done or len(fixture_settings.volumes[tip]) == 0:
            volumes_to_tests = fixture_settings.extra_volumes[tip]
        for volume in volumes_to_tests:
            last_calibrated_volume = _calibrate_liquid_height_if_volume_changed(
                fixture_settings, tip, volume, last_calibrated_volume
            )
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
                tips = _get_tips_for_test(fixture_settings, tip, False, channel)
                print_info(str(tips))
                if channel == 7:
                    # Skip evaporation loss across the 8-channel nozzle-layout transition.
                    print_info(
                        "Switching to channel 7 and skipping evap loss application."
                    )
                    last_measurement = None
                actual_asp_list_channel: List[float] = []
                actual_disp_list_channel: List[float] = []

                for trial in range(fixture_settings.trials):
                    if fixture_settings.cavity_test and trial != 0 and trial % 15 == 0:
                        pick_up_tip_for_channel(fixture_settings, tips[0], 0)
                        print_info("calculating evap.")
                        (
                            blank_measurments,
                            avg_asp_evap,
                            avg_disp_evap,
                        ) = calculate_evaporation(
                            ctx, fixture_settings, liq, tips.pop(0)
                        )
                        remove_tip(fixture_settings)
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

                    full_tip_increment = (
                        len(fixture_settings.channels) == 8
                        and fixture_settings.increment
                    )
                    if full_tip_increment or (
                        fixture_settings.pipette_channels == 96
                        and not fixture_settings.single_tip_96
                    ):
                        asp_with_evap = (
                            asp_with_evap / fixture_settings.pipette_channels
                        )
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
                requirements: Optional[Tuple[float, float]] = _get_passing_requirements(
                    fixture_settings, tip, volume
                )
                if requirements:
                    if (
                        abs(dispense_d) > requirements[0]
                        or abs(dispense_cv) > requirements[1]
                    ):
                        print_error(
                            f"Pipette failed QC on channel {channel} tip {tip} volume {volume}"
                        )
                        raise RuntimeError(
                            f"Pipette failed on QC channel {channel} tip {tip} volume {volume}"
                        )
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
        maybe_close_all_gratings(fixture_settings)


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
    if fixture_settings.fast_simulate:
        # do LPC when it is simulating
        for tip in fixture_settings.tip_sizes:
            for channel in fixture_settings.channels:
                tips = _get_tips_for_test(fixture_settings, tip, False, channel)
                pick_up_tip_for_channel(fixture_settings, tips.pop(0), channel)
                remove_tip(fixture_settings)
        print_info("Simulating. Not running actual tests and stopping analysis.")
        return
    try:
        _store_config_as_old_style(fixture_settings)
        if _should_alter_discontinuity(fixture_settings):
            print_info("Adjusting z discontinuity for this pipette.")
        if fixture_settings.increment:
            _adjust_settings_for_increment(fixture_settings)
        _run(ctx, fixture_settings)
        if fixture_settings.ctx.params.upload_csv_automatically:  # type: ignore [attr-defined]
            print_info("Uploading CSV to Google Drive...")
            result = upload_data_to_google_drive(
                csv_file_path=fixture_settings.test_report.file_path
            )
            if not result:
                print_error("Failed to upload CSV to Google Drive.")
    except Exception as e:
        print_error(f"Captured traceback:\n{traceback.format_exc()}")
        raise e
    finally:
        if fixture_settings.recorder is not None:
            print_info("ending recording")
            fixture_settings.recorder.stop()
            fixture_settings.recorder.deactivate()
            set_output_file(None)
