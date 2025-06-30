"""Tests for family definitions"""

from pathlib import Path

import pytest

from opentrons_shared_data import get_shared_data_root
from opentrons_shared_data.pipette.load_data import (
    load_definition,
    load_family_definition,
)
from opentrons_shared_data.pipette.pipette_definition import PipetteConfigurations
from opentrons_shared_data.pipette.types import PipetteVersionType


@pytest.fixture
def all_general_configs() -> set[Path]:
    """All the general config files."""
    files = set(
        (get_shared_data_root() / "pipette" / "definitions" / "2" / "general").rglob(
            "*.json"
        )
    )
    assert files, "Bad path in fixture"
    return files


@pytest.fixture
def all_family_configs() -> set[Path]:
    """All the family configs."""
    files = set(
        (get_shared_data_root() / "pipette" / "definitions" / "2" / "family").iterdir()
    )
    assert files, "Bad path in fixture"
    return files


def test_families_cover_pipettes(
    all_family_configs: set[Path], all_general_configs: set[Path]
) -> None:
    """
    All pipette definitions should be covered by a family definition.

    While each pipette general configuration lists a family, and the family definition is loaded
    when you load a configuration thus guaranteeing that if the general config is wrong tests will
    fail, we want to be able to list all pipette configurations starting with the family. This
    tests that.
    """
    family_defs = [
        load_family_definition(family_file.stem) for family_file in all_family_configs
    ]
    family_config_associations: dict[str, list[str]] = {
        family_def.family_name: [] for family_def in family_defs
    }
    config_iter_copy = {c for c in all_general_configs}
    for family_def in family_defs:
        for general_config in config_iter_copy:
            relative_config_path = general_config.relative_to(
                get_shared_data_root() / "pipette" / "definitions" / "2" / "general"
            )
            match_statement = (
                Path(
                    family_def.channels.to_config_name()
                    + family_def.oem_type.defpath_extension_str()
                )
                / str(family_def.model.value)
                / "*"
            )
            if not relative_config_path.match(str(match_statement)):
                continue
            if (
                PipetteVersionType.convert_from_string(relative_config_path.stem).major
                == family_def.exemplar_version.major
            ):
                try:
                    all_general_configs.remove(general_config)
                except KeyError:
                    previous_association = next(
                        [
                            family
                            for family, configs in family_config_associations.items()
                            if general_config in configs
                        ]
                    )
                    assert (
                        general_config in all_general_configs
                    ), f"Pipette config {general_config} associated with at least two families: {family_def.family_name} and {previous_association}"
                family_config_associations[family_def.family_name].append(
                    general_config
                )
    assert all_general_configs != config_iter_copy, "tests messed up"
    assert (
        not all_general_configs
    ), f"Some pipette configurations were not covered by a family: {all_general_configs}"
    for family_name, configs in family_config_associations.items():
        assert configs, f"Family {family_name} has no associated configurations"
