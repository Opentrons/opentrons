"""Module Firmware update script."""
import argparse
import asyncio
from glob import glob
import os
import re
import subprocess
import sys
from typing import Dict, Final, List, Optional

from opentrons.drivers.rpi_drivers import usb
from opentrons.hardware_control.module_control import MODULE_PORT_REGEX
from opentrons.hardware_control import modules
from opentrons.hardware_control.modules.mod_abc import AbstractModule
from opentrons.hardware_control.modules.update import update_firmware
from opentrons.hardware_control.types import BoardRevision


# Constants for checking if module is back online
ONLINE_RETRIES = 3
DELAY_S = 5


MODULES: Final[Dict[str, str]] = {
    "temp-deck": "tempdeck",
    "mag-deck": "magdeck",
    "thermocycler": "thermocycler",
    "heater-shaker": "heatershaker",
    "absorbance-reader": "absorbancereader",
    "flex-stacker": "flexstacker",
}


def parse_version(filepath: str) -> str:
    """Parse the version string from the filename."""
    _, ext = os.path.splitext(os.path.basename(filepath))
    ext_pattern = re.escape(ext.lstrip("."))
    pattern = rf"@(v\d+(?:\.\d+)*)\.{ext_pattern}"
    match = re.search(pattern, os.path.basename(filepath))
    return match.group(1) if match else ""


def scan_connected_modules() -> List[modules.ModuleAtPort]:
    """Scan for connected modules and return list of
    tuples of serial ports and device names
    """
    discovered_modules = []
    devices = glob("/dev/ot_module*")
    for port in devices:
        symlink_port = port.split("dev/")[1]
        module_at_port = get_module_at_port(symlink_port)
        if module_at_port:
            discovered_modules.append(module_at_port)
    return discovered_modules


def get_module_at_port(port: str) -> Optional[modules.ModuleAtPort]:
    """Given a port, returns either a ModuleAtPort
    if it is a recognized module, or None if not recognized.
    """
    match = MODULE_PORT_REGEX.search(port)
    if match:
        name = match.group(1).lower()
        if name not in modules.MODULE_TYPE_BY_NAME:
            print(f"Unexpected module connected: {name} on {port}")
            return None
        return modules.ModuleAtPort(port=f"/dev/{port}", name=name)
    return None


async def build_module(
    mod: modules.ModuleAtPort, loop: asyncio.AbstractEventLoop
) -> Optional[AbstractModule]:
    try:
        # Get the device path and
        port = subprocess.check_output(["readlink", "-f", mod.port]).decode().strip()
        # remove the symlink for the device, so its freed by the robot-server
        print(f"Removing symlink {mod.port}")
        subprocess.check_call(["unlink", mod.port])
        # wwait some time to let the device teardown
        await asyncio.sleep(2)
        # create an instance of the module using the device path
        return await modules.build(
            port=port,
            usb_port=mod.usb_port,
            type=modules.MODULE_TYPE_BY_NAME[mod.name],
            simulating=False,
            hw_control_loop=loop,
        )
    except Exception:
        return None


async def teardown_module(module: AbstractModule) -> None:
    """Tearsdown the module so it can be used again by the robot-server.."""
    name = module.name()
    serial = module.device_info["serial"]
    port_name = module.usb_port.name
    command = f"echo '{port_name}' | tee /sys/bus/usb/drivers/usb"
    print(f"Removing module: {name} {serial}")
    try:
        # stop the poller and disconnect serial
        await module._poller.stop()  # type: ignore
        await module._driver.disconnect()  # type: ignore
        # unbind the device from usb and re-bind to simulate unplug
        subprocess.run(f"{command}/unbind", shell=True, capture_output=True)
        await asyncio.sleep(2)
        subprocess.run(f"{command}/bind", shell=True, capture_output=True)
    except Exception:
        pass


def enable_udev_rules(enable: bool) -> None:
    """Enable/Disable creation of opentrons modules by the hardware controller.

    This is done so the module is not automatically picked up by the server
    while we are updating it.
    """
    rule = "95-opentrons-modules.rules"
    original = f"/etc/udev/rules.d/{rule}"
    destination = f"/var/lib/{rule}"
    src = original if not enable else destination
    dst = destination if not enable else original
    msg = "Disabl" if not enable else "Enabl"
    if not os.path.exists(src):
        sys.exit(f"ERROR: Rule file not found: {src}")

    try:
        print(f"{msg}ing udev: Moving rule {src} -> {dst}")
        subprocess.check_call(["mount", "-o", "remount,rw", "/"])
        subprocess.check_call(["mv", src, dst])
    except Exception as e:
        sys.exit(
            f"ERROR: Could not {msg}e udev rule: {rule}\n{e}",
        )
    finally:
        subprocess.check_call(["mount", "-o", "remount,ro", "/"])
        subprocess.check_call(["udevadm", "control", "--reload-rules"])


