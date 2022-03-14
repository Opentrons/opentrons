"""Tests for module state accessors in the protocol engine state store."""
import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from decoy import Decoy

from contextlib import nullcontext
from typing import ContextManager, Dict, NamedTuple, Optional, Type, TypeVar, Union

from opentrons.hardware_control.modules import AbstractModule, MagDeck, TempDeck
from opentrons.types import DeckSlotName
from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    LoadedModule,
    DeckSlotLocation,
    ModuleDefinition,
    ModuleModel,
)
from opentrons.protocol_engine.state.modules import (
    ModuleView,
    ModuleState,
    HardwareModule,
)


def make_module_view(
    slot_by_module_id: Optional[Dict[str, DeckSlotName]] = None,
    hardware_module_by_slot: Optional[Dict[DeckSlotName, HardwareModule]] = None,
) -> ModuleView:
    """Get a module view test subject with the specified state."""
    state = ModuleState(
        slot_by_module_id=slot_by_module_id or {},
        hardware_module_by_slot=hardware_module_by_slot or {},
    )

    return ModuleView(state=state)


HardwareModuleT = TypeVar("HardwareModuleT", bound=AbstractModule)


def make_hardware_module(
    decoy: Decoy, type: Type[HardwareModuleT], serial_number: str
) -> HardwareModuleT:
    """Return a mock hardware module with the specified type and serial number.

    Ideally, we wouldn't use mocks for this, since our subject uses these objects
    as pure input data, and doesn't call anything behavioral on them.
    But it's prohibitively difficult to instantiate these objects in tests otherwise.
    """
    hardware_module = decoy.mock(cls=type)
    # "type: ignore" to override what's normally a read-only property.
    hardware_module.device_info = {"serial": serial_number}  # type: ignore[misc]
    return hardware_module


def test_initial_module_data_by_id() -> None:
    """It should raise if module ID doesn't exist."""
    subject = make_module_view()

    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.get("helloWorld")


def test_get_missing_hardware() -> None:
    """It should raise if no loaded hardware."""
    subject = make_module_view(slot_by_module_id={"module-id": DeckSlotName.SLOT_1})

    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.get("module-id")


def test_get_module_data(tempdeck_v1_def: ModuleDefinition) -> None:
    """It should get module data from state by ID."""
    subject = make_module_view(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-number",
                definition=tempdeck_v1_def,
            )
        },
    )

    assert subject.get("module-id") == LoadedModule(
        id="module-id",
        model=ModuleModel.TEMPERATURE_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        serialNumber="serial-number",
        definition=tempdeck_v1_def,
    )


def test_get_all_modules(
    tempdeck_v1_def: ModuleDefinition,
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """It should return all modules in state."""
    subject = make_module_view(
        slot_by_module_id={
            "module-1": DeckSlotName.SLOT_1,
            "module-2": DeckSlotName.SLOT_2,
        },
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=tempdeck_v1_def,
            ),
            DeckSlotName.SLOT_2: HardwareModule(
                serial_number="serial-2",
                definition=tempdeck_v2_def,
            ),
        },
    )

    assert subject.get_all() == [
        LoadedModule(
            id="module-1",
            serialNumber="serial-1",
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            definition=tempdeck_v1_def,
        ),
        LoadedModule(
            id="module-2",
            serialNumber="serial-2",
            model=ModuleModel.TEMPERATURE_MODULE_V2,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_2),
            definition=tempdeck_v2_def,
        ),
    ]


