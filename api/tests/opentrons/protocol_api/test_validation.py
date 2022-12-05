"""Tests for Protocol API input validation."""
from typing import List, Union, Optional

import pytest

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import Mount, DeckSlotName
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    MagneticModuleModel,
    TemperatureModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
    ThermocyclerStep,
)
from opentrons.protocol_api import validation as subject


@pytest.mark.parametrize(
    ["input_value", "expected"],
    [
        ("left", Mount.LEFT),
        ("right", Mount.RIGHT),
        ("LeFt", Mount.LEFT),
        (Mount.LEFT, Mount.LEFT),
        (Mount.RIGHT, Mount.RIGHT),
    ],
)
def test_ensure_mount(input_value: Union[str, Mount], expected: Mount) -> None:
    """It should properly map strings and mounts."""
    result = subject.ensure_mount(input_value)
    assert result == expected


def test_ensure_mount_input_invalid() -> None:
    """It should raise if given invalid mount input."""
    with pytest.raises(ValueError, match="must be 'left' or 'right'"):
        subject.ensure_mount("oh no")

    with pytest.raises(TypeError, match="'left', 'right', or an opentrons.types.Mount"):
        subject.ensure_mount(42)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ["input_value", "expected"],
    [
        ("p300_single", PipetteNameType.P300_SINGLE),
        ("P300_muLTI_gen2", PipetteNameType.P300_MULTI_GEN2),
    ],
)
def test_ensure_pipette_name(input_value: str, expected: PipetteNameType) -> None:
    """It should properly map strings and PipetteNameType enums."""
    result = subject.ensure_pipette_name(input_value)
    assert result == expected


def test_ensure_pipette_input_invalid() -> None:
    """It should raise a ValueError if given an invalid name."""
    with pytest.raises(ValueError, match="must be given valid pipette name"):
        subject.ensure_pipette_name("oh-no")


@pytest.mark.parametrize(
    ["input_value", "expected"],
    [
        ("1", DeckSlotName.SLOT_1),
        (1, DeckSlotName.SLOT_1),
        (12, DeckSlotName.FIXED_TRASH),
        ("12", DeckSlotName.FIXED_TRASH),
    ],
)
def test_ensure_deck_slot(input_value: Union[str, int], expected: DeckSlotName) -> None:
    """It should map strings and ints to DeckSlotName values."""
    result = subject.ensure_deck_slot(input_value)
    assert result == expected


def test_ensure_deck_slot_invalid() -> None:
    """It should raise a ValueError if given an invalid name."""
    input_values: List[Union[str, int]] = ["0", 0, "13", 13]

    for input_value in input_values:
        with pytest.raises(ValueError, match="not a valid deck slot"):
            subject.ensure_deck_slot(input_value)

    with pytest.raises(TypeError, match="must be a string or integer"):
        subject.ensure_deck_slot(1.23)  # type: ignore[arg-type]


def test_ensure_lowercase_name() -> None:
    """It should properly map strings and PipetteNameType enums."""
    result = subject.ensure_lowercase_name("aBcDeFg")
    assert result == "abcdefg"


def test_ensure_lowercase_name_invalid() -> None:
    """It should raise a ValueError if given an invalid name."""
    with pytest.raises(TypeError, match="must be a string"):
        subject.ensure_lowercase_name(101)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("load_name", "expected_model"),
    [
        ("magdeck", MagneticModuleModel.MAGNETIC_V1),
        ("MaGdEcK", MagneticModuleModel.MAGNETIC_V1),
        ("magnetic module", MagneticModuleModel.MAGNETIC_V1),
        ("magneticModuleV1", MagneticModuleModel.MAGNETIC_V1),
        ("magnetic module gen2", MagneticModuleModel.MAGNETIC_V2),
        ("magneticModuleV2", MagneticModuleModel.MAGNETIC_V2),
        ("tempdeck", TemperatureModuleModel.TEMPERATURE_V1),
        ("tEmpDeCk", TemperatureModuleModel.TEMPERATURE_V1),
        ("temperatureModuleV1", TemperatureModuleModel.TEMPERATURE_V1),
        ("temperature module", TemperatureModuleModel.TEMPERATURE_V1),
        ("temperature module gen2", TemperatureModuleModel.TEMPERATURE_V2),
        ("temperatureModuleV2", TemperatureModuleModel.TEMPERATURE_V2),
        ("thermocycler", ThermocyclerModuleModel.THERMOCYCLER_V1),
        ("ThErMoCyClEr", ThermocyclerModuleModel.THERMOCYCLER_V1),
        ("thermocycler module", ThermocyclerModuleModel.THERMOCYCLER_V1),
        ("thermocyclerModuleV1", ThermocyclerModuleModel.THERMOCYCLER_V1),
        ("thermocycler module gen2", ThermocyclerModuleModel.THERMOCYCLER_V2),
        ("thermocyclerModuleV2", ThermocyclerModuleModel.THERMOCYCLER_V2),
        ("heaterShakerModuleV1", HeaterShakerModuleModel.HEATER_SHAKER_V1),
    ],
)
def test_ensure_module_model(load_name: str, expected_model: ModuleModel) -> None:
    """It should map an module load name to a specific model."""
    result = subject.ensure_module_model(load_name)
    assert result == expected_model


