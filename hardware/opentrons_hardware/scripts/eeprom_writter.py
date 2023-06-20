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
    print("Setting up EEPROM")
    eeprom_api.setup()
    # print("read test")
    # data = eeprom_api._read()
    # print(data)

    # print("write test")
    # size = eeprom_api._write("something".encode("utf-8"), 0)
    # print(f"wrote bytes: {size}")

    # print("confirm write")
    # data = eeprom_api._read()
    # print(data)

    # size = eeprom_api._write(
    #    b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602001" +
    #    b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602002" +
    #    b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602003" +
    #    b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602004" +
    #    b"\x01\x01\x01\x04\x06STRING\x02\x11FLXA1020230602005",
    #    0,
    # )

    print(eeprom_api.data)
    # print("read specific properties test")
    # data = eeprom_api.property_read([PropId.FORMAT_VERSION, PropId.MACHINE_TYPE])
    # print(data)

    print("write properties test")
    written = eeprom_api.property_write(
        {(PropId.SERIAL_NUMBER, "FLXA1020230602006"), (PropId.FORMAT_VERSION, 2)}
    )
    print(f"wrote: {written}")
    data = eeprom_api.property_read()
    print(data)

    print("long write property test")
    written = eeprom_api.property_write(
        {
            (
                PropId.SERIAL_NUMBER,
                "FLXA1020230602006AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            ),
            (PropId.FORMAT_VERSION, 2),
        }
    )

    print("too long property write test")
    written = eeprom_api.property_write(
        {
            (
                PropId.SERIAL_NUMBER,
                "FLXA1020230602006AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            ),
            (PropId.FORMAT_VERSION, 2),
        }
    )
    assert len(written) == 0


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
