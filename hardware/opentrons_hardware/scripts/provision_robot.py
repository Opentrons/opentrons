r"""This script is able to read/write to/from the Flex EEPROM.

The script performs 'actions' on the robot eeprom denoted by the '--actions' arg
These actions are as followed

clear - Clears all the contents on the eeprom by writing it with 0xff.
print - Prints all of the properties on the eeprom
write - Writes at least one property to the eeprom

Examples:
    clear
        python3 -m opentrons_hardware.scripts.provision_robot --action clear

    print
        python3 -m opentrons_hardware.scripts.provision_robot --action print

    write
        The write action requires the --property arg to be passed in
        Each --property argument represents one property denoted by
        the PROPERTY_NAME and property_value
        Note that you can pass in more than one --property

        python3 -m opentrons_hardware.scripts.provision_robot --action write \
        --property SERIAL_NUMBER FLXA1020230602001 --property EXAMPLE value

Notes:
    The SERIAL_NUMBER format:
        We use the following format for the serial number.

        FLX - Flex
        A10 - Version A1.0
        2023 - Year
        06 - Month
        05 - Day
        001 - Unit number

        ex:
            FLXA1020230605001

    Changing I2c device:
        By default we perform actions on the 3-0050 i2c device but this can
        be changed by passing in the --bus and --address arguments like so

        python3 -m opentrons_hardware.scripts.provision_robot --bus 3 --address 0050 \
        --action print

    Overriding the FORMAT_VERSION:
        By default the format version is set to the value in ./eeprom/types.py file
        by the FORMAT_VERSION constant, this can be overriden by manually passing
        in the FORMAT_VERSION property. This should not be manually set at the factory
        as this is only meant to be used for testing.

        python3 -m opentrons_hardware.scripts.provision_robot --action write \
        --property FORMAT_VERSION 2
"""

import re
import argparse
import subprocess
import textwrap

from pathlib import Path
from typing import Dict, Tuple, List, Any, Optional

from opentrons_hardware.drivers.eeprom.build import build_eeprom_driver
from opentrons_hardware.drivers.eeprom import (
    EEPROMDriver,
    PropId,
    DEFAULT_BUS,
    DEFAULT_ADDRESS,
    DEFAULT_READ_SIZE,
    FORMAT_VERSION,
)

# Set of operations this script can perform
ACTIONS = ["clear", "write", "print"]

# Properties we dont want the user to set directly
INVALID = [PropId.INVALID]
# The properties we can operate on
PROPERTIES = [prop.name for prop in PropId if prop not in INVALID]

# serial number regex
SERIAL_REGEX = re.compile(r"FLX[\w]{1}[\d]{2}[\d]{8}[\d]{3}")

# the path to the serial number on the filesystem
SERIAL_NUMBER_FILE = "/var/serial"


def stop_robot_server(start: bool = False) -> None:
    """Start/Stop the robot-server process"""
    action = "restart" if start else "stop"
    message = "Starting" if start else "Stopping"
    print(f"{message} the robot-server")
    subprocess.run(["systemctl", action, "opentrons-robot-server"])


def clear_eeprom(eeprom_api: EEPROMDriver) -> Tuple[bool, str]:
    """Write the eeprom with all 0xff."""
    # This will clear the entire eeprom so confirm with the user
    if eeprom_api.properties:
        print("The eeprom is not empty!")
        print_eeprom(eeprom_api)
        if not _confirm_action("CLEAR EEPROM"):
            return False, "User Cancelled"

    print(f"Clearing the eeprom - {eeprom_api.address}")
    address = 0
    pages = eeprom_api.size // DEFAULT_READ_SIZE

    # set the write bit low
    eeprom_api._gpio.activate_eeprom_wp()

    # write
    data = b"\xff" * DEFAULT_READ_SIZE
    try:
        for idx in range(pages):
            eeprom_api._write(data, address)
            address += DEFAULT_READ_SIZE
        print("Cleared Successfully")
        # clear the serial number on the filesystem
        _write_serial_number("")
        return True, ""
    except (RuntimeError, TimeoutError) as e:
        return False, f"Make sure eeprom write bit is set low - {e}"
    finally:
        eeprom_api._gpio.deactivate_eeprom_wp()


def write_eeprom(
    eeprom_api: EEPROMDriver, properties: Dict[PropId, Any]
) -> Tuple[bool, str]:
    """Write properties to the eeprom, this will clear any data already stored."""
    if not properties:
        msg = (
            "Need at least one valid property and value to write.\n"
            "Pass in the '--help' arg for an example."
        )
        raise RuntimeError(msg)

    # clear the eeprom first
    success, msg = clear_eeprom(eeprom_api)
    if not success:
        msg = f"Error writing to eeprom: Could not clear eeprom - {msg}"
        raise RuntimeError(msg)

    # convert dict to set and write to eeprom
    print(f"Writing properties {properties}")
    eeprom_api.property_write(set(properties.items()))

    print("Verifying writen properties")
    success = True
    msg = ""
    # verify what was writen
    failed_to_write = []
    writen_props = [prop.id for prop in eeprom_api.property_read()]
    for prop, value in properties.items():
        if prop in writen_props:
            print(f"Write Sucess: {prop}")
            # if this is the serial number write it to the filesystem as well
            if prop == PropId.SERIAL_NUMBER:
                _write_serial_number(value)
        else:
            print(f"Write Failed: {prop}")
            failed_to_write.append(prop.name)

    # print the eeprom values
    print_eeprom(eeprom_api)

    if failed_to_write:
        success = False
        msg = str(failed_to_write)
    return success, msg


