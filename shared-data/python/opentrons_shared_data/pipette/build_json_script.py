import argparse
# import csv
from typing import Optional, Dict
from pathlib import Path
from pydantic import BaseModel

from .. import get_shared_data_root
from . import name_config, model_config
from .pipette_definition import (
    PipetteGeometryDefinition,
    PipetteLiquidPropertiesDefinition,
    PipettePhysicalPropertiesDefinition,
    TipHandlingConfigurations,
    PlungerPositions,
    PipetteTipType,
    SupportedTipsDefinition,
    MotorConfigurations,
    PartialTipDefinition)


PIPETTE_DEFINITION_ROOT = get_shared_data_root() / "pipette" / "definitions" / "2"
GEOMETRY_ROOT = PIPETTE_DEFINITION_ROOT / "geometry"
GENERAL_ROOT = PIPETTE_DEFINITION_ROOT / "general"
LIQUID_ROOT = PIPETTE_DEFINITION_ROOT / "liquid"


## Name spec sample
#   "p10_single": {
#     "displayName": "P10 Single-Channel GEN1",
#     "displayCategory": "GEN1",
#     "minVolume": 1,
#     "maxVolume": 10,
#     "channels": 1,
#     "defaultAspirateFlowRate": {
#       "value": 5,
#       "min": 0.001,
#       "max": 50,
#       "valuesByApiLevel": { "2.0": 5 }
#     },
#     "defaultDispenseFlowRate": {
#       "value": 10,
#       "min": 0.001,
#       "max": 50,
#       "valuesByApiLevel": { "2.0": 10 }
#     },
#     "defaultBlowOutFlowRate": {
#       "value": 1000,
#       "min": 5,
#       "max": 1000,
#       "valuesByApiLevel": { "2.0": 1000 }
#     },
#     "smoothieConfigs": {
#       "stepsPerMM": 768,
#       "homePosition": 220,
#       "travelDistance": 30
#     },
#     "defaultTipracks": [
#       "opentrons/opentrons_96_tiprack_10ul/1",
#       "opentrons/opentrons_96_filtertiprack_10ul/1",
#       "opentrons/geb_96_tiprack_10ul/1"
#     ]

## model spec sample
    # "p1000_single_v1.3": {
    #   "name": "p1000_single",
    #   "top": {
    #     "value": 19.5,
    #     "min": 5,
    #     "max": 19.5,
    #     "units": "mm",
    #     "type": "float"
    #   },
    #   "bottom": {
    #     "value": 2.5,
    #     "min": -2,
    #     "max": 19.0,
    #     "units": "mm",
    #     "type": "float"
    #   },
    #   "blowout": {
    #     "value": 0.5,
    #     "min": -4,
    #     "max": 10,
    #     "units": "mm",
    #     "type": "float"
    #   },
    #   "dropTip": {
    #     "value": -4,
    #     "min": -6,
    #     "max": 2,
    #     "units": "mm",
    #     "type": "float"
    #   },
    #   "pickUpCurrent": {
    #     "value": 0.1,
    #     "min": 0.05,
    #     "max": 2.0,
    #     "units": "amps",
    #     "type": "float"
    #   },
    #   "pickUpDistance": {
    #     "value": 15,
    #     "min": 1,
    #     "max": 30,
    #     "units": "mm",
    #     "type": "float"
    #   },
    #   "pickUpIncrement": {
    #     "value": 1.0,
    #     "min": 0.0,
    #     "max": 10.0,
    #     "units": "mm",
    #     "type": "float"
    #   },
    #   "pickUpPresses": {
    #     "value": 3,
    #     "min": 0,
    #     "max": 10,
    #     "units": "presses",
    #     "type": "int"
    #   },
    #   "pickUpSpeed": {
    #     "value": 30,
    #     "min": 1,
    #     "max": 100,
    #     "units": "mm/s",
    #     "type": "float"
    #   },
    #   "modelOffset": [0.0, 0.0, 20.0],
    #   "nozzleOffset": [0.0, 0.0, 45.0],
    #   "ulPerMm": [
    #     {
    #       "aspirate": [
    #         [148.9157, 0.0213, 56.3986],
    #         [210.8237, 0.0108, 57.9568],
    #         [241.2405, 0.0025, 59.717],
    #         [365.2719, 0.0046, 59.2043],
    #         [614.4871, 0.0023, 60.0431],
    #         [1000.0, 0.001, 60.8209]
    #       ],
    #       "dispense": [[1000, 0, 61.3275]]
    #     }
    #   ],
    #   "plungerCurrent": {
    #     "value": 0.5,
    #     "min": 0.1,
    #     "max": 0.5,
    #     "units": "amps",
    #     "type": "float"
    #   },
    #   "dropTipCurrent": {
    #     "value": 0.7,
    #     "min": 0.1,
    #     "max": 0.8,
    #     "units": "amps",
    #     "type": "float"
    #   },
    #   "dropTipSpeed": {
    #     "value": 5,
    #     "min": 0.001,
    #     "max": 30,
    #     "units": "mm/sec",
    #     "type": "float"
    #   },
    #   "quirks": ["pickupTipShake", "dropTipShake"],
    #   "tipOverlap": {
    #     "default": 7.95,
    #     "opentrons/opentrons_96_tiprack_1000ul/1": 7.95,
    #     "opentrons/opentrons_96_filtertiprack_1000ul/1": 7.95,
    #     "opentrons/geb_96_tiprack_1000ul/1": 11.2,
    #     "opentrons/eppendorf_96_tiprack_1000ul_eptips/1": 0
    #   },
    #   "tipLength": {
    #     "value": 76.7,
    #     "units": "mm",
    #     "type": "float",
    #     "min": 0,
    #     "max": 100
    #   }
    # }

