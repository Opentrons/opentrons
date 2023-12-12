import json
import pytest

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.models import protocol_schema_v8

from . import list_fixtures


@pytest.mark.parametrize("defpath", list_fixtures(8))
def test_v8_types(defpath):
    def_data = load_shared_data(defpath)
    def_model = protocol_schema_v8.ProtocolSchemaV8.parse_raw(def_data)
    def_dict_from_model = def_model.dict(
        exclude_unset=True,
        # 'schemaVersion' in python is '$schemaVersion' in JSON
        by_alias=True,
    )
    expected_def_dict = json.loads(def_data)
    assert def_dict_from_model == expected_def_dict
