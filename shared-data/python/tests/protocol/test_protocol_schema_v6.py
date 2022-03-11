import json
import sys

import pytest

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.models import ProtocolSchemaV6
from pydantic import ValidationError

from . import list_fixtures


@pytest.mark.parametrize("defpath", list_fixtures(6))
def test_v6_types(defpath):
    defn = json.loads(load_shared_data(defpath))
        # obj = ProtocolSchemaV6.parse_file("/Users/tamarzanzouri/opentrons/shared-data/python/tests/protocol/../../../protocol/fixtures/6/simpleV6.json")
        # dict_obj = obj.dict()
        #assert dict_obj == defn
    obj = ProtocolSchemaV6.parse_raw(load_shared_data(defpath))