def test_get_properties_by_id(
    tempdeck_v1_def: ModuleDefinition,
    tempdeck_v2_def: ModuleDefinition,
) -> None:
    """It should return a loaded module's properties by ID."""
    subject = make_module_view(
        slot_by_module_id={
            "module-1": DeckSlotName.SLOT_1,
            "module-2": DeckSlotName.SLOT_2,
        },
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=tempdeck_v1_def,
            ),
            DeckSlotName.SLOT_2: HardwareModule(
                serial_number="serial-2",
                definition=tempdeck_v2_def,
            ),
        },
    )

    assert subject.get_definition("module-1") == tempdeck_v1_def
    assert subject.get_dimensions("module-1") == tempdeck_v1_def.dimensions
    assert subject.get_model("module-1") == ModuleModel.TEMPERATURE_MODULE_V1
    assert subject.get_serial_number("module-1") == "serial-1"
    assert subject.get_location("module-1") == DeckSlotLocation(
        slotName=DeckSlotName.SLOT_1
    )

    assert subject.get_definition("module-2") == tempdeck_v2_def
    assert subject.get_dimensions("module-2") == tempdeck_v2_def.dimensions
    assert subject.get_model("module-2") == ModuleModel.TEMPERATURE_MODULE_V2
    assert subject.get_serial_number("module-2") == "serial-2"
    assert subject.get_location("module-2") == DeckSlotLocation(
        slotName=DeckSlotName.SLOT_2
    )


def test_get_magnet_home_to_base_offset() -> None:
    """It should return the model-specific offset to bottom."""
    subject = make_module_view()
    assert (
        subject.get_magnet_home_to_base_offset(
            module_model=ModuleModel.MAGNETIC_MODULE_V1
        )
        == 2.5
    )
    assert (
        subject.get_magnet_home_to_base_offset(
            module_model=ModuleModel.MAGNETIC_MODULE_V2
        )
        == 2.5
    )


@pytest.mark.parametrize(
    "module_model", [ModuleModel.MAGNETIC_MODULE_V1, ModuleModel.MAGNETIC_MODULE_V2]
)
def test_calculate_magnet_height(module_model: ModuleModel) -> None:
    """It should use true millimeters as hardware units."""
    subject = make_module_view()

    assert (
        subject.calculate_magnet_height(
            module_model=module_model,
            height_from_base=100,
        )
        == 100
    )

    # todo(mm, 2022-02-28):
    # It's unclear whether this expected result should actually be the same
    # between GEN1 and GEN2.
    # The GEN1 homing backoff distance looks accidentally halved, for the same reason
    # that its heights are halved. If the limit switch hardware is the same for both
    # modules, we'd expect the backoff difference to cause a difference in the
    # height_from_home test, even though we're measuring everything in true mm.
    # https://github.com/Opentrons/opentrons/issues/9585
    assert (
        subject.calculate_magnet_height(
            module_model=module_model,
            height_from_home=100,
        )
        == 97.5
    )

    assert (
        subject.calculate_magnet_height(
            module_model=module_model,
            labware_default_height=100,
            offset_from_labware_default=10.0,
        )
        == 110
    )


class _CalculateMagnetHardwareHeightTestParams(NamedTuple):
    model: ModuleModel
    mm_from_base: float
    expected_result: Optional[float]
    expected_exception_type: Union[Type[Exception], None]


