import argparse
import csv
import json
from ast import literal_eval
from typing import Optional, Dict, Union, Any, cast
from pathlib import Path
from pydantic import BaseModel

from ... import get_shared_data_root
from .. import name_config, model_config
from ..pipette_definition import (
    PipetteGeometryDefinition,
    PipetteLiquidPropertiesDefinition,
    PipettePhysicalPropertiesDefinition,
    TipHandlingConfigurations,
    PlungerPositions,
    PipetteTipType,
    SupportedTipsDefinition,
    MotorConfigurations,
    PartialTipDefinition,
    AvailableSensorDefinition,
)

from ..dev_types import PipetteModelSpec, PipetteNameSpec, PipetteName


PIPETTE_DEFINITION_ROOT = Path("pipette") / "definitions" / "2"
GEOMETRY_ROOT = get_shared_data_root() / PIPETTE_DEFINITION_ROOT / "geometry"
GENERAL_ROOT = get_shared_data_root() / PIPETTE_DEFINITION_ROOT / "general"
LIQUID_ROOT = get_shared_data_root() / PIPETTE_DEFINITION_ROOT / "liquid"

GENERAL_SCHEMA = "#/pipette/schemas/2/pipettePropertiesSchema.json"
LIQUID_SCHEMA = "#/pipette/schemas/2/pipetteLiquidPropertiesSchema.json"
GEOMETRY_SCHEMA = "#/pipette/schemas/2/pipetteGeometryPropertiesSchema.json"


def _migrate_liquid_model_v1(
    model_configurations: PipetteModelSpec, name_configurations: PipetteNameSpec
) -> PipetteLiquidPropertiesDefinition:
    return build_liquid_model_v2(
        {
            "maxVolume": name_configurations["maxVolume"],
            "minVolume": name_configurations["minVolume"],
            "defaultTipracks": name_configurations["defaultTipracks"],
        },
        _migrate_supported_tips(model_configurations, name_configurations),
    )


def _migrate_physical_model_v1(
    pipette_type: str,
    model_configurations: PipetteModelSpec,
    name_configurations: PipetteNameSpec,
) -> PipettePhysicalPropertiesDefinition:
    channels = name_configurations["channels"]
    pick_up_tip_configurations = _build_tip_handling_configurations(
        "pickup", model_configurations
    )
    drop_tip_configurations = _build_tip_handling_configurations(
        "drop", model_configurations
    )
    plunger_positions = _build_plunger_positions(model_configurations)
    plunger_motor_configurations = _build_motor_configurations(model_configurations)
    partial_tip_configurations = _build_partial_tip_configurations(int(channels))
    return build_physical_model_v2(
        {
            "displayName": name_configurations["displayName"],
            "model": pipette_type,
            "displayCategory": name_configurations["displayCategory"],
            "pickUpTipConfigurations": pick_up_tip_configurations,
            "dropTipConfigurations": drop_tip_configurations,
            "plungerMotorConfigurations": plunger_motor_configurations,
            "plungerPositionsConfigurations": plunger_positions,
            "partialTipConfigurations": partial_tip_configurations,
            "channels": channels,
        }
    )


def _migrate_geometry_model_v1(
    path_to_3d: str, model_configurations: PipetteModelSpec
) -> PipetteGeometryDefinition:

    return build_geometry_model_v2(
        {"nozzleOffset": model_configurations["nozzleOffset"], "pathTo3D": path_to_3d}
    )