def test_ensure_module_model_invalid() -> None:
    """It should reject invalid module load names."""
    with pytest.raises(ValueError, match="not a valid module load name"):
        subject.ensure_module_model("spline reticulator")

    with pytest.raises(TypeError, match="must be a string"):
        subject.ensure_module_model(42)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ["seconds", "minutes", "expected"],
    [
        (42.42, None, 42.42),
        (None, 1.2, 72.0),
        (42.42, 1.2, 114.42),
        (None, None, 0),
    ],
)
def test_ensure_hold_time_seconds(
    seconds: Optional[float], minutes: Optional[float], expected: float
) -> None:
    """It should ensure hold time is in seconds only."""
    result = subject.ensure_hold_time_seconds(seconds=seconds, minutes=minutes)
    assert result == expected


@pytest.mark.parametrize(
    ["repetitions", "expected"],
    [
        (1, 1),
        (2, 2),
        (999, 999),
    ],
)
def test_ensure_thermocycler_repetition_count(repetitions: int, expected: int) -> None:
    """It should return a given positive integer."""
    result = subject.ensure_thermocycler_repetition_count(repetitions)
    assert result == expected


@pytest.mark.parametrize(
    "repetitions",
    [
        0,
        -1,
        -999,
    ],
)
def test_ensure_thermocycler_repetition_count_raises(repetitions: int) -> None:
    """It should raise if repetitions is zero or negative."""
    with pytest.raises(ValueError):
        subject.ensure_thermocycler_repetition_count(repetitions)


@pytest.mark.parametrize(
    ["steps", "expected"],
    [
        (
            [
                {
                    "temperature": 42.0,
                    "hold_time_minutes": 12.3,
                    "hold_time_seconds": 45.6,
                }
            ],
            [{"temperature": 42.0, "hold_time_seconds": 783.6}],
        ),
        (
            [{"temperature": 42.0, "hold_time_seconds": 45.6}],
            [{"temperature": 42.0, "hold_time_seconds": 45.6}],
        ),
        (
            [{"temperature": 42.0, "hold_time_minutes": 12.3}],
            [{"temperature": 42.0, "hold_time_seconds": 738.0}],
        ),
        (
            [
                {"temperature": 42.0, "hold_time_seconds": 12.3},
                {"temperature": 52.0, "hold_time_minutes": 12.3},
            ],
            [
                {"temperature": 42.0, "hold_time_seconds": 12.3},
                {"temperature": 52.0, "hold_time_seconds": 738.0},
            ],
        ),
        ([], []),
    ],
)
def test_ensure_thermocycler_profile_steps(
    steps: List[ThermocyclerStep], expected: List[ThermocyclerStep]
) -> None:
    """It should ensure thermocycler profile steps are valid and hold time is expressed in seconds only."""
    result = subject.ensure_thermocycler_profile_steps(steps)
    assert result == expected


@pytest.mark.parametrize(
    "steps",
    [
        [{"hold_time_minutes": 12.3, "hold_time_seconds": 45.6}],
        [{"temperature": 42.0}],
    ],
)
def test_ensure_thermocycler_profile_steps_invalid(
    steps: List[ThermocyclerStep],
) -> None:
    """It should raise a ValueError when given invalid thermocycler profile steps."""
    with pytest.raises(ValueError):
        subject.ensure_thermocycler_profile_steps(steps)
