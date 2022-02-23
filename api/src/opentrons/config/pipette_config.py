from __future__ import annotations
from dataclasses import dataclass
import logging
import json
import numbers
from typing import Any, Dict, List, Mapping, Optional, Union, Tuple, Sequence, cast

from opentrons import config
from opentrons.config import feature_flags as ff
from opentrons_shared_data.pipette import model_config, name_config, fuse_specs
from opentrons_shared_data.pipette.dev_types import (
    PipetteName,
    PipetteModel,
    PipetteModelSpec,
    UlPerMm,
    Quirk,
    PipetteFusedSpec,
    LabwareUri,
)

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class PipetteConfig:
    top: float
    bottom: float
    blow_out: float
    drop_tip: float
    pick_up_current: float
    pick_up_distance: float
    pick_up_increment: float
    pick_up_presses: int
    pick_up_speed: float
    aspirate_flow_rate: float
    dispense_flow_rate: float
    channels: float
    nozzle_offset: Tuple[float, float, float]
    plunger_current: float
    drop_tip_current: float
    drop_tip_speed: float
    min_volume: float
    max_volume: float
    ul_per_mm: UlPerMm
    quirks: List[Quirk]
    tip_length: float  # TODO(seth): remove
    # TODO: Replace entirely with tip length calibration
    tip_overlap: Dict[str, float]
    display_name: str
    name: PipetteName
    back_compat_names: List[PipetteName]
    return_tip_height: float
    blow_out_flow_rate: float
    max_travel: float
    home_position: float
    steps_per_mm: float
    idle_current: float
    default_blow_out_flow_rates: Dict[str, float]
    default_aspirate_flow_rates: Dict[str, float]
    default_dispense_flow_rates: Dict[str, float]
    model: PipetteModel
    default_tipracks: List[LabwareUri]


# Notes:
# - multi-channel pipettes share the same dimensional offsets
# - single-channel pipettes have different lengths
# - Default number of seconds to aspirate/dispense a pipette's full volume,
#     and these times were chosen to mimic normal human-pipetting motions.
#     However, accurate speeds are dependent on environment (ex: liquid
#     viscosity), therefore a pipette's flow-rates (ul/sec) should be set by
#     protocol writer

# Multi-channel y offset caluclations:
DISTANCE_BETWEEN_NOZZLES = 9
NUM_MULTI_CHANNEL_NOZZLES = 8
MULTI_LENGTH = (NUM_MULTI_CHANNEL_NOZZLES - 1) * DISTANCE_BETWEEN_NOZZLES
Y_OFFSET_MULTI = MULTI_LENGTH / 2
Z_OFFSET_MULTI = -25.8

Z_OFFSET_P10 = -13  # longest single-channel pipette
Z_OFFSET_P50 = 0
Z_OFFSET_P300 = 0
Z_OFFSET_P1000 = 20  # shortest single-channel pipette

NOZZLE_OFFSET_DEFAULT = [0.0, 0.0, 0.0]

LOW_CURRENT_DEFAULT = 0.05

config_models = list(model_config()["config"].keys())
config_names = list(name_config().keys())
configs = model_config()["config"]
#: A list of pipette model names for which we have config entries
MUTABLE_CONFIGS = model_config()["mutableConfigs"]
#: A list of mutable configs for pipettes
VALID_QUIRKS = model_config()["validQuirks"]
#: A list of valid quirks for pipettes


