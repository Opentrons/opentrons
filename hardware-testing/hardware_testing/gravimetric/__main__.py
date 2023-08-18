"""Gravimetric OT3."""
from json import load as json_load
from pathlib import Path
import argparse
from typing import List, Union

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id_and_start_time, ui, get_git_description
from hardware_testing.protocols import (
    gravimetric_ot3_p50_single,
    gravimetric_ot3_p50_multi_50ul_tip,
    gravimetric_ot3_p1000_single,
    gravimetric_ot3_p1000_multi_50ul_tip,
    gravimetric_ot3_p1000_multi_200ul_tip,
    gravimetric_ot3_p1000_multi_1000ul_tip,
    gravimetric_ot3_p1000_96_50ul_tip,
    gravimetric_ot3_p1000_96_200ul_tip,
    gravimetric_ot3_p1000_96_1000ul_tip,
    photometric_ot3_p1000_96_50ul_tip,
    photometric_ot3_p1000_96_200ul_tip,
    gravimetric_ot3_p50_multi_50ul_tip_increment,
    gravimetric_ot3_p1000_multi_50ul_tip_increment,
    gravimetric_ot3_p1000_multi_200ul_tip_increment,
    gravimetric_ot3_p1000_multi_1000ul_tip_increment,
)

from . import execute, helpers, workarounds, execute_photometric
from .config import (
    GravimetricConfig,
    GANTRY_MAX_SPEED,
    PhotometricConfig,
    ConfigType,
    get_tip_volumes_for_qc,
)
from .measurement import DELAY_FOR_MEASUREMENT
from .trial import TestResources
from .tips import get_tips
from hardware_testing.drivers import asair_sensor

# FIXME: bump to v2.15 to utilize protocol engine
API_LEVEL = "2.13"

LABWARE_OFFSETS: List[dict] = []

# Keyed by pipette volume, channel count, and tip volume in that order
GRAVIMETRIC_CFG = {
    50: {
        1: {50: gravimetric_ot3_p50_single},
        8: {50: gravimetric_ot3_p50_multi_50ul_tip},
    },
    1000: {
        1: {
            50: gravimetric_ot3_p1000_single,
            200: gravimetric_ot3_p1000_single,
            1000: gravimetric_ot3_p1000_single,
        },
        8: {
            50: gravimetric_ot3_p1000_multi_50ul_tip,
            200: gravimetric_ot3_p1000_multi_200ul_tip,
            1000: gravimetric_ot3_p1000_multi_1000ul_tip,
        },
        96: {
            50: gravimetric_ot3_p1000_96_50ul_tip,
            200: gravimetric_ot3_p1000_96_200ul_tip,
            1000: gravimetric_ot3_p1000_96_1000ul_tip,
        },
    },
}

GRAVIMETRIC_CFG_INCREMENT = {
    50: {
        1: {50: gravimetric_ot3_p50_single},
        8: {50: gravimetric_ot3_p50_multi_50ul_tip_increment},
    },
    1000: {
        1: {
            50: gravimetric_ot3_p1000_single,
            200: gravimetric_ot3_p1000_single,
            1000: gravimetric_ot3_p1000_single,
        },
        8: {
            50: gravimetric_ot3_p1000_multi_50ul_tip_increment,
            200: gravimetric_ot3_p1000_multi_200ul_tip_increment,
            1000: gravimetric_ot3_p1000_multi_1000ul_tip_increment,
        },
        96: {
            50: gravimetric_ot3_p1000_96_50ul_tip,
            200: gravimetric_ot3_p1000_96_200ul_tip,
            1000: gravimetric_ot3_p1000_96_1000ul_tip,
        },
    },
}

PHOTOMETRIC_CFG = {
    50: photometric_ot3_p1000_96_50ul_tip,
    200: photometric_ot3_p1000_96_200ul_tip,
}


