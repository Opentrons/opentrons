import sys

import pytest
import typeguard

from opentrons_shared_data import module
from opentrons_shared_data.module import dev_types

from . import list_v2_defs, list_v3_defs


pytestmark = pytest.mark.xfail(
    condition=sys.version_info >= (3, 10),
    reason="https://github.com/agronholm/typeguard/issues/242",
)


@pytest.mark.parametrize("defname", list_v3_defs())
def test_v3_definitions_match_types(defname: str) -> None:
    """Test that V3 module definitions match ModuleDefinitionV3."""
    def_dict = module.load_definition("3", defname)
    typeguard.check_type("def_dict", def_dict, dev_types.ModuleDefinitionV3)


@pytest.mark.parametrize("defname", list_v2_defs())
def test_v2_definitions_match_types(defname: str) -> None:
    defdict = module.load_definition("2", defname)  # type: ignore [call-overload]
    typeguard.check_type("defdict", defdict, dev_types.ModuleDefinitionV2)


@pytest.mark.parametrize("defname", ["magdeck", "tempdeck", "thermocycler"])
def test_v1_definitions_match_types(defname: str) -> None:
    defdict = module.load_definition("1", defname)
    typeguard.check_type("defdict", defdict, dev_types.ModuleDefinitionV1)