def load(
    pipette_model: PipetteModel, pipette_id: Optional[str] = None
) -> PipetteConfig:
    """
    Load pipette config data


    This function loads from a combination of

    - the pipetteModelSpecs.json file in the wheel (should never be edited)
    - the pipetteNameSpecs.json file in the wheel (should never be edited)
    - any config overrides found in
      ``opentrons.config.CONFIG['pipette_config_overrides_dir']``

    This function reads from disk each time, so changes to the overrides
    will be picked up in subsequent calls.

    :param str pipette_model: The pipette model name (i.e. "p10_single_v1.3")
                              for which to load configuration
    :param pipette_id: An (optional) unique ID for the pipette to locate
                       config overrides. If the ID is not specified, the system
                       assumes this is a simulated pipette and does not
                       save settings. If the ID is specified but no overrides
                       corresponding to the ID are found, the system creates a
                       new overrides file for it.
    :type pipette_id: str or None
    :raises KeyError: if ``pipette_model`` is not in the top-level keys of
                      the pipetteModelSpecs.json file (and therefore not in
                      :py:attr:`configs`)

    :returns PipetteConfig: The configuration, loaded and checked
    """

    # Load the model config and update with the name config
    cfg = fuse_specs(pipette_model)

    # Load overrides if we have a pipette id
    if pipette_id:
        try:
            override = load_overrides(pipette_id)
            if "quirks" in override.keys():
                override["quirks"] = [
                    qname for qname, qval in override["quirks"].items() if qval
                ]
            for legacy_key in (
                "defaultAspirateFlowRate",
                "defaultDispenseFlowRate",
                "defaultBlowOutFlowRate",
            ):
                override.pop(legacy_key, None)

        except FileNotFoundError:
            save_overrides(pipette_id, {}, pipette_model)
            log.info(
                "Save defaults for pipette model {} and id {}".format(
                    pipette_model, pipette_id
                )
            )
        else:
            cfg.update(override)  # type: ignore

    # the ulPerMm functions are structured in pipetteModelSpecs.json as
    # a list sorted from oldest to newest. That means the latest functions
    # are always the last element and, as of right now, the older ones are
    # the first element (for models that only have one function, the first
    # and last elements are the same, which is fine). If we add more in the
    # future, we’ll have to change this code to select items more
    # intelligently
    if ff.use_old_aspiration_functions():
        log.debug("Using old aspiration functions")
        ul_per_mm = cfg["ulPerMm"][0]
    else:
        ul_per_mm = cfg["ulPerMm"][-1]

    smoothie_configs = cfg["smoothieConfigs"]
    res = PipetteConfig(
        top=ensure_value(cfg, "top", MUTABLE_CONFIGS),
        bottom=ensure_value(cfg, "bottom", MUTABLE_CONFIGS),
        blow_out=ensure_value(cfg, "blowout", MUTABLE_CONFIGS),
        drop_tip=ensure_value(cfg, "dropTip", MUTABLE_CONFIGS),
        pick_up_current=ensure_value(cfg, "pickUpCurrent", MUTABLE_CONFIGS),
        pick_up_distance=ensure_value(cfg, "pickUpDistance", MUTABLE_CONFIGS),
        pick_up_increment=ensure_value(cfg, "pickUpIncrement", MUTABLE_CONFIGS),
        pick_up_presses=ensure_value(cfg, "pickUpPresses", MUTABLE_CONFIGS),
        pick_up_speed=ensure_value(cfg, "pickUpSpeed", MUTABLE_CONFIGS),
        aspirate_flow_rate=cfg["defaultAspirateFlowRate"]["value"],
        dispense_flow_rate=cfg["defaultDispenseFlowRate"]["value"],
        channels=ensure_value(cfg, "channels", MUTABLE_CONFIGS),
        nozzle_offset=cfg.get("nozzleOffset", NOZZLE_OFFSET_DEFAULT),  # type: ignore
        plunger_current=ensure_value(cfg, "plungerCurrent", MUTABLE_CONFIGS),
        drop_tip_current=ensure_value(cfg, "dropTipCurrent", MUTABLE_CONFIGS),
        drop_tip_speed=ensure_value(cfg, "dropTipSpeed", MUTABLE_CONFIGS),
        min_volume=ensure_value(cfg, "minVolume", MUTABLE_CONFIGS),
        max_volume=ensure_value(cfg, "maxVolume", MUTABLE_CONFIGS),
        ul_per_mm=ul_per_mm,
        quirks=validate_quirks(ensure_value(cfg, "quirks", MUTABLE_CONFIGS)),
        tip_overlap=cfg["tipOverlap"],
        tip_length=ensure_value(cfg, "tipLength", MUTABLE_CONFIGS),
        display_name=ensure_value(cfg, "displayName", MUTABLE_CONFIGS),
        name=cfg["name"],
        back_compat_names=cfg.get("backCompatNames", []),
        return_tip_height=cfg.get("returnTipHeight", 0.5),
        blow_out_flow_rate=cfg["defaultBlowOutFlowRate"]["value"],
        max_travel=smoothie_configs["travelDistance"],
        home_position=smoothie_configs["homePosition"],
        steps_per_mm=smoothie_configs["stepsPerMM"],
        idle_current=cfg.get("idleCurrent", LOW_CURRENT_DEFAULT),
        default_blow_out_flow_rates=cfg["defaultBlowOutFlowRate"].get(
            "valuesByApiLevel", {"2.0": cfg["defaultBlowOutFlowRate"]["value"]}
        ),
        default_dispense_flow_rates=cfg["defaultDispenseFlowRate"].get(
            "valuesByApiLevel", {"2.0": cfg["defaultDispenseFlowRate"]["value"]}
        ),
        default_aspirate_flow_rates=cfg["defaultAspirateFlowRate"].get(
            "valuesByApiLevel", {"2.0": cfg["defaultAspirateFlowRate"]["value"]}
        ),
        model=pipette_model,
        default_tipracks=cfg["defaultTipracks"],
    )

    return res


