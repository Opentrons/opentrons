"""This script is able to read/write to the SOM EEPROM."""

import argparse
import subprocess

from opentrons_hardware.drivers.eeprom import (
    EEPROM,
    EEPROMData,
    PropId,
    DEFAULT_BUS,
    DEFAULT_ADDRESS,
)

def _stop_robot_server() -> None:
    subprocess.call(["systemctl"])



def _main(args: argparse.Namespace, eeprom_api: EEPROM) -> None:
    print("")
    print("Setting up EEPROM")
    # print(eeprom_api.name)
    # data = eeprom_api.serialize()
    # print(data)

    # print("read test")
    # data = eeprom_api._read()
    # print(data)

    # print("write test")
    # size = eeprom_api._write("something".encode("utf-8"), 0)
    # print(f"wrote bytes: {size}")

    # print("confirm write")
    # data = eeprom_api._read()
    # print(data)

    print("read property test")
    # write a valid property
    #size = eeprom_api._write(b"\x01\x01\x01\xfe\x07\x03STRING\x0d", 0)
    #print(f"wrote bytes: {size}")

    eeprom_api.setup()
    size = eeprom_api._write(
        b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602001" +
        b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602002" +
        b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602003" +
        b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602004" +
        b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602005",
        0,
    )

    eeprom_api.setup()
    print(f"wrote bytes: {size}")

    print(eeprom_api.data)

    # print("read specific properties test")
    # data = eeprom_api.property_read([PropId.FORMAT_VERSION, PropId.MACHINE_TYPE])
    # print(data)

    #print("write properties test")
    #eeprom_api.property_write(
    #    {(PropId.MACHINE_VERSION, "A02"), (PropId.FORMAT_VERSION, 2)}
    #)
    #data = eeprom_api.property_read()
    #print(data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Program to read/write from the SOM eeprom."
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
    args = parser.parse_args()
    try:
        eeprom_api = EEPROM(args.bus, args.address)
        _main(args, eeprom_api)
    except Exception as e:
        print(e)
        eeprom_api.close()
