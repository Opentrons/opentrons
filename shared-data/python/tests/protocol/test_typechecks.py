import json
import sys
import pytest
import typeguard

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.dev_types import (
    JsonProtocolV3,
    JsonProtocolV4,
    JsonProtocolV5,
)
from . import list_fixtures


pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("defpath", list_fixtures(3))
def test_v3_types(defpath):
    defn = json.loads(load_shared_data(defpath))
    typeguard.check_type("defn", defn, JsonProtocolV3)


@pytest.mark.parametrize("defpath", list_fixtures(4))
def test_v4_types(defpath):
    defn = json.loads(load_shared_data(defpath))
    typeguard.check_type("defn", defn, JsonProtocolV4)


@pytest.mark.parametrize("defpath", list_fixtures(5))
def test_v5_types(defpath):
    defn = json.loads(load_shared_data(defpath))
    typeguard.check_type("defn", defn, JsonProtocolV5)
