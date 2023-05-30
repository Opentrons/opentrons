"""Model the the Opentrons Robot."""
from typing import List

import requests
from requests.adapters import HTTPAdapter
from requests.structures import CaseInsensitiveDict
from rich.console import Console
from urllib3.util.retry import Retry

from automation.resources.robot_data import Module, RobotDataType


class OtRobot:
    """Opentrons Robot."""

    RETRIES = 3
    BACK_OFF_FACTOR = 0.3
    TIME_BETWEEN_RETRIES = 500
    ERROR_CODES = (500, 502, 503, 504)

    def __init__(
        self,
        console: Console,
        robot_data: RobotDataType,
    ) -> None:
        """Initialize the robot."""
        self.alive: bool = False
        self.console: Console = console
        session = requests.session()
        retry = Retry(
            total=OtRobot.RETRIES,
            read=OtRobot.RETRIES,
            connect=OtRobot.RETRIES,
            backoff_factor=OtRobot.BACK_OFF_FACTOR,
            status_forcelist=OtRobot.ERROR_CODES,
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("http://", adapter)
        session.headers = CaseInsensitiveDict({"Opentrons-Version": "3"})
        self.session: requests.Session = session
        self.data: RobotDataType = robot_data
        self.base_url: str = f"http://{self.data.host}:{self.data.port}"
        self.console.print(
            f"base_url for robot {self.data.display_name} is {self.base_url}",
            style="white on blue",
        )
        self.get_modules()

    def is_alive(self) -> bool:
        """Is a robot available by http - request the openapi.json."""
        try:
            response: requests.Response = self.session.get(f"{self.base_url}/openapi.json", timeout=5)
            if response.status_code == 200:
                self.alive = True
                return self.alive
        except requests.exceptions.ConnectionError:
            self.console.print(f"[bold cyan]{self.data.display_name } robot is not reachable.")
        self.alive = False
        return self.alive

    def get_modules(self) -> None:
        """Retrieve the modules from /modules."""
        modules: List[Module] = []
        if self.is_alive():
            response: requests.Response = self.session.get(f"{self.base_url}/modules", timeout=5)
            if response.status_code == 200:
                self.console.print(
                    f"{self.data.display_name } retrieved modules successfully.",
                    style="white on blue",
                )
            for module in response.json()["data"]:
                modules.append(Module(module["moduleModel"], module["id"], module["serialNumber"]))
        self.modules: List[Module] = modules

    def deck_calibrated(self) -> bool:
        """Is the deck calibrated."""
        response: requests.Response = self.session.get(f"{self.base_url}/calibration/status", timeout=2)
        self.console.print(response.json())
        if response.status_code == 200:
            return bool(response.json()["deckCalibration"]["status"] == "OK")
        return False

    def pipettes_calibrated(self) -> bool:
        """Are both pipetted offset and tip length calibrated.

        For now we will tightly couple this to our standard emulation pipette setup.
        """
        response: requests.Response = self.session.get(f"{self.base_url}/calibration/pipette_offset", timeout=2)
        self.console.print(response.json())
        if response.status_code == 200:
            data = response.json()["data"]
            if data == []:
                return False
            try:
                left = [pipette for pipette in data if pipette["id"] == self.data.left_pipette][0]
                right = [pipette for pipette in data if pipette["id"] == self.data.right_pipette][0]
                left_offset: bool = len(left["offset"]) == 3
                right_offset: bool = len(right["offset"]) == 3
                return left_offset and right_offset
            except (KeyError, IndexError):
                pass
        return False

    def tip_length_calibrated(self) -> bool:
        """Are both pipetted offset and tip length calibrated.

        For now we will tightly couple this to our standard emulation pipette setup.
        """
        response: requests.Response = self.session.get(f"{self.base_url}/calibration/tip_length", timeout=2)
        self.console.print(response.json())
        if response.status_code == 200:
            data = response.json()["data"]
            if data == []:
                return False
            try:
                left = [pipette for pipette in data if pipette["pipette"] == self.data.left_pipette.split("&")[0]][0]
                right = [pipette for pipette in data if pipette["pipette"] == self.data.right_pipette.split("&")[0]][0]
                left_tip_length: bool = left["tipLength"] > 0
                right_tip_length: bool = right["tipLength"] > 0
                return left_tip_length and right_tip_length
            except KeyError:
                pass
        return False
