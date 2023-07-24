"""Constants for binary format to rear-panel.

This file is used as a source for code generation, which does not run in a venv
by default. Please do not unconditionally import things outside the python standard
library.
"""
from enum import Enum, unique


@unique
class BinaryMessageId(int, Enum):
    """USB Binary message ID."""

    echo = 0x00
    ack = 0x01
    ack_failed = 0x02
    device_info_request = 0x03
    device_info_response = 0x04
    enter_bootloader_request = 0x05
    enter_bootloader_response = 0x06
    engage_estop = 0x07
    release_estop = 0x08
    engage_nsync_out = 0x09
    release_nsync_out = 0x0A
    estop_state_change = 0x0B
    estop_button_detection_change = 0x0C
    door_switch_state_request = 0x0D
    door_switch_state_info = 0x0E
    aux_present_detection_change = 0x0F
    aux_present_request = 0x10
    aux_id_request = 0x11
    aux_id_response = 0x12
    estop_button_present_request = 0x13
    estop_state_request = 0x14

    write_eeprom_request = 0x100
    read_eeprom_request = 0x101
    read_eeprom_response = 0x102

    # Light messages prefixed by 0x400
    # 0x40x = light strip
    add_light_action = 0x400
    clear_light_action_staging_queue = 0x401
    start_light_action = 0x402
    # 0x41x = deck light
    set_deck_light_request = 0x410
    get_deck_light_request = 0x411
    get_deck_light_response = 0x412


@unique
class LightTransitionType(int, Enum):
    """The types of transitons that the lights can perform."""

    linear = 0x00
    sinusoid = 0x01
    instant = 0x02


@unique
class LightAnimationType(int, Enum):
    """Whether an action is looping or runs one single time."""

    looping = 0x00
    single_shot = 0x01