def _build_tip_handling_configurations(
    tip_handling_type: str, model_configurations: Optional[PipetteModelSpec] = None
) -> TipHandlingConfigurations:
    presses = 0
    increment = 0
    distance = 0.0
    if tip_handling_type == "pickup" and model_configurations:
        current = model_configurations["pickUpCurrent"]["value"]
        speed = model_configurations["pickUpSpeed"]["value"]
        presses = model_configurations["pickUpPresses"]["value"]
        increment = int(model_configurations["pickUpIncrement"]["value"])
        distance = model_configurations["pickUpDistance"]["value"]
    elif tip_handling_type == "pickup":
        print("Handling pick up tip configurations\n")
        current = float(input("please provide the current\n"))
        speed = float(input("please provide the speed\n"))
        presses = int(input("please provide the number of presses for force pick up\n"))
        increment = int(
            input(
                "please provide the increment to move the pipette down for force pickup\n"
            )
        )
        distance = float(
            input("please provide the starting distance for pick up tip\n")
        )
    elif tip_handling_type == "drop" and model_configurations:
        current = model_configurations["dropTipCurrent"]["value"]
        speed = model_configurations["dropTipSpeed"]["value"]
    elif tip_handling_type == "drop":
        print("Handling drop tip configurations\n")
        current = float(input("please provide the current\n"))
        speed = float(input("please provide the speed\n"))
    return TipHandlingConfigurations(
        current=current,
        speed=speed,
        presses=presses,
        increment=increment,
        distance=distance,
    )


def _build_plunger_positions(
    model_configurations: Optional[PipetteModelSpec] = None,
) -> PlungerPositions:
    if model_configurations:
        top = model_configurations["top"]["value"]
        bottom = model_configurations["bottom"]["value"]
        blow_out = model_configurations["blowout"]["value"]
        drop_tip = model_configurations["dropTip"]["value"]
    else:
        print("Handling plunger motor positions\n")
        top = float(input("Please provide the top plunger position\n"))
        bottom = float(input("Please provide the bottom plunger position\n"))
        blow_out = float(input("Please provide the blow out plunger position\n"))
        drop_tip = float(input("Please provide the drop tip plunger position\n"))
    return PlungerPositions(top=top, bottom=bottom, blowout=blow_out, drop=drop_tip)


def _build_motor_configurations(
    model_configurations: Optional[PipetteModelSpec] = None,
) -> MotorConfigurations:
    if model_configurations:
        run = model_configurations["plungerCurrent"]["value"]
        idle = model_configurations.get("idleCurrent", run)
    else:
        print("Handling default plunger motor currents\n")
        idle = float(
            input("Please provide the default idle current of the plunger motor\n")
        )
        run = float(
            input("Please provide the default run current of the plunger motor\n")
        )
    return MotorConfigurations(idle=idle, run=run)


def _build_partial_tip_configurations(channels: int) -> PartialTipDefinition:
    if channels == 8:
        return PartialTipDefinition(
            partialTipSupported=True, availableConfigurations=[1, 2, 3, 4, 5, 6, 7, 8]
        )
    elif channels == 96:
        return PartialTipDefinition(
            partialTipSupported=True, availableConfigurations=[1, 8, 12, 96]
        )
    else:
        return PartialTipDefinition(partialTipSupported=False)


def build_geometry_model_v2(
    input_dictionary: Dict[str, Any]
) -> PipetteGeometryDefinition:
    return PipetteGeometryDefinition.parse_obj(input_dictionary)


def build_liquid_model_v2(
    input_dictionary: Dict[str, Any],
    supported_tip_configurations: Dict[str, SupportedTipsDefinition],
) -> PipetteLiquidPropertiesDefinition:
    if input_dictionary:
        if input_dictionary.get("partialTipConfigurations"):
            return PipetteLiquidPropertiesDefinition.parse_obj(
                {**input_dictionary, "supportedTips": supported_tip_configurations}
            )
        else:
            return PipetteLiquidPropertiesDefinition.parse_obj(
                {
                    **input_dictionary,
                    "partialTipConfigurations": _build_partial_tip_configurations(
                        input_dictionary["channels"]
                    ),
                    "supportedTips": supported_tip_configurations,
                }
            )
    max_volume = int(input("please provide the max volume of the pipette\n"))
    min_volume = float(input("please provide the min volume of the pipette\n"))
    default_tipracks = input(
        "please input the load names of default tipracks separated by commas\n"
    )
    list_default_tipracks = default_tipracks.split(",")
    return PipetteLiquidPropertiesDefinition.parse_obj(
        {
            "supportedTips": supported_tip_configurations,
            "maxVolume": max_volume,
            "minVolume": min_volume,
            "defaultTipracks": list_default_tipracks,
        }
    )


