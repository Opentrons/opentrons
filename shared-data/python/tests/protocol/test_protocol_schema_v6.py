import json
import pytest
from typing import Any, Dict
from opentrons_shared_data import load_shared_data
from opentrons_shared_data.protocol.models import ProtocolSchemaV6

from . import list_fixtures

failed_json_protocol = {
    "robot": {"model": "OT-2 Standard", "deckId": "ot2_standard"},
    "pipettes": {"pipetteId": {"name": "p10_single"}},
    "modules": {
        "magneticModuleId": {"model": "magneticModuleV2"},
        "temperatureModuleId": {"model": "temperatureModuleV2"},
    },
    "labware": {
        "fixedTrash": {
            "displayName": "Trash",
            "definitionId": "opentrons/opentrons_1_trash_1100ml_fixed/1",
        },
        "sourcePlateId": {
            "displayName": "Source Plate",
            "definitionId": "example/plate/1",
        },
    },
    "commands": [
        {
            "commandType": "loadPipette",
            "id": "0abc123",
            "params": {"pipetteId": "pipetteId", "mount": "left"},
        },
        {
            "commandType": "loadModule",
            "id": "1abc123",
            "params": {"moduleId": "magneticModuleId", "location": {"slotName": "3"}},
        },
        {
            "commandType": "loadModule",
            "id": "2abc123",
            "params": {
                "moduleId": "temperatureModuleId",
                "location": {"slotName": "1"},
            },
        },
        {
            "commandType": "loadLabware",
            "id": "3abc123",
            "params": {
                "labwareId": "sourcePlateId-1",
                "location": {"moduleId": "temperatureModuleId"},
            },
        },
    ],
}


@pytest.mark.parametrize("defpath", list_fixtures(6))
def test_v6_types(defpath):
    def_data = load_shared_data(defpath)
    def_model = ProtocolSchemaV6.parse_raw(def_data)
    def_dict_from_model = def_model.dict(
        exclude_unset=True,
        # 'schemaVersion' in python is '$schemaVersion' in JSON
        by_alias=True,
    )
    expected_def_dict = json.loads(def_data)
    delete_unexpected_results(expected_def_dict)
    assert def_dict_from_model == expected_def_dict


# TODO (Tamar and Max 3/16/22):
# Some of our v6 fixtures accidentally contain command "result" data,
# which is not part of the schema, and which we don't parse into our models.
# Here, we delete the extra junk from the fixtures.
# Remove this when the fixtures are corrected.
# https://github.com/Opentrons/opentrons/issues/9701
def delete_unexpected_results(protocol_fixture: Dict[str, Any]) -> None:
    for command_object_dict in protocol_fixture["commands"]:
        command_object_dict.pop("result", None)
        command_object_dict.pop("id", None)


def test_schema_validators() -> None:
    """Should raise an error the keys do not match."""
    with pytest.raises(
        Exception, match="missing loadLabware id in referencing parent data model."
    ):
        ProtocolSchemaV6.parse_raw(json.dumps(failed_json_protocol, indent=4))
