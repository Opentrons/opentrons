"""Module to handle Opentrons Protocol Engine HTTP API."""
from time import sleep
from typing import Optional, List
import requests

from hardware_testing.opentrons_api.types import Point


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
DEFAULT_PORT = 31950
PARAMS = {"waitUntilComplete": "true"}


class OpentronsHTTPAPI:
    """Class to send/receive data using the Opentrons Protocol Engine HTTP API."""

    def __init__(self, ip_addr: str, port: int = DEFAULT_PORT) -> None:
        """Construct.

        Args:
            ip_addr: The host ip address
            port: The port to send requests to
        """
        self._ip_addr = ip_addr
        self._port = port
        self._base_url = f"http://{ip_addr}:{port}"
        self._run_id = None
        self._module_id = None
        self._labware_id = None
        self._pipette_id = None

    @property
    def ip_addr(self) -> str:
        """The ip address of the host."""
        return self._ip_addr

    @property
    def port(self) -> int:
        """The port of the host."""
        return self._port

    @property
    def run_id(self) -> Optional[str]:
        """The current run id."""
        return self._run_id

    def create_run(self) -> Optional[str]:
        """Create a run and return the run_id."""
        # Make sure we dont have any active runs
        if self.get_current_run():
            choice = input(
                "There is a run in progress, do you want to cancel it? y/n\n"
            )
            if choice.lower() in "no":
                print("Not canceling existing run, exiting.\n")
                exit(1)
            # Cancel the run
            if not self.cancel_run():
                raise RuntimeError("Could not cancel run.")

        # create a new run
        url = f"{self._base_url}/runs"
        res = requests.post(headers=HEADERS, url=url)
        if res.status_code == 201:
            self._run_id = res.json()["data"].get("id")
            return self._run_id
        return None

    def get_current_run(self) -> Optional[str]:
        """Get the current run_id if any."""
        url = f"{self._base_url}/runs"
        res = requests.get(headers=HEADERS, url=url)
        if res.status_code == 200:
            for run in res.json()["data"]:
                if run["current"]:
                    return run["id"]
        return None

    def cancel_run(self, run_id: Optional[str] = None) -> bool:
        """Cancel the given run or the active run."""
        run_id = run_id or self.get_current_run()
        if run_id is None:
            print(f"Cannot cancel run with invalid run_id: {run_id}")
            return False

        stop = {"data": {"actionType": "stop"}}
        url = f"{self._base_url}/runs/{run_id}/actions"
        requests.post(headers=HEADERS, params=PARAMS, url=url, json=stop)
        sleep(1)
        # give some time to cancel the run then delete it
        url = f"{self._base_url}/runs/{run_id}"
        requests.delete(headers=HEADERS, params=PARAMS, url=url)
        if self.get_current_run() is None:
            self._reset_state()
        return not bool(self._run_id)

    def home(self, axes: Optional[List[str]] = None) -> bool:
        """Home the given axes."""
        axes = axes or list()
        print(f"Homing {axes} axes")
        home = {"data": {"commandType": "home", "params": {"axes": axes}}}
        url = f"{self._base_url}/commands"
        res = requests.post(headers=HEADERS, url=url, json=home, params=PARAMS)
        return res.status_code == 201

    def _reset_state(self) -> None:
        self._run_id = None
        self._pipette_id = None
        self._module_id = None
        self._labware_id = None

    def _get_instrument_name(self, mount: str) -> Optional[str]:
        url = f"{self._base_url}/instruments"
        res = requests.get(headers=HEADERS, url=url)
        for instrument in res.json()["data"]:
            if instrument["mount"] == mount:
                return instrument["instrumentName"]
        return None

    def load_pipette(self, mount: str) -> str:
        """Load a pipette and return pipette_id."""
        if self._run_id is None:
            raise RuntimeError("Need an active run to load pipette")

        # Make sure the pipette is detected
        pipette_name = self._get_instrument_name(mount)
        if pipette_name is None:
            raise RuntimeError(f"Could not detect instrument at {mount}")

        print(f"Loading pipette {pipette_name} at mount {mount}")
        load_pipette = {
            "data": {
                "commandType": "loadPipette",
                "params": {"pipetteName": pipette_name, "mount": mount},
            }
        }
        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=load_pipette)
        self._pipette_id = res.json()["data"]["result"]["pipetteId"]
        return self._pipette_id  # type: ignore

    def load_module(self, model: str, slot: int) -> str:
        """Load a module for the current run, returns the module_id."""
        if self._run_id is None:
            raise RuntimeError("Need an active run to load module.")

        # Make sure the module is attached
        url = f"{self._base_url}/modules"
        res = requests.get(headers=HEADERS, params=PARAMS, url=url)
        if res.status_code != 200:
            raise RuntimeError("Error fetching modules attached.")
        modules = res.json().get("data", [])
        for module in modules:
            if module.get("moduleModel") == model:
                break
        else:
            raise RuntimeError(f"Module {model} was not detected.")

        # load the module based on the model
        print(f"Loading module {model} at slot {slot}")
        load_module = {
            "data": {
                "commandType": "loadModule",
                "params": {"model": model, "location": {"slotName": slot}},
            }
        }
        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=load_module)
        data = res.json().get("data")
        error = data.get("error")
        if res.status_code != 201 or error:
            error_type = error.get("errorType")
            error_details = error.get("detail")
            raise RuntimeError(f"Error loading module: {error_type} - {error_details}")
        self._module_id = data["result"]["moduleId"]
        return self._module_id  # type: ignore

    def load_labware(self, module_id: str, model: str) -> str:
        """Load a labware adapter on a module."""
        print(f"Loading calibration adapter for {model}")
        load_labware = {
            "data": {
                "commandType": "loadLabware",
                "params": {
                    "location": {"moduleId": module_id},
                    "loadName": CALIBRATION_ADAPTER[model],
                    "namespace": "opentrons",
                    "version": 1,
                },
            }
        }

        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=load_labware)
        data = res.json().get("data")
        error = data.get("error")
        if res.status_code != 201 or error:
            error_type = error.get("errorType")
            error_details = error.get("detail")
            msg = f"Error loading labware: {error_type} - {error_details}"
            raise RuntimeError(msg)
        self._labware_id = data["result"]["labwareId"]
        return self._labware_id  # type: ignore

    def calibrate_module(
        self,
        mount: str,
        module_id: Optional[str] = None,
        labware_id: Optional[str] = None,
    ) -> Point:
        """Start the module calibration and return the offset."""
        module_id = module_id or self._module_id
        labware_id = labware_id or self._labware_id

        calibrate_module = {
            "data": {
                "commandType": "calibration/calibrateModule",
                "params": {
                    "moduleId": module_id,
                    "labwareId": labware_id,
                    "mount": mount,
                },
            }
        }

        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(
            headers=HEADERS, params=PARAMS, url=url, json=calibrate_module
        )
        data = res.json().get("data")
        error = data.get("error")
        if res.status_code != 201 or error:
            error_type = error.get("errorType")
            error_details = error.get("detail")
            msg = f"Failed to calibrate module: {error_type} - {error_details}"
            raise RuntimeError(msg)
        return Point(**res.json()["data"]["result"]["moduleOffset"])

    def move_to_well(
        self, mount: str, well_name: str, offset: Optional[Point] = None
    ) -> Point:
        """Move the instrument to a specific location."""
        if self._run_id is None:
            raise RuntimeError("Need an active run to move to well.")
        if self._pipette_id is None:
            raise RuntimeError("Need an active pipette to move to well.")
        if self._labware_id is None:
            raise RuntimeError("Need a loaded labware to move to well")

        # Make sure we add the probe length when moving to a well
        offset = offset or Point()
        move_to_well = {
            "data": {
                "commandType": "moveToWell",
                "params": {
                    "pipetteId": self._pipette_id,
                    "labwareId": self._labware_id,
                    "wellName": well_name,
                    "wellLocation": {"offset": dict(offset._asdict())},
                },
            }
        }

        print(f"Moving to well {well_name} with offset {offset}.")
        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(headers=HEADERS, params=PARAMS, url=url, json=move_to_well)
        data = res.json().get("data")
        error = data.get("error")
        if res.status_code != 201 or error:
            error_type = error.get("errorType")
            error_details = error.get("detail")
            msg = f"Failed to move to well {well_name}: {error_type} - {error_details}"
            raise RuntimeError(msg)
        return Point(**data["result"]["position"])

    def heater_shaker_latch_open(self, open: bool = True) -> bool:
        """Open/Close the Heater-Shaker Latch."""
        # check the type of module is a heater-shaker
        latch_state = "open" if open else "close"
        heater_shaker_latch = {
            "data": {
                "commandType": f"heaterShaker/{latch_state}LabwareLatch",
                "params": {
                    "moduleId": self._module_id,
                },
            }
        }

        print(f"Heater-Shaker latch will {latch_state}")
        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(
            headers=HEADERS, params=PARAMS, url=url, json=heater_shaker_latch
        )
        data = res.json().get("data")
        error = data.get("error")
        if res.status_code != 201 or error:
            error_type = error.get("errorType")
            error_details = error.get("detail")
            msg = f"Failed to {latch_state} latch: {error_type} - {error_details}"
            raise RuntimeError(msg)
        return True

    def thermocycler_lid_open(self, open: bool = True) -> bool:
        """Open/Close the Thermocycler lid."""
        # check the type of module is a heater-shaker
        lid_state = "open" if open else "close"
        thermocycler_lid = {
            "data": {
                "commandType": f"thermocycler/{lid_state}Lid",
                "params": {
                    "moduleId": self._module_id,
                },
            }
        }

        print(f"Thermocycler Lid will {lid_state}")
        url = f"{self._base_url}/runs/{self._run_id}/commands"
        res = requests.post(
            headers=HEADERS, params=PARAMS, url=url, json=thermocycler_lid
        )
        data = res.json().get("data")
        error = data.get("error")
        if res.status_code != 201 or error:
            error_type = error.get("errorType")
            error_details = error.get("detail")
            msg = f"Failed to {lid_state} lid: {error_type} - {error_details}"
            raise RuntimeError(msg)
        return True