def build_gravimetric_cfg(
    protocol: ProtocolContext,
    pipette_volume: int,
    pipette_channels: int,
    tip_volume: int,
    trials: int,
    increment: bool,
    return_tip: bool,
    blank: bool,
    mix: bool,
    inspect: bool,
    user_volumes: bool,
    gantry_speed: int,
    scale_delay: int,
    isolate_channels: List[int],
    extra: bool,
) -> GravimetricConfig:
    """Run."""
    if increment:
        protocol_cfg = GRAVIMETRIC_CFG_INCREMENT[pipette_volume][pipette_channels][
            tip_volume
        ]
    else:
        protocol_cfg = GRAVIMETRIC_CFG[pipette_volume][pipette_channels][tip_volume]
    return GravimetricConfig(
        name=protocol_cfg.metadata["protocolName"],  # type: ignore[attr-defined]
        pipette_mount="left",
        pipette_volume=pipette_volume,
        pipette_channels=pipette_channels,
        tip_volume=tip_volume,
        trials=trials,
        labware_offsets=LABWARE_OFFSETS,
        labware_on_scale=protocol_cfg.LABWARE_ON_SCALE,  # type: ignore[attr-defined]
        slot_scale=protocol_cfg.SLOT_SCALE,  # type: ignore[attr-defined]
        slots_tiprack=protocol_cfg.SLOTS_TIPRACK[tip_volume],  # type: ignore[attr-defined]
        increment=increment,
        return_tip=return_tip,
        blank=blank,
        mix=mix,
        inspect=inspect,
        user_volumes=user_volumes,
        gantry_speed=gantry_speed,
        scale_delay=scale_delay,
        isolate_channels=isolate_channels,
        kind=ConfigType.gravimetric,
        extra=args.extra,
    )


def build_photometric_cfg(
    protocol: ProtocolContext,
    pipette_volume: int,
    tip_volume: int,
    trials: int,
    return_tip: bool,
    mix: bool,
    inspect: bool,
    user_volumes: bool,
    touch_tip: bool,
    refill: bool,
    extra: bool,
) -> PhotometricConfig:
    """Run."""
    protocol_cfg = PHOTOMETRIC_CFG[tip_volume]
    return PhotometricConfig(
        name=protocol_cfg.metadata["protocolName"],  # type: ignore[attr-defined]
        pipette_mount="left",
        pipette_volume=pipette_volume,
        pipette_channels=96,
        increment=False,
        tip_volume=tip_volume,
        trials=trials,
        labware_offsets=LABWARE_OFFSETS,
        photoplate=protocol_cfg.PHOTOPLATE_LABWARE,  # type: ignore[attr-defined]
        photoplate_slot=protocol_cfg.SLOT_PLATE,  # type: ignore[attr-defined]
        reservoir=protocol_cfg.RESERVOIR_LABWARE,  # type: ignore[attr-defined]
        reservoir_slot=protocol_cfg.SLOT_RESERVOIR,  # type: ignore[attr-defined]
        slots_tiprack=protocol_cfg.SLOTS_TIPRACK[tip_volume],  # type: ignore[attr-defined]
        return_tip=return_tip,
        mix=mix,
        inspect=inspect,
        user_volumes=user_volumes,
        touch_tip=touch_tip,
        refill=refill,
        kind=ConfigType.photometric,
        extra=args.extra,
    )


