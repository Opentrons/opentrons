import os
from opentrons_shared_data import get_shared_data_root

from opentrons_shared_data.pipette.pipette_definition import PipetteConfigurations
from opentrons_shared_data.pipette.load_data import (
    load_definition,
    load_valid_nozzle_maps,
)
from opentrons_shared_data.pipette.pipette_load_name_conversions import (
    convert_pipette_model,
)
from opentrons_shared_data.pipette.dev_types import PipetteModel


def test_check_all_models_are_valid() -> None:
    paths_to_validate = (
        get_shared_data_root() / "pipette" / "definitions" / "2" / "general"
    )
    _channel_model_str = {
        "single_channel": "single",
        "ninety_six_channel": "96",
        "eight_channel": "multi",
    }
    assert os.listdir(paths_to_validate), "You have a path wrong"
    for channel_dir in os.listdir(paths_to_validate):
        for model_dir in os.listdir(paths_to_validate / channel_dir):
            for version_file in os.listdir(paths_to_validate / channel_dir / model_dir):
                version_list = version_file.split(".json")[0].split("_")
                built_model: PipetteModel = PipetteModel(
                    f"{model_dir}_{_channel_model_str[channel_dir]}_v{version_list[0]}.{version_list[1]}"
                )

                model_version = convert_pipette_model(built_model)
                loaded_model = load_definition(
                    model_version.pipette_type,
                    model_version.pipette_channels,
                    model_version.pipette_version,
                )

                assert isinstance(loaded_model, PipetteConfigurations)


def test_pick_up_configs_configuration_by_nozzle_map_keys() -> None:
    """Verify that for every nozzle map the pickUpTipConfigurations have a valid configuration set."""
    paths_to_validate = (
        get_shared_data_root() / "pipette" / "definitions" / "2" / "general"
    )
    _channel_model_str = {
        "single_channel": "single",
        "ninety_six_channel": "96",
        "eight_channel": "multi",
    }
    assert os.listdir(paths_to_validate), "You have a path wrong"
    for channel_dir in os.listdir(paths_to_validate):
        for model_dir in os.listdir(paths_to_validate / channel_dir):
            for version_file in os.listdir(paths_to_validate / channel_dir / model_dir):
                version_list = version_file.split(".json")[0].split("_")
                built_model: PipetteModel = PipetteModel(
                    f"{model_dir}_{_channel_model_str[channel_dir]}_v{version_list[0]}.{version_list[1]}"
                )

                model_version = convert_pipette_model(built_model)
                loaded_model = load_definition(
                    model_version.pipette_type,
                    model_version.pipette_channels,
                    model_version.pipette_version,
                )
                valid_nozzle_maps = load_valid_nozzle_maps(
                    model_version.pipette_type,
                    model_version.pipette_channels,
                    model_version.pipette_version,
                )

                pipette_maps = list(
                    loaded_model.pick_up_tip_configurations.press_fit.configuration_by_nozzle_map.keys()
                )
                if loaded_model.pick_up_tip_configurations.cam_action is not None:
                    pipette_maps += list(
                        loaded_model.pick_up_tip_configurations.cam_action.configuration_by_nozzle_map.keys()
                    )
                assert pipette_maps == list(valid_nozzle_maps.maps.keys())


def test_pick_up_configs_configuration_ordered_from_smallest_to_largest() -> None:
    """Verify that ValidNozzleMaps and PickUpTipConfigurations are ordered from smallest nozzle configuration to largest, ensuring mutable config compliancy."""
    paths_to_validate = (
        get_shared_data_root() / "pipette" / "definitions" / "2" / "general"
    )
    _channel_model_str = {
        "single_channel": "single",
        "ninety_six_channel": "96",
        "eight_channel": "multi",
    }
    assert os.listdir(paths_to_validate), "You have a path wrong"
    for channel_dir in os.listdir(paths_to_validate):
        for model_dir in os.listdir(paths_to_validate / channel_dir):
            for version_file in os.listdir(paths_to_validate / channel_dir / model_dir):
                version_list = version_file.split(".json")[0].split("_")
                built_model: PipetteModel = PipetteModel(
                    f"{model_dir}_{_channel_model_str[channel_dir]}_v{version_list[0]}.{version_list[1]}"
                )

                model_version = convert_pipette_model(built_model)
                loaded_model = load_definition(
                    model_version.pipette_type,
                    model_version.pipette_channels,
                    model_version.pipette_version,
                )
                valid_nozzle_maps = load_valid_nozzle_maps(
                    model_version.pipette_type,
                    model_version.pipette_channels,
                    model_version.pipette_version,
                )

                map_keys = list(valid_nozzle_maps.maps.keys())
                for key in map_keys:
                    for i in range(map_keys.index(key)):
                        assert len(valid_nozzle_maps.maps[map_keys[i]]) <= len(
                            valid_nozzle_maps.maps[key]
                        )

                pipette_maps = list(
                    loaded_model.pick_up_tip_configurations.press_fit.configuration_by_nozzle_map.keys()
                )
                for key in pipette_maps:
                    for i in range(pipette_maps.index(key)):
                        assert len(valid_nozzle_maps.maps[pipette_maps[i]]) <= len(
                            valid_nozzle_maps.maps[key]
                        )
