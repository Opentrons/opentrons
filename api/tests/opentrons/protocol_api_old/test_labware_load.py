import pytest
from opentrons import protocol_api as papi, types
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3


labware_name = "corning_96_wellplate_360ul_flat"


# labware._core.get_geometry() is an implementation detail and is not present in ProtocolContexts
# backed by Protocol Engine.
# TODO(mm, 2022-04-28): Make sure this logic is tested elsewhere, then delete this test.
@pytest.mark.apiv2_non_pe_only
def test_load_to_slot(
    ctx: papi.ProtocolContext, legacy_deck_definition: DeckDefinitionV3
) -> None:
    slot_1 = [
        slot
        for slot in legacy_deck_definition["locations"]["orderedSlots"]
        if slot["id"] == "1"
    ][0]
    slot_2 = [
        slot
        for slot in legacy_deck_definition["locations"]["orderedSlots"]
        if slot["id"] == "2"
    ][0]
    labware = ctx.load_labware(labware_name, "1")

    assert labware._core.get_geometry().offset == types.Point(*slot_1["position"])  # type: ignore[attr-defined]
    other = ctx.load_labware(labware_name, 2)
    assert other._core.get_geometry().offset == types.Point(*slot_2["position"])  # type: ignore[attr-defined]


def test_loaded(ctx: papi.ProtocolContext) -> None:
    labware = ctx.load_labware(labware_name, "1")
    assert ctx.loaded_labwares[1] == labware


def test_get_incorrect_definition_by_name() -> None:
    with pytest.raises(FileNotFoundError):
        papi.labware.get_labware_definition("fake_labware")


def test_get_mixed_case_labware_def() -> None:
    dfn = papi.labware.get_labware_definition("COrnIng_96_wElLplaTE_360UL_Flat")
    assert dfn["parameters"]["loadName"] == labware_name


def test_load_label(ctx: papi.ProtocolContext) -> None:
    labware = ctx.load_labware(labware_name, "1", "my cool labware")
    assert "my cool labware" in str(labware)
    assert labware._core.get_user_display_name() == "my cool labware"


def test_deprecated_load(ctx: papi.ProtocolContext) -> None:
    labware = ctx.load_labware_by_name(labware_name, "1", "my cool labware")
    assert "my cool labware" in str(labware)
