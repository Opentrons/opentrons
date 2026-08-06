"""Gravimetric QC protocol."""

from typing import List, Dict, Tuple, Optional, Any, Union, cast, Generator
from contextlib import contextmanager
from dataclasses import dataclass, asdict, replace
from time import time
import copy
import json
import traceback
import asyncio

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Labware,
    Well,
    Liquid,
    LiquidClass,
    OFF_DECK,
    TrashBin,
)
from opentrons.protocol_api.module_contexts import FlexStackerContext
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    Coordinate,
    PositionReference,
)
from opentrons.protocol_api.core.engine import (
    transfer_components_executor as tx_comps_executor,
    pipette_movement_conflict,
)
from opentrons.protocol_engine import commands as protocol_engine_commands
from opentrons.protocol_engine.types import AddressableOffsetVector
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
from hardware_testing.drivers import (
    ImpactProtection_96ch as ImpactProtection96chDriver,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    clear_pipette_ul_per_mm,
)

from hardware_testing.drivers.data_center_client import (
    upload_data_to_google_drive,
)

# ------ TODO remove and move necessary libraries into a standard release library. ----
import importlib
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


metadata = {"protocolName": "Gravimetric QC V3 db"}
requirements = {"robotType": "Flex", "apiLevel": "2.29"}

SCALE_SECONDS_TO_TRUE_STABILIZE = 60 * 3
IMPACT_96CH_PIPETTE_MOVE_WAIT_SECONDS = 15

# Dual P50M/P1000M runs use the physical A3 collection position instead of a
# registered Flex trash bin. The active tip moves to this A3 height and ejects
# immediately without an additional Z home or relative move.
DUAL_MULTI_A3_DISPOSAL_SLOT = "A3"
DUAL_MULTI_A3_DROP_Z_MM = 40.0


# =============================================================================
# Merge review map
# =============================================================================
#
# This file is the v9.1.0 gravimetric baseline plus stacker and 96ch impact
# extensions. Use this map to review what changed without losing sight of the
# production CSV contract.
#
# Files in scope:
# - gravimetric.py: stacker-aware orchestration, deferred probe flow, and
#   end-of-run cleanup.
# - ImpactProtectionV2.py: port-aware V2 driver and ctx-aware connection
#   helpers used by the protocol.
# - ImpactProtection_96ch.py: new 96ch impact driver with Home/GetPipette and
#   left-pipette selection commands.
#
# What should stay production-shaped:
# - create_csv_test_report() call shape.
# - store_config_gm(), store_serial_numbers(), store_measurement(),
#   store_trial(), store_volume_per_channel(), store_volume_per_trial(),
#   store_volume_all(), store_encoder(), store_average_evaporation().
# - blank_trials handling and measurement loop ordering.
#
# Main extension zones:
# - Runtime params: mounts_to_test, use_96ch_stackers.
# - FixtureSettings.build(): dual impact connection, stacker bootstrap, shared
#   tiprack offsets, and optional trash-bin setup.
# - run() / _run_fixture(): per-mount orchestration, cleanup, and upload.
# - Stacker helpers: supply planning, rack refresh, recovery, and offset lookup.
# - 96ch hook points: deferred liquid probe, stacker-safe home, and end-of-run
#   home for the independent 96ch impact fixture.
#
# Review rule of thumb:
# - If a change touches report writes or measurement tags, it may change CSV
#   shape.
# - If a change touches stacker inventory, impact fixtures, or mount selection,
#   review the guarded extension sections.
# - If a change touches the new 96ch driver, verify command names, response
#   parsing, and home semantics.
# =============================================================================


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


# -----------------------------------------------------------------------------
# Production CSV settings model, extended only with mounts_to_test.
# -----------------------------------------------------------------------------


@dataclass(kw_only=True)
class CSVSettings:
    """All of the settings that are loaded from the CSV runtime parameter."""

    name: str
    increment: bool
    mount: str
    mounts_to_test: List[str]
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
    lld_every_tip: bool
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
        mounts_to_test = _parse_mounts_to_test(lookup_key("mount", csv_params))
        mount = mounts_to_test[0]
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
        lld_every_tip = bool(lookup_key("lld_every_tip", csv_params)[0] == "TRUE")
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
            mounts_to_test=mounts_to_test,
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
            lld_every_tip=lld_every_tip,
            single_tip_96=single_tip_96,
            cavity_test=cavity_test,
            touch_blank=touch_blank,
            retracted_offset=retracted_offset,
            gantry_speed=gantry_speed,
            liquid_class_test=liquid_class_test,
            fail_early=fail_early,
        )


# -----------------------------------------------------------------------------
# Production fixture settings, extended with stacker and 96ch impact state.
# -----------------------------------------------------------------------------


def _build_impact_protection_v2_with_port(
    simulate: bool, ctx: ProtocolContext, skip_port: str
) -> Tuple[ImpactProtectionV2.ImpactProtectionBase, Optional[str]]:
    """Build V2 with either the custom or stock v9.1.0 driver API."""
    builder = getattr(ImpactProtectionV2, "BuildImpactProtectionWithPort", None)
    if callable(builder):
        return cast(
            Tuple[ImpactProtectionV2.ImpactProtectionBase, Optional[str]],
            builder(simulate=simulate, ctx=ctx, skip_port=skip_port),
        )

    device = ImpactProtectionV2.BuildImpactProtection(
        simulate=simulate,
        skip_port=skip_port,
    )
    connected_port: Optional[str] = None
    if not simulate:
        port_value = getattr(device, "port", None)
        connected_port = port_value() if callable(port_value) else port_value
    return device, connected_port


def _build_impact_protection_96ch_with_port(
    simulate: bool,
    ctx: ProtocolContext,
    skip_ports: Optional[List[str]],
) -> Tuple[Optional[Any], Optional[str]]:
    """Build the custom 96ch driver, skipping it only during App analysis."""
    if ImpactProtection96chDriver is None:
        if not simulate:
            raise RuntimeError(
                "ImpactProtection_96ch driver is required for a real 96ch run."
            )
        print_warning(
            "ImpactProtection_96ch driver is unavailable during App analysis; "
            "skipping its simulated connection."
        )
        return None, None

    return ImpactProtection96chDriver.BuildImpactProtection96chWithPort(
        simulate=simulate,
        ctx=ctx,
        skip_port=skip_ports,
    )


def _cleanup_partial_fixture_build(
    recorder: Optional[GravimetricRecorder],
    env_sensor: Optional[Any],
    impact_v2: Optional[Any],
    impact_96ch: Optional[Any],
) -> None:
    """Release resources acquired before FixtureSettings.build() can return."""
    if recorder is not None:
        try:
            recorder.stop()
        except Exception as cleanup_error:
            print_warning(f"Error stopping partial recorder: {cleanup_error}")
        try:
            recorder.deactivate()
        except Exception as cleanup_error:
            print_warning(f"Error deactivating partial recorder: {cleanup_error}")

    for name, device in (
        ("environment sensor", env_sensor),
        ("Impact V2", impact_v2),
        ("96ch impact fixture", impact_96ch),
    ):
        if device is not None and hasattr(device, "close"):
            try:
                device.close()
            except Exception as cleanup_error:
                print_warning(f"Error closing partial {name}: {cleanup_error}")
    set_output_file(None)


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
    use_96ch_stackers: bool
    ImpactSerial_U: Optional[ImpactProtectionV2.ImpactProtectionBase]
    ImpactSerial_96: Optional[Any]
    stackers_96: Optional[Dict[str, "StackerState"]]
    active_96ch_racks_by_slot: Dict[str, Labware]
    tiprack_adapters_by_slot: Dict[str, Labware]
    shared_tiprack_offsets_by_slot: Dict[str, Point]

    @classmethod
    def build(
        cls,
        ctx: ProtocolContext,
        csv_params: Optional[List[List[str]]] = None,
        csv_settings: Optional[CSVSettings] = None,
        mount: Optional[str] = None,
    ) -> "FixtureSettings":
        """Parse the CSV file and build the fixture settings."""
        if csv_params is None:
            csv_params = (
                ctx.params.qc_test_profile.parse_as_csv()  # type: ignore [attr-defined]
            )
        if csv_settings is None:
            csv_settings = CSVSettings.parse_csv(csv_params, ctx.is_simulating())
        if mount is not None:
            csv_settings = replace(csv_settings, mount=mount)

        source_well = _load_or_get_labware(
            ctx,
            csv_settings.labware_on_scale,
            csv_settings.slot_scale,
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
            pipette_tag = f"pipette-{csv_settings.mount}"
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
        print_info(f"mount {csv_settings.mount}")

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
        env_sensor = None
        ImpactSerial = None
        ImpactSerial96 = None
        try:
            recorder.record(in_thread=True)
            env_sensor, link_port = AsairDriver.BuildAsairSensorWithPort(simulating)
            env_serial = env_sensor.get_serial()
            use_impact_protection = ctx.params.use_impact_protection  # type: ignore [attr-defined]
            use_96ch_stackers = getattr(ctx.params, "use_96ch_stackers", True)
            if use_impact_protection:
                if csv_settings.pipette_channels == 96:
                    skip_port = link_port if link_port is not None else ""
                    ImpactSerial, impact_1ch_8ch_port = (
                        _build_impact_protection_v2_with_port(
                            simulate=simulating,
                            ctx=ctx,
                            skip_port=skip_port,
                        )
                    )
                    skip_ports = [
                        p
                        for p in [link_port, impact_1ch_8ch_port]
                        if p is not None
                    ] or None
                    ImpactSerial96, impact_96ch_port = (
                        _build_impact_protection_96ch_with_port(
                            simulate=simulating,
                            ctx=ctx,
                            skip_ports=skip_ports,
                        )
                    )
                    print_info(
                        "96ch impact connected: "
                        f"V2={impact_1ch_8ch_port}, 96ch={impact_96ch_port}, "
                        f"env_skip={link_port}"
                    )
                else:
                    skip_port = link_port if link_port is not None else ""
                    ImpactSerial, impact_1ch_8ch_port = (
                        _build_impact_protection_v2_with_port(
                            simulate=simulating, ctx=ctx, skip_port=skip_port
                        )
                    )
                    print_info(
                        "Impact V2 connected: "
                        f"port={impact_1ch_8ch_port}, env_skip={link_port}"
                    )
        except Exception:
            _cleanup_partial_fixture_build(
                recorder,
                env_sensor,
                ImpactSerial,
                ImpactSerial96,
            )
            raise

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
        try:
            stackers_96 = _build_96ch_stackers(
                ctx, csv_settings, use_96ch_stackers
            )
            if not _uses_96ch_stackers(
                csv_settings, use_96ch_stackers
            ) and not _uses_no_trash_runtime_settings(csv_settings):
                _ensure_trash_bin(ctx)
            _do_simulating_lpc_moves(
                ctx, csv_settings, pipette, source_well, use_96ch_stackers
            )
        except Exception:
            _cleanup_partial_fixture_build(
                recorder,
                env_sensor,
                ImpactSerial,
                ImpactSerial96,
            )
            raise
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
            use_96ch_stackers=use_96ch_stackers,
            ImpactSerial_U=cast(
                Optional[ImpactProtectionV2.ImpactProtectionBase], ImpactSerial
            ),
            ImpactSerial_96=cast(Optional[Any], ImpactSerial96),
            stackers_96=stackers_96,
            active_96ch_racks_by_slot={},
            tiprack_adapters_by_slot={},
            shared_tiprack_offsets_by_slot={},
            **asdict(csv_settings),
        )


# -----------------------------------------------------------------------------
# Production-compatible report config write.
# -----------------------------------------------------------------------------


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


# -----------------------------------------------------------------------------
# Tip loading bridge.
# -----------------------------------------------------------------------------
#
# Non-stacker paths mirror production tip selection. 96ch stacker paths refresh
# racks first, then return the same kind of Well list that production code
# expects.