def piecewise_volume_conversion(ul: float, sequence: List[List[float]]) -> float:
    """
    Takes a volume in microliters and a sequence representing a piecewise
    function for the slope and y-intercept of a ul/mm function, where each
    sub-list in the sequence contains:

      - the max volume for the piece of the function (minimum implied from the
        max of the previous item or 0
      - the slope of the segment
      - the y-intercept of the segment

    :return: the ul/mm value for the specified volume
    """
    # pick the first item from the seq for which the target is less than
    # the bracketing element
    for x in sequence:
        if ul <= x[0]:
            # use that element to calculate the movement distance in mm
            return x[1] * ul + x[2]

    # Compatibility with previous implementation of search.
    #  list(filter(lambda x: ul <= x[0], sequence))[0]
    raise IndexError()


TypeOverrides = Mapping[str, Union[float, bool, None]]


def validate_overrides(data: TypeOverrides, config_model: Dict[str, Any]) -> None:
    """
    Check that override fields are valid.

    :param data: a dict of field name to value
    :param config_model: the configuration for the chosen model
    :raises ValueError: If a value is invalid
    """
    for key, value in data.items():
        field_config = config_model.get(key)
        is_quirk = key in config_model["quirks"] and key in VALID_QUIRKS

        if is_quirk:
            # If it's a quirk it must be a bool or None
            if value is not None and not isinstance(value, bool):
                raise ValueError(f"{value} is invalid for {key}")
        elif not field_config:
            # If it's not a quirk we must have a field config
            raise ValueError(f"Unknown field {key}")
        elif value is not None:
            # If value is not None it must be numeric and between min and max
            if isinstance(value, bool) or not isinstance(value, numbers.Number):
                raise ValueError(f"{value} is invalid for {key}")
            elif value < field_config["min"] or value > field_config["max"]:
                raise ValueError(f"{key} out of range with {value}")


def override(pipette_id: str, fields: TypeOverrides) -> None:
    """
    Override configuration for pipette. Validate then save.

    :param pipette_id: The pipette id
    :param fields: Dict of field name to override value
    """
    config_match = list_mutable_configs(pipette_id)
    whole_config, model = load_config_dict(pipette_id)
    validate_overrides(data=fields, config_model=config_match)
    save_overrides(pipette_id, fields, model)


def save_overrides(
    pipette_id: str, overrides: TypeOverrides, model: PipetteModel
) -> None:
    """
    Save overrides for the pipette.

    :param pipette_id: The pipette id
    :param overrides: The incoming values
    :param model: The model of pipette
    :return: None
    """
    override_dir = config.CONFIG["pipette_config_overrides_dir"]
    model_configs = configs[model]
    model_configs_quirks = {key: True for key in model_configs["quirks"]}
    try:
        existing = load_overrides(pipette_id)
        # Add quirks setting for pipettes already with a pipette id file
        if "quirks" not in existing.keys():
            existing["quirks"] = model_configs_quirks
    except FileNotFoundError:
        existing = model_configs_quirks  # type: ignore

    for key, value in overrides.items():
        # If an existing override is saved as null from endpoint, remove from
        # overrides file
        if value is None:
            if existing.get(key):
                del existing[key]
        elif isinstance(value, bool):
            existing, model_configs = change_quirks(
                {key: value},
                existing,
                model_configs,
            )
        else:
            # type ignores are here because mypy needs typed dict accesses to
            # be string literals sadly enough
            model_config_value = model_configs[key]  # type: ignore
            if not model_config_value.get("default"):
                model_config_value["default"] = model_config_value["value"]
            model_config_value["value"] = value
            existing[key] = model_config_value
    assert model in config_models
    existing["model"] = model
    with (override_dir / f"{pipette_id}.json").open("w") as file:
        json.dump(existing, file)


