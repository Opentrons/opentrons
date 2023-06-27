"""Factory for building the eeprom driver."""

from .eeprom import (
    EEPROMDriver,
    EEPROMData,
)

def build_eeprom_driver(filepath: Path = None) -> EEPROMDriver:
    """Create an instance of the eeprom driver"""
    driver: EEPROMDriver  = EEPROMDriver(filepath=filepath)
    driver.setup()
    return driver


@contextmanager
def eeprom_driver() -> Iterator[EEPROMDriver]:
    """Context manager creating an eeprom driver."""
    d = build_eeprom_driver()
    try:
        yield d
    finally:
        d.__exit__()

