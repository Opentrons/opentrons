from pathlib import Path

import pytest
import typeguard

from opentrons_shared_data import modules
from opentrons_shared_data.modules import dev_types

from . import list_v2_defs



@pytest.mark.parametrize('defname', list_v2_defs())
def test_v2_definitions_match_types(defname):
    defdict = modules.load_definition('2', defname)
    typeguard.check_type('defdict', defdict, dev_types.ModuleDefinitionV2)


@pytest.mark.parametrize('defname', ['magdeck', 'tempdeck', 'thermocycler'])
def test_v1_definitions_match_types(defname):
    defdict = modules.load_definition('1', defname)
    typeguard.check_type('defdict', defdict, dev_types.ModuleDefinitionV1)