def build_physical_model_v2(
    input_dictionary: Optional[Dict[str, Any]], pipette_type: Optional[str] = None
) -> PipettePhysicalPropertiesDefinition:
    if input_dictionary:
        available_sensors = AvailableSensorDefinition(
            sensors=input_dictionary.pop("availableSensors", [])
        )
        return PipettePhysicalPropertiesDefinition.parse_obj(
            {**input_dictionary, "availableSensors": available_sensors}
        )
    print(f"Handling general pipette information for {pipette_type}\n")
    display_name = input("please provide the product name of the pipette\n")

    display_category = input("please provide the model generation of the pipette\n")
    input_available_sensors = input(
        "Please provide a list of available sensors, separated by comma\n"
    )
    channels = input(f"Please provide the number of channels your {pipette_type} has\n")
    pick_up_tip_configurations = _build_tip_handling_configurations("pickup")
    drop_tip_configurations = _build_tip_handling_configurations("drop")
    plunger_positions = _build_plunger_positions()
    plunger_motor_configurations = _build_motor_configurations()
    partial_tip_configurations = _build_partial_tip_configurations(int(channels))

    return PipettePhysicalPropertiesDefinition.parse_obj(
        {
            "displayName": display_name,
            "model": pipette_type,
            "displayCategory": display_category,
            "pickUpTipConfigurations": pick_up_tip_configurations,
            "dropTipConfigurations": drop_tip_configurations,
            "plungerMotorConfigurations": plunger_motor_configurations,
            "plungerPositionsConfigurations": plunger_positions,
            "availableSensors": AvailableSensorDefinition(
                sensors=input_available_sensors.split(",")
            ),
            "partialTipConfigurations": partial_tip_configurations,
            "channels": channels,
        }
    )


def _migrate_supported_tips(
    model_configurations: PipetteModelSpec, name_configurations: PipetteNameSpec
) -> Dict[str, SupportedTipsDefinition]:

    ul_per_mm = model_configurations["ulPerMm"][0]

    tip_overlap_dict = model_configurations["tipOverlap"]

    tip_volumes = set()
    tip_overlap_tiprack_set: Dict[str, Any] = {}
    for tiprack, overlap in tip_overlap_dict.items():
        split_value = tiprack.split("ul")[0].split("_")
        if len(split_value) == 1:
            continue
        current_tip_volume = split_value[-1]
        tip_volumes.add(current_tip_volume)
        if tip_overlap_tiprack_set.get(current_tip_volume, None):
            tip_overlap_tiprack_set[current_tip_volume][tiprack] = overlap
        else:
            tip_overlap_tiprack_set[current_tip_volume] = {tiprack: overlap}
    return {
        PipetteTipType(int(volume)).name: build_supported_tips(
            {
                "aspirate": {
                    tiprack: ul_per_mm["aspirate"]
                    for tiprack in tip_overlap_tiprack_set[volume]
                },
                "dispense": {
                    tiprack: ul_per_mm["dispense"]
                    for tiprack in tip_overlap_tiprack_set[volume]
                },
                "defaultReturnTipHeight": model_configurations.get(
                    "returnTipHeight", None
                ),
                "defaultAspirateFlowRate": name_configurations[
                    "defaultAspirateFlowRate"
                ]["value"],
                "defaultBlowOurFlowRate": name_configurations[
                    "defaultDispenseFlowRate"
                ]["value"],
                "defaultDispenseFlowRate": name_configurations[
                    "defaultDispenseFlowRate"
                ]["value"],
                "defaultTipLength": model_configurations["tipLength"]["value"],
                "defaultTipOverlap": tip_overlap_dict["default"],
                "defaultTipOverlapDictionary": tip_overlap_tiprack_set[volume],
            }
        )
        for volume in tip_volumes
    }


