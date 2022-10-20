import json
import pytest
import importlib
from types import ModuleType
from typing import no_type_check, Generator

from pydantic import ValidationError

from opentrons.util.helpers import utc_now
from opentrons.calibration_storage import encoder_decoder as ed, types as cal_types


@no_type_check
@pytest.fixture
def model(request: pytest.FixtureRequest) -> Generator[ModuleType, None, None]:
    robot_type = request.param
    if robot_type == "ot3":
        yield importlib.import_module("opentrons.calibration_storage.ot3.models")
    else:
        yield importlib.import_module("opentrons.calibration_storage.ot2.models")


def test_json_datetime_encoder() -> None:
    fake_time = utc_now()
    original = {"mock_hash": {"tipLength": 25.0, "lastModified": fake_time}}

    encoded = json.dumps(original, cls=ed.DateTimeEncoder)
    decoded = json.loads(encoded, cls=ed.DateTimeDecoder)
    assert decoded == original


@no_type_check
@pytest.mark.parametrize(
    argnames=["model"],
    argvalues=[["ot2"], ["ot3"]],
    indirect=True,
)
def test_tip_length_positive(model: ModuleType) -> None:
    with pytest.raises(ValidationError):
        model.v1.TipLengthModel(
            tipLength=-10,
            lastModified=utc_now(),
            source=cal_types.SourceType.user,
            status=model.v1.CalibrationStatus(),
            uri="opentrons/tiprack/1",
        )