@pytest.mark.parametrize(
    "model, mm_from_base, expected_result, expected_exception_type",
    [
        # Happy cases:
        _CalculateMagnetHardwareHeightTestParams(
            model=ModuleModel.MAGNETIC_MODULE_V1,
            mm_from_base=10,
            # TODO(mm, 2022-03-09): It's unclear if this expected result is correct.
            # https://github.com/Opentrons/opentrons/issues/9585
            expected_result=25,
            expected_exception_type=None,
        ),
        _CalculateMagnetHardwareHeightTestParams(
            model=ModuleModel.MAGNETIC_MODULE_V2,
            mm_from_base=10,
            expected_result=12.5,
            expected_exception_type=None,
        ),
        # Boundary conditions:
        #
        # TODO(mm, 2022-03-09):
        # In Python >=3.9, improve precision with math.nextafter().
        # Also consider relying on shared constants instead of hard-coding bounds.
        #
        # TODO(mm, 2022-03-09): It's unclear if the bounds used for V1 modules
        # are physically correct. https://github.com/Opentrons/opentrons/issues/9585
        _CalculateMagnetHardwareHeightTestParams(  # V1 barely too low.
            model=ModuleModel.MAGNETIC_MODULE_V1,
            mm_from_base=-2.51,
            expected_result=None,
            expected_exception_type=errors.EngageHeightOutOfRangeError,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V1 lowest allowed.
            model=ModuleModel.MAGNETIC_MODULE_V1,
            mm_from_base=-2.5,
            expected_result=0,
            expected_exception_type=None,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V1 highest allowed.
            model=ModuleModel.MAGNETIC_MODULE_V1,
            mm_from_base=20,
            expected_result=45,
            expected_exception_type=None,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V1 barely too high.
            model=ModuleModel.MAGNETIC_MODULE_V1,
            mm_from_base=20.01,
            expected_result=None,
            expected_exception_type=errors.EngageHeightOutOfRangeError,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V2 barely too low.
            model=ModuleModel.MAGNETIC_MODULE_V2,
            mm_from_base=-2.51,
            expected_result=None,
            expected_exception_type=errors.EngageHeightOutOfRangeError,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V2 lowest allowed.
            model=ModuleModel.MAGNETIC_MODULE_V2,
            mm_from_base=-2.5,
            expected_result=0,
            expected_exception_type=None,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V2 highest allowed.
            model=ModuleModel.MAGNETIC_MODULE_V2,
            mm_from_base=22.5,
            expected_result=25,
            expected_exception_type=None,
        ),
        _CalculateMagnetHardwareHeightTestParams(  # V2 barely too high.
            model=ModuleModel.MAGNETIC_MODULE_V2,
            mm_from_base=22.51,
            expected_result=None,
            expected_exception_type=errors.EngageHeightOutOfRangeError,
        ),
        # Bad model:
        _CalculateMagnetHardwareHeightTestParams(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            mm_from_base=0,
            expected_result=None,
            expected_exception_type=errors.WrongModuleTypeError,
        ),
    ],
)
def test_calculate_magnet_hardware_height(
    model: ModuleModel,
    mm_from_base: float,
    expected_result: float,
    expected_exception_type: Union[Type[Exception], None],
) -> None:
    """It should return the expected height or raise the expected exception."""
    subject = make_module_view()
    context: ContextManager[None] = (
        # Not sure why mypy has trouble with this.
        nullcontext()  # type: ignore[assignment]
        if expected_exception_type is None
        else pytest.raises(expected_exception_type)
    )
    with context:
        result = subject.calculate_magnet_hardware_height(
            magnetic_module_model=model, mm_from_base=mm_from_base
        )
        assert result == expected_result


@pytest.mark.parametrize(
    argnames=["module_model", "target_temp", "expected_valid"],
    argvalues=[(ModuleModel.HEATER_SHAKER_MODULE_V1, 36.8, False),
               (ModuleModel.HEATER_SHAKER_MODULE_V1, 37, True),
               (ModuleModel.HEATER_SHAKER_MODULE_V1, 94.8, True),
               (ModuleModel.HEATER_SHAKER_MODULE_V1, 95.1, False)]
)
def test_is_target_temperature_valid(
        module_model: ModuleModel,
        target_temp: float,
        expected_valid: bool,
) -> None:
    """It should verify if a target temperature is valid for the specified module."""
    subject = make_module_view()
    result = subject.is_target_temperature_valid(heating_module_model=module_model,
                                                 celsius=target_temp)
    assert result == expected_valid


