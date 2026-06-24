import asyncio
import subprocess
import sys
from typing import Any, Dict, Tuple

from serial import Serial  # type: ignore[import-untyped]

from opentrons.drivers.flex_stacker.types import GCODE as FS_GCODES
from opentrons.drivers.heater_shaker.driver import GCODE as HS_GCODES
from opentrons.drivers.mag_deck.driver import GCODE as MD_GCODES
from opentrons.drivers.temp_deck.driver import GCODE as TD_GCODES
from opentrons.drivers.thermocycler.driver import GCODE as TC_GCODES
from opentrons.drivers.vacuum_module.types import GCODE as VM_GCODES

COMMANDS = {
    "readall": lambda dev: dev.readlines().decode(),
    "read": lambda dev: dev.readline().decode(),
}

# the modules as they appear in /dev/ mapped to their respective GCODES
MODULE_NAMES = {
    "thermocycler": TC_GCODES,
    "vacuum": VM_GCODES,
    "heatershaker": HS_GCODES,
    "magdeck": MD_GCODES,
    "flexstacker": FS_GCODES,
    "tempdeck": TD_GCODES,
}

MODULE_NAME_INDEX = 0
SERIAL_OBJ_INDEX = 1


# returns format "GET_DEVICE_INFO" : "M115"
def get_commands_for_module(module_name: str) -> Dict[str, str]:
    # take the 'ot_module_' and the number off the ends of the name
    module_kind = module_name.split("_")[-1][:-1]
    module_gcodes = MODULE_NAMES[module_kind]
    return {_cmd.value: _cmd.name for _cmd in list(module_gcodes)}


async def _message_read(dev: Serial) -> Any:
    response = dev.readline().decode()
    while not response:
        await asyncio.sleep(1)
        response = dev.readline().decode()
    return response


async def message_return(dev: Serial) -> Any:
    try:
        response = await asyncio.wait_for(_message_read(dev), timeout=20)
        return response
    except asyncio.exceptions.TimeoutError:
        print("response timed out.")
        return ""


def _prompt_gcode_command(module_gcodes: Dict[str, str]) -> Dict[str, Any]:
    user_input_values = {
        'valid_module_and_command' : False,
        'prompt_gcode' : True,
        'command' : ''
    }
    
    print("enter gcode command:\n\t'0' to list commands\n\t'!' to go back")
    usr_input = input(">>> ").upper()
    print()
    prefix = usr_input.split()[0]
    if prefix == "0":
        for gcode, cmd_name in module_gcodes.items():
            print(f"{cmd_name} : {gcode}")
    elif prefix == "!":
        user_input_values["prompt_gcode"] = False
        #continue
    elif prefix in module_gcodes:
        user_input_values["valid_module_and_command"] = True
        user_input_values["prompt_gcode"] = False
        user_input_values["command"] = usr_input
    elif prefix == "QUIT":
        sys.exit(0)
    else:
        print("invalid gcode")
    return user_input_values


async def comms_loop(modules_dict: Dict[int, Tuple[str, Serial]]) -> None:
    # TODO : maybe also catch and handle typos
    # find a way to get the gcode arguments

    valid_module_and_command = False
    command = ""
    while not valid_module_and_command:
        # get the module to talk to
        print("modules:")
        for index, name_pair in modules_dict.items():
            # should be vacuum0 / flexstacker1 / etc.
            name = name_pair[MODULE_NAME_INDEX].split("_")[-1]
            print(f"\t{index} : {name}")
        which_mod = input("\n enter module >>> ")
        print()
        if which_mod == "quit":
            sys.exit(0)
        try:
            serial_line = modules_dict[int(which_mod)][SERIAL_OBJ_INDEX]
            module_name = modules_dict[int(which_mod)][MODULE_NAME_INDEX]
        except KeyError:
            print("Invalid module number.")
            continue

        module_gcodes = get_commands_for_module(module_name)

        prompt_gcode = True
        while prompt_gcode:
           gcode_input = _prompt_gcode_command(module_gcodes=module_gcodes)
           prompt_gcode = gcode_input['prompt_gcode']
           valid_module_and_command = gcode_input['valid_module_and_command']
           command = gcode_input['command']

    # send gcode to requested module
    try:
        assert isinstance(serial_line, Serial)
        serial_line.write(f"{command}\n".encode())
        print(await message_return(serial_line))
    except TypeError:
        print("Invalid input.")


async def main() -> None:
    subprocess_output = subprocess.run(
        ["find", "/dev/", "-name", "ot_module*"],
        capture_output=True,
        text=True
    ).stdout
    modules_found = subprocess_output.split()

    if not modules_found:
        print("No modules found. Exiting.")
        return

    modules_dict: Dict[int, Tuple[str, Serial]] = {}
    for module_index in range(len(modules_found)):
        module_name = modules_found[module_index]
        # {
        #   0 : (ot_module_vacuum0, <serial_obj>),
        #   1 : (ot_module_vacuum1, <serial_obj>),
        #   2 : (ot_module_thermocycler0, <serial_obj>),
        # }
        name_serial_obj = module_name, Serial(f"{module_name}", 9600, timeout=2)
        modules_dict[module_index] = name_serial_obj

    while True:
        await comms_loop(modules_dict)


if __name__ == "__main__":
    asyncio.run(main())
