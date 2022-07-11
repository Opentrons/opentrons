from opentrons.config import advanced_settings as advs


def short_fixed_trash() -> bool:
    return advs.get_setting_with_env_overload("shortFixedTrash")


def dots_deck_type() -> bool:
    return advs.get_setting_with_env_overload("deckCalibrationDots")


def disable_home_on_boot() -> bool:
    return advs.get_setting_with_env_overload("disableHomeOnBoot")


def use_old_aspiration_functions() -> bool:
    return advs.get_setting_with_env_overload("useOldAspirationFunctions")


def enable_door_safety_switch() -> bool:
    return advs.get_setting_with_env_overload("enableDoorSafetySwitch")


def disable_fast_protocol_upload() -> bool:
    return advs.get_setting_with_env_overload("disableFastProtocolUpload")


def enable_ot3_hardware_controller() -> bool:
    """Get whether to use the ot3 hardware controller."""

    return advs.get_setting_with_env_overload("enableOT3HardwareController")


def enable_heater_shaker_python_api() -> bool:
    """Get whether to use the Heater-Shaker python API."""
    return advs.get_setting_with_env_overload("enableHeaterShakerPAPI")
