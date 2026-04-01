import inspect
from datetime import datetime
from typing import Union, cast

import pytest
from decoy import Decoy
from pytest_lazy_fixtures import lf as lazy_fixture

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition2,
    Parameters2,
)
from opentrons_shared_data.labware.types import (
    LabwareDefinition2 as LabwareDef2Dict,
)
from opentrons_shared_data.labware.types import (
    LabwareUri,
)

from opentrons import calibration_storage
from opentrons import types as top_types
from opentrons.calibration_storage import helpers as calibration_storage_helpers
from opentrons.calibration_storage.ot2.models import v1 as v1_models
from opentrons.calibration_storage.ot3.models import v1 as ot3_models
from opentrons.config import feature_flags
from opentrons.hardware_control.instruments.ot2 import instrument_calibration as subject
from opentrons.hardware_control.instruments.ot3 import (
    instrument_calibration as subject_ot3,
)

SourceType = calibration_storage.types.SourceType
CalibrationStatus = calibration_storage.types.CalibrationStatus


@pytest.fixture(autouse=True)
def _use_mock_calibration_storage(
    decoy: Decoy, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock out the opentrons.calibration_storage module."""
    for name, func in inspect.getmembers(calibration_storage, inspect.isfunction):
        monkeypatch.setattr(calibration_storage, name, decoy.mock(func=func))
    for name, func in inspect.getmembers(calibration_storage.ot2, inspect.isfunction):
        monkeypatch.setattr(calibration_storage.ot2, name, decoy.mock(func=func))
    for name, func in inspect.getmembers(calibration_storage.ot3, inspect.isfunction):
        monkeypatch.setattr(calibration_storage.ot3, name, decoy.mock(func=func))

    for name, func in inspect.getmembers(
        calibration_storage_helpers, inspect.isfunction
    ):
        monkeypatch.setattr(calibration_storage_helpers, name, decoy.mock(func=func))

    monkeypatch.setattr(
        feature_flags,
        "enable_ot3_hardware_controller",
        decoy.mock(func=feature_flags.enable_ot3_hardware_controller),
    )
    monkeypatch.setattr(
        calibration_storage.ot3.gripper_offset,
        "get_gripper_jaw_width_data",
        decoy.mock(
            func=calibration_storage.ot3.gripper_offset.get_gripper_jaw_width_data
        ),
    )
    monkeypatch.setattr(
        calibration_storage.ot3.gripper_offset,
        "get_gripper_calibration_offset",
        decoy.mock(
            func=calibration_storage.ot3.gripper_offset.get_gripper_calibration_offset
        ),
    )
    monkeypatch.setattr(
        calibration_storage.ot3.gripper_offset,
        "save_gripper_jaw_width_data",
        decoy.mock(
            func=calibration_storage.ot3.gripper_offset.save_gripper_jaw_width_data
        ),
    )
    monkeypatch.setattr(
        calibration_storage.ot3.gripper_offset,
        "save_gripper_calibration",
        decoy.mock(
            func=calibration_storage.ot3.gripper_offset.save_gripper_calibration
        ),
    )


@pytest.fixture
def tip_rack_dict() -> LabwareDef2Dict:
    """Get a tip rack dictionary definition value object."""
    return cast(
        LabwareDef2Dict,
        {"namespace": "test", "version": 1, "parameters": {"loadName": "cool-labware"}},
    )


@pytest.fixture
def tip_rack_model() -> LabwareDefinition2:
    """Get a tip rack Pydantic model definition value object."""
    return LabwareDefinition2.model_construct(  # type: ignore[call-arg]
        namespace="test",
        version=1,
        parameters=Parameters2.model_construct(  # type: ignore[call-arg]
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
    tip_rack_dict: LabwareDef2Dict,
    tip_rack_definition: Union[LabwareDef2Dict, LabwareDefinition2],
) -> None:
    """Test that a tip length can be laoded for a pipette / tiprack combination."""
    tip_length_data = v1_models.TipLengthModel(
        tipLength=1.23,
        lastModified=datetime(year=2023, month=1, day=1),
        definitionHash="asdfghjk",
        source=subject.SourceType.factory,
        status=v1_models.CalibrationStatus(
            markedBad=True,
            source=subject.SourceType.user,
            markedAt=datetime(year=2023, month=2, day=2),
        ),
    )

    decoy.when(
        calibration_storage.ot2.load_tip_length_calibration(
            pip_id="abc123", definition=tip_rack_dict
        )
    ).then_return(tip_length_data)

    decoy.when(calibration_storage.helpers.hash_labware_def(tip_rack_dict)).then_return(
        "asdfghjk"
    )
    decoy.when(
        calibration_storage.helpers.uri_from_definition(tip_rack_dict)
    ).then_return(LabwareUri("def456"))

    result = subject.load_tip_length_for_pipette(
        pipette_id="abc123", tiprack=tip_rack_definition
    )

    assert result == subject.TipLengthCalibration(
        tip_length=1.23,
        source=subject.SourceType.factory,
        pipette="abc123",
        tiprack="asdfghjk",
        last_modified=datetime(year=2023, month=1, day=1),
        uri=LabwareUri("def456"),
        status=subject.CalibrationStatus(
            markedBad=True,
            source=subject.SourceType.user,
            markedAt=datetime(year=2023, month=2, day=2),
        ),
    )


@pytest.mark.parametrize(
    "left,right,ok",
    [
        # If either point is all 0 (uncalibrated) then the check should pass
        (top_types.Point(0, 0, 0), top_types.Point(0, 0, 2), True),
        (top_types.Point(0, 0, 2), top_types.Point(0, 0, 0), True),
        (top_types.Point(0, 0, 0), top_types.Point(0, 0, 0), True),
        # If both points are non-zero but all values are within the range the
        # check should pass
        (top_types.Point(0, 1.0, 1.5), top_types.Point(-1, 0, 0.2), True),
        # If both points are non-zero but at least one element is more than
        # the range different the test should fail
        (top_types.Point(0.1, -1, 4.3), top_types.Point(1.7, 0, 0.2), False),
        (top_types.Point(0.1, -3.2, 1.5), top_types.Point(0.6, 0.9, 1.3), False),
        (top_types.Point(0.1, -1, 1.5), top_types.Point(-0.2, -0.1, 6), False),
    ],
)
def test_instrument_consistency_check_ot3(
    left: top_types.Point, right: top_types.Point, ok: bool
) -> None:
    result = subject_ot3.check_instrument_offset_reasonability(left, right)
    if ok:
        assert result == []
    else:
        assert result[0].kind == "inconsistent-pipette-offset"
        assert result[0].offsets == {
            top_types.Mount.LEFT: left,
            top_types.Mount.RIGHT: right,
        }
        assert result[0].limit == 4.0


@pytest.mark.parametrize("gripper_id", ["phoney_baloney_gripper", None])
@pytest.mark.parametrize("loaded_encoder_val", [14.44444])
def test_load_gripper_jaw_width(
    gripper_id: str | None, decoy: Decoy, loaded_encoder_val: float
) -> None:
    default_return_val = subject_ot3.GripperJawWidthData(
        encoder_position_at_jaw_closed=None,
        source=SourceType.default,
        status=CalibrationStatus(),
    )
    _time = datetime.now()
    loaded_data = ot3_models.GripperJawWidthModel(
        encoderPositionAtJawClosed=loaded_encoder_val,
        source=SourceType.default,
        status=ot3_models.CalibrationStatus(),
        lastModified=_time,
    )
    nondefault_return_val = subject_ot3.GripperJawWidthData(
        encoder_position_at_jaw_closed=loaded_encoder_val,
        source=SourceType.default,
        status=CalibrationStatus(markedBad=False, source=None, markedAt=None),
    )
    decoy.when(feature_flags.enable_ot3_hardware_controller()).then_return(True)
    decoy.when(
        calibration_storage.ot3.gripper_offset.get_gripper_jaw_width_data(
            "phoney_baloney_gripper"
        )
    ).then_return(loaded_data)
    gripper_jaw_width = subject_ot3.load_gripper_jaw_width(gripper_id=gripper_id)
    if gripper_id is None:
        assert gripper_jaw_width == default_return_val
    else:
        if loaded_encoder_val is None:
            assert gripper_jaw_width == default_return_val
        else:
            assert gripper_jaw_width == nondefault_return_val


@pytest.mark.parametrize("gripper_id", ["phoney_baloney_gripper", None])
@pytest.mark.parametrize(
    "loaded_offset", [top_types.Point(0.1, -3.2, 1.5), top_types.Point(0, 0, 0)]
)
def test_load_gripper_calibration_offset(
    gripper_id: str | None, decoy: Decoy, loaded_offset: top_types.Point
) -> None:
    _time = datetime.now()
    default_return_val = subject_ot3.GripperCalibrationOffset(
        offset=top_types.Point(x=0.0, y=0.0, z=0.0),
        source=SourceType.default,
        status=CalibrationStatus(markedBad=False, source=None, markedAt=None),
        last_modified=None,
    )
    nondefault_return_val = subject_ot3.GripperCalibrationOffset(
        offset=loaded_offset,
        source=SourceType.default,
        status=CalibrationStatus(markedBad=False, source=None, markedAt=None),
        last_modified=_time,
    )

    loaded_data = ot3_models.InstrumentOffsetModel(
        offset=loaded_offset,
        lastModified=_time,
        source=SourceType.default,
        status=ot3_models.CalibrationStatus(),
    )
    decoy.when(feature_flags.enable_ot3_hardware_controller()).then_return(True)
    decoy.when(
        calibration_storage.ot3.gripper_offset.get_gripper_calibration_offset(
            "phoney_baloney_gripper"
        )
    ).then_return(loaded_data)
    gripper_offset = subject_ot3.load_gripper_calibration_offset(gripper_id=gripper_id)
    if gripper_id is None:
        assert gripper_offset == default_return_val
    else:
        if loaded_offset is None:
            assert gripper_offset == default_return_val
        else:
            assert gripper_offset == nondefault_return_val


@pytest.mark.parametrize("gripper_id", ["phoney_baloney_gripper", None])
@pytest.mark.parametrize("encoder_val", [14.44444])
def test_save_gripper_jaw_width_data(
    gripper_id: str | None, decoy: Decoy, encoder_val: float
) -> None:
    decoy.when(feature_flags.enable_ot3_hardware_controller()).then_return(True)
    subject_ot3.save_gripper_jaw_width_data(
        gripper_id=gripper_id, encoder_position_at_closed=encoder_val
    )
    decoy.verify(
        calibration_storage.ot3.gripper_offset.save_gripper_jaw_width_data(
            encoder_position_at_jaw_closed=encoder_val,
            gripper_id="phoney_baloney_gripper",
        ),
        times=1 if gripper_id is not None else 0,
    )


@pytest.mark.parametrize("gripper_id", ["phoney_baloney_gripper", None])
@pytest.mark.parametrize("delta", [top_types.Point(x=1, y=2, z=3)])
def test_save_gripper_calibration_offset(
    gripper_id: str | None, decoy: Decoy, delta: top_types.Point
) -> None:
    decoy.when(feature_flags.enable_ot3_hardware_controller()).then_return(True)
    subject_ot3.save_gripper_calibration_offset(gripper_id=gripper_id, delta=delta)
    decoy.verify(
        calibration_storage.ot3.gripper_offset.save_gripper_calibration(
            delta, "phoney_baloney_gripper"
        ),
        times=1 if gripper_id is not None else 0,
    )
