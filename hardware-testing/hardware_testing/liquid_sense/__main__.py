"""Liquid sense testing."""
import argparse
from dataclasses import dataclass
from json import load as json_load
from pathlib import Path
import subprocess
from time import sleep
import os
from typing import List, Any, Optional
import traceback

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.gravimetric import helpers, workarounds
from hardware_testing.data.csv_report import CSVReport
from hardware_testing.gravimetric.measurement.record import GravimetricRecorder
from hardware_testing.gravimetric.measurement.scale import Scale
from hardware_testing.drivers import (
    asair_sensor,
    mitutoyo_digimatic_indicator,
    list_ports_and_select,
)
from hardware_testing.data import (
    ui,
    create_run_id_and_start_time,
    get_git_description,
    get_testing_data_directory,
)

from opentrons.protocol_api import InstrumentContext, ProtocolContext
from opentrons.protocol_engine.types import LabwareOffset

from hardware_testing.liquid_sense import execute
from .report import build_ls_report, store_config, store_serial_numbers
from .post_process import process_csv_directory

from hardware_testing.protocols.liquid_sense_lpc import (
    liquid_sense_ot3_p50_single,
    liquid_sense_ot3_p50_multi,
    liquid_sense_ot3_p1000_single,
    liquid_sense_ot3_p1000_multi,
    liquid_sense_ot3_p1000_96,
)

API_LEVEL = "2.18"

LABWARE_OFFSETS: List[LabwareOffset] = []


LIQUID_SENSE_CFG = {
    50: {
        1: liquid_sense_ot3_p50_single,
        8: liquid_sense_ot3_p50_multi,
    },
    1000: {
        1: liquid_sense_ot3_p1000_single,
        8: liquid_sense_ot3_p1000_multi,
        96: liquid_sense_ot3_p1000_96,
    },
}

PIPETTE_MODEL_NAME = {
    50: {
        1: "p50_single_flex",
        8: "p50_multi_flex",
    },
    1000: {
        1: "p1000_single_flex",
        8: "p1000_multi_flex",
        96: "p1000_96_flex",
    },
}


