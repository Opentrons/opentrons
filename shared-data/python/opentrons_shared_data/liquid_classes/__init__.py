"""opentrons_shared_data.liquid_classes: types and functions for accessing liquid class definitions."""

import json
from typing import cast
from .liquid_class_definition import LiquidClassSchemaV1
from .. import load_shared_data


# TODO (spp, 2024-10-16): update the path once definitions are added
def load_definition(name: str) -> LiquidClassSchemaV1:
    return cast(
        LiquidClassSchemaV1,
        json.loads(load_shared_data(f"liquid-class/fixtures/{name}.json")),
    )
