"""Tests for ProtocolContext in Python Protocol API v3."""
import pytest
from decoy import Decoy

from opentrons_shared_data.labware import dev_types

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import commands
from opentrons.protocol_engine.clients import SyncClient

from opentrons.protocol_api_experimental.types import (
    DeckSlotLocation,
    DeckSlotName,
    DeprecatedMount,
    Mount,
    PipetteName,
)

from opentrons.protocol_api_experimental import (
    ProtocolContext,
    PipetteContext,
    Labware,
    errors,
)


@pytest.fixture
def engine_client(decoy: Decoy) -> SyncClient:
    """Get a fake ProtocolEngine client."""
    return decoy.mock(cls=SyncClient)


@pytest.fixture
def subject(engine_client: SyncClient) -> ProtocolContext:
    """Get a ProtocolContext with its dependencies mocked out."""
    return ProtocolContext(engine_client=engine_client)


def test_load_pipette(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a pipette into the protocol."""
    decoy.when(
        engine_client.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=Mount.LEFT,
        )
    ).then_return(commands.LoadPipetteResult(pipetteId="pipette-id"))

    result = subject.load_pipette(pipette_name="p300_single", mount="left")

    assert result == PipetteContext(
        engine_client=engine_client,
        pipette_id="pipette-id",
    )


def test_load_instrument(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should be able to load a pipette with legacy load_instrument method."""
    decoy.when(
        engine_client.load_pipette(
            pipette_name=PipetteName.P300_MULTI,
            mount=Mount.LEFT,
        )
    ).then_return(commands.LoadPipetteResult(pipetteId="left-pipette-id"))

    decoy.when(
        engine_client.load_pipette(
            pipette_name=PipetteName.P300_SINGLE,
            mount=Mount.RIGHT,
        )
    ).then_return(commands.LoadPipetteResult(pipetteId="right-pipette-id"))

    left_result = subject.load_instrument(instrument_name="p300_multi", mount="left")

    right_result = subject.load_instrument(
        instrument_name="p300_single",
        mount=DeprecatedMount.RIGHT,
    )

    assert left_result == PipetteContext(
        engine_client=engine_client,
        pipette_id="left-pipette-id",
    )

    assert right_result == PipetteContext(
        engine_client=engine_client,
        pipette_id="right-pipette-id",
    )


def test_load_pipette_with_bad_args(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should raise if an invalid pipette name or mount is used."""
    with pytest.raises(errors.InvalidPipetteNameError, match="electronic-thumb"):
        subject.load_pipette(pipette_name="electronic-thumb", mount="left")

    with pytest.raises(errors.InvalidMountError, match="west"):
        subject.load_pipette(pipette_name="p300_single", mount="west")


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_load_pipette_with_tipracks_list(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `tip_racks` parameter to load_pipette."""
    subject.load_pipette(
        pipette_name="p300_single",
        mount="left",
        tip_racks=("something"),  # type: ignore[arg-type]
    )


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_load_pipette_with_replace(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `replace` parameter to load_pipette."""
    subject.load_pipette(pipette_name="p300_single", mount="left", replace=True)


def test_load_labware(
    decoy: Decoy,
    minimal_labware_def: dev_types.LabwareDefinition,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should use the engine to load a labware in a slot."""
    decoy.when(
        engine_client.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            load_name="some_labware",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        commands.LoadLabwareResult(
            labwareId="abc123",
            definition=LabwareDefinition.parse_obj(minimal_labware_def),
            offsetId=None,
        )
    )

    result = subject.load_labware(
        load_name="some_labware",
        location=5,
        namespace="opentrons",
        version=1,
    )

    assert result == Labware(labware_id="abc123", engine_client=engine_client)


def test_load_labware_default_namespace_and_version(
    decoy: Decoy,
    minimal_labware_def: LabwareDefinition,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should default namespace to "opentrons" and version to 1."""
    decoy.when(
        engine_client.load_labware(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            load_name="some_labware",
            namespace="opentrons",
            version=1,
        )
    ).then_return(
        commands.LoadLabwareResult(
            labwareId="abc123",
            definition=minimal_labware_def,
            offsetId=None,
        )
    )

    result = subject.load_labware(load_name="some_labware", location=5)

    assert result == Labware(labware_id="abc123", engine_client=engine_client)


@pytest.mark.xfail(raises=NotImplementedError, strict=True)
def test_load_labware_with_label(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `label` parameter to load_labware."""
    subject.load_labware(load_name="some_labware", location=5, label="some_label")


def test_pause(
    decoy: Decoy,
    engine_client: SyncClient,
    subject: ProtocolContext,
) -> None:
    """It should be able to issue a Pause command through the client."""
    subject.pause()
    decoy.verify(engine_client.pause(message=None), times=1)

    subject.pause(msg="hello world")
    decoy.verify(engine_client.pause(message="hello world"), times=1)
