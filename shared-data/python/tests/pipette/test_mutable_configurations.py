import json
import os
from pathlib import Path
from typing import Dict, Any, cast, Union, Generator

import pytest

from opentrons_shared_data.pipette import (
    mutable_configurations,
    types,
    pipette_definition,
    pipette_load_name_conversions as pip_conversions,
    load_data,
    dev_types,
)


TEST_SERIAL_NUMBER = "P50MV1520200304"
TestOverrideType = Dict[str, Union[float, int, bool]]


@pytest.fixture
def TMPFILE_DATA() -> Dict[str, Any]:
    return {
        "dropTipShake": True,
        "doubleDropTip": True,
        "model": "p50_multi_v1.5",
        "quirks": {"pickUpPresses": True, "dropTipShake": True, "doubleDropTip": True},
        "pickUpSpeed": {
            "value": 5.0,
            "min": 1,
            "max": 100,
            "units": "mm/s",
            "type": "float",
            "default": 30,
        },
    }


@pytest.fixture
def override_configuration_path(tmp_path: Path) -> Generator[Path, None, None]:
    os.environ["OT_API_CONFIG_DIR"] = str(tmp_path)

    tmp_path.mkdir(parents=True, exist_ok=True)
    with_pip_path = tmp_path / Path("pipettes")
    with_pip_path.mkdir(parents=True, exist_ok=True)
    yield with_pip_path

    del os.environ["OT_API_CONFIG_DIR"]


@pytest.fixture
def overrides_fixture(
    override_configuration_path: Path, TMPFILE_DATA: Dict[str, Any]
) -> types.MutableConfig:
    with open(override_configuration_path / f"{TEST_SERIAL_NUMBER}.json", "w") as f:
        json.dump(TMPFILE_DATA, f)
    return types.MutableConfig.build(**TMPFILE_DATA["pickUpSpeed"], name="pickUpSpeed")


def test_list_mutable_configs_unknown_pipette_id(
    override_configuration_path: Path,
) -> None:
    """Test unknown pipette id mutable configs.

    Test that a user receives a list of all possible mutable configurations
    with the default value equal to the regular value.
    """

    found_configurations = mutable_configurations.list_mutable_configs(
        TEST_SERIAL_NUMBER, override_configuration_path
    )
    for c in found_configurations:
        if isinstance(c, str):
            # model string, ignore
            continue
        if isinstance(c, types.QuirkConfig):
            assert isinstance(c.value, bool)
        else:
            assert c.default == c.value


def test_list_mutable_configs_known_pipette_id(
    overrides_fixture: types.MutableConfig, override_configuration_path: Path
) -> None:
    """Test known pipette id mutable configs.

    Test that a user receives a list of all possible mutable configurations
    with the expected overrides also listed.
    """
    found_configurations = mutable_configurations.list_mutable_configs(
        TEST_SERIAL_NUMBER, override_configuration_path
    )

    for c in found_configurations:
        if isinstance(c, str):
            # model string, ignore
            continue
        if overrides_fixture.name == c.name:
            assert c.value == overrides_fixture.value
        elif isinstance(c, types.QuirkConfig):
            assert isinstance(c.value, bool)
        else:
            assert c.default == c.value


@pytest.mark.parametrize(
    argnames=["overrides_dict", "saved_dict"],
    argvalues=[
        [
            {"pickUpCurrent": 0.5, "dropTipSpeed": 5, "dropTipShake": False},
            {
                "quirks": {"dropTipShake": False},
                "pickUpCurrent": {
                    "value": 0.5,
                    "default": 0.8,
                    "units": "amps",
                    "type": "float",
                    "min": 0.1,
                    "max": 2.0,
                },
                "model": "p50_multi_v1.5",
                "dropTipSpeed": {
                    "value": 5,
                    "default": 5.0,
                    "units": "mm/s",
                    "type": "float",
                    "min": 0.01,
                    "max": 30,
                },
            },
        ]
    ],
)
def test_save_new_overrides_new_file(
    override_configuration_path: Path,
    overrides_dict: TestOverrideType,
    saved_dict: Dict[str, Any],
) -> None:
    mutable_configurations.save_overrides(
        TEST_SERIAL_NUMBER, overrides_dict, override_configuration_path
    )
    with open(override_configuration_path / f"{TEST_SERIAL_NUMBER}.json") as f:
        new_file = json.load(f)
    assert saved_dict == new_file


