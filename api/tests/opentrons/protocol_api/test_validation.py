"""Tests for Protocol API input validation."""
from typing import List, Type, Union, Optional, Dict

from decoy import Decoy
import pytest

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons.types import Mount, DeckSlotName, Location, Point
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    MagneticModuleModel,
    TemperatureModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
    ThermocyclerStep,
)
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.api_support.util import APIVersionError
from opentrons.protocol_api import validation as subject, Well, Labware


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
    with pytest.raises(
        subject.InvalidPipetteMountError, match="must be 'left' or 'right'"
    ):
        subject.ensure_mount("oh no")

    with pytest.raises(
        subject.PipetteMountTypeError,
        match="'left', 'right', or an opentrons.types.Mount",
    ):
        subject.ensure_mount(42)  # type: ignore[arg-type]

    with pytest.raises(
        subject.InvalidPipetteMountError, match="Use the left or right mounts instead"
    ):
        subject.ensure_mount(Mount.EXTENSION)


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
    ["input_value", "input_api_version", "expected"],
    [
        ("1", APIVersion(2, 0), DeckSlotName.SLOT_1),
        (1, APIVersion(2, 0), DeckSlotName.SLOT_1),
        ("12", APIVersion(2, 0), DeckSlotName.FIXED_TRASH),
        (12, APIVersion(2, 0), DeckSlotName.FIXED_TRASH),
        ("d1", APIVersion(2, 15), DeckSlotName.SLOT_D1),
        ("D1", APIVersion(2, 15), DeckSlotName.SLOT_D1),
        ("a3", APIVersion(2, 15), DeckSlotName.SLOT_A3),
        ("A3", APIVersion(2, 15), DeckSlotName.SLOT_A3),
    ],
)
def test_ensure_deck_slot(
    input_value: Union[str, int], input_api_version: APIVersion, expected: DeckSlotName
) -> None:
    """It should map strings and ints to DeckSlotName values."""
    result = subject.ensure_deck_slot(input_value, input_api_version)
    assert result == expected


@pytest.mark.parametrize(
    ["input_value", "input_api_version", "expected_error_type", "expected_error_match"],
    [
        ("0", APIVersion(2, 0), ValueError, "not a valid deck slot"),
        (0, APIVersion(2, 0), ValueError, "not a valid deck slot"),
        ("13", APIVersion(2, 0), ValueError, "not a valid deck slot"),
        (13, APIVersion(2, 0), ValueError, "not a valid deck slot"),
        ("b7", APIVersion(2, 0), ValueError, "not a valid deck slot"),
        ("B7", APIVersion(2, 0), ValueError, "not a valid deck slot"),
        (1.23, APIVersion(2, 0), TypeError, "must be a string or integer"),
        (
            "A1",
            APIVersion(2, 0),
            APIVersionError,
            '"A1" requires apiLevel 2.15. Increase your protocol\'s apiLevel, or use slot "10" instead.',
        ),
    ],
)
def test_ensure_deck_slot_invalid(
    input_value: object,
    input_api_version: APIVersion,
    expected_error_type: Type[Exception],
    expected_error_match: str,
) -> None:
    """It should raise an exception if given an invalid name."""
    with pytest.raises(expected_error_type, match=expected_error_match):
        subject.ensure_deck_slot(input_value, input_api_version)  # type: ignore[arg-type]


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


@pytest.mark.parametrize("offset", [{}, [1, 2, 3], 1, {"a", "b", "c"}, "abc"])
def test_ensure_valid_labware_offset_vector(offset: Dict[str, float]) -> None:
    """It should raise ValueError when given offset is invalid."""
    assert subject.ensure_valid_labware_offset_vector({"x": 1.1, "y": 2, "z": 3.3}) == (
        1.1,
        2,
        3.3,
    )
    with pytest.raises(TypeError):
        subject.ensure_valid_labware_offset_vector(offset)


