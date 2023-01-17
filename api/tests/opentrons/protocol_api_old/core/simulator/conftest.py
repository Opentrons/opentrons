import pytest

from opentrons import types
from opentrons.hardware_control import ThreadManagedHardware
from opentrons.protocol_api import MAX_SUPPORTED_VERSION
from opentrons.protocol_api.core.legacy.labware import LegacyLabwareCore
from opentrons.protocol_api.core.legacy.protocol_context import (
    ProtocolContextImplementation,
)
from opentrons.protocol_api.core.legacy.labware_offset_provider import (
    NullLabwareOffsetProvider,
)
from opentrons.protocol_api.core.legacy.instrument_context import (
    LegacyInstrumentCore,
)
from opentrons.protocol_api.core.legacy_simulator.instrument_context import (
    InstrumentContextSimulation,
)
from opentrons.protocol_api.core.legacy_simulator.protocol_context import (
    ProtocolContextSimulation,
)

from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons_shared_data.pipette.dev_types import PipetteNameType


@pytest.fixture
def protocol_context(hardware: ThreadManagedHardware) -> ProtocolContextImplementation:
    """Protocol context implementation fixture."""
    return ProtocolContextImplementation(
        sync_hardware=hardware.sync,
        api_version=MAX_SUPPORTED_VERSION,
        labware_offset_provider=NullLabwareOffsetProvider(),
    )


@pytest.fixture
def simulating_protocol_context(
    hardware: ThreadManagedHardware,
) -> ProtocolContextSimulation:
    """Protocol context simulation fixture."""
    return ProtocolContextSimulation(
        sync_hardware=hardware.sync,
        api_version=MAX_SUPPORTED_VERSION,
        labware_offset_provider=NullLabwareOffsetProvider(),
    )


@pytest.fixture
def instrument_context(
    protocol_context: ProtocolContextImplementation,
) -> LegacyInstrumentCore:
    """Instrument context backed by hardware simulator."""
    return protocol_context.load_instrument(
        PipetteNameType.P300_SINGLE_GEN2, types.Mount.RIGHT
    )


@pytest.fixture
def second_instrument_context(
    protocol_context: ProtocolContextImplementation,
) -> LegacyInstrumentCore:
    """Instrument context backed by hardware simulator."""
    return protocol_context.load_instrument(
        PipetteNameType.P300_SINGLE_GEN2, types.Mount.LEFT
    )


@pytest.fixture
def simulating_instrument_context(
    simulating_protocol_context: ProtocolContextSimulation,
    instrument_context: LegacyInstrumentCore,
) -> InstrumentContextSimulation:
    """A simulating instrument context."""
    return InstrumentContextSimulation(
        protocol_interface=simulating_protocol_context,
        pipette_dict=instrument_context.get_hardware_state(),
        mount=types.Mount.RIGHT,
        instrument_name="p300_single_gen2",
    )


@pytest.fixture
def second_simulating_instrument_context(
    simulating_protocol_context: ProtocolContextSimulation,
    second_instrument_context: LegacyInstrumentCore,
) -> InstrumentContextSimulation:
    """A simulating instrument context."""
    return InstrumentContextSimulation(
        protocol_interface=simulating_protocol_context,
        pipette_dict=second_instrument_context.get_hardware_state(),
        mount=types.Mount.LEFT,
        instrument_name="p300_single_gen2",
    )


@pytest.fixture
def labware(minimal_labware_def: LabwareDefinition) -> LegacyLabwareCore:
    """Labware fixture."""
    return LegacyLabwareCore(
        definition=minimal_labware_def,
        parent=types.Location(types.Point(0, 0, 0), "1"),
    )


@pytest.fixture
def tip_rack(minimal_labware_def: LabwareDefinition) -> LegacyLabwareCore:
    tip_rack_definition = minimal_labware_def.copy()
    tip_rack_parameters = minimal_labware_def["parameters"].copy()

    tip_rack_parameters["isTiprack"] = True
    tip_rack_parameters["tipLength"] = 123
    tip_rack_definition["parameters"] = tip_rack_parameters

    """Labware fixture."""
    return LegacyLabwareCore(
        definition=tip_rack_definition,
        parent=types.Location(types.Point(0, 0, 0), "1"),
    )


@pytest.fixture
def second_labware(minimal_labware_def: LabwareDefinition) -> LegacyLabwareCore:
    """Labware fixture."""
    return LegacyLabwareCore(
        definition=minimal_labware_def,
        parent=types.Location(types.Point(0, 0, 0), "5"),
    )