@dataclass
class RunArgs:
    """Common resources across multiple runs."""

    tip_volumes: List[int]
    run_id: str
    pipette: InstrumentContext
    pipette_tag: str
    git_description: str
    recorder: GravimetricRecorder
    pipette_volume: int
    pipette_channels: int
    name: str
    environment_sensor: asair_sensor.AsairSensorBase
    trials: int
    z_speed: float
    return_tip: bool
    ctx: ProtocolContext
    protocol_cfg: Any
    test_report: CSVReport
    start_height_offset: float
    aspirate: bool
    dial_indicator: Optional[mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator]
    plunger_speed: float
    trials_before_jog: int
    multi_passes: int

    @classmethod
    def _get_protocol_context(cls, args: argparse.Namespace) -> ProtocolContext:
        if not args.simulate and not args.skip_labware_offsets:
            # getting labware offsets must be done before creating the protocol context
            # because it requires the robot-server to be running
            ui.print_title("SETUP")
            ui.print_info(
                "Starting opentrons-robot-server, so we can http GET labware offsets"
            )
            LABWARE_OFFSETS.extend(workarounds.http_get_all_labware_offsets())
            ui.print_info(f"found {len(LABWARE_OFFSETS)} offsets:")
            for offset in LABWARE_OFFSETS:
                ui.print_info(f"\t{offset.createdAt}:")
                ui.print_info(f"\t\t{offset.definitionUri}")
                ui.print_info(f"\t\t{offset.vector}")
        # gather the custom labware (for simulation)
        custom_defs = {}
        if args.simulate:
            labware_dir = Path(__file__).parent.parent / "labware"
            custom_def_uris = [
                "radwag_pipette_calibration_vial",
                "dial_indicator",
            ]
            for def_uri in custom_def_uris:
                with open(labware_dir / def_uri / "1.json", "r") as f:
                    custom_def = json_load(f)
                custom_defs[def_uri] = custom_def
        _ctx = helpers.get_api_context(
            API_LEVEL,  # type: ignore[attr-defined]
            is_simulating=args.simulate,
            pipette_left=PIPETTE_MODEL_NAME[args.pipette][args.channels],
            extra_labware=custom_defs,
        )
        for offset in LABWARE_OFFSETS:
            engine = _ctx._core._engine_client._transport._engine  # type: ignore[attr-defined]
            engine.state_view._labware_store._add_labware_offset(offset)
        return _ctx

    @classmethod
    def build_run_args(cls, args: argparse.Namespace) -> "RunArgs":
        """Build."""
        _ctx = RunArgs._get_protocol_context(args)
        run_id, start_time = create_run_id_and_start_time()
        environment_sensor = asair_sensor.BuildAsairSensor(
            _ctx.is_simulating() or args.ignore_env
        )
        git_description = get_git_description()
        protocol_cfg = LIQUID_SENSE_CFG[args.pipette][args.channels]
        name = protocol_cfg.metadata["protocolName"]  # type: ignore[attr-defined]
        ui.print_header("LOAD PIPETTE")
        pipette = _ctx.load_instrument(
            f"flex_{args.channels}channel_{args.pipette}", "left"
        )
        loaded_labwares = _ctx.loaded_labwares
        if 12 in loaded_labwares.keys():
            trash = loaded_labwares[12]
        else:
            trash = _ctx.load_labware("opentrons_1_trash_3200ml_fixed", "A3")
        pipette.trash_container = trash
        pipette_tag = helpers._get_tag_from_pipette(pipette, False, False)

        if args.trials == 0:
            if args.channels < 96:
                trials = 10
            else:
                trials = 7
        else:
            trials = args.trials

        if args.tip == 0:
            if args.pipette == 1000:
                tip_volumes: List[int] = [50, 200, 1000]
            else:
                tip_volumes = [50]
        else:
            tip_volumes = [args.tip]

        scale = Scale.build(simulate=_ctx.is_simulating() or args.ignore_scale)
        recorder: GravimetricRecorder = execute._load_scale(
            name,
            scale,
            run_id,
            pipette_tag,
            start_time,
            _ctx.is_simulating() or args.ignore_scale,
        )
        dial: Optional[mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator] = None
        if not _ctx.is_simulating() and not args.ignore_dial:
            dial_port = list_ports_and_select("Dial Indicator")
            dial = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(
                port=dial_port
            )
            dial.connect()
        ui.print_info(f"pipette_tag {pipette_tag}")
        report = build_ls_report(name, run_id, trials, tip_volumes)
        report.set_tag(name)
        # go ahead and store the meta data now
        store_serial_numbers(
            report,
            pipette_tag,
            scale.read_serial_number(),
            environment_sensor.get_serial(),
            git_description,
        )

        store_config(
            report,
            name,
            args.pipette,
            tip_volumes,
            trials,
            args.plunger_direction,
            args.liquid,
            protocol_cfg.LABWARE_ON_SCALE,  # type: ignore[attr-defined]
            args.z_speed,
            args.start_height_offset,
        )
        return RunArgs(
            tip_volumes=tip_volumes,
            run_id=run_id,
            pipette=pipette,
            pipette_tag=pipette_tag,
            git_description=git_description,
            recorder=recorder,
            pipette_volume=args.pipette,
            pipette_channels=args.channels,
            name=name,
            environment_sensor=environment_sensor,
            trials=trials,
            z_speed=args.z_speed,
            return_tip=args.return_tip,
            ctx=_ctx,
            protocol_cfg=protocol_cfg,
            test_report=report,
            start_height_offset=args.start_height_offset,
            aspirate=args.plunger_direction == "aspirate",
            dial_indicator=dial,
            plunger_speed=args.plunger_speed,
            trials_before_jog=args.trials_before_jog,
            multi_passes=args.multi_passes,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[50, 1000], required=True)
    parser.add_argument("--channels", type=int, choices=[1, 8, 96], default=1)
    parser.add_argument("--tip", type=int, choices=[0, 50, 200, 1000], default=0)
    parser.add_argument("--trials", type=int, default=0)
    parser.add_argument("--return-tip", action="store_true")
    parser.add_argument("--skip-labware-offsets", action="store_true")
    parser.add_argument(
        "--liquid", type=str, choices=["water", "glycerol", "alchohol"], default="water"
    )
    parser.add_argument("--z-speed", type=float, default=5)
    parser.add_argument(
        "--plunger-direction",
        type=str,
        choices=["aspirate", "dispense"],
        default="aspirate",
    )
    parser.add_argument("--labware-type", type=str, default="nest_1_reservoir_195ml")
    parser.add_argument("--plunger-speed", type=float, default=-1.0)
    parser.add_argument("--isolate-plungers", action="store_true")
    parser.add_argument("--start-height-offset", type=float, default=0)
    parser.add_argument("--ignore-scale", action="store_true")
    parser.add_argument("--ignore-env", action="store_true")
    parser.add_argument("--ignore-dial", action="store_true")
    parser.add_argument("--trials-before-jog", type=int, default=10)
    parser.add_argument("--multi-passes", type=int, default=1)

    args = parser.parse_args()
    run_args = RunArgs.build_run_args(args)
    exit_error = os.EX_OK
    try:
        if not run_args.ctx.is_simulating():
            data_dir = get_testing_data_directory()
            data_file = f"/{data_dir}/{run_args.name}/{run_args.run_id}/serial.log"
            ui.print_info(f"logging can data to {data_file}")
            serial_logger = subprocess.Popen(
                [f"python3 -m opentrons_hardware.scripts.can_mon > {data_file}"],
                shell=True,
            )
            sleep(1)
        hw = run_args.ctx._core.get_hardware()
        if not run_args.ctx.is_simulating():
            ui.get_user_ready("CLOSE the door, and MOVE AWAY from machine")
        ui.print_info("homing...")
        run_args.ctx.home()
        for tip in run_args.tip_volumes:
            if args.channels == 96 and not run_args.ctx.is_simulating():
                ui.alert_user_ready(f"prepare the {tip}ul tipracks", hw)
            execute.run(tip, run_args)
    except Exception as e:
        ui.print_info(f"got error {e}")
        ui.print_info(traceback.format_exc())
        exit_error = 1
    finally:
        if run_args.recorder is not None:
            ui.print_info("ending recording")
            run_args.recorder.stop()
            run_args.recorder.deactivate()
        if not run_args.ctx.is_simulating():
            ui.print_info("killing serial log")
            serial_logger.terminate()
        if run_args.dial_indicator is not None:
            run_args.dial_indicator.disconnect()
        run_args.test_report.save_to_disk()
        run_args.test_report.print_results()
        ui.print_info("done\n\n")
        if not run_args.ctx.is_simulating():
            process_csv_directory(
                f"{data_dir}/{run_args.name}/{run_args.run_id}",
                run_args.tip_volumes,
                run_args.trials,
            )
        run_args.ctx.cleanup()
        if not args.simulate:
            helpers_ot3.restart_server_ot3()
        os._exit(exit_error)
