import pytest
from opentrons import ThreadManager, types
from opentrons.protocols.context.instrument import AbstractInstrument
from opentrons.protocols.context.labware import AbstractLabware
from opentrons.protocols.context.paired_instrument import AbstractPairedInstrument
from opentrons.protocols.context.protocol_api.labware import LabwareImplementation
from opentrons.protocols.context.protocol_api.protocol_context import (
    ProtocolContextImplementation,
)
from opentrons.protocols.context.simulator.instrument_context import (
    InstrumentContextSimulation,
)
from opentrons.protocols.context.simulator.protocol_context import (
    ProtocolContextSimulation,
)
from opentrons_shared_data.labware.dev_types import LabwareDefinition


@pytest.fixture
def protocol_context(hardware: ThreadManager) -> ProtocolContextImplementation:
    """Protocol context implementation fixture."""
    return ProtocolContextImplementation(hardware=hardware)


@pytest.fixture
def simulating_protocol_context(hardware: ThreadManager) -> ProtocolContextSimulation:
    """Protocol context simulation fixture."""
    return ProtocolContextSimulation(hardware=hardware)


@pytest.fixture
def instrument_context(
    protocol_context: ProtocolContextImplementation,
) -> AbstractInstrument:
    """Instrument context backed by hardware simulator."""
    return protocol_context.load_instrument(
        "p300_single_gen2", types.Mount.RIGHT, replace=False
    )


@pytest.fixture
def second_instrument_context(
    protocol_context: ProtocolContextImplementation,
) -> AbstractInstrument:
    """Instrument context backed by hardware simulator."""
    return protocol_context.load_instrument(
        "p300_single_gen2", types.Mount.LEFT, replace=False
    )


@pytest.fixture
def simulating_instrument_context(
    protocol_context: ProtocolContextImplementation,
    instrument_context: AbstractInstrument,
) -> AbstractInstrument:
    """A simulating instrument context."""
    return InstrumentContextSimulation(
        protocol_interface=protocol_context,
        pipette_dict=instrument_context.get_pipette(),
        mount=types.Mount.RIGHT,
        instrument_name="p300_single_gen2",
    )


@pytest.fixture
def second_simulating_instrument_context(
    protocol_context: ProtocolContextImplementation,
    second_instrument_context: AbstractInstrument,
) -> AbstractInstrument:
    """A simulating instrument context."""
    return InstrumentContextSimulation(
        protocol_interface=protocol_context,
        pipette_dict=second_instrument_context.get_pipette(),
        mount=types.Mount.LEFT,
        instrument_name="p300_single_gen2",
    )


@pytest.fixture
def paired_instrument(
    instrument_context: AbstractInstrument,
    second_instrument_context: AbstractInstrument,
) -> AbstractPairedInstrument:
    """A paired instrument."""
    instrument_context.home()
    return instrument_context.pair_with(second_instrument_context)


@pytest.fixture
def simulating_paired_instrument(
    simulating_instrument_context: AbstractInstrument,
    second_simulating_instrument_context: AbstractInstrument,
) -> AbstractPairedInstrument:
    """A simulating paired instrument."""
    return simulating_instrument_context.pair_with(second_simulating_instrument_context)


@pytest.fixture
def labware(minimal_labware_def: LabwareDefinition) -> AbstractLabware:
    """Labware fixture."""
    return LabwareImplementation(
        definition=minimal_labware_def,
        parent=types.Location(types.Point(0, 0, 0), "1"),
    )


@pytest.fixture
def second_labware(minimal_labware_def: LabwareDefinition) -> AbstractLabware:
    """Labware fixture."""
    return LabwareImplementation(
        definition=minimal_labware_def,
        parent=types.Location(types.Point(0, 0, 0), "5"),
    )