def check_dev_exist(port: str) -> bool:
    """True if the device with the given port exists in /dev."""
    try:
        return subprocess.run(["ls", port], capture_output=True).returncode == 0
    except Exception:
        return False


async def main(args: argparse.Namespace) -> None:  # noqa: C901
    """Entry point for script."""
    mod_name = MODULES[args.module]
    target_version = parse_version(args.file)
    if not os.path.exists(args.file):
        sys.exit(f"Invalid filepath: {args.file}")
    if not target_version:
        sys.exit(f"Target version could not be parsed from file: {args.file}")

    print("Setting up...")
    loop = asyncio.get_running_loop()
    usb_bus = usb.USBBus(BoardRevision.FLEX_B2)  # todo: get this from the robot
    print(f"Searching for {mod_name} modules in /dev/")
    mods = scan_connected_modules()
    mods = usb_bus.match_virtual_ports(mods)  # type: ignore
    if not mods:
        print("No modules found")
        return

    # Disable udev rules so modules aren't re-created by the server when they update
    teardown_modules: List[AbstractModule] = []
    enable_udev_rules(False)
    print("\n------------------------------------------")
    for mod in mods:
        if mod_name not in mod.name:
            continue

        # Create an instance of the opentrons module
        print(f"Found mod: {mod.name} at {mod.port}")
        module = await build_module(mod, loop)
        if module is None:
            continue

        name = module.name()
        version = module.device_info["version"]
        serial = module.device_info["serial"]
        model = module.device_info["model"]
        teardown_modules.append(module)
        print(f"Created module: {module.name()} {model} {serial} {version}")

        # Check that the update file is for this module
        file_prefix = module.firmware_prefix()
        if file_prefix not in args.file:
            print(f"ERROR: Target module does not match file: {mod_name} {args.file}")
            continue

        # Check if the module is one we care about
        if args.serial and serial not in args.serial:
            continue

        # Check if the module needs an update
        if version == target_version and not args.force:
            print(f"Module {name} {serial} is up-to-date.")
            continue

        print(f"Updating {name} {model} {serial}: {version} -> {target_version}")
        await update_firmware(module, args.file)

        # wait for the device to come online
        for retry in range(ONLINE_RETRIES):
            if retry >= ONLINE_RETRIES:
                print(f"Module {serial} failed to come back online.")
                break

            print(f"Checking if {name} at {module.port} is online...")
            await asyncio.sleep(DELAY_S)
            if not check_dev_exist(module.port):
                print("Not online")
                continue

            # re-open serial connection
            if not await module._driver.is_connected():  # type: ignore
                await module._driver.connect()  # type: ignore

            # refresh the device info
            print(f"Device {module.port} is back online, refreshing device info.")
            device_info = (await module._driver.get_device_info()).to_dict()  # type: ignore
            success = device_info["version"] == target_version
            msg = "updated successfully!" if success else "failed to update"
            print(f"Device {name} {serial} {msg}")
            break

    print("------------------------------------------\n")
    print("Tearing down")
    # Enable udev rules and teardown the module so they can be pick-up by the robot-server
    enable_udev_rules(True)
    for module in teardown_modules:
        await teardown_module(module)
    print("Done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Module FW Update.")
    parser.add_argument(
        "--module",
        help="The module target to be updated.",
        type=str,
        required=True,
        choices=MODULES.keys(),
    )
    parser.add_argument(
        "--file",
        help="""Path to binary file containing the FW executable"""
        """Must have format `module-name@vx.x.x.bin/hex`, ex, flex-stacker@v0.0.1.bin""",
        type=str,
        required=True,
    )
    parser.add_argument(
        "--serial",
        help="The specific serial numbers of the devices to update.",
        type=str,
        nargs="+",
    )
    parser.add_argument(
        "--force",
        help="Force install the update, even if the versions are the same.",
        action="store_true",
        default=False,
    )
    args = parser.parse_args()
    try:
        asyncio.run(main(args))
    except Exception as e:
        print("ERROR: Unhandled Exception: ", e)
        # Re-enable udev rules
        enable_udev_rules(True)
