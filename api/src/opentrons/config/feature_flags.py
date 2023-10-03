from opentrons.config import advanced_settings as advs
from opentrons_shared_data.robot.dev_types import RobotTypeEnum
from opentrons_shared_data.robot.dev_types import RobotType


def short_fixed_trash() -> bool:
    return advs.get_setting_with_env_overload("shortFixedTrash", RobotTypeEnum.OT2)


def dots_deck_type() -> bool:
    return advs.get_setting_with_env_overload("deckCalibrationDots", RobotTypeEnum.OT2)


def disable_home_on_boot() -> bool:
    return advs.get_setting_with_env_overload("disableHomeOnBoot", RobotTypeEnum.OT2)


def use_old_aspiration_functions() -> bool:
    return advs.get_setting_with_env_overload(
        "useOldAspirationFunctions", RobotTypeEnum.OT2
    )


def enable_door_safety_switch(robot_type: RobotType) -> bool:
    if robot_type == "OT-2 Standard":
        return advs.get_setting_with_env_overload(
            "enableDoorSafetySwitch", RobotTypeEnum.OT2
        )
    elif robot_type == "OT-3 Standard":
        return advs.get_setting_with_env_overload(
            "enableDoorSafetySwitch", RobotTypeEnum.FLEX
        )
    else:
        raise KeyError("Invalid Robot Type during Door Saftey switch check")


def disable_fast_protocol_upload() -> bool:
    return advs.get_setting_with_env_overload(
        "disableFastProtocolUpload", RobotTypeEnum.FLEX
    )


def enable_ot3_hardware_controller() -> bool:
    """Get whether to use the OT-3 hardware controller."""

    return advs.get_setting_with_env_overload(
        "enableOT3HardwareController", RobotTypeEnum.FLEX
    )


def rear_panel_integration() -> bool:
    """Whether to enable usb connected rear_panel for the OT-3."""

    return advs.get_setting_with_env_overload(
        "rearPanelIntegration", RobotTypeEnum.FLEX
    )


def stall_detection_enabled() -> bool:
    return not advs.get_setting_with_env_overload(
        "disableStallDetection", RobotTypeEnum.FLEX
    )


def overpressure_detection_enabled() -> bool:
    return not advs.get_setting_with_env_overload(
        "disableOverpressureDetection", RobotTypeEnum.FLEX
    )


def status_bar_enabled() -> bool:
    """Whether the status bar is enabled."""
    return not advs.get_setting_with_env_overload(
        "disableStatusBar", RobotTypeEnum.FLEX
    )


def tip_presence_detection_enabled() -> bool:
    """Whether tip presence is enabled on the Flex"""
    return not advs.get_setting_with_env_overload(
        "disableTipPresenceDetection", RobotTypeEnum.FLEX
    )


def require_estop() -> bool:
    """Whether the OT3 should allow gantry movements with no Estop plugged in."""
    return not advs.get_setting_with_env_overload(
        "estopNotRequired", RobotTypeEnum.FLEX
    )