def _get_tips_for_test_single_multi(
    fixture_settings: FixtureSettings, tip: int, channel: int, blank: bool
) -> List[Well]:
    wells = []
    tipracks_lw = _get_csv_tipracks(fixture_settings, tip)
    if fixture_settings.pipette_channels == 8:
        if fixture_settings.increment:
            a_row_tips = [
                rack[f"A{col + 1}"] for rack in tipracks_lw for col in range(12)
            ]
            return [t for t in a_row_tips if _tip_has_not_been_used(t)]
        elif fixture_settings.cavity_test:
            # This should only ever be called once so hopefully this doesn't break anything
            # consume tips bottom to top, left to right
            for rack in tipracks_lw:
                for col in range(1, 13):  # H->A
                    for row in range(72, 64, -1):  # 1->12
                        next_tip = rack[f"{chr(row)}{col}"]
                        if _tip_has_not_been_used(next_tip):
                            wells.append(next_tip)
            return wells

        else:
            return [
                t
                for t in tips.get_tips_for_individual_channel_on_multi(
                    fixture_settings.ctx,
                    channel,
                    tip,
                    fixture_settings.pipette_volume,
                )
                if _tip_has_not_been_used(t)
            ]

    return _get_unused_tips_from_racks(tipracks_lw)


def _get_tips_for_test_96_single(
    fixture_settings: FixtureSettings, tip: int, blank: bool = False
) -> List[Well]:
    wells = _get_unused_tips_from_racks(_get_csv_tipracks(fixture_settings, tip))
    wells = sorted(
        wells,
        reverse=True,
        key=lambda well: f"{well.well_name[0]}{chr(int(well.well_name[1:]))}",
    )
    return wells


