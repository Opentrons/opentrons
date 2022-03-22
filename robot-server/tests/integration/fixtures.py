import requests
from requests import Response
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, MIN_SUPPORTED_VERSION
from opentrons import __version__, config

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
    try:
        runs = response.json()["data"]
        if runs == []:
            return
        run_ids = [run["id"] for run in runs]
        for run_id in run_ids:
            delete_response = requests.delete(
                f"{base_url}/runs/{run_id}", headers=headers
            )
            print(
                f"""Delete run {run_id}
                response status code = {delete_response.status_code}
                """
            )
    except Exception as e:
        # Stop the test because the robot is not in
        # a state where this step may be used.
        assert False, e
