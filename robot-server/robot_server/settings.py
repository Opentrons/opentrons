import typing
import logging
from functools import lru_cache
from pathlib import Path

from pydantic import BaseSettings, Field
from dotenv import load_dotenv

from opentrons.config import infer_config_base_dir

log = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_settings() -> "RobotServerSettings":
    """Get the settings"""
    load_dotenv(get_dotenv_path())
    return RobotServerSettings()


def get_dotenv_path() -> Path:
    """Get the location of the settings file"""
    return Environment().dot_env_path


class Environment(BaseSettings):
    """Environment related settings"""

    dot_env_path: Path = infer_config_base_dir() / "robot.env"

    class Config:
        env_prefix = "OT_ROBOT_SERVER_"


class RobotServerSettings(BaseSettings):
    """
    Robot server settings.

    To override any of these create an environment variable with prefix
    OT_ROBOT_SERVER_.
    """

    ws_host_name: str = Field(
        "localhost",
        description="TCP/IP hostname to serve on. Will be ignored if domain "
        "socket is defined.",
    )
    ws_port: int = Field(
        31950,
        description="TCP/IP port to serve on. Will be ignored if domain socket"
        " is defined.",
    )
    ws_domain_socket: typing.Optional[str] = Field(
        "/run/aiohttp.sock",
        description="Unix file system path to serve on. This value supersedes"
        " the port and host name settings.",
    )
    simulator_configuration_file_path: str = Field(
        None,
        description="Path to a json file that describes the hardware" " simulator.",
    )

    protocol_manager_max_protocols: int = Field(
        1, description="The maximum number of protocols allowed for upload"
    )

    notification_server_subscriber_address: str = Field(
        "tcp://localhost:5555",
        description="The endpoint to subscribe to notification server topics.",
    )

    class Config:
        env_prefix = "OT_ROBOT_SERVER_"