def _build_geometry_model(path_to_3d: str, model_configurations: Optional[Dict] = None) -> PipetteGeometryDefinition:
    if model_configurations:
        nozzle_offset = model_configurations["nozzleOffset"]
    else:
        nozzle_offset = input("Please provide the nozzle offset")
    return PipetteGeometryDefinition(nozzle_offset=nozzle_offset, path_to_3D=path_to_3d)

def _build_tip_handling_configurations(tip_handling_type: str, model_configurations: Optional[Dict] = None) -> TipHandlingConfigurations:
    presses = 0.0
    increment = 0.0
    distance = 0.0
    if tip_handling_type == "pickup" and model_configurations:
        current = model_configurations["pickUpCurrent"]["value"]
        speed = model_configurations["pickUpSpeed"]["value"]
        presses = model_configurations["pickUpPresses"]["value"]
        increment = model_configurations["pickUpIncrement"]["value"]
        distance = model_configurations["pickUpDistance"]["value"]
    elif tip_handling_type == "pickup":
        print("Handling pick up tip configurations\n")
        current = input("please provide the current")
        speed = input("please provide the speed")
        presses = input("please provide the number of presses for force pick up")
        increment = input("please provide the increment to move the pipette down for force pickup")
        distance = input("please provide the starting distance for pick up tip")
    elif tip_handling_type == "drop" and model_configurations:
        current = model_configurations["dropTipCurrent"]["value"]
        speed = model_configurations["dropTipSpeed"]["value"]
    elif tip_handling_type == "drop":
        print("Handling drop tip configurations\n")
        current = input("please provide the current")
        speed = input("please provide the speed")
    return TipHandlingConfigurations(
        current=current,
        speed=speed,
        presses=presses,
        increment=increment,
        distance=distance)

def _build_plunger_positions(model_configurations: Optional[Dict] = None) -> PlungerPositions:
    if model_configurations:
        top=model_configurations["top"]["value"]
        bottom=model_configurations["bottom"]["value"]
        blow_out=model_configurations["blowout"]["value"]
        drop_tip=model_configurations["dropTip"]["value"]
    else:
        print("Handling plunger motor positions\n")
        top=input("Please provide the top plunger position")
        bottom=input("Please provide the bottom plunger position")
        blow_out=input("Please provide the blow out plunger position")
        drop_tip=input("Please provide the drop tip plunger position")
    return PlungerPositions(top=top, bottom=bottom, blow_out=blow_out, drop_tip=drop_tip)


def _build_motor_configurations(model_configurations: Optional[Dict] = None) -> MotorConfigurations:
    if model_configurations:
        idle = model_configurations["idleCurrent"]
        run = model_configurations["plungerCurrent"]["value"]
    else:
        print("Handling default plunger motor currents\n")
        idle = input("Please provide the default idle current of the plunger motor")
        run = input("Please provide the default run current of the plunger motor")
    return MotorConfigurations(idle=idle, run=run)

def _build_partial_tip_configurations(channels: int) -> PartialTipDefinition:
    if channels == 8:
        return PartialTipDefinition(partial_tip_supported=True, available_configurations=[1, 2, 3, 4, 5, 6, 7, 8])
    elif channels == 96:
        return PartialTipDefinition(partial_tip_supported=True, available_configurations=[1, 8, 12, 96])
    else:
        return PartialTipDefinition(partial_tip_supported=False)

