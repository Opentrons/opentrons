from typing import Dict, Union, Optional

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.types import Mount, DeckSlotName
from opentrons.hardware_control.modules.types import (
    ModuleModel,
    MagneticModuleModel,
    TemperatureModuleModel,
    ThermocyclerModuleModel,
    HeaterShakerModuleModel,
)


def ensure_mount(mount: Union[str, Mount]) -> Mount:
    """Ensure that an input value represents a valid Mount."""
    if isinstance(mount, Mount):
        return mount

    if isinstance(mount, str):
        try:
            return Mount[mount.upper()]
        except KeyError as e:
            # TODO(mc, 2022-08-25): create specific exception type
            raise ValueError(
                "If mount is specified as a string, it must be 'left' or 'right';"
                f" instead, {mount} was given."
            ) from e

    # TODO(mc, 2022-08-25): create specific exception type
    raise TypeError(
        "Instrument mount should be 'left', 'right', or an opentrons.types.Mount;"
        f" instead, {mount} was given."
    )


def ensure_pipette_name(pipette_name: str) -> PipetteNameType:
    """Ensure that an input value represents a valid pipette name."""
    try:
        return PipetteNameType(pipette_name)
    except ValueError as e:
        raise ValueError(
            f"Cannot resolve {pipette_name} to pipette, must be given valid pipette name."
        ) from e


def ensure_deck_slot(deck_slot: Union[int, str]) -> DeckSlotName:
    """Ensure that a primitive value matches a named deck slot."""
    if not isinstance(deck_slot, (int, str)):
        raise TypeError(f"Deck slot must be a string or integer, but got {deck_slot}")

    try:
        return DeckSlotName(str(deck_slot))
    except ValueError as e:
        raise ValueError(f"'{deck_slot}' is not a valid deck slot") from e


_MODULE_ALIASES: Dict[str, ModuleModel] = {
    "magdeck": MagneticModuleModel.MAGNETIC_V1,
    "magnetic module": MagneticModuleModel.MAGNETIC_V1,
    "magnetic module gen2": MagneticModuleModel.MAGNETIC_V2,
    "tempdeck": TemperatureModuleModel.TEMPERATURE_V1,
    "temperature module": TemperatureModuleModel.TEMPERATURE_V1,
    "temperature module gen2": TemperatureModuleModel.TEMPERATURE_V2,
    "thermocycler": ThermocyclerModuleModel.THERMOCYCLER_V1,
    "thermocycler module": ThermocyclerModuleModel.THERMOCYCLER_V1,
    "thermocycler module gen2": ThermocyclerModuleModel.THERMOCYCLER_V2,
    # No alias for heater-shaker. Use heater-shaker model name for loading.
}

_MODULE_MODELS: Dict[str, ModuleModel] = {
    "magneticModuleV1": MagneticModuleModel.MAGNETIC_V1,
    "magneticModuleV2": MagneticModuleModel.MAGNETIC_V2,
    "temperatureModuleV1": TemperatureModuleModel.TEMPERATURE_V1,
    "temperatureModuleV2": TemperatureModuleModel.TEMPERATURE_V2,
    "thermocyclerModuleV1": ThermocyclerModuleModel.THERMOCYCLER_V1,
    "thermocyclerModuleV2": ThermocyclerModuleModel.THERMOCYCLER_V2,
    "heaterShakerModuleV1": HeaterShakerModuleModel.HEATER_SHAKER_V1,
}


def ensure_module_model(load_name: str) -> ModuleModel:
    """Ensure that a requested module load name matches a known module model."""
    if not isinstance(load_name, str):
        raise TypeError(f"Module load name must be a string, but got {load_name}")

    model = _MODULE_ALIASES.get(load_name.lower()) or _MODULE_MODELS.get(load_name)

    if model is None:
        valid_names = '", "'.join(_MODULE_ALIASES.keys())
        valid_models = '", "'.join(_MODULE_MODELS.keys())
        raise ValueError(
            f"{load_name} is not a valid module load name.\n"
            f'Valid names (ignoring case): "{valid_names}"\n'
            f'You may also use their exact models: "{valid_models}"'
        )

    return model


def ensure_hold_time_seconds(
    seconds: Optional[float], minutes: Optional[float]
) -> float:
    """Ensure that hold time is expressed in seconds."""
    if seconds is None:
        seconds = 0
    if minutes is not None:
        seconds += minutes * 60
    return seconds
