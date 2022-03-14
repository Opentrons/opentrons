import json
import pytest
from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from . import list_fixtures


@pytest.mark.parametrize("defpath", list_fixtures(6))
def test_v6_types(defpath):
    def_data = load_shared_data(defpath)
    def_model = ProtocolSchemaV6.parse_raw(def_data)
    def_dict_from_model = def_model.dict(exclude_none=True)

    # pop the schema ID off the dicts so we can compare the full dicts later
    expected_def_dict = json.loads(def_data)
    expected_schema = expected_def_dict.pop("$otSharedSchema")
    actual_schema = def_dict_from_model.pop("otSharedSchema")

    assert actual_schema == expected_schema
    assert def_dict_from_model == expected_def_dict
