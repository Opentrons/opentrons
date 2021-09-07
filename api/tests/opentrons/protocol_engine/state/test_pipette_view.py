"""Tests for pipette state accessors in the protocol_engine state store."""
import pytest
from typing import cast, Dict, Optional

from opentrons.types import MountType, Mount as HwMount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import DeckLocation, PipetteName

from opentrons.protocol_engine.state.pipettes import (
    PipetteState,
    PipetteView,
    PipetteData,
    HardwarePipette,
)


def get_pipette_view(
    pipettes_by_id: Optional[Dict[str, PipetteData]] = None,
    aspirated_volume_by_id: Dict[str, float] = None,
    current_location: Optional[DeckLocation] = None,
) -> PipetteView:
    """Get a pipette view test subject with the specified state."""
    state = PipetteState(
        pipettes_by_id=pipettes_by_id or {},
        aspirated_volume_by_id=aspirated_volume_by_id or {},
        current_location=current_location,
    )

    return PipetteView(state=state)


def test_initial_pipette_data_by_id() -> None:
    """It should should raise if pipette ID doesn't exist."""
    subject = get_pipette_view()

    with pytest.raises(errors.PipetteDoesNotExistError):
        subject.get_pipette_data_by_id("asdfghjkl")


def test_initial_pipette_data_by_mount() -> None:
    """It should return None if mount isn't present."""
    subject = get_pipette_view()

    assert subject.get_pipette_data_by_mount(MountType.LEFT) is None
    assert subject.get_pipette_data_by_mount(MountType.RIGHT) is None


def test_get_pipette_data() -> None:
    """It should get pipette data by ID and mount from the state."""
    pipette_data = PipetteData(
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject = get_pipette_view(pipettes_by_id={"pipette-id": pipette_data})

    result_by_id = subject.get_pipette_data_by_id("pipette-id")
    result_by_mount = subject.get_pipette_data_by_mount(MountType.LEFT)

    assert result_by_id == pipette_data
    assert result_by_mount == pipette_data


def test_get_hardware_pipette() -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes."""
    pipette_config = cast(PipetteDict, {"name": "p300_single"})
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    subject = get_pipette_view(
        pipettes_by_id={
            "left-id": PipetteData(
                mount=MountType.LEFT,
                pipette_name=PipetteName.P300_SINGLE,
            ),
            "right-id": PipetteData(
                mount=MountType.RIGHT,
                pipette_name=PipetteName.P300_MULTI,
            ),
        }
    )

    result = subject.get_hardware_pipette(
        pipette_id="left-id",
        attached_pipettes=attached_pipettes,
    )

    assert result == HardwarePipette(mount=HwMount.LEFT, config=pipette_config)

    with pytest.raises(errors.PipetteNotAttachedError):
        subject.get_hardware_pipette(
            pipette_id="right-id",
            attached_pipettes=attached_pipettes,
        )


def test_get_hardware_pipette_raises_with_name_mismatch() -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes.

    In this test, the hardware config specs "p300_single_gen2", but the
    loaded pipette name in state is "p300_single," which does not match.
    """
    pipette_config = cast(PipetteDict, {"name": "p300_single_gen2"})
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": PipetteData(
                mount=MountType.LEFT,
                pipette_name=PipetteName.P300_SINGLE,
            ),
        }
    )

    with pytest.raises(errors.PipetteNotAttachedError):
        subject.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=attached_pipettes,
        )


def test_pipette_volume_raises_if_bad_id() -> None:
    """get_aspirated_volume should raise if the given pipette doesn't exist."""
    subject = get_pipette_view()

    with pytest.raises(errors.PipetteDoesNotExistError):
        subject.get_aspirated_volume("pipette-id")


def test_get_pipette_volume() -> None:
    """It should get the aspirate volume for a pipette."""
    subject = get_pipette_view(aspirated_volume_by_id={"pipette-id": 42})

    assert subject.get_aspirated_volume("pipette-id") == 42


def test_pipette_is_ready_to_aspirate_if_has_volume() -> None:
    """Pipette should be ready to aspirate if it's already got volume."""
    pipette_config = cast(PipetteDict, {"ready_to_aspirate": False})

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": PipetteData(
                mount=MountType.LEFT,
                pipette_name=PipetteName.P300_SINGLE,
            ),
        },
        aspirated_volume_by_id={"pipette-id": 42},
    )

    result = subject.get_is_ready_to_aspirate(
        pipette_id="pipette-id", pipette_config=pipette_config
    )

    assert result is True


def test_pipette_is_ready_to_aspirate_if_no_volume_and_hc_says_ready() -> None:
    """Pipette should be ready to aspirate if HC says it is."""
    pipette_config = cast(PipetteDict, {"ready_to_aspirate": True})

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": PipetteData(
                mount=MountType.LEFT,
                pipette_name=PipetteName.P300_SINGLE,
            ),
        },
        aspirated_volume_by_id={"pipette-id": 0},
    )

    result = subject.get_is_ready_to_aspirate(
        pipette_id="pipette-id",
        pipette_config=pipette_config,
    )

    assert result is True


def test_pipette_not_ready_to_aspirate() -> None:
    """Pipette should not be ready to aspirate if HC says so and it has no volume."""
    pipette_config = cast(PipetteDict, {"ready_to_aspirate": False})

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": PipetteData(
                mount=MountType.LEFT,
                pipette_name=PipetteName.P300_SINGLE,
            ),
        },
        aspirated_volume_by_id={"pipette-id": 0},
    )

    result = subject.get_is_ready_to_aspirate(
        pipette_id="pipette-id",
        pipette_config=pipette_config,
    )

    assert result is False
