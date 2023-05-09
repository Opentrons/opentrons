import requests
from box import Box
from requests import Response
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, MIN_SUPPORTED_VERSION
from opentrons import __version__, config
from opentrons_shared_data.module.dev_types import ModuleModel

minimum_version = list(MIN_SUPPORTED_VERSION)
maximum_version = list(MAX_SUPPORTED_VERSION)


def check_health_response(response: Response) -> None:
    expected = {
        "name": "opentrons-dev",
        "api_version": __version__,
        "fw_version": "Virtual Smoothie",
        "board_revision": "2.1",
        "logs": ["/logs/serial.log", "/logs/api.log", "/logs/server.log"],
        "system_version": config.OT_SYSTEM_VERSION,
        "robot_model": "OT-2 Standard",
        "minimum_protocol_api_version": minimum_version,
        "maximum_protocol_api_version": maximum_version,
        "links": {
            "apiLog": "/logs/api.log",
            "serialLog": "/logs/serial.log",
            "apiSpec": "/openapi.json",
            "systemTime": "/system/time",
            "serverLog": "/logs/server.log",
        },
    }

    assert response.json() == expected


def delete_all_runs(response: Response, host: str, port: str) -> None:
    """Intake the response of a GET /runs and delete all runs if any exist."""
    headers = {"Opentrons-Version": "*"}
    base_url = f"{host}:{port}"
    runs = response.json()["data"]
    run_ids = [run["id"] for run in runs]
    for run_id in run_ids:
        delete_response = requests.delete(f"{base_url}/runs/{run_id}", headers=headers)
        print(
            f"Deleted run {run_id},"
            f" response status code = {delete_response.status_code}"
        )


def delete_all_protocols(response: Response, host: str, port: str) -> None:
    """Intake the response of a GET /protocols and delete all protocols if any exist."""
    headers = {"Opentrons-Version": "*"}
    base_url = f"{host}:{port}"
    protocols = response.json()["data"]
    protocol_ids = [protocol["id"] for protocol in protocols]
    for protocol_id in protocol_ids:
        delete_response = requests.delete(
            f"{base_url}/protocols/{protocol_id}", headers=headers
        )
        print(
            f"Deleted protocol {protocol_id},"
            f" response status code = {delete_response.status_code}"
        )


def get_module_id(response: Response, module_model: ModuleModel) -> Box:
    """Get the first module id that matches module_model."""
    modules = response.json()["data"]
    # assuming dev robot does not have multiples of a module
    id = next(
        module["id"] for module in modules if module["moduleModel"] == module_model
    )
    return Box({f"{module_model}_id": id})