def build_supported_tips(input_dictionary: Dict[str, Any]) -> SupportedTipsDefinition:
    return SupportedTipsDefinition.parse_obj(input_dictionary)


def save_to_file(
    directorypath: Path,
    file_name: str,
    data: Union[BaseModel, Dict[str, Any]],
    schema_path: str,
) -> None:
    """
    Function used to save data to a file
    """

    directorypath.mkdir(parents=True, exist_ok=True)
    filepath = directorypath / f"{file_name}.json"
    if isinstance(data, BaseModel):
        dict_basemodel = data.dict(by_alias=True)
        dict_basemodel["$otSharedSchema"] = schema_path
        filepath.write_text(json.dumps(dict_basemodel), encoding="utf-8")
    else:
        data["$otSharedSchema"] = schema_path
        filepath.write_text(json.dumps(data), encoding="utf-8")


def migrate_v1_to_v2() -> None:
    """
    Migrate pipette config data from v1 to v2 schema version.
    """
    all_models = model_config()["config"]
    config_models_ot2 = [
        k for k in all_models.keys() if "v3" not in k and "v4" not in k
    ]

    quirks_list = {}
    for model in config_models_ot2:
        base_name, full_version = model.split("_v")
        generation = "_gen2" if float(full_version) >= 2.0 else ""
        name = cast(PipetteName, f"{base_name}{generation}")

        name_configurations = name_config()[name]
        model_configurations = all_models[model]

        liquid_model = _migrate_liquid_model_v1(
            model_configurations, name_configurations
        )
        pipette_type = f"p{liquid_model.max_volume}"
        physical_model = _migrate_physical_model_v1(
            pipette_type, model_configurations, name_configurations
        )

        quirks_list[model] = model_configurations["quirks"]
        split_version = full_version.split(".")
        file_name = (
            f"{split_version[0]}_{split_version[1] if len(split_version) > 1 else 0}"
        )
        current_pipette_path = Path(physical_model.channels.name.lower()) / pipette_type

        path_to_3d = PIPETTE_DEFINITION_ROOT / current_pipette_path / "placeholder.gltf"
        geometry_model = _migrate_geometry_model_v1(
            str(path_to_3d), model_configurations
        )

        # workaround to better serialize nested dicts in pydantic
        dict_liquid_model = liquid_model.dict(by_alias=True)
        dict_liquid_model["supportedTips"] = {
            k.name: v for k, v in dict_liquid_model["supportedTips"].items()
        }

        save_to_file(
            GEOMETRY_ROOT / current_pipette_path,
            file_name,
            geometry_model,
            GEOMETRY_SCHEMA,
        )
        save_to_file(
            GENERAL_ROOT / current_pipette_path,
            file_name,
            physical_model,
            GENERAL_SCHEMA,
        )
        save_to_file(
            LIQUID_ROOT / current_pipette_path,
            file_name,
            dict_liquid_model,
            LIQUID_SCHEMA,
        )

    for key, items in quirks_list.items():
        print(f"Quirks list for {key}: {items}")


