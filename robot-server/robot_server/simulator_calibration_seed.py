r"""Seed fake calibration data for OT-3 hardware simulators.

Dev simulators attach instruments with default (uncalibrated) offsets. The desktop
app requires calibratedOffset.last_modified and moduleOffset.last_modified before
LPC can proceed. This module writes zero-offset user calibrations for every
instrument and module declared in a simulator configuration file.

Robot-server auto-seeds on startup when `simulator_configuration_file_path` is set.
To seed manually:

    uv run python -m robot_server.simulator_calibration_seed \\
        simulators/test-flex-vm-combos.json
"""

import argparse
import logging
from pathlib import Path

from opentrons.calibration_storage.ot3 import (
    save_module_calibration,
    save_pipette_calibration,
)
from opentrons.calibration_storage.ot3.gripper_offset import save_gripper_calibration
from opentrons.hardware_control.modules.types import ModuleType
from opentrons.hardware_control.simulator_setup import (
    OT3SimulatorSetup,
    load_simulator_setup,
)
from opentrons.hardware_control.types import OT3Mount
from opentrons.types import Point

log = logging.getLogger(__name__)

# Keys match simulator JSON `attached_modules` entries and SimulatingModule.name().
_MODULE_KEY_TO_TYPE: dict[str, ModuleType] = {
    "thermocycler": ModuleType.THERMOCYCLER,
    "tempdeck": ModuleType.TEMPERATURE,
    "heatershaker": ModuleType.HEATER_SHAKER,
    "magdeck": ModuleType.MAGNETIC,
    "flexstacker": ModuleType.FLEX_STACKER,
    "vacuummodule": ModuleType.VACUUM_MODULE,
}

_DEFAULT_MODULE_SLOT = "B1"
_DEFAULT_MODULE_MOUNT = OT3Mount.LEFT


def _get_calibration_instrument_id(setup: OT3SimulatorSetup) -> str:
    for mount, instrument in setup.attached_instruments.items():
        if mount != OT3Mount.GRIPPER:
            instrument_id = instrument.get("id")
            if instrument_id is not None:
                return instrument_id
    return "simulator-calibration-instrument"


def seed_simulator_calibration(simulator_config_path: Path) -> None:
    """Write fake calibration files for a simulator configuration."""
    setup = load_simulator_setup(simulator_config_path)
    if not isinstance(setup, OT3SimulatorSetup):
        log.info(
            "Skipping simulator calibration seed for non-OT-3 machine: %s",
            setup.machine,
        )
        return

    zero_offset = Point(0, 0, 0)
    calibration_instrument_id = _get_calibration_instrument_id(setup)

    for mount, instrument in setup.attached_instruments.items():
        instrument_id = instrument.get("id")
        if instrument_id is None:
            continue
        if mount == OT3Mount.GRIPPER:
            save_gripper_calibration(zero_offset, instrument_id)
            log.info("Seeded gripper calibration for %s", instrument_id)
        else:
            save_pipette_calibration(zero_offset, instrument_id, mount.to_mount())
            log.info(
                "Seeded pipette calibration for %s on %s",
                instrument_id,
                mount.name,
            )

    for module_key, modules in setup.attached_modules.items():
        module_type = _MODULE_KEY_TO_TYPE.get(module_key)
        if module_type is None:
            log.warning(
                "Skipping module calibration seed for unknown module key: %s",
                module_key,
            )
            continue
        for module in modules:
            save_module_calibration(
                zero_offset,
                _DEFAULT_MODULE_MOUNT,
                _DEFAULT_MODULE_SLOT,
                module_type,
                module.serial_number,
                calibration_instrument_id,
            )
            log.info(
                "Seeded module calibration for %s (%s)",
                module.serial_number,
                module_key,
            )


def main() -> int:
    """Parse arguments and seed simulator calibration data."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "simulator_config",
        type=Path,
        help="Path to simulator JSON configuration file",
    )
    args = parser.parse_args()
    if not args.simulator_config.is_file():
        log.error("Simulator config not found: %s", args.simulator_config)
        return 1
    seed_simulator_calibration(args.simulator_config)
    log.info("Seeded calibration data for %s", args.simulator_config)
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    raise SystemExit(main())
