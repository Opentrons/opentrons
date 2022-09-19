import json

from opentrons.util.helpers import utc_now
from opentrons.calibration_storage import encoder_decoder as ed


def test_json_datetime_encoder():
    fake_time = utc_now()
    original = {"mock_hash": {"tipLength": 25.0, "lastModified": fake_time}}

    encoded = json.dumps(original, cls=ed.DateTimeEncoder)
    decoded = json.loads(encoded, cls=ed.DateTimeDecoder)
    assert decoded == original