@pytest.mark.parametrize(
    argnames=["overrides_dict"],
    argvalues=[
        [{"pickUpCurrent": 1, "pickUpSpeed": 10, "dropTipShake": False}],
        [{"pickUpCurrent": 2}],
    ],
)
def test_save_new_overrides_update_file(
    override_configuration_path: Path,
    overrides_fixture: types.MutableConfig,
    overrides_dict: TestOverrideType,
    TMPFILE_DATA: Dict[str, Any],
) -> None:
    mutable_configurations.save_overrides(
        TEST_SERIAL_NUMBER, overrides_dict, override_configuration_path
    )
    with open(override_configuration_path / f"{TEST_SERIAL_NUMBER}.json") as f:
        new_file = json.load(f)

    for k, v in overrides_dict.items():
        if isinstance(v, bool):
            TMPFILE_DATA["quirks"][k] = v
        elif TMPFILE_DATA.get(k):
            TMPFILE_DATA[k]["value"] = v

    TMPFILE_DATA["pickUpCurrent"] = {
        "default": 0.8,
        "max": 2.0,
        "min": 0.1,
        "type": "float",
        "units": "amps",
        "value": overrides_dict["pickUpCurrent"],
    }

    del TMPFILE_DATA["quirks"]["pickUpPresses"]
    assert TMPFILE_DATA == new_file


@pytest.mark.parametrize(
    argnames=["overrides_dict"],
    argvalues=[
        [{"pickUpCurrent": 1231.213, "dropTipSpeed": 121, "dropTipShake": False}],
        [{"quirk123": True}],
    ],
)
def test_save_invalid_overrides(
    overrides_fixture: types.MutableConfig,
    override_configuration_path: Path,
    overrides_dict: TestOverrideType,
    TMPFILE_DATA: Dict[str, Any],
) -> None:
    with pytest.raises(ValueError):
        mutable_configurations.save_overrides(
            TEST_SERIAL_NUMBER, overrides_dict, override_configuration_path
        )
    with open(override_configuration_path / f"{TEST_SERIAL_NUMBER}.json") as f:
        new_file = json.load(f)
    assert TMPFILE_DATA == new_file


@pytest.mark.parametrize(
    argnames=["pipette_model", "serial_number"],
    argvalues=[
        [
            pip_conversions.convert_pipette_model(
                cast(dev_types.PipetteModel, "p1000_96_v3.3")
            ),
            "P1KHV3320230629",
        ],
        [
            pip_conversions.convert_pipette_model(
                cast(dev_types.PipetteModel, "p50_multi_v1.5")
            ),
            TEST_SERIAL_NUMBER,
        ],
    ],
)
def test_load_with_overrides(
    overrides_fixture: types.MutableConfig,
    pipette_model: pipette_definition.PipetteModelVersionType,
    serial_number: str,
    override_configuration_path: Path,
) -> None:
    """Test that you can load configurations both with pre-existing overrides and non-pre-existing overrides."""
    updated_configurations = mutable_configurations.load_with_mutable_configurations(
        pipette_model, override_configuration_path, serial_number
    )

    loaded_base_configurations = load_data.load_definition(
        pipette_model.pipette_type,
        pipette_model.pipette_channels,
        pipette_model.pipette_version,
    )

    if serial_number == TEST_SERIAL_NUMBER:
        dict_loaded_configs = loaded_base_configurations.dict(by_alias=True)
        dict_loaded_configs["pickUpTipConfigurations"]["pressFit"]["speed"] = 5.0
        updated_configurations_dict = updated_configurations.dict(by_alias=True)
        assert set(dict_loaded_configs.pop("quirks")) == set(
            updated_configurations_dict.pop("quirks")
        )
        assert updated_configurations_dict == dict_loaded_configs
    else:
        assert updated_configurations == loaded_base_configurations


def test_build_mutable_config_using_old_units() -> None:
    """Test that MutableConfigs can build with old units."""
    old_units_config = {
        "value": 5,
        "default": 5.0,
        "units": "mm/s",
        "type": "float",
        "min": 0.01,
        "max": 30,
    }
    assert (
        types.MutableConfig.build(**old_units_config, name="dropTipSpeed") is not None  # type: ignore
    )