def change_quirks(
    override_quirks: Dict[str, Any],
    existing: Dict[str, Any],
    model_configs: PipetteModelSpec,
) -> Tuple[Dict[str, Any], PipetteModelSpec]:
    if not existing.get("quirks"):
        # ensure quirk key exists
        existing["quirks"] = override_quirks
    for quirk, setting in override_quirks.items():
        # setting values again if above case true, but
        # meant for use-cases where we may only be given an update
        # for one setting
        existing["quirks"][quirk] = setting
        if setting not in model_configs["quirks"]:
            model_configs["quirks"].append(quirk)  # type: ignore[arg-type]
        elif not setting:
            model_configs["quirks"].remove(quirk)  # type: ignore[arg-type]
    return existing, model_configs


def load_overrides(pipette_id: str) -> Dict[str, Any]:
    overrides = config.CONFIG["pipette_config_overrides_dir"]
    try:
        with (overrides / f"{pipette_id}.json").open() as fi:
            return cast(Dict[str, Any], json.load(fi))
    except json.JSONDecodeError as e:
        log.warning(f"pipette override for {pipette_id} is corrupt: {e}")
        (overrides / f"{pipette_id}.json").unlink()
        raise FileNotFoundError(str(overrides / f"{pipette_id}.json"))


def validate_quirks(quirks: List[str]) -> List[Quirk]:
    valid_quirks: List[Quirk] = []
    for quirk in quirks:
        if quirk in VALID_QUIRKS:
            valid_quirks.append(Quirk(quirk))
        else:
            log.warning(f"{quirk} is not a valid quirk")
    return valid_quirks


def ensure_value(
    config: PipetteFusedSpec,
    name: Union[str, Tuple[str, ...]],
    mutable_config_list: List[str],
) -> Any:
    """
    Pull value of config data from file. Shape can either be a dictionary with
    a value key -- indicating that it can be changed -- or another
    data structure such as an array.
    """
    if not isinstance(name, tuple):
        path: Tuple[str, ...] = (name,)
    else:
        path = name
    for element in path[:-1]:
        config = config[element]  # type: ignore

    value = config[path[-1]]  # type: ignore
    if path[-1] != "quirks" and path[-1] in mutable_config_list:
        value = value["value"]
    return value


def known_pipettes() -> Sequence[str]:
    """List pipette IDs for which we have known overrides"""
    return [
        fi.stem
        for fi in config.CONFIG["pipette_config_overrides_dir"].iterdir()
        if fi.is_file() and ".json" in fi.suffixes
    ]


def add_default(cfg: Any) -> None:
    if isinstance(cfg, dict):
        if "value" in cfg.keys():
            cfg["default"] = cfg["value"]
        else:
            for top_level_key in cfg.keys():
                add_default(cfg[top_level_key])


def load_config_dict(pipette_id: str) -> Tuple["PipetteFusedSpec", "PipetteModel"]:
    """Give updated config with overrides for a pipette. This will add
    the default value for a mutable config before returning the modified
    config value.
    """
    override = load_overrides(pipette_id)
    model = override["model"]
    config = fuse_specs(model)

    if "quirks" not in override.keys():
        override["quirks"] = {key: True for key in config["quirks"]}
    else:
        # 20210210 AL - There have been bugs that allow settings invalid
        # quirks. Sanitize quirks by removing invalid ones that may have
        # been saved erroneously.
        override["quirks"] = {
            key: value
            for key, value in override["quirks"].items()
            if key in VALID_QUIRKS
        }

    for top_level_key in config.keys():
        if top_level_key != "quirks":
            add_default(config[top_level_key])  # type: ignore

    config.update(override)  # type: ignore

    return config, model


def list_mutable_configs(pipette_id: str) -> Dict[str, Any]:
    """
    Returns dict of mutable configs only.
    """
    cfg: Dict[str, Any] = {}

    try:
        config, model = load_config_dict(pipette_id)
    except FileNotFoundError:
        log.info(f"Pipette id {pipette_id} not found")
        return cfg

    for key in config:
        if key in MUTABLE_CONFIGS:
            cfg[key] = config[key]  # type: ignore
    return cfg