def _build_physical_model(pipette_type: str, model_configurations: Optional[Dict] = None, name_configurations: Optional[Dict] = None) -> PipettePhysicalPropertiesDefinition:
    if model_configurations and name_configurations:
        display_name = name_configurations["displayName"]

        display_category = name_configurations["displayCategory"]
        available_sensors = []
        channels = name_configurations["channels"]
    else:
        print(f"Handling general pipette information for {pipette_type}\n")
        display_name = input("please provide the product name of the pipette")

        display_category = input("please provide the model generation of the pipette")
        available_sensors = input("Please provide a list of available sensors")
        channels = input(f"Please provide the number of channels your {pipette_type} has")
    pick_up_tip_configurations = _build_tip_handling_configurations("pickup")
    drop_tip_configurations = _build_tip_handling_configurations("drop")
    plunger_positions = _build_plunger_positions(model_configurations)
    plunger_motor_configurations =_build_motor_configurations(model_configurations)
    partial_tip_configurations=_build_partial_tip_configurations(int(channels))
    return PipettePhysicalPropertiesDefinition(
        display_name=display_name,
        pipette_type=pipette_type,
        display_category=display_category,
        pick_up_tip_configurations=pick_up_tip_configurations,
        drop_tip_configurations=drop_tip_configurations,
        plunger_motor_configurations=plunger_motor_configurations,
        plunger_positions_configurations=plunger_positions,
        available_sensors=available_sensors,
        partial_tip_configurations=partial_tip_configurations,
        channels=channels,
        )

def _build_supported_tips(model_configurations: Optional[Dict] = None, name_configurations: Optional[Dict] = None) -> Dict[PipetteTipType, SupportedTipsDefinition]:

    if model_configurations and name_configurations:
        ul_per_mm = model_configurations["ulPerMm"][0]
        default_aspirate_flowrate = name_configurations["defaultAspirateFlowRate"]["value"]
        default_dispense_flowrate = name_configurations["defaultDispenseFlowRate"]["value"]
        default_blowout_flowrate = name_configurations["defaultBlowOutFlowRate"]["value"]
        tip_length = model_configurations["tipLength"]["value"]
        tip_overlap_dict = model_configurations["tipOverlap"]
        default_return_tip = model_configurations.get("returnTipHeight", None)

        tip_volumes = set()
        tip_overlap_tiprack_set = {}
        for tiprack, overlap in tip_overlap_dict.items():
            split_value = tiprack.split("ul")[0].split("_")
            if len(split_value) == 1:
                continue
            current_tip_volume = split_value[-1]
            tip_volumes.add(int(current_tip_volume))
            if tip_overlap_tiprack_set.get(current_tip_volume, None):
                tip_overlap_tiprack_set[int(current_tip_volume)][tiprack] = overlap
            else:
                tip_overlap_tiprack_set[int(current_tip_volume)] = {tiprack: overlap}
        # breakpoint()
        tips_dict = {
            PipetteTipType[volume]: {SupportedTipsDefinition(
                defaultAspirateFlowRate=default_aspirate_flowrate,
                defaultDispenseFlowRate=default_dispense_flowrate,
                defaultBlowOutFlowRate=default_blowout_flowrate,
                defaultTipLength=tip_length,
                defaultTipOverlap=tip_overlap_dict["default"],
                aspirate={tiprack: ul_per_mm["aspirate"] for tiprack in tip_overlap_tiprack_set},
                dispense={tiprack: ul_per_mm["dispense"] for tiprack in tip_overlap_tiprack_set},
                defaultTipOverlapDictionary=tip_overlap_tiprack_set[volume],
                defaultReturnTipHeight=default_return_tip)
            }
            for volume in tip_volumes
        }
    else:
        print("Building tip specific pipetting functionality")
        next_tip = True

        tips_dict = {}
        while next_tip:
            tip_volume = input("Please provide the next tip volume")
            default_aspirate_flowrate = input("Please provide the default aspirate flowrate")
            default_dispense_flowrate = input("Please provide the default dispense flowrate")
            default_blowout_flowrate = input("Please provide the default blowout flowrate")

            tip_length = input("Please provide the default tip length for this tip size")
            default_tip_overlap = input("Please provide the default tip overlap for this tip size")
            tips_dict = {
                PipetteTipType[tip_volume]: SupportedTipsDefinition(
                defaultAspirateFlowRate=default_aspirate_flowrate,
                default_dispense_flowrate=default_dispense_flowrate,
                default_blowout_flowrate=default_blowout_flowrate,
                defaultTipLength=tip_length,
                defaultTipOverlap=default_tip_overlap,
                aspirate={"default": [[]]},
                dispense={"default": [[]]})
            }
            cont = input("Additional tips? Please enter y/n")

            next_tip = cont == "y" or cont == "yes"
        print("Please review the aspirate and dispense functions once the pipette model is built.")
    return tips_dict

