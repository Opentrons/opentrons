"""Constants for can bus.

This file is used as a source for code generation, which does not run in a venv
by default. Please do not unconditionally import things outside the python standard
library.
"""
from enum import Enum, unique


@unique
class NodeId(int, Enum):
    """Can bus arbitration id node id."""

    broadcast = 0x00
    host = 0x10
    pipette_left = 0x60
    pipette_right = 0x70
    gantry_x = 0x30
    gantry_y = 0x40
    head = 0x50
    head_l = 0x51
    head_r = 0x52
    pipette_left_bootloader = pipette_left | 0xF
    pipette_right_bootloader = pipette_right | 0xF
    gantry_x_bootloader = gantry_x | 0xF
    gantry_y_bootloader = gantry_y | 0xF
    head_bootloader = head | 0xF


@unique
class FunctionCode(int, Enum):
    """Can bus arbitration id function code."""

    network_management = 0x0
    sync = 0x1
    error = 0x2
    command = 0x3
    status = 0x4
    parameters = 0x5
    bootloader = 0x6
    heartbeat = 0x7


@unique
class MessageId(int, Enum):
    """Can bus arbitration id message id."""

    heartbeat_request = 0x3FF
    heartbeat_response = 0x3FE

    device_info_request = 0x302
    device_info_response = 0x303

    stop_request = 0x00

    get_status_request = 0x01
    get_status_response = 0x05

    enable_motor_request = 0x06
    disable_motor_request = 0x07

    move_request = 0x10

    setup_request = 0x02

    write_eeprom = 0x201
    read_eeprom_request = 0x202
    read_eeprom_response = 0x203

    add_move_request = 0x15
    get_move_group_request = 0x16
    get_move_group_response = 0x17
    execute_move_group_request = 0x18
    clear_all_move_groups_request = 0x19
    home_request = 0x20
    home_response = 0x21
    move_completed = 0x13

    set_motion_constraints = 0x101
    get_motion_constraints_request = 0x102
    get_motion_constraints_response = 0x103

    write_motor_driver_register_request = 0x30
    read_motor_driver_register_request = 0x31
    read_motor_driver_register_response = 0x32

    read_presence_sensing_voltage_request = 0x600
    read_presence_sensing_voltage_response = 0x601

    attached_tools_request = 0x700
    tools_detected_notification = 0x701

    fw_update_initiate = 0x60
    fw_update_data = 0x61
    fw_update_data_ack = 0x62
    fw_update_complete = 0x63
    fw_update_complete_ack = 0x64
    fw_update_status_request = 0x65
    fw_update_status_response = 0x66

    limit_sw_request = 0x08
    limit_sw_response = 0x09

    read_sensor_request = 0x82
    write_sensor_request = 0x83
    baseline_sensor_request = 0x84
    read_sensor_response = 0x85
    set_sensor_threshold_request = 0x86
    set_sensor_threshold_response = 0x87


@unique
class ErrorCode(int, Enum):
    """Common error codes."""

    ok = 0x00
    invalid_size = 0x01
    bad_checksum = 0x02
    invalid_byte_count = 0x03
    invalid_input = 0x04
    hardware = 0x05


@unique
class ToolType(int, Enum):
    """Tool types detected on Head."""

    undefined_tool = 0x00
    pipette_96_chan = 0x01
    pipette_384_chan = 0x02
    pipette_single_chan = 0x03
    pipette_multi_chan = 0x04
    gripper = 0x05
    nothing_attached = 0x06


@unique
class SensorType(int, Enum):
    """Sensor types available."""

    tip = 0x00
    capacitive = 0x01
    humidity = 0x02
    temperature = 0x03
