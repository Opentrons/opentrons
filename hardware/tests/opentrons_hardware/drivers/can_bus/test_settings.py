"""Tests for pcan bit timing calculations."""
import pytest

from typing import Optional
from opentrons_shared_data.errors.exceptions import CANBusConfigurationError
from opentrons_hardware.drivers.can_bus import settings


@pytest.mark.parametrize(
    argnames=["fcan_clock", "bitrate", "sample_rate", "jump_width", "expected"],
    argvalues=[
        [
            None,
            None,
            None,
            None,
            settings.PCANParameters(
                f_clock_mhz=20, nom_brp=2, nom_tseg1=15, nom_tseg2=4, nom_sjw=1
            ),
        ],
        [
            40,
            250000,
            None,
            None,
            settings.PCANParameters(
                f_clock_mhz=40, nom_brp=4, nom_tseg1=31, nom_tseg2=8, nom_sjw=1
            ),
        ],
        [
            None,
            None,
            87.5,
            None,
            settings.PCANParameters(
                f_clock_mhz=20, nom_brp=2, nom_tseg1=16, nom_tseg2=2, nom_sjw=1
            ),
        ],
        [
            60,
            None,
            None,
            4,
            settings.PCANParameters(
                f_clock_mhz=60, nom_brp=6, nom_tseg1=15, nom_tseg2=4, nom_sjw=4
            ),
        ],
    ],
)
def test_valid_calculate_bit_timings(
    fcan_clock: Optional[int],
    bitrate: Optional[int],
    sample_rate: Optional[float],
    jump_width: Optional[int],
    expected: settings.PCANParameters,
) -> None:
    """Test valid bit timing calculations."""
    result = settings.calculate_fdcan_parameters(
        fcan_clock, bitrate, sample_rate, jump_width
    )
    assert result == expected


@pytest.mark.parametrize(
    argnames=["fcan_clock", "bitrate", "sample_rate", "jump_width", "match_str"],
    argvalues=[
        [
            90,
            None,
            None,
            None,
            "Clock value 90 exceeds max value of 80",
        ],
        [
            None,
            None,
            None,
            130,
            "Jump width value 130 exceeds max value of 128",
        ],
        [
            80,
            10000,
            None,
            None,
            "Calculated TSEG1 799.0 exceeds max value 256",
        ],
    ],
)
def test_invalid_calculate_bit_timings(
    fcan_clock: Optional[int],
    bitrate: Optional[int],
    sample_rate: Optional[float],
    jump_width: Optional[int],
    match_str: str,
) -> None:
    """Test invalid bit timing calculations."""
    with pytest.raises(CANBusConfigurationError, match=match_str):
        settings.calculate_fdcan_parameters(
            fcan_clock, bitrate, sample_rate, jump_width
        )