def test_validate_well_no_location(decoy: Decoy) -> None:
    """Should return a WellTarget with no location."""
    input_location = decoy.mock(cls=Well)
    expected_result = subject.WellTarget(
        well=input_location, location=None, in_place=False
    )

    result = subject.validate_location(location=input_location, last_location=None)

    assert result == expected_result


def test_validate_coordinates(decoy: Decoy) -> None:
    """Should return a WellTarget with no location."""
    input_location = Location(point=Point(x=1, y=1, z=2), labware=None)
    expected_result = subject.PointTarget(location=input_location, in_place=False)

    result = subject.validate_location(location=input_location, last_location=None)

    assert result == expected_result


def test_validate_in_place(decoy: Decoy) -> None:
    """Should return an `in_place` PointTarget."""
    input_last_location = Location(point=Point(x=1, y=1, z=2), labware=None)
    expected_result = subject.PointTarget(location=input_last_location, in_place=True)

    result = subject.validate_location(location=None, last_location=input_last_location)

    assert result == expected_result


def test_validate_location_with_well(decoy: Decoy) -> None:
    """Should return a WellTarget with location."""
    mock_well = decoy.mock(cls=Well)
    input_location = Location(point=Point(x=1, y=1, z=1), labware=mock_well)
    expected_result = subject.WellTarget(
        well=mock_well, location=input_location, in_place=False
    )

    result = subject.validate_location(location=input_location, last_location=None)

    assert result == expected_result


def test_validate_last_location(decoy: Decoy) -> None:
    """Should return a WellTarget with location."""
    mock_well = decoy.mock(cls=Well)
    input_last_location = Location(point=Point(x=1, y=1, z=1), labware=mock_well)
    expected_result = subject.WellTarget(
        well=mock_well, location=input_last_location, in_place=True
    )

    result = subject.validate_location(location=None, last_location=input_last_location)

    assert result == expected_result


def test_validate_location_matches_last_location(decoy: Decoy) -> None:
    """Should return an in_place WellTarget."""
    mock_well = decoy.mock(cls=Well)
    input_last_location = Location(point=Point(x=1, y=1, z=1), labware=mock_well)
    input_location = Location(point=Point(x=1, y=1, z=1), labware=mock_well)
    expected_result = subject.WellTarget(
        well=mock_well, location=input_last_location, in_place=True
    )

    result = subject.validate_location(
        location=input_location, last_location=input_last_location
    )

    assert result == expected_result


def test_validate_with_wrong_location_with_last_location() -> None:
    """Should raise a LocationTypeError."""
    with pytest.raises(subject.LocationTypeError):
        subject.validate_location(
            location=42,  # type: ignore[arg-type]
            last_location=Location(point=Point(x=1, y=1, z=1), labware=None),
        )


def test_validate_with_wrong_location() -> None:
    """Should raise a LocationTypeError."""
    with pytest.raises(subject.LocationTypeError):
        subject.validate_location(
            location=42, last_location=None  # type: ignore[arg-type]
        )


def test_validate_raises_no_location_error() -> None:
    """Should raise a NoLocationError."""
    with pytest.raises(subject.NoLocationError):
        subject.validate_location(location=None, last_location=None)


def test_validate_with_labware(decoy: Decoy) -> None:
    """Should return a PointTarget for a non-Well Location."""
    mock_labware = decoy.mock(cls=Labware)
    input_location = Location(point=Point(1, 1, 1), labware=mock_labware)

    result = subject.validate_location(location=input_location, last_location=None)

    assert result == subject.PointTarget(location=input_location, in_place=False)


def test_validate_last_location_with_labware(decoy: Decoy) -> None:
    """Should return a PointTarget for non-Well previous Location."""
    mock_labware = decoy.mock(cls=Labware)
    input_last_location = Location(point=Point(1, 1, 1), labware=mock_labware)

    result = subject.validate_location(location=None, last_location=input_last_location)

    assert result == subject.PointTarget(location=input_last_location, in_place=True)
