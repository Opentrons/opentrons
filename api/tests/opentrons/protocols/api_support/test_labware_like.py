import pytest

from opentrons_shared_data.labware.types import LabwareDefinition2

from opentrons.hardware_control.modules.types import TemperatureModuleModel
from opentrons.protocol_api import OFF_DECK, ModuleContext, ProtocolContext, labware
from opentrons.protocol_api.labware import Labware
from opentrons.protocols.api_support.labware_like import LabwareLike, LabwareLikeType


@pytest.fixture()
def trough_definition() -> LabwareDefinition2:
    result = labware.get_labware_definition("usascientific_12_reservoir_22ml")
    assert result["schemaVersion"] == 2  # For type checking.
    return result


@pytest.fixture()
def trough(trough_definition: LabwareDefinition2, ctx: ProtocolContext) -> Labware:
    return ctx.load_labware_from_definition(trough_definition, "A1")


@pytest.fixture()
def module(ctx: ProtocolContext) -> ModuleContext:
    return ctx.load_module(TemperatureModuleModel.TEMPERATURE_V2, "B1")


def test_labware(trough: Labware) -> None:
    ll = LabwareLike(trough)
    assert ll.has_parent is True
    assert ll.parent.object == trough.parent
    assert ll.object == trough
    assert ll.object_type == LabwareLikeType.LABWARE


def test_well(trough: Labware) -> None:
    well = trough["A1"]
    ll = LabwareLike(well)
    assert ll.has_parent is True
    assert ll.parent.object == trough
    assert ll.object == well
    assert ll.object_type == LabwareLikeType.WELL


def test_module(module: ModuleContext) -> None:
    ll = LabwareLike(module)
    assert ll.has_parent is True
    assert ll.parent.object is module.parent
    assert ll.object is module
    assert ll.object_type == LabwareLikeType.MODULE
    assert ll.is_module


def test_slot() -> None:
    ll = LabwareLike("1")
    assert ll.has_parent is False
    assert ll.parent.object is None
    assert ll.object == "1"
    assert ll.object_type == LabwareLikeType.SLOT


def test_empty() -> None:
    ll = LabwareLike(None)
    assert ll.has_parent is False
    assert ll.parent.object is None
    assert ll.object is None
    assert ll.object_type == LabwareLikeType.NONE


def test_off_deck() -> None:
    ll = LabwareLike(OFF_DECK)
    assert ll.has_parent is False
    assert ll.parent.object is None
    assert ll.object is OFF_DECK
    assert ll.object_type == LabwareLikeType.OFF_DECK
