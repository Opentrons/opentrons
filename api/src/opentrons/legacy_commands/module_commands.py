from typing import List
from math import trunc

from opentrons.drivers import utils
from opentrons.hardware_control.modules import ThermocyclerStep

from . import types as command_types


def magdeck_engage() -> command_types.MagdeckEngageCommand:
    text = "Engaging Magnetic Module"
    return {"name": command_types.MAGDECK_ENGAGE, "payload": {"text": text}}


def magdeck_disengage() -> command_types.MagdeckDisengageCommand:
    text = "Disengaging Magnetic Module"
    return {"name": command_types.MAGDECK_DISENGAGE, "payload": {"text": text}}


def magdeck_calibrate() -> command_types.MagdeckCalibrateCommand:
    text = "Calibrating Magnetic Module"
    return {"name": command_types.MAGDECK_CALIBRATE, "payload": {"text": text}}


def tempdeck_set_temp(celsius: float) -> command_types.TempdeckSetTempCommand:
    # TODO: SB 2022-06-03 Investigate if we should change this to match hs style below
    temp = round(float(celsius), utils.TEMPDECK_GCODE_ROUNDING_PRECISION)
    text = (
        f"Setting Temperature Module temperature "
        f"to {temp} °C (rounded off to nearest integer)"
    )
    return {
        "name": command_types.TEMPDECK_SET_TEMP,
        "payload": {"celsius": celsius, "text": text},
    }


def tempdeck_await_temp(celsius: float) -> command_types.TempdeckAwaitTempCommand:
    text = (
        "Waiting for Temperature Module to reach temperature "
        "{temp} °C (rounded off to nearest integer)".format(
            temp=round(float(celsius), utils.TEMPDECK_GCODE_ROUNDING_PRECISION)
        )
    )
    return {
        "name": command_types.TEMPDECK_AWAIT_TEMP,
        "payload": {"celsius": celsius, "text": text},
    }


def tempdeck_deactivate() -> command_types.TempdeckDeactivateCommand:
    text = "Deactivating Temperature Module"
    return {"name": command_types.TEMPDECK_DEACTIVATE, "payload": {"text": text}}


def thermocycler_open() -> command_types.ThermocyclerOpenCommand:
    text = "Opening Thermocycler lid"
    return {"name": command_types.THERMOCYCLER_OPEN, "payload": {"text": text}}


def thermocycler_set_block_temp(
    temperature: float, hold_time_seconds: float, hold_time_minutes: float
) -> command_types.ThermocyclerSetBlockTempCommand:
    temp = round(float(temperature), utils.TC_GCODE_ROUNDING_PRECISION)
    text = f"Setting Thermocycler well block temperature to {temp} °C"
    total_seconds = None
    # TODO: BC 2019-09-05 this time resolving logic is partially duplicated
    # in the thermocycler api class definition, with this command logger
    # implementation, there isn't a great way to avoid this, but it should
    # be consolidated as soon as an alternative to the publisher is settled on.
    if hold_time_seconds or hold_time_minutes:
        given_seconds = hold_time_seconds or 0
        given_minutes = hold_time_minutes or 0
        total_seconds = given_seconds + (given_minutes * 60)

        clean_seconds = total_seconds % 60
        clean_minutes = (total_seconds - clean_seconds) / 60
        text += " with a hold time of "
        if clean_minutes > 0:
            text += f"{clean_minutes} minutes and "
        text += f"{clean_seconds} seconds"
    return {
        "name": command_types.THERMOCYCLER_SET_BLOCK_TEMP,
        "payload": {
            "temperature": temperature,
            "hold_time": total_seconds,
            "text": text,
        },
    }


def thermocycler_execute_profile(
    steps: List[ThermocyclerStep], repetitions: int
) -> command_types.ThermocyclerExecuteProfileCommand:
    text = (
        f"Thermocycler starting {repetitions} repetitions"
        f" of cycle composed of the following steps: {steps}"
    )
    return {
        "name": command_types.THERMOCYCLER_EXECUTE_PROFILE,
        "payload": {"text": text, "steps": steps},
    }


def thermocycler_wait_for_hold() -> command_types.ThermocyclerWaitForHoldCommand:
    text = "Waiting for hold time duration"
    return {"name": command_types.THERMOCYCLER_WAIT_FOR_HOLD, "payload": {"text": text}}


