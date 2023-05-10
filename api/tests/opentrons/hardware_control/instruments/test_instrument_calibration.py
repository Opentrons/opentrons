import inspect
from datetime import datetime
from typing import Union, cast

import pytest
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]
from decoy import Decoy

from opentrons_shared_data.labware.dev_types import (
    LabwareUri,
    LabwareDefinition as LabwareDefDict,
)
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters,
)


from opentrons import calibration_storage
from opentrons.calibration_storage import helpers as calibration_storage_helpers
from opentrons.calibration_storage.ot2.models import v1 as v1_models
from opentrons.hardware_control.instruments.ot2 import instrument_calibration as subject


@pytest.fixture(autouse=True)
def _use_mock_calibration_storage(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the opentrons.calibration_storage module."""
    for name, func in inspect.getmembers(calibration_storage, inspect.isfunction):
        monkeypatch.setattr(calibration_storage, name, decoy.mock(func=func))

    for name, func in inspect.getmembers(
        calibration_storage_helpers, inspect.isfunction
    ):
        monkeypatch.setattr(calibration_storage_helpers, name, decoy.mock(func=func))


@pytest.fixture
def tip_rack_dict() -> LabwareDefDict:
    """Get a tip rack dictionary definition value object."""
    return cast(
        LabwareDefDict,
        {"namespace": "test", "version": 1, "parameters": {"loadName": "cool-labware"}},
    )


@pytest.fixture
def tip_rack_model() -> LabwareDefinition:
    """Get a tip rack Pydantic model definition value object."""
    return LabwareDefinition.construct(  # type: ignore[call-arg]
        namespace="test",
        version=1,
        parameters=Parameters.construct(  # type: ignore[call-arg]
            loadName="cool-labware",
            tipOverlap=None,  # add a None value to validate serialization to dictionary
        ),
    )


@pytest.mark.parametrize(
    "tip_rack_definition",
    [
        lazy_fixture("tip_rack_dict"),
        lazy_fixture("tip_rack_model"),
    ],
)
def test_load_tip_length(
    decoy: Decoy,
    tip_rack_dict: LabwareDefDict,
    tip_rack_definition: Union[LabwareDefDict, LabwareDefinition],
) -> None:
    """Test that a tip length can be laoded for a pipette / tiprack combination."""
    tip_length_data = v1_models.TipLengthModel(
        tipLength=1.23,
        lastModified=datetime(year=2023, month=1, day=1),
        uri=LabwareUri("def456"),
        source=subject.types.SourceType.factory,
        status=v1_models.CalibrationStatus(
            markedBad=True,
            source=subject.types.SourceType.user,
            markedAt=datetime(year=2023, month=2, day=2),
        ),
    )

    decoy.when(
        calibration_storage.load_tip_length_calibration(
            pip_id="abc123", definition=tip_rack_dict
        )
    ).then_return(tip_length_data)

    decoy.when(calibration_storage.helpers.hash_labware_def(tip_rack_dict)).then_return(
        "asdfghjk"
    )

    result = subject.load_tip_length_for_pipette(
        pipette_id="abc123", tiprack=tip_rack_definition
    )

    assert result == subject.TipLengthCalibration(
        tip_length=1.23,
        source=subject.types.SourceType.factory,
        pipette="abc123",
        tiprack="asdfghjk",
        last_modified=datetime(year=2023, month=1, day=1),
        uri=LabwareUri("def456"),
        status=subject.types.CalibrationStatus(
            markedBad=True,
            source=subject.types.SourceType.user,
            markedAt=datetime(year=2023, month=2, day=2),
        ),
    )
