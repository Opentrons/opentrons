"""OT-3 Module Calibration test script."""
import argparse

from hardware_testing.opentrons_api.types import Point
from hardware_testing.opentrons_api.http_api import (
    OpentronsHTTPAPI,
)

PROBE_OFFSET = Point(x=0, y=0, z=44.5)


MODELS = [
    "temperatureModuleV1",
    "temperatureModuleV2",
    "magneticModuleV1",
    "magneticModuleV2",
    "thermocyclerModuleV1",
    "thermocyclerModuleV2",
    "heaterShakerModuleV1",
]


def _handle_module_case(opentrons_api: OpentronsHTTPAPI, model: str) -> bool:
    if "heaterShaker" in model:
        # make sure the clamp is closed
        opentrons_api.heater_shaker_latch_open(False)
    elif "thermocycler" in model:
        # make sure the lid is open
        opentrons_api.thermocycler_lid_open(True)
    return True


def _main(args: argparse.Namespace, opentrons_api: OpentronsHTTPAPI) -> None:
    # Create a new run
    run_id = opentrons_api.create_run()
    if not run_id:
        raise RuntimeError("Could not create run.")

    # Home all axes so we are at a known state
    opentrons_api.home()

    # Load in the instrument
    pipette_id = opentrons_api.load_pipette(args.mount)
    if not pipette_id:
        raise RuntimeError(f"Could not load mount {args.mount}")

    # Load the module
    module_id = opentrons_api.load_module(args.model, args.slot)
    if not module_id:
        raise RuntimeError(f"Could not load module {args.model}")

    # Load the calibration labware for the specific module
    labware_id = opentrons_api.load_labware(module_id, args.model)
    if not labware_id:
        raise RuntimeError(f"Could not load labware for {args.model}")

    # Calibrate the module
    print(
        f"Calibrating module {args.model} at slot {args.slot} with mount {args.mount}"
    )
    offset = opentrons_api.calibrate_module(args.mount, module_id, labware_id)
    if not offset:
        raise RuntimeError(f"Could not calibrate {args.model}")

    # set module pre-conditions (closed lid/latch)
    _handle_module_case(opentrons_api, args.model)
    print("Moving to calibrated well center")
    calibrated_position = opentrons_api.move_to_well(
        args.mount, "A1", offset=PROBE_OFFSET
    )

    # Finish and print result
    print(f"Calibration offset {offset}")
    print(f"Calibrated center {calibrated_position}")

    # Verify the offset
    confirm = input("Verify the calibrated offset? y/n\n")
    if "n" in confirm:
        return

    # Setup the run
    opentrons_api.cancel_run(run_id)
    opentrons_api.create_run()
    opentrons_api.home()
    module_id = opentrons_api.load_module(args.model, args.slot)
    opentrons_api.load_labware(module_id, args.model)
    opentrons_api.load_pipette(args.mount)

    # set module pre-conditions (closed lid/latch)
    _handle_module_case(opentrons_api, args.model)

    print("Moving to the uncalibrated well position")
    # we need to add the probe z offset so we dont crash into the deck
    inverse_offset = (offset * -1) + PROBE_OFFSET
    uncalibrated_position = opentrons_api.move_to_well(
        args.mount, "A1", offset=inverse_offset
    )
    print(f"Uncalibrated center position: {uncalibrated_position}")

    input("Press Enter to to move to calibrated position.")
    calibrated_position = opentrons_api.move_to_well(
        args.mount, "A1", offset=PROBE_OFFSET
    )
    print(f"Calibrated center position: {calibrated_position}")

    input("Press Enter to continue...")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Script to test and verify module calibration over HTTP"
    )
    parser.add_argument(
        "--host", help="The ip address of the robot", default="localhost"
    )
    parser.add_argument(
        "--model",
        help="The model of the module to calibrate",
        choices=MODELS,
        required=True,
    )
    parser.add_argument(
        "--slot",
        help="The slot on the deck the module is located in. eg D3",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--mount",
        help="The mount to use for the calibration",
        choices=["left", "right"],
        required=True,
    )
    args = parser.parse_args()

    try:
        opentrons_api = OpentronsHTTPAPI(args.host)
        _main(args, opentrons_api)
    except Exception as e:
        print(e)
    finally:
        # home the gantry and cancel run
        opentrons_api.home(["leftZ", "rightZ"])
        opentrons_api.cancel_run()