def _build_liquid_model(model_configurations: Optional[Dict] = None, name_configurations: Optional[Dict] = None, pipette_functions_path: Optional[Path] = None) -> PipetteLiquidPropertiesDefinition:
    if model_configurations and name_configurations:
        max_volume = name_configurations["maxVolume"]
        min_volume = name_configurations["minVolume"]
        default_tipracks = name_configurations["defaultTipracks"]
    else:
        max_volume = input("please provide the max volume of the pipette")
        min_volume = input("please provide the min volume of the pipette")
    supported_tips_dict = _build_supported_tips(model_configurations, name_configurations)
    return PipetteLiquidPropertiesDefinition(
        supported_tips=supported_tips_dict,
        max_volume=max_volume,
        min_volume=min_volume,
        default_tipracks=default_tipracks)

def save_to_file(
    directorypath: Path,
    file_name: str,
    data: BaseModel,
) -> None:
    """
    Function used to save data to a file

    :param filepath: path to save data at
    :param data: data to save
    :param encoder: if there is any specialized encoder needed.
    The default encoder is the date time encoder.
    """
    directorypath.mkdir(parents=True, exist_ok=True)
    filepath = directorypath / f"{file_name}.json"
    filepath.write_text(data.json(), encoding="utf-8")


def migrate_v1_to_v2() -> None:
    print("MIGRATING!")
    all_models = model_config()["config"]
    config_models_ot2 = [k for k in all_models.keys() if "v3" not in k]

    quirks_list = {}
    for model in config_models_ot2:
        base_name, full_version = model.split("_v")
        generation = "_gen2" if float(full_version) >= 2.0 else ""
        name = f"{base_name}{generation}"
        name_configurations = name_config()[name]
        model_configurations = all_models[model]

        liquid_model = _build_liquid_model(model_configurations, name_configurations)
        pipette_type = f"p{liquid_model.max_volume}"
        physical_model = _build_physical_model(model_configurations, name_configurations, pipette_type)

        quirks_list[model] = model_configurations["quirks"]
        split_version = full_version.split(".")
        file_name = f"{split_version[0]}_{split_version[1] if len(split_version) > 1 else 0}.json"
        current_pipette_path = physical_model.channels / liquid_model.max_volume

        path_to_3d = GEOMETRY_ROOT / current_pipette_path / "placeholder.gltf"
        geometry_model = _build_geometry_model(path_to_3d, model_configurations)


        save_to_file(GEOMETRY_ROOT / current_pipette_path, file_name, geometry_model)
        save_to_file(GENERAL_ROOT / current_pipette_path, file_name, physical_model)
        save_to_file(LIQUID_ROOT / current_pipette_path, file_name, liquid_model)

    for key, items in quirks_list.items():
        print(f"Quirks list for {key}: {items}")


def build_new_pipette_model_v2() -> None:
    """
    Build a brand new pipette model from user inputted data.
    """
    geometry_model = _build_geometry_model()
    liquid_model = _build_liquid_model()
    pipette_type = f"p{liquid_model.max_volume}"
    physical_model = _build_physical_model(pipette_type)

    major_version = input("please provide the major version of this pipette model")
    minor_version = input("please provide the minor version of this pipette model")

    file_name = f"{major_version}_{minor_version}.json"
    current_pipette_path = physical_model.channels / liquid_model.max_volume
    save_to_file(GEOMETRY_ROOT / current_pipette_path, file_name, geometry_model)
    save_to_file(GENERAL_ROOT / current_pipette_path, file_name, physical_model)
    save_to_file(LIQUID_ROOT / current_pipette_path, file_name, liquid_model)



def main() -> None:
    print("EXECUTING!")
    parser = argparse.ArgumentParser(
        description="96 channel tip handling testing script."
    )
    parser.add_argument(
        "--new_pipette_model",
        type=bool,
        help="If true, build a new pipette model from scratch",
        default=False,
    )


    args = parser.parse_args()
    if args.new_pipette_model:
        build_new_pipette_model_v2()
    else:
        migrate_v1_to_v2()


if __name__ == "__main__":
    print("file got called?")
    main()
