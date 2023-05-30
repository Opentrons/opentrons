"""This script is able to read/write to the SOM EEPROM."""

import argparse

from opentrons_hardware.drivers.eeprom import (
    EEPROM,
    EEPROMData,
)


def _main(args: argparse.Namespace, eeprom_api: EEPROM) -> None:
    data = eeprom_api.serialize()
    print(data)
    


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Program to read/write from the SOM eeprom."
    )
    parser.add_argument(
        "--eeprom_path", type=str, help="The path of the eeprom if not given."
    )
    args = parser.parse_args()
    try:
        eeprom_api = EEPROM(args.eeprom_path)
        _main(args, eeprom_api)
    except Exception as e:
        print(e)
        eeprom_api.close()
