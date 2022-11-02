"""Tests for the ProtocolContext public interface."""
import inspect
from typing import cast

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareDefinition as LabwareDefDict

from opentrons.types import Mount, DeckSlotName
from opentrons.broker import Broker
from opentrons.hardware_control.modules.types import ModuleType, TemperatureModuleModel
from opentrons.protocols.api_support import instrument as mock_instrument_support
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import (
    MAX_SUPPORTED_VERSION,
    ProtocolContext,
    InstrumentContext,
    ModuleContext,
    Labware,
    validation as mock_validation,
)
from opentrons.protocol_api.module_contexts import TemperatureModuleContext
from opentrons.protocol_api.core.labware import LabwareLoadParams
from opentrons.protocol_api.core.common import (
    InstrumentCore,
    LabwareCore,
    ProtocolCore,
    TemperatureModuleCore,
)


@pytest.fixture(autouse=True)
def _mock_validation_module(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    for name, func in inspect.getmembers(mock_validation, inspect.isfunction):
        monkeypatch.setattr(mock_validation, name, decoy.mock(func=func))


@pytest.fixture(autouse=True)
def _mock_instrument_support_module(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    for name, func in inspect.getmembers(mock_instrument_support, inspect.isfunction):
        monkeypatch.setattr(mock_instrument_support, name, decoy.mock(func=func))


@pytest.fixture
def mock_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(mock_core: ProtocolCore) -> ProtocolContext:
    """Get a ProtocolContext test subject with its dependencies mocked out."""
    return ProtocolContext(
        api_version=MAX_SUPPORTED_VERSION,
        implementation=mock_core,
    )


def test_fixed_trash(
    decoy: Decoy, mock_core: ProtocolCore, subject: ProtocolContext
) -> None:
    """It should get the fixed trash labware from the core."""
    mock_labware = decoy.mock(cls=Labware)
    decoy.when(mock_core.get_fixed_trash()).then_return(mock_labware)

    result = subject.fixed_trash

    assert result is mock_labware


def test_load_instrument(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should create a instrument using its execution core."""
    mock_instrument_core = decoy.mock(cls=InstrumentCore)
    mock_tip_racks = [decoy.mock(cls=Labware), decoy.mock(cls=Labware)]

    decoy.when(mock_validation.ensure_mount("shadowfax")).then_return(Mount.LEFT)
    decoy.when(mock_validation.ensure_lowercase_name("Gandalf")).then_return("gandalf")
    decoy.when(mock_validation.ensure_pipette_name("gandalf")).then_return(
        PipetteNameType.P300_SINGLE
    )

    decoy.when(
        mock_core.load_instrument(
            instrument_name=PipetteNameType.P300_SINGLE,
            mount=Mount.LEFT,
        )
    ).then_return(mock_instrument_core)

    decoy.when(mock_instrument_core.get_pipette_name()).then_return("Gandalf the Grey")

    result = subject.load_instrument(
        instrument_name="Gandalf", mount="shadowfax", tip_racks=mock_tip_racks
    )

    assert isinstance(result, InstrumentContext)
    assert result.name == "Gandalf the Grey"
    assert result.requested_as == "gandalf"
    assert subject.loaded_instruments["left"] is result

    decoy.verify(
        mock_instrument_support.validate_tiprack(
            instrument_name="Gandalf the Grey",
            tip_rack=mock_tip_racks[0],
            log=matchers.Anything(),
        ),
        mock_instrument_support.validate_tiprack(
            instrument_name="Gandalf the Grey",
            tip_rack=mock_tip_racks[1],
            log=matchers.Anything(),
        ),
    )


def test_load_instrument_replace(
    decoy: Decoy, mock_core: ProtocolCore, subject: ProtocolContext
) -> None:
    """It should allow/disallow pipette replacement."""
    mock_instrument_core = decoy.mock(cls=InstrumentCore)

    decoy.when(mock_validation.ensure_lowercase_name("ada")).then_return("ada")
    decoy.when(mock_validation.ensure_mount(matchers.IsA(Mount))).then_return(
        Mount.RIGHT
    )
    decoy.when(mock_validation.ensure_pipette_name(matchers.IsA(str))).then_return(
        PipetteNameType.P300_SINGLE
    )
    decoy.when(
        mock_core.load_instrument(
            instrument_name=matchers.IsA(PipetteNameType),
            mount=matchers.IsA(Mount),
        )
    ).then_return(mock_instrument_core)
    decoy.when(mock_instrument_core.get_pipette_name()).then_return("Ada Lovelace")

    pipette_1 = subject.load_instrument(instrument_name="ada", mount=Mount.RIGHT)
    assert subject.loaded_instruments["right"] is pipette_1

    pipette_2 = subject.load_instrument(
        instrument_name="ada", mount=Mount.RIGHT, replace=True
    )
    assert subject.loaded_instruments["right"] is pipette_2

    with pytest.raises(RuntimeError, match="Instrument already present"):
        subject.load_instrument(instrument_name="ada", mount=Mount.RIGHT)


def test_load_labware(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should create a labware using its execution core."""
    mock_labware_core = decoy.mock(cls=LabwareCore)

    decoy.when(mock_validation.ensure_lowercase_name("UPPERCASE_LABWARE")).then_return(
        "lowercase_labware"
    )
    decoy.when(mock_validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_5)

    decoy.when(
        mock_core.load_labware(
            load_name="lowercase_labware",
            location=DeckSlotName.SLOT_5,
            label="some_display_name",
            namespace="some_namespace",
            version=1337,
        )
    ).then_return(mock_labware_core)

    decoy.when(mock_labware_core.get_name()).then_return("Full Name")

    result = subject.load_labware(
        load_name="UPPERCASE_LABWARE",
        location=42,
        label="some_display_name",
        namespace="some_namespace",
        version=1337,
    )

    assert isinstance(result, Labware)
    assert result.name == "Full Name"


def test_load_labware_from_definition(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a labware from a definition dictionary."""
    mock_labware_core = decoy.mock(cls=LabwareCore)

    labware_definition_dict = cast(LabwareDefDict, {"labwareDef": True})
    labware_load_params = LabwareLoadParams("you", "are", 1337)

    decoy.when(mock_validation.ensure_lowercase_name("are")).then_return("are")
    decoy.when(mock_validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_1)
    decoy.when(mock_core.add_labware_definition(labware_definition_dict)).then_return(
        labware_load_params
    )

    decoy.when(mock_labware_core.get_name()).then_return("Full Name")

    decoy.when(
        mock_core.load_labware(
            namespace="you",
            load_name="are",
            version=1337,
            location=DeckSlotName.SLOT_1,
            label="Some Display Name",
        )
    ).then_return(mock_labware_core)

    result = subject.load_labware_from_definition(
        labware_def=labware_definition_dict,
        location=42,
        label="Some Display Name",
    )

    assert isinstance(result, Labware)
    assert result.name == "Full Name"


def test_move_labware_to_slot(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should move labware to new slot location."""
    mock_labware_core = decoy.mock(cls=LabwareCore)
    movable_labware = Labware(implementation=mock_labware_core)
    decoy.when(mock_validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_1)

    subject.move_labware(
        labware=movable_labware,
        new_location=42,
    )
    decoy.verify(
        mock_core.move_labware(
            labware_core=mock_labware_core,
            new_location=DeckSlotName.SLOT_1,
            use_gripper=False,
        )
    )


def test_move_labware_to_module(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should move labware to new module location."""
    mock_labware_core = decoy.mock(cls=LabwareCore)
    mock_module_core = decoy.mock(cls=TemperatureModuleCore)
    mock_broker = decoy.mock(cls=Broker)
    movable_labware = Labware(implementation=mock_labware_core)
    module_location = TemperatureModuleContext(
        core=mock_module_core,
        protocol_core=mock_core,
        api_version=APIVersion(2, 13),
        broker=mock_broker,
    )

    subject.move_labware(labware=movable_labware, new_location=module_location)
    decoy.verify(
        mock_core.move_labware(
            labware_core=mock_labware_core,
            new_location=mock_module_core,
            use_gripper=False,
        )
    )


def test_load_module(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should load a module."""
    # TODO: replace with `decoy.mock(cls=TemperatureModuleCore)` with decoy >= 1.11.1
    mock_module_core = cast(
        TemperatureModuleCore, decoy.mock(cls=TemperatureModuleCore.__origin__)  # type: ignore[attr-defined]
    )
    decoy.when(mock_validation.ensure_module_model("spline reticulator")).then_return(
        TemperatureModuleModel.TEMPERATURE_V1
    )
    decoy.when(mock_validation.ensure_deck_slot(42)).then_return(DeckSlotName.SLOT_3)

    decoy.when(
        mock_core.load_module(
            model=TemperatureModuleModel.TEMPERATURE_V1,
            deck_slot=DeckSlotName.SLOT_3,
            configuration=None,
        )
    ).then_return(mock_module_core)

    decoy.when(mock_module_core.get_model()).then_return(
        TemperatureModuleModel.TEMPERATURE_V2
    )
    decoy.when(mock_module_core.get_serial_number()).then_return("cap'n crunch")
    decoy.when(mock_module_core.get_deck_slot()).then_return(DeckSlotName.SLOT_3)

    result = subject.load_module(module_name="spline reticulator", location=42)

    assert isinstance(result, ModuleContext)
    assert subject.loaded_modules[3] is result


def test_load_module_default_location(
    decoy: Decoy,
    mock_core: ProtocolCore,
    subject: ProtocolContext,
) -> None:
    """It should load a module without specifying a location explicitely."""
    # TODO: replace with `decoy.mock(cls=TemperatureModuleCore)` with decoy >= 1.11.1
    mock_module_core = cast(
        TemperatureModuleCore, decoy.mock(cls=TemperatureModuleCore.__origin__)  # type: ignore[attr-defined]
    )

    decoy.when(mock_validation.ensure_module_model("spline reticulator")).then_return(
        TemperatureModuleModel.TEMPERATURE_V1
    )

    decoy.when(
        mock_core.load_module(
            model=TemperatureModuleModel.TEMPERATURE_V1,
            deck_slot=None,
            configuration=None,
        )
    ).then_return(mock_module_core)

    decoy.when(mock_module_core.get_type()).then_return(ModuleType.TEMPERATURE)
    decoy.when(mock_module_core.get_model()).then_return(
        TemperatureModuleModel.TEMPERATURE_V2
    )
    decoy.when(mock_module_core.get_serial_number()).then_return("cap'n crunch")
    decoy.when(mock_module_core.get_deck_slot()).then_return(DeckSlotName.SLOT_3)

    result = subject.load_module(module_name="spline reticulator", location=42)

    assert isinstance(result, ModuleContext)
    assert subject.loaded_modules[3] is result
