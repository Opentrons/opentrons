"""Model the the Opentrons Robot."""
import logging
import os
from types import ModuleType
from typing import List, Optional
from requests.adapters import HTTPAdapter
from rich.console import Console
from urllib3.util.retry import Retry
import requests
from requests.structures import CaseInsensitiveDict
from src.resources.robot_data import RobotDataType, Module


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
            f"base_url for robot {self.data.display_name} is {self.base_url}"
        )
        self.get_modules()

    def is_alive(self) -> bool:
        """Is a robot available by http - request the openapi.json."""
        try:
            response: requests.Response = self.session.get(
                f"{self.base_url}/openapi.json"
            )
            if response.status_code == 200:
                self.alive = True
                return self.alive
        except requests.exceptions.ConnectionError:
            self.console.print(
                f"[bold cyan]{self.data.display_name } robot is not reachable."
            )
        self.alive = False
        return self.alive

    def get_modules(self) -> None:
        "Retrieve the modules from /modules."
        modules: List[Module] = []
        if self.is_alive():
            response: requests.Response = self.session.get(f"{self.base_url}/modules")
            if response.status_code == 200:
                self.console.print(
                    f"{self.data.display_name } retrieved modules successfully."
                )
            for module in response.json()["data"]:
                modules.append(
                    Module(module["moduleModel"], module["id"], module["serialNumber"])
                )
        self.modules: List[Module] = modules
