"""Constants for can bus."""
from enum import Enum


class NodeId(int, Enum):
    """Can bus arbitration id node id."""

    broadcast = 0x00
    host = 0x10
    pipette = 0x20
    gantry_x = 0x30
    gantry_y = 0x40
    head = 0x50


class FunctionCode(int, Enum):
    """Can bus arbitration id function code."""

    network_management = 0x0
    sync = 0x2
    error = 0x4
    command = 0x10
    status = 0x12
    parameters = 0x14
    bootloader = 0x7C
    heartbeat = 0x7E


class MessageId(int, Enum):
    """Can bus arbitration id message id."""

    heartbeat_request = 0x3FFF
    heartbeat_response = 0x3FFE

    device_info_request = 0x3002
    device_info_response = 0x3003

    stop_request = 0x00

    get_status_request = 0x01
    get_status_response = 0x05

    enable_motor_request = 0x06
    disable_motor_request = 0x07

    move_request = 0x10

    setup_request = 0x02

    set_speed_request = 0x03

    get_speed_request = 0x04
    get_speed_response = 0x11
    write_eeprom = 0x2001
    read_eeprom_request = 0x2002
    read_eeprom_response = 0x2003

    add_move_request = 0x15
    get_move_group_request = 0x16
    get_move_group_response = 0x17
    execute_move_group_request = 0x18
    clear_move_group_request = 0x19
    move_group_completed = 0x1A
