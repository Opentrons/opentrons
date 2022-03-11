import json
import pytest
from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from . import list_fixtures


@pytest.mark.parametrize("defpath", list_fixtures(6))
def test_v6_types(defpath):
    json.loads(load_shared_data(defpath))
    ProtocolSchemaV6.parse_raw(load_shared_data(defpath))