def build_new_pipette_model_v2(
    pipette_functions_dict: Dict[str, Any], pipette_model_csv: str
) -> None:
    """
    Build a brand new pipette model from user inputted data.
    """
    top_level_pipette_model = {}
    with open(pipette_model_csv, "r") as f:
        reader = csv.reader(f)
        current_key = None
        for row in reader:
            if row[0]:
                current_key = row[0]
                top_level_pipette_model[current_key] = {row[1]: literal_eval(row[2])}
            elif current_key:
                top_level_pipette_model[current_key][row[1]] = literal_eval(row[2])
            else:
                continue
    geometry_model = build_geometry_model_v2(top_level_pipette_model["geometry"])
    liquid_model = build_liquid_model_v2(
        top_level_pipette_model["liquid"], pipette_functions_dict
    )
    pipette_type = f"p{liquid_model.max_volume}"
    physical_model = build_physical_model_v2(
        {
            **top_level_pipette_model["general"],
            "plungerMotorConfigurations": top_level_pipette_model[
                "plungerMotorConfigurations"
            ],
            "plungerPositionsConfigurations": top_level_pipette_model[
                "plungerPositionsConfigurations"
            ],
            "pickUpTipConfigurations": top_level_pipette_model[
                "pickUpTipConfigurations"
            ],
            "dropTipConfigurations": top_level_pipette_model["dropTipConfigurations"],
        },
        pipette_type,
    )

    major_version = input("please provide the major version of this pipette model\n")
    minor_version = input("please provide the minor version of this pipette model\n")

    file_name = f"{major_version}_{minor_version}"
    current_pipette_path = Path(physical_model.channels.name.lower()) / pipette_type

    save_to_file(
        GEOMETRY_ROOT / current_pipette_path, file_name, geometry_model, GEOMETRY_SCHEMA
    )
    save_to_file(
        GENERAL_ROOT / current_pipette_path, file_name, physical_model, GENERAL_SCHEMA
    )
    save_to_file(
        LIQUID_ROOT / current_pipette_path, file_name, liquid_model, LIQUID_SCHEMA
    )


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(
        description="96 channel tip handling testing script."
    )
    parser.add_argument(
        "--new_pipette_model",
        type=bool,
        help="If true, build a new pipette model from scratch",
        default=False,
    )
    parser.add_argument(
        "--path_to_pipette_model",
        type=str,
        help="the csv filled with data to build a pipette model",
        default=None,
    )

    args = parser.parse_args()
    if args.new_pipette_model:
        using_csv = "" if args.path_to_pipette_model else "out"
        print(f"Building new pipette function with{using_csv} using csv")

        next_tip = True
        pipette_functions_dict: Dict[str, Any] = {}
        while next_tip:
            print("Preparing pipetting function table from csv\n")
            tip_volume = input("Please provide the next tip volume\n")
            tiprack = input(
                "Please provide the tiprack/tip type associated with this data\n"
            )
            path_to_data = input("Please provide the data path to the csv\n")
            csv_dict = pipette_functions_dict.get(f"t{tip_volume}", {})
            with open(path_to_data, "r") as f:
                reader = csv.reader(f)
                pipetting_key = None
                for row in reader:
                    current_key_exists = csv_dict.get(row[0])
                    if row[0] == "aspirate" or row[0] == "dispense":
                        pipetting_key = row[0]
                        if current_key_exists:
                            csv_dict[pipetting_key][f"{tiprack}"].append(
                                [float(row[1]), float(row[2]), float(row[3])]
                            )
                        else:
                            csv_dict[pipetting_key] = {
                                f"{tiprack}": [
                                    [float(row[1]), float(row[2]), float(row[3])]
                                ]
                            }
                    elif pipetting_key and not row[0]:
                        csv_dict[pipetting_key][f"{tiprack}"].append(
                            [float(row[1]), float(row[2]), float(row[3])]
                        )
                    else:
                        pipetting_key = None
                        if current_key_exists:
                            continue
                        csv_dict[row[0]] = row[1]
            pipette_functions_dict[f"t{tip_volume}"] = csv_dict
            cont = input("Additional tips? Please enter y/n")

            next_tip = cont == "y" or cont == "yes"
        converted_pipette_functions_dict = {
            k: build_supported_tips(d) for k, d in pipette_functions_dict.items()
        }

        print(
            "Please review the aspirate and dispense functions once the pipette model is built.\n"
        )
        build_new_pipette_model_v2(
            converted_pipette_functions_dict, args.path_to_pipette_model
        )
    else:
        print("Migrating schema v1 files...")
        migrate_v1_to_v2()


if __name__ == "__main__":
    """
    A script to automate building a pipette configuration definition.

    This script can either perform migrations from a v1 -> v2 schema format
    or build a brand new script from scratch.

    When building a new pipette configuration model, you will either need
    to provide CSVs or use command line inputs.

    If you choose CSVs you will need one CSV for the general pipette configuration
    data (such as pipette model or number of channels) and one for every tip
    type that this pipette model can support.
    """
    main()
