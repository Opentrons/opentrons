import os
from typing import Iterator
from opentrons_shared_data import get_shared_data_root

from opentrons_shared_data.pipette.pipette_definition import (
    PipetteConfigurations,
    TIP_OVERLAP_VERSION_MINIMUM,
    TIP_OVERLAP_VERSION_MAXIMUM,
)
from opentrons_shared_data.pipette.load_data import load_definition
from opentrons_shared_data.pipette.pipette_load_name_conversions import (
    convert_pipette_model,
)
from opentrons_shared_data.pipette.dev_types import PipetteModel


def iterate_models() -> Iterator[PipetteModel]:
    """Get an iterator of all pipette models."""
    _channel_model_str = {
        "single_channel": "single",
        "ninety_six_channel": "96",
        "eight_channel": "multi",
    }
    defn_root = get_shared_data_root() / "pipette" / "definitions" / "2" / "liquid"
    assert os.listdir(defn_root), "A path is wrong"
    for channel_dir in defn_root.iterdir():
        for model_dir in channel_dir.iterdir():
            for lc_dir in model_dir.iterdir():
                for version_file in lc_dir.iterdir():
                    version_list = version_file.stem.split("_")
                    yield PipetteModel(
                        f"{model_dir.stem}_{_channel_model_str[channel_dir.stem]}_v{version_list[0]}.{version_list[1]}"
                    )


def test_check_all_models_are_valid() -> None:
    """Make sure each model can be loaded."""
    for model in iterate_models():
        model_version = convert_pipette_model(model)
        loaded_model = load_definition(
            model_version.pipette_type,
            model_version.pipette_channels,
            model_version.pipette_version,
        )

        assert isinstance(loaded_model, PipetteConfigurations)


def test_pick_up_configs_tip_count_keys() -> None:
    """Verify that speed, distance & current of pickUpTipConfigurations have same tip count keys."""

    for model in iterate_models():
        model_version = convert_pipette_model(model)
        loaded_model = load_definition(
            model_version.pipette_type,
            model_version.pipette_channels,
            model_version.pipette_version,
        )
        pick_up_tip_configs = loaded_model.pick_up_tip_configurations.press_fit
        assert (
            pick_up_tip_configs.distance_by_tip_count.keys()
            == pick_up_tip_configs.speed_by_tip_count.keys()
            == pick_up_tip_configs.current_by_tip_count.keys()
        )


def test_tip_overlap_version_extrema_cover_definitions() -> None:
    """Check that tip overlap versions are up to date."""
    found_min = False
    found_max = False
    for model in iterate_models():
        model_version = convert_pipette_model(model)
        loaded_model = load_definition(
            model_version.pipette_type,
            model_version.pipette_channels,
            model_version.pipette_version,
        )
        for lc_name, lc_value in loaded_model.liquid_properties.items():
            for version in lc_value.versioned_tip_overlap_dictionary.keys():
                version_number = int(version[1:])
                assert (
                    version_number >= TIP_OVERLAP_VERSION_MINIMUM
                ), f"{model} / {lc_name} has tip overlap version {version} (below min)"
                assert (
                    version_number <= TIP_OVERLAP_VERSION_MAXIMUM
                ), f"{model} / {lc_name} has tip overlap version {version} (above max)"
                if version_number == TIP_OVERLAP_VERSION_MINIMUM:
                    found_min = True
                if version_number == TIP_OVERLAP_VERSION_MAXIMUM:
                    found_max = True
    assert (
        found_min
    ), f"No tip overlap data for version {TIP_OVERLAP_VERSION_MINIMUM} found"
    assert (
        found_max
    ), f"No tip overlap data for version {TIP_OVERLAP_VERSION_MAXIMUM} found"