def _get_tips_for_test_96(
    fixture_settings: FixtureSettings, tip: int, blank: bool = False
) -> List[Well]:
    if fixture_settings.stackers_96 is not None:
        if blank:
            probe_slots = [fixture_settings.tips[tip][0]]
            tipracks_lw = _refresh_96ch_slot_group(fixture_settings, tip, probe_slots)
            return [rack.wells()[0] for rack in tipracks_lw]

        tipracks_lw = []
        for group_index, group in enumerate(FIXED_96CH_SWAP_GROUPS):
            slots = [slot for slot in group if slot in fixture_settings.tips[tip]]
            if not slots:
                continue
            if (
                _uses_p1000h_three_tip_stacker_plan(fixture_settings)
                and tip == 1000
            ):
                remaining_slots = [
                    slot
                    for later_group in FIXED_96CH_SWAP_GROUPS[group_index:]
                    for slot in later_group
                    if slot in fixture_settings.tips[tip]
                ]
                tipracks_lw.extend(
                    _refresh_p1000h_t1000_slots(
                        fixture_settings, tip, remaining_slots
                    )
                )
                break
            tipracks_lw.extend(_refresh_96ch_slot_group(fixture_settings, tip, slots))
        return [rack.wells()[0] for rack in tipracks_lw]

    slots_to_load = (
        [fixture_settings.tips[tip][0]]
        if blank
        else fixture_settings.tips[tip]
    )
    need_to_swap = [
        slot
        for slot in slots_to_load
        if slot in fixture_settings.active_96ch_racks_by_slot
    ]
    if len(need_to_swap) != 0:
        fixture_settings.pipette._retract()
        fixture_settings.ctx.pause(f"Replace slots {need_to_swap} with {tip}ul tips")
        for slot in need_to_swap:
            old_rack = fixture_settings.active_96ch_racks_by_slot.pop(slot)
            old_adapter = old_rack.parent
            fixture_settings.ctx._core.move_labware(
                old_rack._core,
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
            _forget_loaded_labware_in_slot(slot)
            fixture_settings.tiprack_adapters_by_slot.pop(slot, None)
    tipracks_lw = [
        _load_96ch_tiprack_on_adapter(fixture_settings, tip, slot)
        for slot in slots_to_load
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


# -----------------------------------------------------------------------------
# Runtime parameters.
# -----------------------------------------------------------------------------
#
# Production parameters stay together here. Extension switches are isolated in
# this same builder so the protocol upload UI remains the only runtime surface.


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
        display_name="Pipette Mounts To Test",
        variable_name="mounts_to_test",
        default="csv",
        choices=[
            {"display_name": "Use CSV profile", "value": "csv"},
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
            {"display_name": "Left and Right", "value": "both"},
        ],
        description="Choose which mounted pipette or pipettes to test.",
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
        display_name="Use 96CH Stackers",
        variable_name="use_96ch_stackers",
        default=True,
        description="Whether to use Flex Stackers for 96-channel full-rack testing.",
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


# -----------------------------------------------------------------------------
# Production-facing impact hooks.
# -----------------------------------------------------------------------------
#
# Measurement code calls these small hooks. The hardware-specific V2 and 96ch
# implementations live in the extension impact section below.


def maybe_close_all_gratings(fixture_settings: FixtureSettings) -> None:
    """Close all impact protection gratings if the use_impact_protection param is set."""
    if (
        not fixture_settings.ctx.is_simulating()
        and fixture_settings.use_impact_protection
    ):
        if fixture_settings.pipette_channels == 96:
            print_info(
                "96ch impact close sequence: closing V2 gratings; "
                "96ch fixture keeps last selected pipette mode"
            )
        _close_impact_protection_v2(fixture_settings)


def maybe_switch_mode(fixture_settings: FixtureSettings, tip: int) -> None:
    """Switch gratings mode if the use_impact_protection param is set."""
    if (
        not fixture_settings.ctx.is_simulating()
        and fixture_settings.use_impact_protection
    ):
        if fixture_settings.pipette_channels == 96:
            print_info(f"96ch impact switch sequence start: tip={tip}")
            _switch_impact_protection_v2(fixture_settings, tip)
            if fixture_settings.ImpactSerial_96:
                _configure_impact_protection_96ch(
                    fixture_settings.ctx,
                    fixture_settings.ImpactSerial_96,
                    tip,
                )
            print_info(f"96ch impact switch sequence done: tip={tip}")
        else:
            _switch_impact_protection_v2(fixture_settings, tip)


# -----------------------------------------------------------------------------
# Production-compatible tip handling and liquid measurement helpers.
# -----------------------------------------------------------------------------
#
# These functions should stay easy to compare with production. No-trash behavior
# is guarded for 96ch stacker runs and dual P50S/P1000S runs.


def _drop_dual_multi_tip_to_a3(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
) -> None:
    """Drop one active dual-M tip into the physical A3 opening.

    A3 is physically open on this fixture, so it must not be represented as a
    Flex ``movableTrashA3``. The ordinary A3 addressable area is compatible
    with the A4 staging fixture. ``ignoreTipConfiguration=True`` matches the
    standard Trash Bin path by centering the entire instrument over A3. This
    keeps the full 8-channel nozzle/ejector assembly inside the A3 opening
    instead of extending from an A1/H1 active nozzle toward the B3 tip rack.

    As in the original Trash Bin flow, Protocol Engine performs a safe arc
    move and lowers the active tip to 40 mm above the deck reference before
    ejecting it in place.
    """
    core = pipette._core  # type: ignore[attr-defined]
    engine_client = core._engine_client
    pipette_id = core._pipette_id
    annotations = core._protocol_core.annotation_ids

    ctx.comment(
        "dual M tip disposal: center the full instrument at A3, "
        "Z=+40 mm then eject tip"
    )
    engine_client.execute_command(
        protocol_engine_commands.MoveToAddressableAreaForDropTipParams(
            pipetteId=pipette_id,
            addressableAreaName=DUAL_MULTI_A3_DISPOSAL_SLOT,
            offset=AddressableOffsetVector(
                x=0,
                y=0,
                z=DUAL_MULTI_A3_DROP_Z_MM,
            ),
            forceDirect=False,
            speed=None,
            minimumZHeight=None,
            alternateDropLocation=False,
            ignoreTipConfiguration=True,
        ),
        annotations,
    )
    engine_client.execute_command(
        protocol_engine_commands.DropTipInPlaceParams(
            pipetteId=pipette_id,
            homeAfter=True,
        ),
        annotations,
    )


def remove_tip(fixture_settings: FixtureSettings) -> None:
    """Return, discard, or dispose of the active tip according to the run mode."""
    maybe_close_all_gratings(fixture_settings)
    if _uses_dual_multi_extension_deck(fixture_settings):
        _drop_dual_multi_tip_to_a3(
            fixture_settings.ctx,
            fixture_settings.pipette,
        )
    elif fixture_settings.return_tip or _uses_no_trash_runtime(fixture_settings):
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
    if _uses_96ch_stacker_runtime(fixture_settings):
        maybe_switch_mode(
            fixture_settings,
            _tip_size_from_rack(cast(Labware, tip.parent)),
        )
    offset = _get_offset_for_channel(fixture_settings, channel)
    point_offset = Point(x=offset.x, y=offset.y, z=offset.z)
    print_info(
        f"Picking up tip {tip.well_name} of rack {tip.parent.load_name} "
        f"with channel {channel} and offset {offset}"
    )
    fixture_settings.pipette.pick_up_tip(tip.top().move(point_offset))
    _USED_TIP_LOCATIONS.add(_tip_location_key(tip))
    if fixture_settings.increment and not fixture_settings.ctx.is_simulating():
        print_info("clearing pipette ul-per-mm table to be linear")
        from hardware_testing.opentrons_api.helpers_ot3 import (  # noqa: WPS433
            clear_pipette_ul_per_mm,
        )

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
        trash_location=_liquid_class_trash_location(fixture_settings),
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
    # Move away from the scale before opening/closing the impact protection.
    maybe_close_all_gratings(fixture_settings)
    if not _uses_no_trash_runtime(fixture_settings):
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

    maybe_switch_mode(fixture_settings, tip)
    print_info("Pre-aspirate read.")
    pre_aspirate = retract_and_wait(
        fixture_settings, MeasurementType.INIT, tip, volume, trial, channel=channel
    )
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    if fixture_settings.lld_every_tip:
        fixture_settings.pipette.require_liquid_presence(fixture_settings.liquid_source)
    elif last_measurement:
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


def calculate_evaporation(
    ctx: ProtocolContext,
    fixture_settings: FixtureSettings,
    liq: SupportedLiquid,
    tip: Well,
) -> Tuple[List[List[MeasurementData]], float, float]:
    """This is done at the begining of the test and during the cavity test it happens again for each cavity."""
    print_info("Detecting liquid height.")


    fixture_settings.pipette._retract()
    maybe_switch_mode(fixture_settings, fixture_settings.tip_sizes[0])

    fixture_settings.pipette.require_liquid_presence(fixture_settings.liquid_source)
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


# -----------------------------------------------------------------------------
# Main measurement loop. Keep this production-shaped; custom hook is deferred
# liquid probe only when stacker rack refresh must happen before probing.
# -----------------------------------------------------------------------------


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
    last_probed_tip_size = fixture_settings.tip_sizes[0]
    liq = SupportedLiquid.from_string(fixture_settings.liquid_name)
    blank_measurments, avg_asp_evap, avg_disp_evap = calculate_evaporation(
        ctx, fixture_settings, liq, first_tip
    )
    remove_tip(fixture_settings)

    measurements: Dict[float, List[List[MeasurementData]]] = {}
    last_measurement: Optional[MeasurementData] = blank_measurments[-1][-1]
    tip_sizes_done = []
    for tip in fixture_settings.tip_sizes:
        deferred_96ch_probe = False
        if tip != last_probed_tip_size:
            if _should_defer_96ch_stacker_probe(fixture_settings, tip):
                deferred_96ch_probe = True
            else:
                _configure_tip_count(fixture_settings, 0)
                probe_tip = _get_tips_for_test(fixture_settings, tip, True)[0]
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
                tips = _get_tips_for_test(fixture_settings, tip, False, channel)
                if deferred_96ch_probe:
                    tips = _run_deferred_96ch_stacker_probe(
                        fixture_settings, tip, tips
                    )
                    last_probed_tip_size = tip
                    deferred_96ch_probe = False
                print_info(str(tips))
                if channel == 7:
                    # we're doing an 8 channel test and just swapped over to the front channel.
                    print_info(
                        "Switching to channel 7, running LLD again and skipping evap loss application."
                    )
                    pick_up_tip_for_channel(fixture_settings, tips.pop(0), channel)
                    fixture_settings.pipette.require_liquid_presence(
                        fixture_settings.liquid_source
                    )
                    remove_tip(fixture_settings)
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




# =============================================================================
# Custom extension helpers
# =============================================================================
# Everything below this point supports stacker automation, independent 96ch impact
# protection, shared 96ch LPC offsets, and dual-mount orchestration. The
# production-shaped measurement/reporting code above should stay easy to compare
# against gravimetric_production.py.
#
# Extension subsystem map
# -----------------------
# - Drop-offset configuration:
#   _default_stacker_to_deck_drop_offsets(),
#   _default_deck_to_stacker_drop_offsets(),
#   _load_stacker_drop_offsets_config_for_run().
#
# - Stacker plan and inventory:
#   SupplySegment, StackerState, ActiveRack,
#   _build_96ch_stacker_supply_plan(), _find_supply(),
#   _find_recovery_target(), _refresh_96ch_slot_group().
#
# - Physical rack movement:
#   _move_rack_to_recovery(), _retrieve_rack_to_adapter(),
#   _retrieve_96ch_racks_to_empty_adapters().
#
# - Tiprack loading bridge used by the production-shaped code:
#   _get_csv_tipracks(), _load_csv_tipracks(), _get_unused_tips_from_racks(),
#   _load_96ch_tiprack_on_adapter().
#
# - 96ch impact fixture support:
#   _configure_impact_protection_96ch(),
#   maybe_home_impact_protection_96ch(),
#   maybe_home_impact_for_stacker_move().
#
# - Dual-mount execution:
#   _parse_mounts_to_test(), _get_mounts_to_test_from_runtime_param(),
#   _right_pipette_heat_guard(), _run_fixture(), run().
# =============================================================================


_USED_TIP_LOCATIONS: set[Tuple[str, str]] = set()
_DECK_LABWARE_BY_SLOT: Dict[str, Labware] = {}
_TRASH_BIN_LOADED = False
TIPRACK_ADAPTER = "opentrons_flex_96_tiprack_adapter"
SHARED_TIPRACK_OFFSET_REFERENCE_TIP = 50
STACKER_MODEL = "flexStackerModuleV1"
STACKER_HOPPER_CAPACITY = 6
STACKER_SLOTS = ["A4", "B4", "C4", "D4"]
DUAL_MULTI_TEST_SLOTS = ["D2", "D3", "B2", "B3"]
DUAL_MULTI_AUX_SLOT_BY_TEST_SLOT = {
    "D2": "A4",
    "D3": "B4",
    "B2": "C4",
    "B3": "D4",
}
DUAL_MULTI_RACK_SWAP_MOVES = [
    ("D2", "B1"),
    ("D3", "A1"),
    ("A4", "D2"),
    ("B4", "D3"),
    ("B2", "A4"),
    ("B3", "B4"),
    ("C4", "B2"),
    ("D4", "B3"),
]
IMPACT_96CH_STACKER_HOME_SLOTS = {"A1", "B1"}
STACKER_DROP_OFFSETS_CONFIG_FILE = "gravimetric_stacker_drop_offsets.json"
STACKER_TO_DECK_DROP_OFFSET_TARGETS = [
    "D2",
    "D3",
    "C2",
    "C3",
    "B1",
    "B2",
    "B3",
    "A1",
    "A2",
]
DECK_TO_STACKER_DROP_OFFSET_SOURCES = [
    "D2",
    "D3",
    "C2",
    "C3",
    "B1",
    "B2",
    "B3",
    "A1",
    "A2",
]


# -----------------------------------------------------------------------------
# Custom: stacker gripper drop-offset configuration.
# -----------------------------------------------------------------------------
#
# The gripper drop-offset table is deliberately kept outside the production
# measurement path. It only affects move_labware() pickup/drop mechanics during
# stacker rack exchange.
#
# Default offsets are in code so the protocol can parse without a separate file.
# Robot-specific tuning can be provided by gravimetric_stacker_drop_offsets.json.
# Search order:
# 1. GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG environment variable.
# 2. A file next to this protocol when __file__ is available.
# 3. infer_config_base_dir()/hardware_testing/gravimetric/protocol_replacement.
#
# Expected JSON shape:
# {
#   "stacker_to_deck": {
#     "B4": {
#       "B1": {"x": 2.0, "y": 0.0, "z": 0.0}
#     }
#   },
#   "deck_to_stacker": {
#     "D2": {
#       "B4": {"x": -1.5, "y": 0.0, "z": 0.0}
#     }
#   }
# }
#
# Direction names are literal:
# - stacker_to_deck: source is stacker slot, target is deck slot.
# - deck_to_stacker: source is deck slot, target is stacker slot.


def _zero_drop_offsets(
    source_slots: List[str], target_slots: List[str]
) -> Dict[Tuple[str, str], Dict[str, float]]:
    return {
        (source_slot, target_slot): {"x": 0.0, "y": 0.0, "z": 0.0}
        for source_slot in source_slots
        for target_slot in target_slots
    }


def _default_stacker_to_deck_drop_offsets(
) -> Dict[Tuple[str, str], Dict[str, float]]:
    offsets = _zero_drop_offsets(STACKER_SLOTS, STACKER_TO_DECK_DROP_OFFSET_TARGETS)
    offsets.update(
        {
            ("B4", "B1"): {"x": 2.0, "y": 0.0, "z": 0.0},
            ("C4", "C2"): {"x": 1.0, "y": 0.0, "z": 0.0},
            ("D4", "B1"): {"x": 2.0, "y": 0.0, "z": 0.0},
            ("D4", "B2"): {"x": 1.5, "y": 0.0, "z": 0.0},
            ("D4", "A1"): {"x": 2.0, "y": 0.0, "z": 0.0},
            ("D4", "A2"): {"x": 2.0, "y": 0.0, "z": 0.0},
        }
    )
    return offsets


def _default_deck_to_stacker_drop_offsets(
) -> Dict[Tuple[str, str], Dict[str, float]]:
    offsets = _zero_drop_offsets(DECK_TO_STACKER_DROP_OFFSET_SOURCES, STACKER_SLOTS)
    offsets.update(
        {
            ("D2", "B4"): {"x": -1.5, "y": 0.0, "z": 0.0},
            ("D3", "B4"): {"x": -1.5, "y": 0.0, "z": 0.0},
            ("C2", "B4"): {"x": -1.5, "y": 0.0, "z": 0.0},
            ("C3", "B4"): {"x": -1.5, "y": 0.0, "z": 0.0},
            ("B1", "C4"): {"x": -1.0, "y": 0.0, "z": 0.0},
            ("B2", "C4"): {"x": -1.0, "y": 0.0, "z": 0.0},
            ("B3", "C4"): {"x": -0.5, "y": 0.0, "z": 0.0},
            ("A1", "C4"): {"x": -1.5, "y": 0.0, "z": 0.0},
        }
    )
    return offsets


def _stacker_drop_offsets_config_paths() -> List[str]:
    paths = []
    env_path = os.environ.get("GRAVIMETRIC_STACKER_DROP_OFFSETS_CONFIG")
    if env_path:
        paths.append(env_path)
    protocol_file = globals().get("__file__")
    if protocol_file:
        paths.append(
            os.path.join(
                os.path.dirname(os.path.abspath(str(protocol_file))),
                STACKER_DROP_OFFSETS_CONFIG_FILE,
            )
        )
    paths.append(
        os.path.join(
            str(infer_config_base_dir()),
            "hardware_testing",
            "gravimetric",
            "protocol_replacement",
            STACKER_DROP_OFFSETS_CONFIG_FILE,
        )
    )
    unique_paths = []
    for path in paths:
        if path not in unique_paths:
            unique_paths.append(path)
    return unique_paths


def _parse_drop_offset_vector(
    direction_name: str,
    source_slot: str,
    target_slot: str,
    raw_vector: object,
) -> Dict[str, float]:
    if not isinstance(raw_vector, dict):
        raise ValueError(
            f"{direction_name}.{source_slot}.{target_slot} must be an object."
        )
    return {
        axis: float(raw_vector.get(axis, 0.0))
        for axis in ("x", "y", "z")
    }


def _parse_drop_offset_direction(
    direction_name: str,
    raw_direction: object,
) -> Dict[Tuple[str, str], Dict[str, float]]:
    if not isinstance(raw_direction, dict):
        raise ValueError(f"{direction_name} must be an object.")
    parsed: Dict[Tuple[str, str], Dict[str, float]] = {}
    for source_slot, raw_targets in raw_direction.items():
        if not isinstance(raw_targets, dict):
            raise ValueError(f"{direction_name}.{source_slot} must be an object.")
        for target_slot, raw_vector in raw_targets.items():
            parsed[(str(source_slot), str(target_slot))] = _parse_drop_offset_vector(
                direction_name,
                str(source_slot),
                str(target_slot),
                raw_vector,
            )
    return parsed


def _load_stacker_drop_offsets_config(
) -> Tuple[
    Dict[Tuple[str, str], Dict[str, float]],
    Dict[Tuple[str, str], Dict[str, float]],
]:
    stacker_to_deck_offsets = _default_stacker_to_deck_drop_offsets()
    deck_to_stacker_offsets = _default_deck_to_stacker_drop_offsets()
    for path in _stacker_drop_offsets_config_paths():
        if not os.path.exists(path):
            continue
        with open(path, "r") as config_file:
            raw_config = json.load(config_file)
        if not isinstance(raw_config, dict):
            raise ValueError(f"{path} must contain a JSON object.")
        stacker_to_deck_offsets.update(
            _parse_drop_offset_direction(
                "stacker_to_deck", raw_config.get("stacker_to_deck", {})
            )
        )
        deck_to_stacker_offsets.update(
            _parse_drop_offset_direction(
                "deck_to_stacker", raw_config.get("deck_to_stacker", {})
            )
        )
        break
    return stacker_to_deck_offsets, deck_to_stacker_offsets


(
    STACKER_TO_DECK_DROP_OFFSETS,
    DECK_TO_STACKER_DROP_OFFSETS,
) = (
    _default_stacker_to_deck_drop_offsets(),
    _default_deck_to_stacker_drop_offsets(),
)


def _load_stacker_drop_offsets_config_for_run(ctx: ProtocolContext) -> None:
    global STACKER_TO_DECK_DROP_OFFSETS, DECK_TO_STACKER_DROP_OFFSETS
    if ctx.is_simulating():
        return
    (
        STACKER_TO_DECK_DROP_OFFSETS,
        DECK_TO_STACKER_DROP_OFFSETS,
    ) = _load_stacker_drop_offsets_config()


# -----------------------------------------------------------------------------
# Custom: 96ch stacker supply/recovery model.
# -----------------------------------------------------------------------------
#
# Stacker inventory model
# -----------------------
# A Flex Stacker has a hopper and a shuttle. The protocol models each stacker as
# one or more SupplySegment values:
# - tip_size: the tiprack type in that segment.
# - hopper_count: racks available in the hopper.
# - shuttle_count: rack available on the shuttle before hopper racks.
# - shuttle_first: whether the shuttle rack should be consumed before hopper.
#
# This lets P1000H use mixed stackers without relying on the module to know the
# semantic type of every future rack. Recovery can intentionally store used racks
# as a T50 pool where required by the P1000H workflow; that behavior is isolated
# in _uses_t50_pool_for_p1000h_recovery() and _recovery_pool_tip_size().
#
# Priority rules:
# - Supply/recovery stacker priority is A4 -> B4 -> C4 -> D4.
# - Fixed deck refresh groups are D2/D3/C2/C3/B1/B2, then B3/A1/A2.
# - P1000H T1000 has a special first refresh for D2/D3/C2 so C4 can be emptied
#   before recovering remaining T200 racks into it.
#
# Keep rack planning here. The production-shaped _run() loop should only ask for
# tips; it should not contain stacker inventory details.


FIXED_96CH_SWAP_GROUPS = [
    ["D2", "D3", "C2", "C3", "B1", "B2"],
    ["B3", "A1", "A2"],
]
P1000H_T1000_FIRST_REFRESH_SLOTS = ["D2", "D3", "C2"]


@dataclass
class SupplySegment:
    """A physical stacker supply segment, split between hopper and shuttle."""

    tip_size: int
    hopper_count: int
    shuttle_count: int = 0
    shuttle_first: bool = True


@dataclass
class StackerState:
    """Track planned 96CH stacker inventory during a gravimetric run."""

    slot: str
    stacker: FlexStackerContext
    supply_queue: List[SupplySegment]
    configured_tip_size: Optional[int] = None
    stored_count: int = 0
    shuttle_rack: Optional[Labware] = None
    shuttle_tip_size: Optional[int] = None
    current_segment_is_supply: bool = False
    current_segment_shuttle_first: bool = True


@dataclass
class ActiveRack:
    """A tiprack currently sitting on a deck adapter."""

    tip_size: int
    rack: Labware
    adapter: Labware


# -----------------------------------------------------------------------------
# Custom: dual-mount runtime selection.
# -----------------------------------------------------------------------------


def _parse_mounts_to_test(mount_values: List[str]) -> List[str]:
    """Parse a CSV mount value into the ordered list of mounts to test."""
    mounts: List[str] = []
    for raw_mount in mount_values:
        for mount in raw_mount.replace("/", ",").replace(";", ",").split(","):
            normalized_mount = mount.strip().lower()
            if normalized_mount == "both":
                mounts.extend(["left", "right"])
            elif normalized_mount in ["left", "right"]:
                mounts.append(normalized_mount)
            elif normalized_mount:
                raise ValueError(
                    f'Unexpected mount "{mount}". Expected left, right, or both.'
                )

    mounts_deduped: List[str] = []
    for mount in mounts:
        if mount not in mounts_deduped:
            mounts_deduped.append(mount)
    if not mounts_deduped:
        raise ValueError("No mount was defined in the csv params.")
    return mounts_deduped


def _get_mounts_to_test_from_runtime_param(
    ctx: ProtocolContext, csv_settings: "CSVSettings"
) -> List[str]:
    mount_selection = ctx.params.mounts_to_test  # type: ignore[attr-defined]
    if mount_selection == "csv":
        return csv_settings.mounts_to_test
    return _parse_mounts_to_test([mount_selection])


def _uses_dual_multi_extension_deck(csv_settings: "CSVSettings") -> bool:
    """Whether this is a sequential dual P50M/P1000M extension-deck run."""
    return (
        csv_settings.pipette_channels == 8
        and csv_settings.pipette_volume in (50, 1000)
        and "left" in csv_settings.mounts_to_test
        and "right" in csv_settings.mounts_to_test
    )


def _uses_dual_single_no_trash(csv_settings: "CSVSettings") -> bool:
    """Whether this is a sequential dual P50S/P1000S no-trash run."""
    return (
        csv_settings.pipette_channels == 1
        and csv_settings.pipette_volume in (50, 1000)
        and "left" in csv_settings.mounts_to_test
        and "right" in csv_settings.mounts_to_test
    )


def _uses_dual_mount_no_trash(csv_settings: "CSVSettings") -> bool:
    """Whether a dual-pipette workflow returns tips instead of loading trash."""
    return _uses_dual_single_no_trash(csv_settings)


def _uses_no_trash_runtime_settings(csv_settings: "CSVSettings") -> bool:
    """Whether setup must avoid registering a physical trash bin."""
    return _uses_dual_single_no_trash(
        csv_settings
    ) or _uses_dual_multi_extension_deck(csv_settings)


# -----------------------------------------------------------------------------
# Custom: shared helpers for stacker labware bookkeeping and offsets.
# -----------------------------------------------------------------------------


def _deck_slot_key(slot: str) -> str:
    normalized_slot = str(slot).upper()
    if normalized_slot in {"A4", "B4", "C4", "D4"}:
        return normalized_slot
    return str(DeckSlotName.from_primitive(normalized_slot).to_ot3_equivalent())


def _nonzero_drop_offset(
    offsets: Dict[Tuple[str, str], Dict[str, float]],
    source_slot: str,
    target_slot: str,
) -> Optional[Dict[str, float]]:
    offset = offsets.get((source_slot, target_slot))
    if offset is None:
        return None
    normalized_offset = {
        axis: float(offset.get(axis, 0.0))
        for axis in ("x", "y", "z")
    }
    if all(value == 0.0 for value in normalized_offset.values()):
        return None
    return normalized_offset


def _drop_offset_for_stacker_to_deck(
    stacker_slot: str, deck_slot: str
) -> Optional[Dict[str, float]]:
    return _nonzero_drop_offset(
        STACKER_TO_DECK_DROP_OFFSETS, stacker_slot, deck_slot
    )


def _drop_offset_for_deck_to_stacker(
    deck_slot: str, stacker_slot: str
) -> Optional[Dict[str, float]]:
    return _nonzero_drop_offset(
        DECK_TO_STACKER_DROP_OFFSETS, deck_slot, stacker_slot
    )


def _should_home_96ch_impact_for_stacker_slot(slot: Optional[str]) -> bool:
    return slot is not None and _deck_slot_key(slot) in IMPACT_96CH_STACKER_HOME_SLOTS


def _register_loaded_labware_in_slot(slot: str, labware: Labware) -> None:
    _DECK_LABWARE_BY_SLOT[_deck_slot_key(slot)] = labware


def _forget_loaded_labware_in_slot(slot: str) -> None:
    _DECK_LABWARE_BY_SLOT.pop(_deck_slot_key(slot), None)


def _get_loaded_labware_in_slot(slot: str) -> Optional[Labware]:
    return _DECK_LABWARE_BY_SLOT.get(_deck_slot_key(slot))


def _load_or_get_labware(ctx: ProtocolContext, load_name: str, slot: str) -> Labware:
    existing_labware = _get_loaded_labware_in_slot(slot)
    if existing_labware is not None:
        if existing_labware.load_name != load_name:
            raise ValueError(
                f"Slot {slot} already has {existing_labware.load_name}, "
                f"not {load_name}."
            )
        return existing_labware
    labware = ctx.load_labware(load_name, slot)
    _register_loaded_labware_in_slot(slot, labware)
    return labware


def _ensure_trash_bin(ctx: ProtocolContext) -> None:
    global _TRASH_BIN_LOADED
    if not _TRASH_BIN_LOADED:
        ctx.load_trash_bin("A3")
        _TRASH_BIN_LOADED = True


def _tiprack_load_name(tip_size: int) -> str:
    return f"opentrons_flex_96_tiprack_{tip_size}ul"


def _dual_multi_tip_size_by_test_slot(
    csv_settings: "CSVSettings",
) -> Dict[str, int]:
    """Map the four CSV test slots to their configured tip sizes."""
    slot_to_tip_size: Dict[str, int] = {}
    for tip_size, slots in csv_settings.tips.items():
        for slot in slots:
            slot_key = _deck_slot_key(slot)
            if slot_key in slot_to_tip_size:
                raise RuntimeError(
                    "Dual multi slot "
                    f"{slot_key} is configured for more than one tip size."
                )
            slot_to_tip_size[slot_key] = tip_size

    expected_slots = set(DUAL_MULTI_TEST_SLOTS)
    configured_slots = set(slot_to_tip_size)
    if configured_slots != expected_slots:
        raise RuntimeError(
            "Dual P50M/P1000M mode requires CSV tiprack slots exactly "
            f"{DUAL_MULTI_TEST_SLOTS}; configured slots are "
            f"{sorted(configured_slots)}."
        )
    return {slot: slot_to_tip_size[slot] for slot in DUAL_MULTI_TEST_SLOTS}


def _prepare_dual_multi_extension_deck_layout(
    ctx: ProtocolContext, csv_settings: "CSVSettings"
) -> None:
    """Load the left test racks and matching right-side reserve racks."""
    if csv_settings.mounts_to_test != ["left", "right"]:
        raise RuntimeError(
            "Dual P50M/P1000M extension-deck mode must run left, then right."
        )

    reserved_slots = {
        *DUAL_MULTI_TEST_SLOTS,
        *DUAL_MULTI_AUX_SLOT_BY_TEST_SLOT.values(),
        "A1",
        "B1",
    }
    scale_slot = _deck_slot_key(csv_settings.slot_scale)
    if scale_slot in reserved_slots:
        raise RuntimeError(
            f"Scale slot {scale_slot} conflicts with the dual multi rack layout."
        )

    tip_size_by_test_slot = _dual_multi_tip_size_by_test_slot(csv_settings)
    for test_slot in DUAL_MULTI_TEST_SLOTS:
        tip_size = tip_size_by_test_slot[test_slot]
        reserve_slot = DUAL_MULTI_AUX_SLOT_BY_TEST_SLOT[test_slot]
        load_name = _tiprack_load_name(tip_size)
        _load_or_get_labware(ctx, load_name, test_slot)
        _load_or_get_labware(ctx, load_name, reserve_slot)
        ctx.comment(
            f"dual multi layout: T{tip_size} left rack at {test_slot}, "
            f"right reserve rack at {reserve_slot}"
        )


def _move_registered_labware_with_gripper(
    ctx: ProtocolContext, source_slot: str, target_slot: str
) -> None:
    """Move one deck labware and keep the protocol's slot cache synchronized."""
    source_slot = _deck_slot_key(source_slot)
    target_slot = _deck_slot_key(target_slot)
    labware = _get_loaded_labware_in_slot(source_slot)
    if labware is None:
        raise RuntimeError(f"No labware is registered in source slot {source_slot}.")
    target_labware = _get_loaded_labware_in_slot(target_slot)
    if target_labware is not None:
        raise RuntimeError(
            f"Cannot move {source_slot} to {target_slot}: target contains "
            f"{target_labware.load_name}."
        )

    ctx.comment(f"dual multi rack swap: {source_slot} -> {target_slot}")
    ctx.move_labware(labware, target_slot, use_gripper=True)
    _forget_loaded_labware_in_slot(source_slot)
    _register_loaded_labware_in_slot(target_slot, labware)


def _rearrange_tipracks_for_dual_multi_right_mount(
    ctx: ProtocolContext, csv_settings: "CSVSettings"
) -> None:
    """Replace left-used racks with A4-D4 reserve racks for the right run."""
    ctx.comment("start dual P50M/P1000M rack swap for right mount")
    for source_slot, target_slot in DUAL_MULTI_RACK_SWAP_MOVES:
        _move_registered_labware_with_gripper(ctx, source_slot, target_slot)

    tip_size_by_test_slot = _dual_multi_tip_size_by_test_slot(csv_settings)
    for test_slot, expected_tip_size in tip_size_by_test_slot.items():
        rack = _get_loaded_labware_in_slot(test_slot)
        if rack is None:
            raise RuntimeError(
                f"Dual multi rack swap left target slot {test_slot} empty."
            )
        actual_tip_size = _tip_size_from_rack(rack)
        if actual_tip_size != expected_tip_size:
            raise RuntimeError(
                f"Dual multi rack swap placed T{actual_tip_size} in {test_slot}; "
                f"expected T{expected_tip_size}."
            )
    ctx.comment("dual P50M/P1000M rack swap complete")


def _tip_size_from_rack(rack: Labware) -> int:
    load_name = rack.load_name.lower()
    for tip_size in [20, 50, 200, 1000]:
        if f"_{tip_size}ul" in load_name or f"_{tip_size}uL".lower() in load_name:
            return tip_size
    raise ValueError(f"Unable to determine tip size from labware {rack.load_name}.")


def _labware_offset_vector(labware: Labware) -> Point:
    return cast(
        Point,
        labware._core._engine_client.state.labware.get_labware_offset_vector(
            labware._core.labware_id
        ),
    )


def _should_share_tiprack_offsets(csv_settings: "CSVSettings") -> bool:
    return (
        csv_settings.pipette_channels == 96
        and SHARED_TIPRACK_OFFSET_REFERENCE_TIP in csv_settings.tip_sizes
    )


def _tip_sizes_for_lpc(csv_settings: "CSVSettings") -> List[int]:
    if _should_share_tiprack_offsets(csv_settings):
        return [SHARED_TIPRACK_OFFSET_REFERENCE_TIP]
    return csv_settings.tip_sizes


def _capture_or_apply_shared_tiprack_offset(
    fixture_settings: "FixtureSettings",
    tip: int,
    slot: str,
    rack: Labware,
) -> None:
    if not _should_share_tiprack_offsets(fixture_settings):
        return

    slot_key = _deck_slot_key(slot)
    if tip == SHARED_TIPRACK_OFFSET_REFERENCE_TIP:
        offset = _labware_offset_vector(rack)
        fixture_settings.shared_tiprack_offsets_by_slot[slot_key] = offset
        fixture_settings.ctx.comment(
            f"cache T{tip} LPC offset for slot {slot_key}: "
            f"x={offset.x}, y={offset.y}, z={offset.z}"
        )
        return

    reference_offset = fixture_settings.shared_tiprack_offsets_by_slot.get(slot_key)
    if reference_offset is None:
        fixture_settings.ctx.comment(
            f"no T{SHARED_TIPRACK_OFFSET_REFERENCE_TIP} LPC offset cached for "
            f"slot {slot_key}; keep T{tip} rack offset unchanged"
        )
        return

    rack.set_offset(
        reference_offset.x,
        reference_offset.y,
        reference_offset.z,
    )
    fixture_settings.ctx.comment(
        f"apply T{SHARED_TIPRACK_OFFSET_REFERENCE_TIP} LPC offset to T{tip} "
        f"rack in slot {slot_key}: x={reference_offset.x}, "
        f"y={reference_offset.y}, z={reference_offset.z}"
    )


def _first_96ch_stacker_tip(csv_settings: "CSVSettings") -> int:
    if csv_settings.pipette_volume <= 200 and 50 in csv_settings.tip_sizes:
        return 50
    if csv_settings.pipette_volume >= 1000 and 200 in csv_settings.tip_sizes:
        return 200
    return csv_settings.tip_sizes[0]


def _second_96ch_stacker_tip(csv_settings: "CSVSettings") -> int:
    if csv_settings.pipette_volume <= 200 and 200 in csv_settings.tip_sizes:
        return 200
    if csv_settings.pipette_volume >= 1000 and 1000 in csv_settings.tip_sizes:
        return 1000
    return csv_settings.tip_sizes[-1]


def _uses_p1000h_three_tip_stacker_plan(csv_settings: "CSVSettings") -> bool:
    return (
        csv_settings.pipette_channels == 96
        and csv_settings.pipette_volume >= 1000
        and all(tip in csv_settings.tip_sizes for tip in [50, 200, 1000])
    )


# Stacker placement entry point.
#
# Change this function when the physical starting layout changes. The rest of
# the stacker code consumes the resulting SupplySegment queues and should not
# need to know whether the plan is P200H or P1000H.
def _build_96ch_stacker_supply_plan(
    csv_settings: "CSVSettings",
) -> Dict[str, List[SupplySegment]]:
    if _uses_p1000h_three_tip_stacker_plan(csv_settings):
        plan = {
            "A4": [],
            "B4": [
                SupplySegment(50, hopper_count=0, shuttle_count=1),
                SupplySegment(200, hopper_count=6),
            ],
            "C4": [
                SupplySegment(200, hopper_count=3, shuttle_count=1),
                SupplySegment(1000, hopper_count=3),
            ],
            "D4": [SupplySegment(1000, hopper_count=6, shuttle_count=1)],
        }
        _validate_96ch_stacker_supply_plan(plan)
        return plan

    first_tip = _first_96ch_stacker_tip(csv_settings)
    second_tip = _second_96ch_stacker_tip(csv_settings)
    plan = {
        "A4": [],
        "B4": [SupplySegment(first_tip, hopper_count=6, shuttle_count=1)],
        "C4": [
            SupplySegment(first_tip, hopper_count=2, shuttle_count=1),
            SupplySegment(second_tip, hopper_count=4),
        ],
        "D4": [SupplySegment(second_tip, hopper_count=6)],
    }
    _validate_96ch_stacker_supply_plan(plan)
    return plan


def _validate_96ch_stacker_supply_plan(
    plan: Dict[str, List[SupplySegment]]
) -> None:
    max_total_capacity = STACKER_HOPPER_CAPACITY + 1
    for slot, segments in plan.items():
        total_count = sum(
            segment.hopper_count + segment.shuttle_count for segment in segments
        )
        hopper_count = sum(segment.hopper_count for segment in segments)
        shuttle_count = sum(segment.shuttle_count for segment in segments)
        if total_count > max_total_capacity:
            raise RuntimeError(
                f"Stacker {slot} plan requires {total_count} racks, "
                f"but max capacity is {max_total_capacity}."
            )
        if hopper_count > STACKER_HOPPER_CAPACITY:
            raise RuntimeError(
                f"Stacker {slot} plan requires {hopper_count} hopper racks, "
                f"but hopper capacity is {STACKER_HOPPER_CAPACITY}."
            )
        if shuttle_count > 1:
            raise RuntimeError(
                f"Stacker {slot} plan requires {shuttle_count} shuttle racks, "
                "but shuttle capacity is 1."
            )


def _uses_96ch_stackers(
    csv_settings: "CSVSettings", use_96ch_stackers: bool
) -> bool:
    return (
        use_96ch_stackers
        and csv_settings.pipette_channels == 96
        and not csv_settings.single_tip_96
    )


def _load_simulating_96ch_stacker_lpc_layout(
    ctx: ProtocolContext,
    csv_settings: "CSVSettings",
) -> None:
    """Load active 96CH deck tip rack positions during analysis for LPC."""
    tip_size = (
        csv_settings.tip_sizes[0]
        if _uses_p1000h_three_tip_stacker_plan(csv_settings)
        else _first_96ch_stacker_tip(csv_settings)
    )
    load_name = _tiprack_load_name(tip_size)
    active_slots = csv_settings.tips.get(tip_size, [])
    for slot in active_slots:
        adapter = ctx.load_adapter(TIPRACK_ADAPTER, slot)
        _register_loaded_labware_in_slot(slot, adapter)
        rack = adapter.load_labware(load_name)
        _register_loaded_labware_in_slot(slot, rack)


def _build_96ch_stackers(
    ctx: ProtocolContext,
    csv_settings: "CSVSettings",
    use_96ch_stackers: bool,
) -> Optional[Dict[str, StackerState]]:
    if not _uses_96ch_stackers(csv_settings, use_96ch_stackers):
        return None
    supply_plan = _build_96ch_stacker_supply_plan(csv_settings)
    stackers = {
        slot: StackerState(
            slot=slot,
            stacker=ctx.load_module(STACKER_MODEL, slot),  # type: ignore[arg-type]
            supply_queue=list(supply_plan[slot]),
        )
        for slot in STACKER_SLOTS
    }
    if ctx.is_simulating():
        _load_simulating_96ch_stacker_lpc_layout(ctx, csv_settings)
        ctx.comment(
            "simulating: loaded A4/B4/C4/D4 stackers and active 96CH deck "
            "tip racks for LPC; skip stacker runtime actions"
        )
        return None
    return stackers


def _configure_stacker(
    ctx: ProtocolContext,
    state: StackerState,
    tip_size: int,
    hopper_count: int,
    shuttle_count: int = 0,
    shuttle_first: bool = True,
) -> None:
    if shuttle_count not in (0, 1):
        raise RuntimeError(f"Stacker {state.slot} shuttle_count must be 0 or 1.")
    if hopper_count > STACKER_HOPPER_CAPACITY:
        raise RuntimeError(
            f"Stacker {state.slot} hopper_count={hopper_count} exceeds "
            f"{STACKER_HOPPER_CAPACITY}."
        )

    state.stacker.set_stored_labware(
        load_name=_tiprack_load_name(tip_size),
        count=hopper_count,
    )
    state.configured_tip_size = tip_size
    state.stored_count = hopper_count
    state.shuttle_tip_size = tip_size if shuttle_count else None
    state.shuttle_rack = (
        state.stacker.load_labware(_tiprack_load_name(tip_size))
        if shuttle_count and shuttle_first
        else None
    )
    state.current_segment_is_supply = False
    state.current_segment_shuttle_first = shuttle_first
    ctx.comment(
        f"stacker {state.slot}: configured T{tip_size}, "
        f"hopper_count={hopper_count}, shuttle_count={shuttle_count}, "
        f"shuttle_first={shuttle_first}"
    )


def _ensure_supply_segment(ctx: ProtocolContext, state: StackerState) -> None:
    if state.stored_count != 0 or not state.supply_queue:
        return
    if state.shuttle_rack is not None:
        return
    segment = state.supply_queue.pop(0)
    _configure_stacker(
        ctx,
        state,
        segment.tip_size,
        segment.hopper_count,
        segment.shuttle_count,
        segment.shuttle_first,
    )
    state.current_segment_is_supply = True


def _stackers_in_priority_order(
    stackers: Dict[str, StackerState]
) -> List[StackerState]:
    return [stackers[slot] for slot in STACKER_SLOTS if slot in stackers]


def _find_supply(
    ctx: ProtocolContext, stackers: Dict[str, StackerState], tip_size: int
) -> StackerState:
    for state in _stackers_in_priority_order(stackers):
        _ensure_supply_segment(ctx, state)
    for state in _stackers_in_priority_order(stackers):
        if not state.current_segment_is_supply:
            continue
        if (
            state.shuttle_tip_size == tip_size
            and state.shuttle_rack is not None
        ) or (state.configured_tip_size == tip_size and state.stored_count > 0):
            return state
    raise RuntimeError(f"No stacker supply available for T{tip_size}.")


def _can_recover_to_state(state: StackerState, tip_size: int) -> bool:
    return (
        state.configured_tip_size == tip_size
        and not state.current_segment_is_supply
        and not state.supply_queue
        and state.shuttle_rack is None
        and state.stored_count <= STACKER_HOPPER_CAPACITY
    )


def _uses_t50_pool_for_p1000h_recovery(
    fixture_settings: "FixtureSettings",
) -> bool:
    return _uses_p1000h_three_tip_stacker_plan(fixture_settings)


def _recovery_pool_tip_size(
    fixture_settings: "FixtureSettings", rack_tip_size: int
) -> int:
    if _uses_t50_pool_for_p1000h_recovery(fixture_settings):
        return SHARED_TIPRACK_OFFSET_REFERENCE_TIP
    return rack_tip_size


def _find_recovery_target(
    ctx: ProtocolContext,
    stackers: Dict[str, StackerState],
    tip_size: int,
) -> StackerState:
    for state in _stackers_in_priority_order(stackers):
        if _can_recover_to_state(state, tip_size):
            return state

    for state in _stackers_in_priority_order(stackers):
        if (
            state.stored_count == 0
            and state.shuttle_rack is None
            and not state.supply_queue
        ):
            _configure_stacker(ctx, state, tip_size, hopper_count=0)
            return state

    raise RuntimeError(f"No recovery capacity available for T{tip_size}.")


def _t50_stacker_store_labware_height(ctx: ProtocolContext) -> float:
    if ctx.is_simulating():
        return 0.0
    # The Flex 96 T50/T200/T1000 racks share the same external stacker geometry.
    return 99.0


def _unsafe_store_recovered_rack_as_t50_pool(
    ctx: ProtocolContext,
    target: StackerState,
    rack: Labware,
) -> None:
    stacker_core = cast(Any, target.stacker._core)
    stacker_core._sync_module_hardware.store_labware(
        labware_height=_t50_stacker_store_labware_height(ctx)
    )
    ctx._core.move_labware(
        rack._core,
        new_location=OFF_DECK,
        use_gripper=False,
        pause_for_manual_move=False,
        pick_up_offset=None,
        drop_offset=None,
    )


def _move_rack_to_recovery(
    fixture_settings: "FixtureSettings",
    active_rack: ActiveRack,
    recovery_tip_size_override: Optional[int] = None,
) -> Labware:
    ctx = fixture_settings.ctx
    stackers = fixture_settings.stackers_96
    if stackers is None:
        raise RuntimeError("96ch stackers are not initialized.")
    recovery_tip_size = (
        recovery_tip_size_override
        if recovery_tip_size_override is not None
        else _recovery_pool_tip_size(fixture_settings, active_rack.tip_size)
    )
    target = _find_recovery_target(
        ctx,
        stackers,
        recovery_tip_size,
    )
    source_slot = _deck_slot_key(str(active_rack.adapter.parent))
    drop_offset = _drop_offset_for_deck_to_stacker(source_slot, target.slot)
    ctx.comment(
        f"recover T{active_rack.tip_size} rack from {active_rack.adapter.parent} "
        f"to stacker {target.slot}"
        + (
            f" as T{recovery_tip_size} pool"
            if recovery_tip_size != active_rack.tip_size
            else ""
        )
        + (
            f" with drop_offset={drop_offset}"
            if drop_offset is not None
            else ""
        )
    )
    ctx.move_labware(
        active_rack.rack,
        target.stacker,
        use_gripper=True,
        drop_offset=drop_offset,
    )
    target.shuttle_rack = active_rack.rack
    target.shuttle_tip_size = recovery_tip_size
    if target.stored_count < STACKER_HOPPER_CAPACITY:
        if recovery_tip_size == active_rack.tip_size:
            target.stacker.store()
        else:
            _unsafe_store_recovered_rack_as_t50_pool(
                ctx, target, active_rack.rack
            )
        target.stored_count += 1
        target.shuttle_rack = None
        target.shuttle_tip_size = None
    else:
        ctx.comment(
            f"stacker {target.slot}: hopper full; keep T{active_rack.tip_size} "
            "rack on shuttle"
        )
    return active_rack.adapter


def _load_or_get_tiprack_adapter(
    fixture_settings: "FixtureSettings", slot: str
) -> Labware:
    existing_labware = fixture_settings.tiprack_adapters_by_slot.get(slot)
    if existing_labware is None:
        existing_labware = _get_loaded_labware_in_slot(slot)
        if existing_labware is not None:
            if existing_labware.load_name != TIPRACK_ADAPTER:
                raise RuntimeError(
                    f"Slot {slot} already has {existing_labware.load_name}, "
                    f"not {TIPRACK_ADAPTER}."
                )
            fixture_settings.tiprack_adapters_by_slot[slot] = existing_labware
            return existing_labware

    if existing_labware is None:
        adapter = cast(Labware, fixture_settings.ctx.load_adapter(TIPRACK_ADAPTER, slot))
        fixture_settings.tiprack_adapters_by_slot[slot] = adapter
        _register_loaded_labware_in_slot(slot, adapter)
        return adapter
    if existing_labware.load_name != TIPRACK_ADAPTER:
        raise RuntimeError(
            f"Slot {slot} already has {existing_labware.load_name}, "
            f"not {TIPRACK_ADAPTER}."
        )
    return existing_labware


def _load_initial_deck_96ch_rack(
    fixture_settings: "FixtureSettings",
    tip: int,
    adapter: Labware,
) -> Labware:
    fixture_settings.ctx.comment(
        f"use initial deck T{tip} rack on adapter {adapter.parent}"
    )
    rack = adapter.load_labware(_tiprack_load_name(tip))
    _capture_or_apply_shared_tiprack_offset(
        fixture_settings, tip, str(adapter.parent), rack
    )
    return rack


def _recover_96ch_active_rack(
    fixture_settings: "FixtureSettings",
    slot: str,
) -> Labware:
    existing_rack = fixture_settings.active_96ch_racks_by_slot.get(slot)
    if existing_rack is None:
        raise RuntimeError(f"No active 96ch rack is loaded in slot {slot}.")
    if fixture_settings.stackers_96 is None:
        raise RuntimeError("96ch stackers are not initialized.")

    adapter = cast(Labware, existing_rack.parent)
    existing_tip = _tip_size_from_rack(existing_rack)
    fixture_settings.ctx.comment(
        f"prepare impact protection before recovering T{existing_tip} rack"
    )
    maybe_home_impact_for_stacker_move(fixture_settings, slot)
    empty_adapter = _move_rack_to_recovery(
        fixture_settings,
        ActiveRack(tip_size=existing_tip, rack=existing_rack, adapter=adapter),
    )
    fixture_settings.active_96ch_racks_by_slot.pop(slot, None)
    return empty_adapter


def _try_recover_96ch_active_rack(
    fixture_settings: "FixtureSettings",
    slot: str,
) -> Optional[Labware]:
    try:
        return _recover_96ch_active_rack(fixture_settings, slot)
    except RuntimeError as error:
        if "No recovery capacity available" in str(error):
            return None
        raise


def _rack_has_used_tips(rack: Labware) -> bool:
    return any(not _tip_has_not_been_used(well) for well in rack.wells())


def _recover_96ch_slots_before_retrieving(
    fixture_settings: "FixtureSettings",
    tip: int,
    slots: List[str],
) -> Dict[str, Labware]:
    """Recover every used rack in a slot group before retrieving replacements."""
    empty_adapters_by_slot: Dict[str, Labware] = {}
    pending_slots = list(slots)

    while pending_slots:
        recovered_any = False
        still_pending: List[str] = []
        for slot in pending_slots:
            empty_adapter = _try_recover_96ch_active_rack(fixture_settings, slot)
            if empty_adapter is None:
                still_pending.append(slot)
            else:
                empty_adapters_by_slot[slot] = empty_adapter
                recovered_any = True
        if still_pending and not recovered_any:
            raise RuntimeError(
                f"Unable to recover all old racks before retrieving T{tip} "
                f"racks in slots {still_pending}: no recovery capacity available."
            )
        pending_slots = still_pending

    return empty_adapters_by_slot


def _retrieve_96ch_racks_to_empty_adapters(
    fixture_settings: "FixtureSettings",
    tip: int,
    slots: List[str],
    empty_adapters_by_slot: Dict[str, Labware],
) -> Dict[str, Labware]:
    tipracks_by_slot: Dict[str, Labware] = {}
    for slot in slots:
        fixture_settings.ctx.comment(
            f"prepare impact protection before retrieving T{tip} rack from stacker"
        )
        maybe_home_impact_for_stacker_move(fixture_settings, slot)
        tipracks_by_slot[slot] = _retrieve_rack_to_adapter(
            fixture_settings.ctx,
            fixture_settings.stackers_96,
            tip,
            empty_adapters_by_slot[slot],
        ).rack
        _capture_or_apply_shared_tiprack_offset(
            fixture_settings, tip, slot, tipracks_by_slot[slot]
        )
        fixture_settings.active_96ch_racks_by_slot[slot] = tipracks_by_slot[slot]
    return tipracks_by_slot


# P1000H T1000 transition helper.
#
# This exists because C4 must be emptied by retrieving its T1000 racks before
# remaining T200 racks can be recovered into C4. Keep this separate from the
# generic refresh path so the special P1000H inventory transition is visible.
def _refresh_p1000h_t1000_slots(
    fixture_settings: "FixtureSettings",
    tip: int,
    slots: List[str],
) -> List[Labware]:
    """Run the P1000H T200-to-T1000 stacker handoff in the planned order."""
    first_slots = [
        slot for slot in P1000H_T1000_FIRST_REFRESH_SLOTS if slot in slots
    ]
    second_slots = [slot for slot in slots if slot not in first_slots]
    tipracks_by_slot: Dict[str, Labware] = {}

    if first_slots:
        empty_adapters_by_slot = _recover_96ch_slots_before_retrieving(
            fixture_settings, tip, first_slots
        )
        tipracks_by_slot.update(
            _retrieve_96ch_racks_to_empty_adapters(
                fixture_settings, tip, first_slots, empty_adapters_by_slot
            )
        )

    if second_slots:
        empty_adapters_by_slot = _recover_96ch_slots_before_retrieving(
            fixture_settings, tip, second_slots
        )
        tipracks_by_slot.update(
            _retrieve_96ch_racks_to_empty_adapters(
                fixture_settings, tip, second_slots, empty_adapters_by_slot
            )
        )

    return [tipracks_by_slot[slot] for slot in slots]


# Generic 96ch rack refresh.
#
# This is the main "test volume finished, recover old racks, retrieve new racks"
# function for 96ch stacker mode. If a rack-capacity bug appears, inspect this
# together with _find_recovery_target() and _retrieve_96ch_racks_to_empty_adapters().
def _refresh_96ch_slot_group(
    fixture_settings: "FixtureSettings",
    tip: int,
    slots: List[str],
) -> List[Labware]:
    """Load or swap a fixed 96CH slot group in batch order."""
    tipracks_by_slot: Dict[str, Labware] = {}
    existing_slots: List[str] = []

    for slot in slots:
        existing_rack = fixture_settings.active_96ch_racks_by_slot.get(slot)
        if existing_rack is not None:
            if _rack_has_used_tips(existing_rack):
                existing_slots.append(slot)
            else:
                tipracks_by_slot[slot] = existing_rack
            continue

        tipracks_by_slot[slot] = _load_96ch_tiprack_on_adapter(
            fixture_settings, tip, slot
        )

    if existing_slots:
        fixture_settings.pipette._retract()
    if (
        existing_slots
        and _uses_p1000h_three_tip_stacker_plan(fixture_settings)
    ):
        empty_adapters_by_slot = _recover_96ch_slots_before_retrieving(
            fixture_settings, tip, existing_slots
        )
        tipracks_by_slot.update(
            _retrieve_96ch_racks_to_empty_adapters(
                fixture_settings, tip, existing_slots, empty_adapters_by_slot
            )
        )
        return [tipracks_by_slot[slot] for slot in slots]

    pending_slots = list(existing_slots)
    empty_adapters_by_slot: Dict[str, Labware] = {}
    while pending_slots or empty_adapters_by_slot:
        recovered_any = False
        still_pending: List[str] = []
        for slot in pending_slots:
            empty_adapter = _try_recover_96ch_active_rack(fixture_settings, slot)
            if empty_adapter is None:
                still_pending.append(slot)
            else:
                empty_adapters_by_slot[slot] = empty_adapter
                recovered_any = True
        pending_slots = still_pending

        retrieved_any = False
        for slot in list(empty_adapters_by_slot.keys()):
            fixture_settings.ctx.comment(
                f"prepare impact protection before retrieving T{tip} rack from stacker"
            )
            maybe_home_impact_for_stacker_move(fixture_settings, slot)
            tipracks_by_slot[slot] = _retrieve_rack_to_adapter(
                fixture_settings.ctx,
                fixture_settings.stackers_96,
                tip,
                empty_adapters_by_slot.pop(slot),
            ).rack
            _capture_or_apply_shared_tiprack_offset(
                fixture_settings, tip, slot, tipracks_by_slot[slot]
            )
            fixture_settings.active_96ch_racks_by_slot[slot] = tipracks_by_slot[slot]
            retrieved_any = True

        if pending_slots and not recovered_any and not retrieved_any:
            raise RuntimeError(
                f"Unable to refresh T{tip} racks in slots {pending_slots}: "
                "no recovery capacity available and no emptied adapters to refill."
            )

    return [tipracks_by_slot[slot] for slot in slots]


def _retrieve_rack_to_adapter(
    ctx: ProtocolContext,
    stackers: Dict[str, StackerState],
    tip_size: int,
    adapter: Labware,
) -> ActiveRack:
    source = _find_supply(ctx, stackers, tip_size)
    adapter_slot = _deck_slot_key(str(adapter.parent))
    drop_offset = _drop_offset_for_stacker_to_deck(source.slot, adapter_slot)
    ctx.comment(
        f"retrieve T{tip_size} rack from stacker {source.slot} to {adapter.parent}"
        + (
            f" with drop_offset={drop_offset}"
            if drop_offset is not None
            else ""
        )
    )
    use_shuttle = (
        source.shuttle_tip_size == tip_size
        and source.shuttle_rack is not None
        and (source.current_segment_shuttle_first or source.stored_count == 0)
    )
    if use_shuttle:
        rack = source.shuttle_rack
        source.shuttle_rack = None
        source.shuttle_tip_size = None
        if source.stored_count == 0:
            source.current_segment_is_supply = False
    else:
        rack = source.stacker.retrieve()
        source.stored_count -= 1
        if source.stored_count == 0 and source.shuttle_rack is None:
            source.current_segment_is_supply = False
    ctx.move_labware(rack, adapter, use_gripper=True, drop_offset=drop_offset)
    return ActiveRack(tip_size=tip_size, rack=rack, adapter=adapter)


def _get_csv_tipracks(fixture_settings: "FixtureSettings", tip: int) -> List[Labware]:
    """Load or retrieve tip racks in the order specified by the CSV profile."""
    return [
        _load_or_get_labware(
            fixture_settings.ctx,
            _tiprack_load_name(tip),
            slot,
        )
        for slot in fixture_settings.tips[tip]
    ]


def _load_csv_tipracks(
    ctx: ProtocolContext, csv_settings: "CSVSettings", tip: int
) -> List[Labware]:
    """Load or retrieve CSV tip racks without needing a full FixtureSettings."""
    return [
        _load_or_get_labware(
            ctx,
            _tiprack_load_name(tip),
            slot,
        )
        for slot in csv_settings.tips[tip]
    ]


def _get_unused_tips_from_racks(racks: List[Labware]) -> List[Well]:
    """Return unused tips from the given racks without resetting tip order."""
    wells: List[Well] = []
    rows = "ABCDEFGH"
    for rack in racks:
        for col in range(1, 13):
            for row in rows:
                well_name = f"{row}{col}"
                next_tip = rack.next_tip(1, rack[well_name])
                if (
                    next_tip is not None
                    and well_name == next_tip.well_name
                    and _tip_has_not_been_used(rack[well_name])
                ):
                    wells.append(rack[well_name])
    return wells


def _tip_location_key(tip: Well) -> Tuple[str, str]:
    rack = tip.parent
    return f"{rack.load_name}:{id(rack)}", tip.well_name


def _tip_has_not_been_used(tip: Well) -> bool:
    return tip.has_tip and _tip_location_key(tip) not in _USED_TIP_LOCATIONS


def _do_simulating_lpc_moves(
    ctx: ProtocolContext,
    csv_settings: "CSVSettings",
    pipette: InstrumentContext,
    source_well: Well,
    use_96ch_stackers: bool,
) -> None:
    """Touch CSV tip racks and scale labware during analysis so LPC is offered."""
    if not ctx.is_simulating():
        return
    if _uses_96ch_stackers(csv_settings, use_96ch_stackers):
        print_info(
            "Simulating 96CH stacker LPC layout was handled by stacker "
            "calibration moves."
        )
        return
    print_info(f"Simulating LPC moves for {csv_settings.mount} mount.")
    for tip in _tip_sizes_for_lpc(csv_settings):
        for tiprack in _load_csv_tipracks(ctx, csv_settings, tip):
            available_tips = _get_unused_tips_from_racks([tiprack])
            if not available_tips:
                print_warning(
                    f"No simulated {tip} uL tips available in slot {tiprack.parent} "
                    f"for {csv_settings.mount} LPC moves."
                )
                continue
            lpc_tip = available_tips[0]
            pipette.pick_up_tip(lpc_tip)
            pipette.aspirate(min(tip, pipette.max_volume), source_well)
            pipette.dispense(min(tip, pipette.max_volume), source_well)
            if _uses_dual_single_no_trash(csv_settings):
                pipette.return_tip()
            elif _uses_dual_multi_extension_deck(csv_settings):
                _drop_dual_multi_tip_to_a3(ctx, pipette)
            else:
                pipette.drop_tip()


# -----------------------------------------------------------------------------
# Custom: right-mount current guard for dual P1000S/P50S/P1000M/P50M workflows.
# -----------------------------------------------------------------------------


def _right_pipette_axes() -> List[Axis]:
    return [Axis.P_R]


def _set_hold_current_for_axis(
    ctx: ProtocolContext, axis: Axis, current: float
) -> None:
    """Set hold current on a backend axis from the protocol sync context."""
    hw_api = ctx._core.get_hardware()
    backend = hw_api._backend
    result = backend.set_hold_current({axis: current})
    if asyncio.iscoroutine(result):
        asyncio.run_coroutine_threadsafe(
            result, hw_api._obj_to_adapt._loop
        ).result()


def _set_default_currents(ctx: ProtocolContext) -> None:
    """Restore the OT3 backend's configured default motor currents."""
    hw_api = ctx._core.get_hardware()
    backend = hw_api._backend
    result = backend.set_default_currents()
    if asyncio.iscoroutine(result):
        asyncio.run_coroutine_threadsafe(
            result, hw_api._obj_to_adapt._loop
        ).result()


def _set_right_pipette_axes_engaged(ctx: ProtocolContext, engaged: bool) -> None:
    """Engage or disengage the right pipette axes to control motor heat."""
    if ctx.is_simulating():
        return
    hw_api = ctx._core.get_hardware()
    axes = _right_pipette_axes()
    if hasattr(hw_api, "axis_is_present"):
        axes = [axis for axis in axes if hw_api.axis_is_present(axis)]
    if not axes:
        return
    if engaged:
        _set_default_currents(ctx)
        print_info("Engaging right pipette axes for right mount testing.")
        hw_api.engage_axes(axes)
    else:
        print_info("Lowering and disengaging right pipette plunger to prevent heating.")
        _set_hold_current_for_axis(ctx, Axis.P_R, 0.1)
        hw_api.disengage_axes(axes)


@contextmanager
def _right_pipette_heat_guard(
    ctx: ProtocolContext, active_mount: str, enabled: bool
) -> Generator[None, None, None]:
    """Keep the right pipette cold unless the right mount is under test."""
    if not enabled:
        yield
        return
    right_mount_active = active_mount == "right"
    try:
        _set_right_pipette_axes_engaged(ctx, right_mount_active)
        yield
    finally:
        try:
            _set_right_pipette_axes_engaged(ctx, False)
        except Exception as cleanup_error:
            print_warning(
                f"Failed to disengage right pipette after {active_mount} test: "
                f"{cleanup_error}"
            )


def _should_manage_right_pipette_heat(mounts_to_test: List[str]) -> bool:
    """Only manage right heat when both left and right are tested in one run."""
    return "left" in mounts_to_test and "right" in mounts_to_test


def _load_96ch_tiprack_on_adapter(
    fixture_settings: FixtureSettings,
    tip: int,
    slot: str,
) -> Labware:
    if fixture_settings.stackers_96 is not None:
        existing_rack = fixture_settings.active_96ch_racks_by_slot.get(slot)
        if existing_rack is not None:
            existing_tip = _tip_size_from_rack(existing_rack)
            if existing_tip != tip:
                raise RuntimeError(
                    f"Slot {slot} already has T{existing_tip}, cannot load T{tip}."
                )
            return existing_rack

        adapter = _load_or_get_tiprack_adapter(fixture_settings, slot)

        if tip == fixture_settings.tip_sizes[0]:
            rack = _load_initial_deck_96ch_rack(fixture_settings, tip, adapter)
        else:
            fixture_settings.ctx.comment(
                f"prepare impact protection before retrieving T{tip} rack from stacker"
            )
            maybe_home_impact_for_stacker_move(fixture_settings, slot)
            rack = _retrieve_rack_to_adapter(
                fixture_settings.ctx,
                fixture_settings.stackers_96,
                tip,
                adapter,
            ).rack
            _capture_or_apply_shared_tiprack_offset(
                fixture_settings, tip, slot, rack
            )
        fixture_settings.active_96ch_racks_by_slot[slot] = rack
        return rack

    existing_rack = _get_loaded_labware_in_slot(slot)
    if existing_rack is not None:
        if existing_rack.load_name == TIPRACK_ADAPTER:
            rack = existing_rack.load_labware(_tiprack_load_name(tip))
            _register_loaded_labware_in_slot(slot, rack)
            _capture_or_apply_shared_tiprack_offset(
                fixture_settings, tip, slot, rack
            )
            fixture_settings.active_96ch_racks_by_slot[slot] = rack
            return rack
        existing_tip = _tip_size_from_rack(existing_rack)
        if existing_tip != tip:
            raise RuntimeError(
                f"Slot {slot} already has T{existing_tip}, cannot load T{tip}."
            )
        fixture_settings.active_96ch_racks_by_slot[slot] = existing_rack
        return existing_rack
    rack = fixture_settings.ctx.load_labware(
        _tiprack_load_name(tip),
        slot,
        adapter=TIPRACK_ADAPTER,
    )
    _register_loaded_labware_in_slot(slot, rack)
    _capture_or_apply_shared_tiprack_offset(fixture_settings, tip, slot, rack)
    fixture_settings.active_96ch_racks_by_slot[slot] = rack
    return rack


# -----------------------------------------------------------------------------
# Custom: deferred liquid probe after stacker rack refresh.
# -----------------------------------------------------------------------------
#
# Production behavior probes liquid as soon as the next tip size starts. In
# stacker mode that can consume a rack before the old rack set has been recovered,
# leaving no recovery capacity. These helpers delay the probe until the deck has
# already been refreshed with the next tip size, then replace the probe rack
# before formal testing starts.
#
# Keep this as the only measurement-loop hook for stacker-specific liquid probe
# sequencing. If another probe timing rule is needed, add it here instead of
# spreading stacker checks through _run().


def _should_defer_96ch_stacker_probe(
    fixture_settings: FixtureSettings, tip: int
) -> bool:
    if (
        _uses_96ch_stacker_runtime(fixture_settings)
        and fixture_settings.stackers_96 is not None
        and _uses_p1000h_three_tip_stacker_plan(fixture_settings)
        and tip in (200, 1000)
    ):
        return True
    return (
        _uses_96ch_stacker_runtime(fixture_settings)
        and fixture_settings.stackers_96 is not None
        and not _uses_p1000h_three_tip_stacker_plan(fixture_settings)
        and fixture_settings.pipette_volume <= 200
        and 50 in fixture_settings.tip_sizes
        and 200 in fixture_settings.tip_sizes
        and tip == 200
    )


def _p200h_deferred_probe_recovery_pool_tip_size(
    fixture_settings: FixtureSettings, tip: int
) -> Optional[int]:
    """Recover the P200H T200 probe rack into the existing T50 recovery pool."""
    if (
        _uses_96ch_stacker_runtime(fixture_settings)
        and fixture_settings.stackers_96 is not None
        and not _uses_p1000h_three_tip_stacker_plan(fixture_settings)
        and fixture_settings.pipette_volume <= 200
        and 50 in fixture_settings.tip_sizes
        and 200 in fixture_settings.tip_sizes
        and tip == 200
    ):
        return SHARED_TIPRACK_OFFSET_REFERENCE_TIP
    return None


def _run_deferred_96ch_stacker_probe(
    fixture_settings: FixtureSettings, tip: int, tips: List[Well]
) -> List[Well]:
    if fixture_settings.stackers_96 is None:
        raise RuntimeError("96ch stackers are not initialized.")
    if not tips:
        raise RuntimeError(f"No T{tip} rack is available for liquid probe.")

    probe_tip = tips[0]
    probe_rack = cast(Labware, probe_tip.parent)
    probe_adapter = cast(Labware, probe_rack.parent)
    probe_slot = _deck_slot_key(str(probe_adapter.parent))
    fixture_settings.ctx.comment(
        f"run T{tip} liquid probe after refreshing deck racks"
    )

    _configure_tip_count(fixture_settings, 0)
    pick_up_tip_for_channel(fixture_settings, probe_tip, 0)
    fixture_settings.pipette.require_liquid_presence(
        fixture_settings.liquid_source
    )
    remove_tip(fixture_settings)

    fixture_settings.ctx.comment(
        f"replace T{tip} liquid-probe rack in slot {probe_slot} before testing"
    )
    fixture_settings.ctx.comment(
        f"prepare impact protection before recovering T{tip} liquid-probe rack"
    )
    maybe_home_impact_for_stacker_move(fixture_settings, probe_slot)
    empty_adapter = _move_rack_to_recovery(
        fixture_settings,
        ActiveRack(tip_size=tip, rack=probe_rack, adapter=probe_adapter),
        recovery_tip_size_override=_p200h_deferred_probe_recovery_pool_tip_size(
            fixture_settings, tip
        ),
    )
    fixture_settings.active_96ch_racks_by_slot.pop(probe_slot, None)
    fixture_settings.ctx.comment(
        f"prepare impact protection before retrieving replacement T{tip} rack"
    )
    maybe_home_impact_for_stacker_move(fixture_settings, probe_slot)
    replacement_rack = _retrieve_rack_to_adapter(
        fixture_settings.ctx,
        fixture_settings.stackers_96,
        tip,
        empty_adapter,
    ).rack
    _capture_or_apply_shared_tiprack_offset(
        fixture_settings, tip, probe_slot, replacement_rack
    )
    fixture_settings.active_96ch_racks_by_slot[probe_slot] = replacement_rack

    return [
        replacement_rack.wells()[0]
        if cast(Labware, tip_to_use.parent) is probe_rack
        else tip_to_use
        for tip_to_use in tips
    ]


# -----------------------------------------------------------------------------
# Extension impact implementations. Runtime parameters are defined above in
# add_parameters().
# -----------------------------------------------------------------------------


# -----------------------------------------------------------------------------
# Impact protection. Production V2 support plus independent 96ch fixture.
# -----------------------------------------------------------------------------


def _configure_impact_protection_96ch(
    ctx: ProtocolContext,
    impact_serial: Any,
    tip_volume: int,
) -> None:
    cmd_name = ""
    if tip_volume == 1000:
        cmd_name = "set_left_p1000"
        state = impact_serial.set_left_p1000()
    elif tip_volume in (50, 200):
        cmd_name = "set_left_p200"
        state = impact_serial.set_left_p200()
    elif tip_volume == 20:
        cmd_name = "set_left_p20"
        state = impact_serial.set_left_p20()
    else:
        raise RuntimeError(
            f"Unsupported 96ch tip volume for impact protection: {tip_volume}"
        )

    print_info(
        f"96ch impact command: tip={tip_volume}, cmd={cmd_name}, response={state.raw_response}"
    )
    ctx.delay(seconds=0.1, msg=f"96ch impact set state: {state.raw_response}")
    if "OK" not in state.raw_response:
        raise RuntimeError(
            f"96ch impact protection pipette switch failed: {state.raw_response}"
        )
    if "OK_ALREADY" not in state.raw_response:
        ctx.delay(
            seconds=IMPACT_96CH_PIPETTE_MOVE_WAIT_SECONDS,
            msg=(
                "Waiting for 96ch impact motor to reach position: "
                f"tip={tip_volume}, cmd={cmd_name}"
            ),
        )


def _impact_96ch_response_needs_motion_wait(state: Any) -> bool:
    response = state.raw_response.upper()
    if "OK_ALREADY" in response:
        return False
    home_command = (
        getattr(ImpactProtection96chDriver, "CMD_HOME", "Home")
        if ImpactProtection96chDriver is not None
        else "Home"
    )
    if state.command == home_command:
        return False
    return True


def maybe_home_impact_protection_96ch(
    fixture_settings: FixtureSettings, reason: str = ""
) -> None:
    """Home the independent 96ch impact fixture when it is connected."""
    if (
        fixture_settings.ctx.is_simulating()
        or not fixture_settings.use_impact_protection
        or fixture_settings.pipette_channels != 96
        or not fixture_settings.ImpactSerial_96
    ):
        return

    reason_msg = f" for {reason}" if reason else ""
    print_info(f"96ch impact home sequence{reason_msg}")
    state = fixture_settings.ImpactSerial_96.home()
    print_info(f"96ch impact home command: response={state.raw_response}")
    fixture_settings.ctx.delay(
        seconds=0.1,
        msg=f"96ch impact home state: {state.raw_response}",
    )
    if "OK" not in state.raw_response:
        raise RuntimeError(
            "96ch impact protection home failed: "
            f"{state.raw_response}"
        )
    if _impact_96ch_response_needs_motion_wait(state):
        fixture_settings.ctx.delay(
            seconds=IMPACT_96CH_PIPETTE_MOVE_WAIT_SECONDS,
            msg="Waiting for 96ch impact motor to reach home position",
        )


def _switch_impact_protection_v2(
    fixture_settings: FixtureSettings, tip: int
) -> None:
    if not fixture_settings.ImpactSerial_U:
        return

    tip_mode_by_size = {
        20: "T50",
        50: "T50",
        200: "T50",
        1000: "T1000",
    }
    side = "LEFT" if fixture_settings.mount == "left" else "RIGHT"
    mode = f"SET_{side}_{tip_mode_by_size[tip]}"
    print_info(
        f"Impact V2 command: tip={tip}, cmd={mode}, "
        f"pipette_channels={fixture_settings.pipette_channels}"
    )
    impp = fixture_settings.ImpactSerial_U.switch_mode(mode)
    fixture_settings.ctx.delay(
        seconds=0.1,
        msg=f"switch_mode state :{impp.raw_response}",
    )
    if "OK" not in impp.raw_response:
        raise RuntimeError("Collision avoidance switch failed to activate.")


def _close_impact_protection_v2(fixture_settings: FixtureSettings) -> None:
    if not fixture_settings.ImpactSerial_U:
        return

    print_info(
        f"Impact V2 close_all_gratings: pipette_channels={fixture_settings.pipette_channels}"
    )
    impp = fixture_settings.ImpactSerial_U.close_all_gratings()
    fixture_settings.ctx.delay(
        seconds=0.1,
        msg=f"close_all_gratings state :{impp.raw_response}",
    )
    if "OK" not in impp.raw_response:
        raise RuntimeError(
            "close all gratings Collision avoidance switch failed to activate. "
            f"{impp.raw_response}"
        )


# -----------------------------------------------------------------------------
# Production liquid-handling helpers with guarded stacker-specific behavior.
# -----------------------------------------------------------------------------


def maybe_home_impact_for_stacker_move(
    fixture_settings: FixtureSettings, deck_slot: Optional[str] = None
) -> None:
    """Prepare impact protection for stacker moves that need fixture clearance."""
    if (
        fixture_settings.ctx.is_simulating()
        or not fixture_settings.use_impact_protection
        or not _should_home_96ch_impact_for_stacker_slot(deck_slot)
    ):
        return

    _close_impact_protection_v2(fixture_settings)
    maybe_home_impact_protection_96ch(
        fixture_settings, f"stacker move at {_deck_slot_key(deck_slot)}"
    )


def _uses_96ch_stacker_runtime(fixture_settings: FixtureSettings) -> bool:
    """Whether this run should avoid trash-only 96CH actions."""
    return (
        fixture_settings.use_96ch_stackers
        and fixture_settings.pipette_channels == 96
        and not fixture_settings.single_tip_96
    )


def _uses_no_trash_runtime(fixture_settings: FixtureSettings) -> bool:
    """Whether this run returns tips and does not load or visit a trash bin."""
    return (
        _uses_96ch_stacker_runtime(fixture_settings)
        or _uses_no_trash_runtime_settings(fixture_settings)
    )


def _liquid_class_trash_location(
    fixture_settings: FixtureSettings,
) -> Union[Location, TrashBin]:
    """Return a liquid-class trash fallback without requiring a loaded trash bin."""
    if _uses_no_trash_runtime(fixture_settings):
        return fixture_settings.liquid_source.top()
    return fixture_settings.pipette.trash_container  # type: ignore[return-value]


def _close_device(name: str, device: object) -> None:
    if device is None or not hasattr(device, "close"):
        return
    try:
        device.close()  # type: ignore[attr-defined]
    except Exception as cleanup_error:
        print_warning(f"Error closing {name}: {cleanup_error}")


# -----------------------------------------------------------------------------
# Run orchestration. Production run body is extracted so dual-mount runs can
# create independent reports and always clean up each fixture.
# -----------------------------------------------------------------------------


def _run_fixture(
    ctx: ProtocolContext, fixture_settings: FixtureSettings, manage_right_heat: bool
) -> None:
    """Run one configured pipette fixture and clean up its recorder."""
    _MEASUREMENTS.clear()
    try:
        with _right_pipette_heat_guard(
            ctx, fixture_settings.mount, manage_right_heat
        ):
            if fixture_settings.fast_simulate:
                # do LPC when it is simulating
                for tip in _tip_sizes_for_lpc(fixture_settings):
                    for channel in fixture_settings.channels:
                        tips = _get_tips_for_test(
                            fixture_settings, tip, False, channel
                        )
                        pick_up_tip_for_channel(
                            fixture_settings, tips.pop(0), channel
                        )
                        remove_tip(fixture_settings)
                print_info(
                    "Simulating. Not running actual tests and stopping analysis."
                )
                return
            _store_config_as_old_style(fixture_settings)
            if _should_alter_discontinuity(fixture_settings):
                print_info("Adjusting z discontinuity for this pipette.")
            if fixture_settings.increment:
                _adjust_settings_for_increment(fixture_settings)
            _run(ctx, fixture_settings)
            maybe_home_impact_protection_96ch(fixture_settings, "test complete")
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
        _close_device("environment sensor", fixture_settings.env_sensor)
        _close_device("Impact V2", fixture_settings.ImpactSerial_U)
        _close_device("96ch impact fixture", fixture_settings.ImpactSerial_96)


def run(ctx: ProtocolContext) -> None:
    """Pick up, aspirate, and dispense one trial and write it to the report."""
    # Development note:
    # Production has a single FixtureSettings.build() + run body. This protocol
    # keeps the same body in _run_fixture() so each selected mount can get its own
    # report/recorder/cleanup lifecycle. Add new per-run setup here only when it
    # must happen once for the whole protocol, not once per mount.
    _load_stacker_drop_offsets_config_for_run(ctx)
    _USED_TIP_LOCATIONS.clear()
    _DECK_LABWARE_BY_SLOT.clear()
    csv_params = (
        ctx.params.qc_test_profile.parse_as_csv()  # type: ignore[attr-defined]
    )
    csv_settings = CSVSettings.parse_csv(csv_params, ctx.is_simulating())
    mounts_to_test = _get_mounts_to_test_from_runtime_param(ctx, csv_settings)
    csv_settings = replace(
        csv_settings,
        mount=mounts_to_test[0],
        mounts_to_test=mounts_to_test,
    )
    dual_multi_extension_deck = _uses_dual_multi_extension_deck(csv_settings)
    dual_mount_no_trash = _uses_dual_mount_no_trash(csv_settings)
    if dual_mount_no_trash:
        csv_settings = replace(csv_settings, return_tip=True)
        ctx.comment(
            "dual P50S/P1000S mode: force return_tip and "
            "skip the trash bin"
        )
    elif dual_multi_extension_deck:
        csv_settings = replace(csv_settings, return_tip=False)
        ctx.comment(
            "dual P50M/P1000M mode: drop every tip at centered A3 with "
            "Z=+40 mm; do not return tips"
        )
    if dual_multi_extension_deck:
        _prepare_dual_multi_extension_deck_layout(ctx, csv_settings)
    manage_right_heat = _should_manage_right_pipette_heat(csv_settings.mounts_to_test)
    if manage_right_heat:
        _set_right_pipette_axes_engaged(ctx, False)

    for mount_index, mount in enumerate(csv_settings.mounts_to_test):
        if manage_right_heat and mount == "left":
            _set_right_pipette_axes_engaged(ctx, False)
        print_title(f"Starting gravimetric test on {mount} mount")
        fixture_settings = FixtureSettings.build(
            ctx,
            csv_params=csv_params,
            csv_settings=csv_settings,
            mount=mount,
        )
        _run_fixture(ctx, fixture_settings, manage_right_heat)
        mounts_remaining = csv_settings.mounts_to_test[mount_index + 1 :]
        if (
            dual_multi_extension_deck
            and mount == "left"
            and "right" in mounts_remaining
        ):
            _rearrange_tipracks_for_dual_multi_right_mount(ctx, csv_settings)
