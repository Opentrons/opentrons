import typing
import logging
import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseSettings, Field
from dotenv import load_dotenv

from opentrons.config import IS_ROBOT

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_settings() -> 'RobotServerSettings':
    """Get the settings"""
    load_dotenv(get_dotenv_path())
    return RobotServerSettings()


def get_dotenv_path() -> Path:
    """Get the location of the settings file"""
    environment = "robot" if IS_ROBOT else "dev"
    return Path(os.path.dirname(__file__)) / f'{environment}.env'


class RobotServerSettings(BaseSettings):
    """
    Robot server settings.

    To override any of these create an environment variable with prefix
    OT_ROBOT_SERVER_.
    """
    ws_host_name: str = Field(
        "localhost",
        description="TCP/IP hostname to serve on. Will be ignored if domain "
                    "socket is defined.")
    ws_port: int = Field(
        31950,
        description="TCP/IP port to serve on. Will be ignored if domain socket"
                    " is defined.")
    ws_domain_socket: typing.Optional[str] = Field(
        "/run/aiohttp.sock",
        description="Unix file system path to serve on. This value supersedes"
                    " the port and host name settings."
    )

    hardware_server_enable: bool = Field(
        False,
        description="Run a jsonrpc server allowing rpc to the  hardware "
                    "controller. Only works on buildroot because extra "
                    "dependencies are required."
    )
    hardware_server_socket_path: str = Field(
        '/var/run/opentrons-hardware.sock',
        description="Unix file system path used by the hardware server."
    )

    class Config:
        env_prefix = "OT_ROBOT_SERVER_"