@pytest.mark.parametrize(
    argnames=["from_slot", "to_slot", "should_dodge"],
    argvalues=[
        (DeckSlotName.SLOT_1, DeckSlotName.FIXED_TRASH, True),
        (DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_1, True),
        (DeckSlotName.SLOT_4, DeckSlotName.FIXED_TRASH, True),
        (DeckSlotName.FIXED_TRASH, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_9, True),
        (DeckSlotName.SLOT_9, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_8, True),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_8, True),
        (DeckSlotName.SLOT_8, DeckSlotName.SLOT_1, True),
        (DeckSlotName.SLOT_4, DeckSlotName.SLOT_11, True),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_1, DeckSlotName.SLOT_11, True),
        (DeckSlotName.SLOT_11, DeckSlotName.SLOT_1, True),
        (DeckSlotName.SLOT_2, DeckSlotName.SLOT_4, False),
    ],
)
def test_thermocycler_dodging(
    thermocycler_v1_def: ModuleDefinition,
    from_slot: DeckSlotName,
    to_slot: DeckSlotName,
    should_dodge: bool,
) -> None:
    """It should specify if thermocycler dodging is needed.

    It should return True if thermocycler exists and movement is between bad pairs of
    slot locations.
    """
    subject = make_module_view(
        slot_by_module_id={"module-id": DeckSlotName.SLOT_1},
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-number",
                definition=thermocycler_v1_def,
            )
        },
    )

    assert (
        subject.should_dodge_thermocycler(from_slot=from_slot, to_slot=to_slot)
        is should_dodge
    )


def test_find_loaded_hardware_module(
    decoy: Decoy, magdeck_v1_def: ModuleDefinition
) -> None:
    """It should return the matching hardware module."""
    matching = make_hardware_module(
        decoy=decoy, type=MagDeck, serial_number="serial-matching"
    )
    non_matching = make_hardware_module(
        decoy=decoy, type=MagDeck, serial_number="serial-non-matching"
    )
    another_non_matching = make_hardware_module(
        decoy=decoy, type=TempDeck, serial_number="serial-another-non-matching"
    )

    attached = [non_matching, matching, another_non_matching]

    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-non-matching",
                definition=magdeck_v1_def,
            ),
            DeckSlotName.SLOT_2: HardwareModule(
                serial_number="serial-matching",
                definition=magdeck_v1_def,
            ),
            DeckSlotName.SLOT_3: HardwareModule(
                serial_number="serial-another-non-matching",
                definition=magdeck_v1_def,
            ),
        },
        slot_by_module_id={
            "id-non-matching": DeckSlotName.SLOT_1,
            "id-matching": DeckSlotName.SLOT_2,
            "id-another-non-matching": DeckSlotName.SLOT_3,
        },
    )

    result = subject.find_loaded_hardware_module(
        module_id="id-matching",
        attached_modules=attached,
        expected_type=MagDeck,
    )

    assert result == matching


def test_find_loaded_hardware_module_raises_if_no_match_loaded(
    decoy: Decoy,
) -> None:
    """It should raise if the ID doesn't point to a loaded module."""
    subject = make_module_view(
        hardware_module_by_slot={},
        slot_by_module_id={},
    )
    with pytest.raises(errors.ModuleDoesNotExistError):
        subject.find_loaded_hardware_module(
            module_id="module-id",
            attached_modules=[],
            expected_type=MagDeck,
        )


def test_find_loaded_hardware_module_raises_if_match_not_attached(
    decoy: Decoy, magdeck_v1_def: ModuleDefinition
) -> None:
    """It should raise if a match was loaded but is not found in the attached list."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-matching",
                definition=magdeck_v1_def,
            ),
        },
        slot_by_module_id={
            "id-matching": DeckSlotName.SLOT_1,
        },
    )
    with pytest.raises(errors.ModuleNotAttachedError):
        subject.find_loaded_hardware_module(
            module_id="id-matching",
            attached_modules=[],
            expected_type=MagDeck,
        )


def test_find_loaded_hardware_module_raises_if_match_is_wrong_type(
    decoy: Decoy, magdeck_v1_def: ModuleDefinition
) -> None:
    """It should raise if a match was found but is of an unexpected type."""
    matching = make_hardware_module(
        decoy=decoy, type=MagDeck, serial_number="serial-matching"
    )
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-matching",
                definition=magdeck_v1_def,
            ),
        },
        slot_by_module_id={
            "id-matching": DeckSlotName.SLOT_1,
        },
    )
    with pytest.raises(errors.WrongModuleTypeError):
        subject.find_loaded_hardware_module(
            module_id="id-matching",
            attached_modules=[matching],
            expected_type=TempDeck,  # Will definitely not match.
        )


def test_select_hardware_module_to_load_rejects_missing() -> None:
    """It should raise if the correct module isn't attached."""
    subject = make_module_view()

    with pytest.raises(errors.ModuleNotAttachedError):
        subject.select_hardware_module_to_load(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            attached_modules=[],
        )


