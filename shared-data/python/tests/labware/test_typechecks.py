import sys

import pytest
import typeguard

from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.dev_types import LabwareDefinition

from . import get_ot_defs


pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("loadname,version", get_ot_defs())
def test_opentrons_definition_types(loadname, version):
    defdict = load_definition(loadname, version)
    typeguard.check_type("defdict", defdict, LabwareDefinition)
