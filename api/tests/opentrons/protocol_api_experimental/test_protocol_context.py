"""Tests for ProtocolContext in Python Protocol API v3."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine import commands
from opentrons.protocol_engine.clients import SyncClient
from opentrons.protocol_api_experimental import ProtocolContext, PipetteContext, errors
from opentrons.protocol_api_experimental.types import (
    PipetteName,
    Mount,
    DeprecatedMount,
)


@pytest.fixture
def decoy() -> Decoy:
    """Get a Decoy test-double container fixture."""
    return Decoy()


@pytest.fixture
def engine_client(decoy: Decoy) -> SyncClient:
    """Get a fake ProtocolEngine client."""
    return decoy.create_decoy(spec=SyncClient)


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
        resource_id="pipette-id",
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
        resource_id="left-pipette-id",
    )

    assert right_result == PipetteContext(
        engine_client=engine_client,
        resource_id="right-pipette-id",
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


@pytest.mark.xfail(raises=NotImplementedError)
def test_load_pipette_with_tipracks_list(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `tip_racks` parameter to load_pipette."""
    subject.load_pipette(
        pipette_name="p300_single",
        mount="left",
        tip_racks=("something"),  # type: ignore[arg-type]
    )


@pytest.mark.xfail(raises=NotImplementedError)
def test_load_pipette_with_replace(subject: ProtocolContext) -> None:
    """TODO: it should do something with the `replace` parameter to load_pipette."""
    subject.load_pipette(pipette_name="p300_single", mount="left", replace=True)
