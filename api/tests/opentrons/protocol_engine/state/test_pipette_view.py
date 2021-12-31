"""Tests for pipette state accessors in the protocol_engine state store."""
import pytest
from typing import cast, Dict, List, Optional

from opentrons.types import MountType, Mount as HwMount
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import PipetteName, LoadedPipette
from opentrons.protocol_engine.state.pipettes import (
    PipetteState,
    PipetteView,
    CurrentWell,
    HardwarePipette,
)


def get_pipette_view(
    pipettes_by_id: Optional[Dict[str, LoadedPipette]] = None,
    aspirated_volume_by_id: Optional[Dict[str, float]] = None,
    current_well: Optional[CurrentWell] = None,
    attached_tip_labware_by_id: Optional[Dict[str, Optional[str]]] = None,
) -> PipetteView:
    """Get a pipette view test subject with the specified state."""
    state = PipetteState(
        pipettes_by_id=pipettes_by_id or {},
        aspirated_volume_by_id=aspirated_volume_by_id or {},
        current_well=current_well,
        attached_tip_labware_by_id=attached_tip_labware_by_id,
    )

    return PipetteView(state=state)


def create_pipette_config(
    name: str,
    back_compat_names: Optional[List[str]] = None,
    ready_to_aspirate: bool = False,
) -> PipetteDict:
    """Create a fake but valid (enough) PipetteDict object."""
    return cast(
        PipetteDict,
        {
            "name": name,
            "back_compat_names": back_compat_names or [],
            "ready_to_aspirate": ready_to_aspirate,
        },
    )


def test_initial_pipette_data_by_id() -> None:
    """It should should raise if pipette ID doesn't exist."""
    subject = get_pipette_view()

    with pytest.raises(errors.PipetteDoesNotExistError):
        subject.get("asdfghjkl")


def test_initial_pipette_data_by_mount() -> None:
    """It should return None if mount isn't present."""
    subject = get_pipette_view()

    assert subject.get_by_mount(MountType.LEFT) is None
    assert subject.get_by_mount(MountType.RIGHT) is None


def test_get_pipette_data() -> None:
    """It should get pipette data by ID and mount from the state."""
    pipette_data = LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject = get_pipette_view(pipettes_by_id={"pipette-id": pipette_data})

    result_by_id = subject.get("pipette-id")
    result_by_mount = subject.get_by_mount(MountType.LEFT)

    assert result_by_id == pipette_data
    assert result_by_mount == pipette_data


def test_get_hardware_pipette() -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes."""
    pipette_config = create_pipette_config("p300_single")
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    subject = get_pipette_view(
        pipettes_by_id={
            "left-id": LoadedPipette(
                id="left-id",
                mount=MountType.LEFT,
                pipetteName=PipetteName.P300_SINGLE,
            ),
            "right-id": LoadedPipette(
                id="right-id",
                mount=MountType.RIGHT,
                pipetteName=PipetteName.P300_MULTI,
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


def test_get_hardware_pipette_with_back_compat() -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes.

    In this test, the hardware config specs "p300_single_gen2", and the
    loaded pipette name in state is "p300_single," which is is allowed.
    """
    pipette_config = create_pipette_config(
        "p300_single_gen2",
        back_compat_names=["p300_single"],
    )
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": LoadedPipette(
                id="pipette-id",
                mount=MountType.LEFT,
                pipetteName=PipetteName.P300_SINGLE,
            ),
        }
    )

    result = subject.get_hardware_pipette(
        pipette_id="pipette-id",
        attached_pipettes=attached_pipettes,
    )

    assert result == HardwarePipette(mount=HwMount.LEFT, config=pipette_config)


def test_get_hardware_pipette_raises_with_name_mismatch() -> None:
    """It maps a pipette ID to a config given the HC's attached pipettes.

    In this test, the hardware config specs "p300_single_gen2", but the
    loaded pipette name in state is "p10_single," which does not match.
    """
    pipette_config = create_pipette_config("p300_single_gen2")
    attached_pipettes: Dict[HwMount, Optional[PipetteDict]] = {
        HwMount.LEFT: pipette_config,
        HwMount.RIGHT: None,
    }

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": LoadedPipette(
                id="pipette-id",
                mount=MountType.LEFT,
                pipetteName=PipetteName.P10_SINGLE,
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
    pipette_config = create_pipette_config("p300_single", ready_to_aspirate=False)

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": LoadedPipette(
                id="pipette-id",
                mount=MountType.LEFT,
                pipetteName=PipetteName.P300_SINGLE,
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
    pipette_config = create_pipette_config("p300_single", ready_to_aspirate=True)

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": LoadedPipette(
                id="pipette-id",
                mount=MountType.LEFT,
                pipetteName=PipetteName.P300_SINGLE,
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
    pipette_config = create_pipette_config("p300_single", ready_to_aspirate=False)

    subject = get_pipette_view(
        pipettes_by_id={
            "pipette-id": LoadedPipette(
                id="pipette-id",
                mount=MountType.LEFT,
                pipetteName=PipetteName.P300_SINGLE,
            ),
        },
        aspirated_volume_by_id={"pipette-id": 0},
    )

    result = subject.get_is_ready_to_aspirate(
        pipette_id="pipette-id",
        pipette_config=pipette_config,
    )

    assert result is False


def test_get_attached_tip_labware_id() -> None:
    """It should return the labware id of the pipette's attached tip, if any."""
    subject = get_pipette_view(attached_tip_labware_by_id={"pipette-id": "tiprack-id"})
    assert subject.get_attached_tip_labware_id(pipette_id="pipette-id") == "tiprack-id"
