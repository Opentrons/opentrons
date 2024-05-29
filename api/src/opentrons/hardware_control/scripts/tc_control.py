from serial import Serial  # type: ignore[import-untyped]
import asyncio
import subprocess
from typing import Any

_READ_ALL = "readall"
_READ_LINE = "read"
_DONE = "done"
_MOVE_SEAL = "ms"
_MOVE_LID = "ml"

gcode_shortcuts = {
    "status": "M119",
    _MOVE_SEAL: "M241.D",  # move seal motor
    _MOVE_LID: "M240.D",  # move lid stepper motor
    "ol": "M126",  # open lid
    "cl": "M127",  # close lid
    "sw": "M901.D",  # status of all switches
    "lt": "M141.D",  # get lid temperature
    "pt": "M105.D",  # get plate temperature
}


async def message_read(dev: Serial) -> Any:
    response = dev.readline().decode()
    while not response:
        await asyncio.sleep(1)
        response = dev.readline().decode()
    return response


async def message_return(dev: Serial) -> Any:
    try:
        response = await asyncio.wait_for(message_read(dev), timeout=20)
        return response
    except asyncio.exceptions.TimeoutError:
        print("response timed out.")
        return ""


async def handle_gcode_shortcut(dev: Serial, command: str) -> None:
    # handle debugging commands that require followup
    if command == _MOVE_SEAL:
        distance = input("enter distance in steps => ")
        dev.write(
            f"{gcode_shortcuts[command]} {distance}\n".encode()
        )  # (+) -> retract, (-) -> engage
        print(await message_return(dev))
    elif command == _MOVE_LID:
        distance = input(
            "enter angular distance in degrees => "
        )  # (+) -> open, (-) -> close
        dev.write(f"{gcode_shortcuts[command]} {distance}\n".encode())
        print(await message_return(dev))
    # everything else
    else:
        dev.write(f"{gcode_shortcuts[command]}\n".encode())
        print(await message_return(dev))


async def comms_loop(dev: Serial) -> bool:
    _exit = False
    command = input("\n>>> ")
    if command == _READ_ALL:
        print(dev.readlines())
    elif command == _READ_LINE:
        print(dev.readline())
    elif command == _DONE:
        _exit = True
    elif command in gcode_shortcuts:
        await handle_gcode_shortcut(dev, command)
    else:
        try:
            dev.write(f"{command}\n".encode())
            print(await message_return(dev))
        except TypeError:
            print("Invalid input.")
    return _exit


async def _main() -> None:
    tc_name = (
        subprocess.check_output(["find", "/dev/", "-name", "*thermocycler*"])
        .decode()
        .strip()
    )
    if not tc_name:
        print("Thermocycler not found. Exiting.")
        return
    dev = Serial(f"{tc_name}", 9600, timeout=2)
    _exit = False
    while not _exit:
        _exit = await comms_loop(dev)


if __name__ == "__main__":
    asyncio.run(_main())
