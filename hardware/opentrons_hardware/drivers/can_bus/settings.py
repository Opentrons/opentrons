"""Driver settings."""
from typing_extensions import Final, TypedDict
from typing import Optional
from pydantic import BaseSettings, Field

from math import floor

DEFAULT_INTERFACE: Final = "socketcan"

DEFAULT_BITRATE: Final[int] = 500000

DEFAULT_FDCAN_CLK: Final[int] = 20  # 20 MHZ
MINIMUM_FDCAN_CLK: Final[int] = 10
DEFAULT_SAMPLE_RATE: Final[float] = 87.5
DEFAULT_JUMP_WIDTH_SEG: Final[int] = 1


DEFAULT_CHANNEL: Final = "can0"

DEFAULT_HOST: Final = "localhost"

DEFAULT_PORT: Final = 9898

OPENTRONS_INTERFACE: Final = "opentrons_sock"


class PCANParameters(TypedDict):
    """FDCan parameters for PCAN."""

    f_clock_mhz: int
    nom_brp: int
    nom_tseg1: int
    nom_tseg2: int
    nom_sjw: int


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
    fcan_clock: int = Field(DEFAULT_FDCAN_CLK, description="pcan only.")
    sample_rate: float = Field(DEFAULT_SAMPLE_RATE, description="pcan only.")

    class Config:  # noqa: D106
        env_prefix = "OT3_CAN_DRIVER_"


def calculate_fdcan_parameters(
    fcan_clock: Optional[int], bitrate: Optional[int], sample_rate: Optional[float]
) -> PCANParameters:
    """Calculate FDCAN Timing Parameters.

    Args:
        fcan_clock: The clock used by the analyzer
        bitrate: The bitrate of data transfer
        sample_rate: When to sample the data.


    """
    if not fcan_clock:
        fcan_clock = DEFAULT_FDCAN_CLK
    if not bitrate:
        bitrate = DEFAULT_BITRATE
    if not sample_rate:
        sample_rate = DEFAULT_SAMPLE_RATE

    sample_rate_percent = sample_rate / 100
    bit_time = 1 / bitrate  # us units
    time_quanta_ns = 1 / fcan_clock
    time_quanta_unitless = bit_time / time_quanta_ns

    # Given a sample rate, we can say that
    # (jump_width_seg + TSEG1)/(jump_width_seg + TSEG1 + TSEG2) = sample_rate
    # and also that (jump_width_seg + TSEG1 + TSEG2) = unitless_time_quanta (tq)
    tseg_1 = (sample_rate_percent * time_quanta_unitless) - DEFAULT_JUMP_WIDTH_SEG
    tseg_2 = time_quanta_unitless - DEFAULT_JUMP_WIDTH_SEG - tseg_1
    brp = fcan_clock // MINIMUM_FDCAN_CLK  # clock prescaler (unitless)

    return PCANParameters(
        f_clock_mhz=fcan_clock,
        nom_brp=brp,
        nom_tseg1=floor(tseg_1),
        nom_tseg2=floor(tseg_2),
        nom_sjw=DEFAULT_JUMP_WIDTH_SEG,
    )
