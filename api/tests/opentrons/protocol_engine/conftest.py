"""ProtocolEngine shared test fixtures."""
from __future__ import annotations

import pytest
from typing import Generator, TYPE_CHECKING
from decoy import Decoy

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.deck import load as load_deck
from opentrons_shared_data.deck.dev_types import DeckDefinitionV4
from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.pipette import pipette_definition
from opentrons.protocols.models import LabwareDefinition
from opentrons.protocols.api_support.deck_type import (
    STANDARD_OT2_DECK,
    SHORT_TRASH_DECK,
    STANDARD_OT3_DECK,
)
from opentrons.protocol_engine.types import ModuleDefinition

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.api import API


if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


def _ot2_hardware_api(decoy: Decoy) -> API:
    return decoy.mock(cls=API)


def _ot3_hardware_api(decoy: Decoy) -> OT3API:
    return decoy.mock(cls=OT3API)


@pytest.fixture(params=["ot2", "ot3"])
def hardware_api(
    request: pytest.FixtureRequest, decoy: Decoy
) -> Generator[HardwareControlAPI, None, None]:
    """Yield a OT2 Hardware Controller API or a OT3 Hardware Controller API."""
    machine = request.param  # type: ignore[attr-defined]

    if request.node.get_closest_marker("ot2_only") and machine == "ot3":
        pytest.skip("test requests only ot-2")
    if request.node.get_closest_marker("ot3_only") and machine == "ot2":
        pytest.skip("test requests only ot-3")

    if machine == "ot3":
        yield _ot3_hardware_api(decoy)
    else:
        yield _ot2_hardware_api(decoy)


@pytest.fixture(scope="session")
def ot2_standard_deck_def() -> DeckDefinitionV4:
    """Get the OT-2 standard deck definition."""
    return load_deck(STANDARD_OT2_DECK, 4)


@pytest.fixture(scope="session")
def ot2_short_trash_deck_def() -> DeckDefinitionV4:
    """Get the OT-2 short-trash deck definition."""
    return load_deck(SHORT_TRASH_DECK, 4)


@pytest.fixture(scope="session")
def ot3_standard_deck_def() -> DeckDefinitionV4:
    """Get the OT-2 standard deck definition."""
    return load_deck(STANDARD_OT3_DECK, 4)


@pytest.fixture(scope="session")
def ot2_fixed_trash_def() -> LabwareDefinition:
    """Get the definition of the OT-2 standard fixed trash."""
    return LabwareDefinition.parse_obj(
        load_definition("opentrons_1_trash_1100ml_fixed", 1)
    )


@pytest.fixture(scope="session")
def ot2_short_fixed_trash_def() -> LabwareDefinition:
    """Get the definition of the OT-2 short fixed trash."""
    return LabwareDefinition.parse_obj(
        load_definition("opentrons_1_trash_850ml_fixed", 1)
    )


@pytest.fixture(scope="session")
def ot3_fixed_trash_def() -> LabwareDefinition:
    """Get the definition of the OT-3 fixed trash."""
    return LabwareDefinition.parse_obj(
        load_definition("opentrons_1_trash_3200ml_fixed", 1)
    )


@pytest.fixture(scope="session")
def well_plate_def() -> LabwareDefinition:
    """Get the definition of a 96 well plate."""
    return LabwareDefinition.parse_obj(
        load_definition("corning_96_wellplate_360ul_flat", 2)
    )


@pytest.fixture(scope="session")
def flex_50uL_tiprack() -> LabwareDefinition:
    """Get the definition of a Flex 50uL tiprack."""
    return LabwareDefinition.parse_obj(
        load_definition("opentrons_flex_96_filtertiprack_50ul", 1)
    )


@pytest.fixture(scope="session")
def adapter_plate_def() -> LabwareDefinition:
    """Get the definition of a h/s adapter plate."""
    return LabwareDefinition.parse_obj(
        load_definition("opentrons_universal_flat_adapter", 1)
    )


@pytest.fixture(scope="session")
def reservoir_def() -> LabwareDefinition:
    """Get the definition of single-row reservoir."""
    return LabwareDefinition.parse_obj(load_definition("nest_12_reservoir_15ml", 1))


@pytest.fixture(scope="session")
def tip_rack_def() -> LabwareDefinition:
    """Get the definition of Opentrons 300 uL tip rack."""
    return LabwareDefinition.parse_obj(load_definition("opentrons_96_tiprack_300ul", 1))


@pytest.fixture(scope="session")
def adapter_def() -> LabwareDefinition:
    """Get the definition of Opentrons 96 PCR adapter."""
    return LabwareDefinition.parse_obj(load_definition("opentrons_96_pcr_adapter", 1))


@pytest.fixture(scope="session")
def falcon_tuberack_def() -> LabwareDefinition:
    """Get the definition of the 6-well Falcon tuberack."""
    return LabwareDefinition.parse_obj(
        load_definition("opentrons_6_tuberack_falcon_50ml_conical", 1)
    )


@pytest.fixture(scope="session")
def magdeck_well_plate_def() -> LabwareDefinition:
    """Get the definition of a well place compatible with magdeck."""
    return LabwareDefinition.parse_obj(
        load_definition("nest_96_wellplate_100ul_pcr_full_skirt", 1)
    )


@pytest.fixture(scope="session")
def tempdeck_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 tempdeck."""
    definition = load_shared_data("module/definitions/3/temperatureModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def tempdeck_v2_def() -> ModuleDefinition:
    """Get the definition of a V2 tempdeck."""
    definition = load_shared_data("module/definitions/3/temperatureModuleV2.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def magdeck_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 magdeck."""
    definition = load_shared_data("module/definitions/3/magneticModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def magdeck_v2_def() -> ModuleDefinition:
    """Get the definition of a V2 magdeck."""
    definition = load_shared_data("module/definitions/3/magneticModuleV2.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def thermocycler_v1_def() -> ModuleDefinition:
    """Get the definition of a V2 thermocycler."""
    definition = load_shared_data("module/definitions/3/thermocyclerModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def thermocycler_v2_def() -> ModuleDefinition:
    """Get the definition of a V2 thermocycler."""
    definition = load_shared_data("module/definitions/3/thermocyclerModuleV2.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def heater_shaker_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 heater-shaker."""
    definition = load_shared_data("module/definitions/3/heaterShakerModuleV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def mag_block_v1_def() -> ModuleDefinition:
    """Get the definition of a V1 Mag Block."""
    definition = load_shared_data("module/definitions/3/magneticBlockV1.json")
    return ModuleDefinition.parse_raw(definition)


@pytest.fixture(scope="session")
def supported_tip_fixture() -> pipette_definition.SupportedTipsDefinition:
    """Get a mock supported tip definition."""
    return pipette_definition.SupportedTipsDefinition(
        defaultAspirateFlowRate=pipette_definition.FlowRateDefinition(
            default=10, valuesByApiLevel={}
        ),
        defaultDispenseFlowRate=pipette_definition.FlowRateDefinition(
            default=10, valuesByApiLevel={}
        ),
        defaultBlowOutFlowRate=pipette_definition.FlowRateDefinition(
            default=10, valuesByApiLevel={}
        ),
        defaultTipLength=40,
        defaultReturnTipHeight=0.5,
        aspirate=pipette_definition.ulPerMMDefinition(default={"1": [(0, 0, 0)]}),
        dispense=pipette_definition.ulPerMMDefinition(default={"1": [(0, 0, 0)]}),
        defaultPushOutVolume=3,
    )
