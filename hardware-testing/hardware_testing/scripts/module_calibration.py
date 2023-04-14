"""OT-3 Module Calibration Script."""
import argparse
from traceback import print_exc
from typing import Optional
import requests


MOUNTS = ["left", "right", "extension"]


MODELS = [
    "temperatureModuleV1",
    "temperatureModuleV2",
    "magneticModuleV1",
    "magneticModuleV2",
    "thermocyclerModuleV1",
    "thermocyclerModuleV2",
    "heaterShakerModuleV1",
]


CALIBRATION_ADAPTER = {
    "temperatureModuleV1": "opentrons_calibration_adapter_temperature_module",
    "temperatureModuleV2": "opentrons_calibration_adapter_temperature_module",
    "magneticModuleV1": "opentrons_calibration_adapter_magnetic_module",
    "magneticModuleV2": "opentrons_calibration_adapter_magnetic_module",
    "thermocyclerModuleV1": "opentrons_calibration_adapter_thermocycler_module",
    "thermocyclerModuleV2": "opentrons_calibration_adapter_thermocycler_module",
    "heaterShakerModuleV1": "opentrons_calibration_adapter_heatershaker_module",
}


HEADERS = {"opentrons-version": "4"}
BASE_URL = "http://{}:31950"
PARAMS = {"waitUntilComplete": "true"}


def _home_z(ip_addr: str) -> None:
    """Home the z axis for the instrument."""
    # Home the instrument axis so we are at a known state
    print("Homing z axis")
    home_z = {"data": {"commandType": "home", "params": {"axes": ["leftZ", "rightZ"]}}}
    url = f"{BASE_URL.format(ip_addr)}/commands"
    requests.post(headers=HEADERS, url=url, json=home_z, params=PARAMS)


def _create_run(ip_addr: str) -> Optional[str]:
    """Create an empty run."""
    print("Creating new run.")
    url = f"{BASE_URL.format(ip_addr)}/runs"
    res = requests.post(headers=HEADERS, url=url)
    if res.status_code != 201:
        return None
    # get the run id
    return res.json()["data"]["id"]


def _cancel_run(ip_addr: str, run_id: str) -> bool:
    """Cancel the run."""
    print(f"Canceling run {run_id}")
    stop = {"data": {"actionType": "stop"}}
    url = f"{BASE_URL.format(ip_addr)}/runs/{run_id}/actions"
    res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=stop)
    return res.status_code == 201


def _main(args: argparse.Namespace) -> None:
    base_url = f"{BASE_URL.format(args.host)}"

    # Collect all runs
    res = requests.get(headers=HEADERS, url=f"{base_url}/runs")
    runs = res.json()["data"]
    active_run = None
    for run in runs:
        if run["current"]:
            active_run = run
            break

    if active_run:
        choice = input("There is a run in progress, do you want to cancel it? y/n\n")
        if choice.lower() in "no":
            print("Not canceling existing run, exiting.\n")
            exit(1)

        # Cancel the run
        run_id = active_run["id"]
        if not _cancel_run(args.host, run_id):
            print("Could not cancel run.")
            exit(1)

    # Create a new run
    run_id = _create_run(args.host)
    if not run_id:
        print("Could not create run.")
        exit(1)

    url = f"{base_url}/runs/{run_id}/commands"

    # Home the instrument axis so we are at a known state
    _home_z(args.host)

    # load the module based on the model
    print(f"Loading the module {args.model} at slot {args.slot}")
    load_module = {
        "data": {
            "commandType": "loadModule",
            "params": {"model": args.model, "location": {"slotName": args.slot}},
        }
    }
    res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=load_module)
    if res.status_code != 201:
        print("Error loading module")
        exit(1)
    module_id = res.json()["data"]["result"]["moduleId"]

    # load the calibration labware for the specific module
    print(f"Loading the calibration adapter at slot {args.slot}")
    load_labware = {
        "data": {
            "commandType": "loadLabware",
            "params": {
                "location": {"moduleId": module_id},
                "loadName": CALIBRATION_ADAPTER[args.model],
                "namespace": "opentrons",
                "version": 1,
            },
        }
    }
    res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=load_labware)
    if res.status_code != 201:
        print("Error loading labware")
        exit(1)
    labware_id = res.json()["data"]["result"]["labwareId"]

    # calibrate the module
    print(f"Calibrating {args.model} at slot {args.slot} with mount {args.mount}")
    calibrate_module = {
        "data": {
            "commandType": "calibration/calibrateModule",
            "params": {
                "moduleId": module_id,
                "labwareId": labware_id,
                "mount": args.mount,
            },
        }
    }

    res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=calibrate_module)
    if res.status_code != 201 or not res.json()["data"].get("result"):
        error = res.json()["data"]["error"]
        error_type = error.get("errorType")
        error_details = error.get("detail")
        print(f"Failed to calibrate module {args.model} {error_type} - {error_details}")
        return

    calibration_offset = res.json()["data"]["result"]["moduleOffset"]
    print(f"Calibration result {calibration_offset}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Script to test module calibration over HTTP"
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
        help="The slot on the deck the module is located in",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--mount",
        help="The mount to use for the calibration",
        choices=MOUNTS,
        required=True,
    )
    args = parser.parse_args()
    try:
        _main(args)
    except Exception:
        print("Unhandled exception")
        print_exc()
        _home_z(args.host)
