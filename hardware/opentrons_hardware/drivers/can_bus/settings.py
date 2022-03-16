"""Driver settings."""
from typing_extensions import Final
from pydantic import BaseSettings, Field

DEFAULT_INTERFACE: Final = "socketcan"

DEFAULT_BITRATE: Final = 250000

DEFAULT_CHANNEL: Final = "can0"

DEFAULT_HOST: Final = "localhost"

DEFAULT_PORT: Final = 9898

OPENTRONS_INTERFACE: Final = "opentrons_sock"


class DriverSettings(BaseSettings):
    """Settings for driver building."""

    interface: str = Field(
        DEFAULT_INTERFACE,
        description=f"Can either be {OPENTRONS_INTERFACE} for simple socket "
        f"or a python can interface.",
    )
    bit_rate: int = Field(
        DEFAULT_BITRATE,
        description=f"Bit rate. Not applicable to {OPENTRONS_INTERFACE} interface.",
    )
    channel: str = Field(DEFAULT_CHANNEL, description="The SocketCan channel.")

    host: str = Field(DEFAULT_HOST, description=f"{OPENTRONS_INTERFACE} only.")
    port: int = Field(DEFAULT_PORT, description=f"{OPENTRONS_INTERFACE} only.")

    class Config:  # noqa: D106
        env_prefix = "OT3_CAN_DRIVER_"