@pytest.mark.parametrize(
    argnames=["requested_model", "attached_definition"],
    argvalues=[
        (ModuleModel.TEMPERATURE_MODULE_V1, lazy_fixture("tempdeck_v1_def")),
        (ModuleModel.TEMPERATURE_MODULE_V2, lazy_fixture("tempdeck_v2_def")),
        (ModuleModel.TEMPERATURE_MODULE_V1, lazy_fixture("tempdeck_v2_def")),
        (ModuleModel.TEMPERATURE_MODULE_V2, lazy_fixture("tempdeck_v1_def")),
        (ModuleModel.MAGNETIC_MODULE_V1, lazy_fixture("magdeck_v1_def")),
        (ModuleModel.MAGNETIC_MODULE_V2, lazy_fixture("magdeck_v2_def")),
        (ModuleModel.THERMOCYCLER_MODULE_V1, lazy_fixture("thermocycler_v1_def")),
    ],
)
def test_select_hardware_module_to_load(
    requested_model: ModuleModel,
    attached_definition: ModuleDefinition,
) -> None:
    """It should return the first attached module that matches."""
    subject = make_module_view()

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=attached_definition),
        HardwareModule(serial_number="serial-2", definition=attached_definition),
    ]

    result = subject.select_hardware_module_to_load(
        model=requested_model,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[0]


def test_select_hardware_module_to_load_skips_non_matching(
    magdeck_v1_def: ModuleDefinition,
    magdeck_v2_def: ModuleDefinition,
) -> None:
    """It should skip over non-matching modules."""
    subject = make_module_view()

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=magdeck_v2_def),
    ]

    result = subject.select_hardware_module_to_load(
        model=ModuleModel.MAGNETIC_MODULE_V2,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[1]


def test_select_hardware_module_to_load_skips_already_loaded(
    magdeck_v1_def: ModuleDefinition,
) -> None:
    """It should skip over already assigned modules."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=magdeck_v1_def,
            )
        }
    )

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=magdeck_v1_def),
    ]

    result = subject.select_hardware_module_to_load(
        model=ModuleModel.MAGNETIC_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[1]


def test_select_hardware_module_to_load_reuses_already_loaded(
    magdeck_v1_def: ModuleDefinition,
) -> None:
    """It should reuse over already assigned modules in the same location."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=magdeck_v1_def,
            )
        }
    )

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=magdeck_v1_def),
    ]

    result = subject.select_hardware_module_to_load(
        model=ModuleModel.MAGNETIC_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        attached_modules=attached_modules,
    )

    assert result == attached_modules[0]


def test_select_hardware_module_to_load_rejects_location_reassignment(
    magdeck_v1_def: ModuleDefinition,
    tempdeck_v1_def: ModuleDefinition,
) -> None:
    """It should raise if a non-matching module is already present in the slot."""
    subject = make_module_view(
        hardware_module_by_slot={
            DeckSlotName.SLOT_1: HardwareModule(
                serial_number="serial-1",
                definition=magdeck_v1_def,
            )
        }
    )

    attached_modules = [
        HardwareModule(serial_number="serial-1", definition=magdeck_v1_def),
        HardwareModule(serial_number="serial-2", definition=tempdeck_v1_def),
    ]

    with pytest.raises(errors.ModuleAlreadyPresentError):
        subject.select_hardware_module_to_load(
            model=ModuleModel.TEMPERATURE_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            attached_modules=attached_modules,
        )
