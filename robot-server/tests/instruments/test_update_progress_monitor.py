"""Tests for UpdateProgressMonitor."""
from __future__ import annotations

import pytest
from datetime import datetime
from typing import TYPE_CHECKING
from decoy import Decoy

from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.hardware_control.types import (
    OT3Mount,
    InstrumentUpdateStatus,
    UpdateState,
)
from opentrons_shared_data.pipette.dev_types import PipetteName, PipetteModel

from robot_server.instruments.instrument_models import UpdateProgressData
from robot_server.instruments.update_progress_monitor import (
    UpdateProgressMonitor,
    InstrumentNotFound,
    UpdateIdNotFound,
    UpdatePossiblyFailed,
)

if TYPE_CHECKING:
    from opentrons.hardware_control.ot3api import OT3API


# TODO (spp, 2022-01-17): remove all xfails once robot server test flow is set up to
#  handle OT2 vs OT3 tests correclty


@pytest.mark.ot3_only
@pytest.fixture
def ot3_hardware_api(decoy: Decoy) -> OT3API:
    """Get a mocked out OT3API."""
    try:
        from opentrons.hardware_control.ot3api import OT3API

        return decoy.mock(cls=OT3API)
    except ImportError:
        return None  # type: ignore[return-value]


def get_sample_pipette_dict(
    name: PipetteName,
    model: PipetteModel,
    pipette_id: str,
    fw_update_required: bool,
) -> PipetteDict:
    """Return a sample PipetteDict."""
    pipette_dict: PipetteDict = {  # type: ignore [typeddict-item]
        "name": name,
        "model": model,
        "pipette_id": pipette_id,
        "back_compat_names": ["p10_single"],
        "min_volume": 1,
        "max_volume": 1,
        "channels": 1,
        "fw_update_required": fw_update_required,
        "fw_current_version": 1,
    }
    return pipette_dict


@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_create_and_save_update_resource(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """It should create an update resource and save to memory."""
    created_at = datetime(year=2023, month=12, day=2)
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.RIGHT: InstrumentUpdateStatus(
                mount=OT3Mount.RIGHT,
                status=UpdateState.updating,
                progress=42,
            ),
        }
    )
    expected_data = UpdateProgressData(
        id="update-id",
        createdAt=created_at,
        mount="right",
        updateStatus="updating",  # type: ignore[arg-type]
        updateProgress=42,
    )
    subject = UpdateProgressMonitor(hardware_api=ot3_hardware_api)
    result = await subject.create(
        update_id="update-id", created_at=created_at, mount="right"
    )

    assert result == expected_data
    assert subject.get_progress_status("update-id") == expected_data


@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_create_update_resource_without_update_progress(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """It should fail to create resource when there is no update progress from HC."""
    created_at = datetime(year=2023, month=12, day=2)
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    subject = UpdateProgressMonitor(hardware_api=ot3_hardware_api)

    # TODO: This test will take 5 seconds to complete. Shorten this wait time
    with pytest.raises(TimeoutError):
        await subject.create(
            update_id="update-id", created_at=created_at, mount="right"
        )


@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_completed_update_progress(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """It should provide a valid status for an existent resource with no status from hardware API."""
    created_at = datetime(year=2023, month=12, day=2)
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.RIGHT: InstrumentUpdateStatus(
                mount=OT3Mount.RIGHT,
                status=UpdateState.updating,
                progress=42,
            ),
        }
    )

    subject = UpdateProgressMonitor(hardware_api=ot3_hardware_api)
    await subject.create(update_id="update-id", created_at=created_at, mount="right")

    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {
            OT3Mount.RIGHT: get_sample_pipette_dict(
                name="p20_multi_gen2",
                model=PipetteModel("xyz"),
                pipette_id="my-other-pipette-id",
                fw_update_required=False,
            ),
        }
    )
    result = subject.get_progress_status("update-id")
    assert result == UpdateProgressData(
        id="update-id",
        createdAt=created_at,
        mount="right",
        updateStatus="done",  # type: ignore[arg-type]
        updateProgress=100,
    )


@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_update_progress_of_non_attached_instrument(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """It should raise error if instrument is no longer attached."""
    created_at = datetime(year=2023, month=12, day=2)
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.RIGHT: InstrumentUpdateStatus(
                mount=OT3Mount.RIGHT,
                status=UpdateState.updating,
                progress=42,
            ),
        }
    )

    subject = UpdateProgressMonitor(hardware_api=ot3_hardware_api)
    await subject.create(update_id="update-id", created_at=created_at, mount="right")

    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {OT3Mount.RIGHT: None}
    )

    with pytest.raises(InstrumentNotFound):
        subject.get_progress_status("update-id")


@pytest.mark.xfail
@pytest.mark.ot3_only
async def test_get_update_progress_of_a_failed_update(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """It should raise error if an instrument completes update process but still requires update."""
    created_at = datetime(year=2023, month=12, day=2)
    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return(
        {
            OT3Mount.RIGHT: InstrumentUpdateStatus(
                mount=OT3Mount.RIGHT,
                status=UpdateState.updating,
                progress=42,
            ),
        }
    )

    subject = UpdateProgressMonitor(hardware_api=ot3_hardware_api)
    await subject.create(update_id="update-id", created_at=created_at, mount="right")

    decoy.when(ot3_hardware_api.get_firmware_update_progress()).then_return({})
    decoy.when(ot3_hardware_api.get_all_attached_instr()).then_return(
        {
            OT3Mount.RIGHT: get_sample_pipette_dict(
                name="p20_multi_gen2",
                model=PipetteModel("xyz"),
                pipette_id="my-other-pipette-id",
                fw_update_required=True,
            ),
        }
    )

    with pytest.raises(UpdatePossiblyFailed):
        subject.get_progress_status("update-id")


@pytest.mark.xfail
@pytest.mark.ot3_only
def test_get_non_existent_update_progress(
    decoy: Decoy, ot3_hardware_api: OT3API
) -> None:
    """It should raise an error when fetching status using a non-existent ID."""
    subject = UpdateProgressMonitor(hardware_api=ot3_hardware_api)

    with pytest.raises(UpdateIdNotFound):
        subject.get_progress_status("update-id")