def _main(args: argparse.Namespace, _ctx: ProtocolContext) -> None:
    union_cfg: Union[PhotometricConfig, GravimetricConfig]
    if args.photometric:
        cfg_pm: PhotometricConfig = build_photometric_cfg(
            _ctx,
            args.pipette,
            args.tip,
            args.trials,
            args.return_tip,
            args.mix,
            args.inspect,
            args.user_volumes,
            args.touch_tip,
            args.refill,
            args.extra,
        )
        if args.trials == 0:
            cfg_pm.trials = helpers.get_default_trials(cfg_pm)
        union_cfg = cfg_pm
    else:
        cfg_gm: GravimetricConfig = build_gravimetric_cfg(
            _ctx,
            args.pipette,
            args.channels,
            args.tip,
            args.trials,
            args.increment,
            args.return_tip,
            False if args.no_blank else True,
            args.mix,
            args.inspect,
            args.user_volumes,
            args.gantry_speed,
            args.scale_delay,
            args.isolate_channels if args.isolate_channels else [],
            args.extra,
        )
        if args.trials == 0:
            cfg_gm.trials = helpers.get_default_trials(cfg_gm)
        union_cfg = cfg_gm
    run_id, start_time = create_run_id_and_start_time()
    ui.print_header("LOAD PIPETTE")
    pipette = helpers._load_pipette(_ctx, union_cfg)
    ui.print_header("GET PARAMETERS")
    test_volumes = helpers._get_volumes(_ctx, union_cfg)
    for v in test_volumes:
        ui.print_info(f"\t{v} uL")
    all_channels_same_time = (
        getattr(union_cfg, "increment", False) or union_cfg.pipette_channels == 96
    )
    run_args = TestResources(
        ctx=_ctx,
        pipette=pipette,
        pipette_tag=helpers._get_tag_from_pipette(pipette, union_cfg),
        tipracks=helpers._load_tipracks(
            _ctx, union_cfg, use_adapters=args.channels == 96
        ),
        test_volumes=test_volumes,
        run_id=run_id,
        start_time=start_time,
        operator_name=helpers._get_operator_name(_ctx.is_simulating()),
        robot_serial=helpers._get_robot_serial(_ctx.is_simulating()),
        tip_batch=helpers._get_tip_batch(_ctx.is_simulating()),
        git_description=get_git_description(),
        tips=get_tips(_ctx, pipette, args.tip, all_channels=all_channels_same_time),
        env_sensor=asair_sensor.BuildAsairSensor(_ctx.is_simulating()),
    )

    if args.photometric:
        execute_photometric.run(cfg_pm, run_args)
    else:
        execute.run(cfg_gm, run_args)


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[50, 1000], required=True)
    parser.add_argument("--channels", type=int, choices=[1, 8, 96], default=1)
    parser.add_argument("--tip", type=int, choices=[0, 50, 200, 1000], default=0)
    parser.add_argument("--trials", type=int, default=0)
    parser.add_argument("--increment", action="store_true")
    parser.add_argument("--return-tip", action="store_true")
    parser.add_argument("--skip-labware-offsets", action="store_true")
    parser.add_argument("--no-blank", action="store_true")
    parser.add_argument("--mix", action="store_true")
    parser.add_argument("--inspect", action="store_true")
    parser.add_argument("--user-volumes", action="store_true")
    parser.add_argument("--gantry-speed", type=int, default=GANTRY_MAX_SPEED)
    parser.add_argument("--scale-delay", type=int, default=DELAY_FOR_MEASUREMENT)
    parser.add_argument("--photometric", action="store_true")
    parser.add_argument("--touch-tip", action="store_true")
    parser.add_argument("--refill", action="store_true")
    parser.add_argument("--isolate-channels", nargs="+", type=int, default=None)
    parser.add_argument("--extra", action="store_true")
    args = parser.parse_args()
    if not args.simulate and not args.skip_labware_offsets:
        # getting labware offsets must be done before creating the protocol context
        # because it requires the robot-server to be running
        ui.print_title("SETUP")
        ui.print_info(
            "Starting opentrons-robot-server, so we can http GET labware offsets"
        )
        offsets = workarounds.http_get_all_labware_offsets()
        ui.print_info(f"found {len(offsets)} offsets:")
        for offset in offsets:
            ui.print_info(f"\t{offset['createdAt']}:")
            ui.print_info(f"\t\t{offset['definitionUri']}")
            ui.print_info(f"\t\t{offset['vector']}")
            LABWARE_OFFSETS.append(offset)
    # gather the custom labware (for simulation)
    custom_defs = {}
    if args.simulate:
        labware_dir = Path(__file__).parent.parent / "labware"
        custom_def_uris = [
            "radwag_pipette_calibration_vial",
            "opentrons_flex_96_tiprack_50ul_adp",
            "opentrons_flex_96_tiprack_200ul_adp",
            "opentrons_flex_96_tiprack_1000ul_adp",
        ]
        for def_uri in custom_def_uris:
            with open(labware_dir / def_uri / "1.json", "r") as f:
                custom_def = json_load(f)
            custom_defs[def_uri] = custom_def
    _ctx = helpers.get_api_context(
        API_LEVEL,  # type: ignore[attr-defined]
        is_simulating=args.simulate,
        deck_version="2",
        extra_labware=custom_defs,
    )
    if args.tip == 0:
        for tip in get_tip_volumes_for_qc(
            args.pipette, args.channels, args.extra, args.photometric
        ):
            hw = _ctx._core.get_hardware()
            if not _ctx.is_simulating():
                ui.alert_user_ready(f"Ready to run with {tip}ul tip?", hw)
            args.tip = tip
            _main(args, _ctx)
    else:
        _main(args, _ctx)