def thermocycler_wait_for_temp() -> command_types.ThermocyclerWaitForTempCommand:
    text = "Waiting for Thermocycler to reach target"
    return {"name": command_types.THERMOCYCLER_WAIT_FOR_TEMP, "payload": {"text": text}}


def thermocycler_set_lid_temperature(
    temperature: float,
) -> command_types.ThermocyclerSetLidTempCommand:
    temp = round(float(temperature), utils.TC_GCODE_ROUNDING_PRECISION)
    text = f"Setting Thermocycler lid temperature to {temp} °C"
    return {"name": command_types.THERMOCYCLER_SET_LID_TEMP, "payload": {"text": text}}


def thermocycler_deactivate_lid() -> command_types.ThermocyclerDeactivateLidCommand:
    text = "Deactivating Thermocycler lid heating"
    return {
        "name": command_types.THERMOCYCLER_DEACTIVATE_LID,
        "payload": {"text": text},
    }


def thermocycler_deactivate_block() -> command_types.ThermocyclerDeactivateBlockCommand:
    text = "Deactivating Thermocycler well block heating"
    return {
        "name": command_types.THERMOCYCLER_DEACTIVATE_BLOCK,
        "payload": {"text": text},
    }


def thermocycler_deactivate() -> command_types.ThermocyclerDeactivateCommand:
    text = "Deactivating Thermocycler"
    return {"name": command_types.THERMOCYCLER_DEACTIVATE, "payload": {"text": text}}


def thermocycler_wait_for_lid_temp() -> command_types.ThermocyclerWaitForLidTempCommand:
    text = "Waiting for Thermocycler lid to reach target temperature"
    return {
        "name": command_types.THERMOCYCLER_WAIT_FOR_LID_TEMP,
        "payload": {"text": text},
    }


def thermocycler_close() -> command_types.ThermocyclerCloseCommand:
    text = "Closing Thermocycler lid"
    return {"name": command_types.THERMOCYCLER_CLOSE, "payload": {"text": text}}


def heater_shaker_set_target_temperature(
    celsius: float,
) -> command_types.HeaterShakerSetTargetTemperatureCommand:
    formatted_temp = trunc(celsius)
    text = f"Setting Target Temperature of Heater-Shaker to {formatted_temp} °C"
    return {
        "name": command_types.HEATER_SHAKER_SET_TARGET_TEMPERATURE,
        "payload": {"text": text},
    }


def heater_shaker_wait_for_temperature() -> command_types.HeaterShakerWaitForTemperatureCommand:
    text = "Waiting for Heater-Shaker to reach target temperature"
    return {
        "name": command_types.HEATER_SHAKER_WAIT_FOR_TEMPERATURE,
        "payload": {"text": text},
    }


def heater_shaker_set_and_wait_for_shake_speed(
    rpm: int,
) -> command_types.HeaterShakerSetAndWaitForShakeSpeedCommand:
    text = f"Setting Heater-Shaker to Shake at {rpm} RPM and waiting until reached"
    return {
        "name": command_types.HEATER_SHAKER_SET_AND_WAIT_FOR_SHAKE_SPEED,
        "payload": {"text": text},
    }


def heater_shaker_open_labware_latch() -> command_types.HeaterShakerOpenLabwareLatchCommand:
    text = "Unlatching labware on Heater-Shaker"
    return {
        "name": command_types.HEATER_SHAKER_OPEN_LABWARE_LATCH,
        "payload": {"text": text},
    }


def heater_shaker_close_labware_latch() -> command_types.HeaterShakerCloseLabwareLatchCommand:
    text = "Latching labware on Heater-Shaker"
    return {
        "name": command_types.HEATER_SHAKER_CLOSE_LABWARE_LATCH,
        "payload": {"text": text},
    }


def heater_shaker_deactivate_shaker() -> command_types.HeaterShakerDeactivateShakerCommand:
    text = "Deactivating Shaker"
    return {
        "name": command_types.HEATER_SHAKER_DEACTIVATE_SHAKER,
        "payload": {"text": text},
    }


def heater_shaker_deactivate_heater() -> command_types.HeaterShakerDeactivateHeaterCommand:
    text = "Deactivating Heater"
    return {
        "name": command_types.HEATER_SHAKER_DEACTIVATE_HEATER,
        "payload": {"text": text},
    }
