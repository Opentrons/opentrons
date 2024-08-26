import pytest

from pydantic import ValidationError
from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from . import get_ot_defs, get_ot_defs_3

# add tests for def3 in here

def test_loadname_regex_applied() -> None:
    defdict = load_definition(*get_ot_defs()[0])
    defdict["parameters"]["loadName"] = "ALSJHDAKJLA"
    with pytest.raises(ValidationError):
        LabwareDefinition.parse_obj(defdict)


def test_namespace_regex_applied() -> None:
    defdict = load_definition(*get_ot_defs()[0])
    defdict["namespace"] = "ALSJHDAKJLA"
    with pytest.raises(ValidationError):
        LabwareDefinition.parse_obj(defdict)
