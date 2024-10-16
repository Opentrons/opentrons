import json

from opentrons_shared_data import load_shared_data
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    LiquidClassSchemaV1,
)


def test_load_liquid_class_schema_v1() -> None:
    fixture_data = load_shared_data("liquid-class/fixtures/fixture_glycerol50.json")
    liquid_class_model = LiquidClassSchemaV1.parse_raw(fixture_data)
    liquid_class_def_from_model = json.loads(
        liquid_class_model.json(exclude_unset=True)
    )
    expected_liquid_class_def = json.loads(fixture_data)
    assert liquid_class_def_from_model == expected_liquid_class_def
