"""OT-3 Module Calibration Script."""
import argparse
from time import sleep
from typing import Optional, List
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


def _home(ip_addr: str, axes: Optional[List[str]] = None) -> None:
    """Home the z axis for the instrument."""
    axes = axes or list()
    print(f"Homing {axes} axes")
    home = {"data": {"commandType": "home", "params": {"axes": axes}}}
    url = f"{BASE_URL.format(ip_addr)}/commands"
    requests.post(headers=HEADERS, url=url, json=home, params=PARAMS)


def _get_current_run(ip_addr: str) -> Optional[str]:
    url = f"{BASE_URL.format(ip_addr)}/runs"
    res = requests.get(headers=HEADERS, url=url)
    runs = res.json()["data"]
    active_run = None
    for run in runs:
        if run["current"]:
            active_run = run["id"]
            break
    return active_run


def _create_run(ip_addr: str) -> Optional[str]:
    """Create an empty run."""
    url = f"{BASE_URL.format(ip_addr)}/runs"
    res = requests.post(headers=HEADERS, url=url)
    if res.status_code != 201:
        return None
    # get the run id
    return res.json()["data"].get("id")


def _cancel_run(ip_addr: str, run_id: Optional[str] = None) -> bool:
    run_id = run_id or _get_current_run(ip_addr)
    print(f"Finishing run {run_id}")
    stop = {"data": {"actionType": "stop"}}
    url = f"{BASE_URL.format(ip_addr)}/runs/{run_id}/actions"
    requests.post(headers=HEADERS, params=PARAMS, url=url, json=stop)
    sleep(1)  # give some time to cancel the run
    # delete the run
    url = f"{BASE_URL.format(ip_addr)}/runs/{run_id}"
    requests.delete(headers=HEADERS, params=PARAMS, url=url)
    return _get_current_run(ip_addr) is None


def _main(args: argparse.Namespace) -> None:
    base_url = f"{BASE_URL.format(args.host)}"
    # check if there is an active run
    run_id = _get_current_run(args.host)
    if run_id:
        choice = input(
            f"{run_id} There is a run in progress, do you want to cancel it? y/n\n"
        )
        if choice.lower() in "no":
            print("Not canceling existing run, exiting.\n")
            exit(1)
        # Cancel the run
        if not _cancel_run(args.host, run_id):
            raise RuntimeError("Could not cancel run.")

    # Create a new run
    run_id = _create_run(args.host)
    if not run_id:
        raise RuntimeError("Could not create run.")

    url = f"{base_url}/runs/{run_id}/commands"

    # Home all axes so we are at a known state
    _home(args.host)

    # Make sure the module is attached
    res = requests.get(headers=HEADERS, params=PARAMS, url=f"{base_url}/modules")
    if res.status_code != 200:
        raise RuntimeError("Error fetching modules attached.")
    modules = res.json().get("data", [])
    for module in modules:
        if module.get("moduleModel") == args.model:
            break
    else:
        raise RuntimeError(f"Module {args.model} was not detected.")

    # load the module based on the model
    print(f"Loading the module {args.model} at slot {args.slot}")
    load_module = {
        "data": {
            "commandType": "loadModule",
            "params": {"model": args.model, "location": {"slotName": args.slot}},
        }
    }
    res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=load_module)
    data = res.json().get("data")
    error = data.get("error")
    if res.status_code != 201 or error:
        error_type = error.get("errorType")
        error_details = error.get("detail")
        raise RuntimeError(f"Error loading module: {error_type} - {error_details}")
    module_id = data["result"]["moduleId"]

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
    data = res.json().get("data")
    error = data.get("error")
    if res.status_code != 201 or error:
        error_type = error.get("errorType")
        error_details = error.get("detail")
        msg = f"Error loading labware: {error_type} - {error_details}"
        raise RuntimeError(msg)
    labware_id = data["result"]["labwareId"]

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
    data = res.json().get("data")
    error = data.get("error")
    if res.status_code != 201 or error:
        error_type = error.get("errorType")
        error_details = error.get("detail")
        msg = f"Failed to calibrate module {args.model}: {error_type} - {error_details}"
        raise RuntimeError(msg)

    # Finish and print result
    _cancel_run(args.host, run_id)
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
    except Exception as e:
        print(e)
        _cancel_run(args.host)
    finally:
        # home the gantry
        _home(args.host, ["leftZ", "rightZ"])