def print_eeprom(eeprom_api: EEPROMDriver) -> Tuple[bool, str]:
    """Print the properties currently on the eeprom"""
    print(f"Printing properties for {eeprom_api.address}")
    print("#" * 20)
    if not eeprom_api.properties:
        print("No properties found.")
    for prop in eeprom_api.properties:
        print(f"<Property: {prop.id.name}, value={prop.value}>")
    print("#" * 20)
    return True, ""


def _confirm_action(action: str) -> bool:
    """Gets confirmation from the user before performing action."""
    user_input = input(f"Are you sure you want to perform this action: {action}? y/n\n")
    return user_input == "y"


def _validate_robot_sn(serial_number: str) -> bool:
    return bool(re.match(SERIAL_REGEX, serial_number))


def _parse_property(prop_name: str, value: Any) -> Optional[Tuple[PropId, Any]]:
    """Verify the value"""
    if prop_name not in PROPERTIES:
        print(f"Invalid prop name: {prop_name}, must be one of {PROPERTIES}")
        return None

    # verify the value
    try:
        prop_id = PropId[prop_name]
        if prop_id == PropId.FORMAT_VERSION:
            value = int(value)
            confirm_msg = f"Override format version {FORMAT_VERSION}->{value}"
            if value != FORMAT_VERSION and not _confirm_action(confirm_msg):
                return None
        elif prop_id == PropId.SERIAL_NUMBER:
            if not _validate_robot_sn(value):
                print(f"Invalid serial number: {value}")
                return None
        else:
            return None
    except Exception as e:
        print(f"Error formatting {property} - {e}")
        return None
    return prop_id, value


def _format_properties(properties: List[List[Any]]) -> Dict[PropId, Any]:
    """Verifies that the value is valid for the given property."""
    formated_properties: Dict[PropId, Any] = dict()
    for property in properties:
        if len(property) != 2:
            print(f"Prop: {property} needs a prop and a value.")
            continue

        # verify the property
        prop_name, value = property
        print(f"Validating property {property}")
        parsed_property = _parse_property(prop_name, value)
        if not parsed_property:
            print(f"Error parsing property {property}")
            continue

        prop_id, prop_value = parsed_property
        formated_properties[prop_id] = prop_value

    # always add the FORMAT_VERSION property
    if formated_properties and not formated_properties.get(PropId.FORMAT_VERSION):
        formated_properties[PropId.FORMAT_VERSION] = FORMAT_VERSION
    return formated_properties


def _write_serial_number(serial_number: str, filepath: Optional[str] = None) -> None:
    """Writes the serial number to the rootfs."""
    filepath = filepath or SERIAL_NUMBER_FILE
    print(f"Writting {serial_number} to {filepath}")
    try:
        with open(filepath, "w") as fh:
            fh.write(serial_number)
    except Exception as e:
        raise RuntimeError(f"Unable to write serial {serial_number} - {e}")


def _get_property_from_barcode() -> Dict[PropId, Any]:
    robot_serial = input("scan robot serial number: ").strip()
    if not _validate_robot_sn(robot_serial):
        raise ValueError(f"invalid serial number: {robot_serial}")
    prompt = f"read serial '{robot_serial}', write to robot? (y/n): "
    if "y" not in input(prompt):
        raise ValueError(f"could not confirm serial: {robot_serial}")
    return {PropId.SERIAL_NUMBER: robot_serial}


def _main(args: argparse.Namespace, eeprom_api: EEPROMDriver) -> None:
    if eeprom_api.open() == -1:
        raise RuntimeError("Could not setup eeprom")

    # Check if we have properties passed in and convert them to PropId
    properties = _format_properties(args.property) if args.property else dict()

    # Add serial number from barcode
    if not properties:
        properties = _get_property_from_barcode()

    # The eeprom has been setup and is ready for action
    if args.action == "clear":
        success, msg = clear_eeprom(eeprom_api)
    elif args.action == "write":
        success, msg = write_eeprom(eeprom_api, properties)
    elif args.action == "print":
        success, msg = print_eeprom(eeprom_api)
    else:
        raise RuntimeError(f"Unknown action - {args.action}")

    if not success:
        raise RuntimeError(f"Error running action: {args.action} - {msg}")

    # do something here
    print(f"Finished action ({args.action})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=textwrap.dedent(__doc__),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--bus",
        type=int,
        default=DEFAULT_BUS,
        help="The bus i2c line this device is on.",
    )
    parser.add_argument(
        "--address",
        type=str,
        default=DEFAULT_ADDRESS,
        help="The i2c address of this device.",
    )
    parser.add_argument(
        "--action",
        choices=ACTIONS,
        default="write",
        help="What we want the script to do.",
    )
    parser.add_argument(
        "--property",
        nargs="+",
        action="append",
        help=f"The Prop and value we want to write, {PROPERTIES}",
    )
    args = parser.parse_args()
    stop_robot_server()
    eeprom_path = Path(f"/sys/bus/i2c/devices/{args.bus}-{args.address}/eeprom")
    eeprom_api = build_eeprom_driver(eeprom_path=eeprom_path)
    try:
        _main(args, eeprom_api)
    except Exception as e:
        print(e)
    finally:
        eeprom_api._gpio.deactivate_eeprom_wp()
        eeprom_api.close()
        print("Exiting.")
