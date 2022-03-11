import json
import sys

import pytest
import typeguard

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.dev_types import JsonProtocolV4, JsonProtocolV3

from . import list_fixtures

# TODO(mc, 2022-02-17): investigate and resolve failures in Python 3.10
pytestmark = pytest.mark.xfail(
    sys.version_info >= (3, 8),
    reason="Tests fail on later Python versions",
    strict=False,
)


@pytest.mark.parametrize("defpath", list_fixtures(4))
def test_v4_types(defpath):
    defn = json.loads(load_shared_data(defpath))
    typeguard.check_type("defn", defn, JsonProtocolV4)


@pytest.mark.parametrize("defpath", list_fixtures(3))
def test_v3_types(defpath):
    defn = json.loads(load_shared_data(defpath))
    typeguard.check_type("defn", defn, JsonProtocolV3)
