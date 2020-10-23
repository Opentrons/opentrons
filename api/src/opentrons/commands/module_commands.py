from opentrons.drivers import utils

from .helpers import make_command
from . import types as command_types


def magdeck_engage():
    text = "Engaging Magnetic Module"
    return make_command(
        name=command_types.MAGDECK_ENGAGE,
        payload={'text': text}
    )


def magdeck_disengage():
    text = "Disengaging Magnetic Module"
    return make_command(
        name=command_types.MAGDECK_DISENGAGE,
        payload={'text': text}
    )


def magdeck_calibrate():
    text = "Calibrating Magnetic Module"
    return make_command(
        name=command_types.MAGDECK_CALIBRATE,
        payload={'text': text}
    )


def tempdeck_set_temp(celsius):
    text = "Setting Temperature Module temperature " \
           "to {temp} °C (rounded off to nearest integer)".format(
            temp=round(float(celsius),
                       utils.TEMPDECK_GCODE_ROUNDING_PRECISION))
    return make_command(
        name=command_types.TEMPDECK_SET_TEMP,
        payload={
            'celsius': celsius,
            'text': text
        }
    )


def tempdeck_await_temp(celsius):
    text = "Waiting for Temperature Module to reach temperature " \
           "{temp} °C (rounded off to nearest integer)".format(
            temp=round(float(celsius),
                       utils.TEMPDECK_GCODE_ROUNDING_PRECISION))
    return make_command(
        name=command_types.TEMPDECK_AWAIT_TEMP,
        payload={
            'celsius': celsius,
            'text': text
        }
    )


def tempdeck_deactivate():
    text = "Deactivating Temperature Module"
    return make_command(
        name=command_types.TEMPDECK_DEACTIVATE,
        payload={'text': text}
    )


def thermocycler_open():
    text = "Opening Thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_OPEN,
        payload={'text': text}
    )


def thermocycler_set_block_temp(temperature,
                                hold_time_seconds,
                                hold_time_minutes):
    temp = round(float(temperature), utils.TC_GCODE_ROUNDING_PRECISION)
    text = f'Setting Thermocycler well block temperature to {temp} °C'
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
        text += ' with a hold time of '
        if clean_minutes > 0:
            text += f'{clean_minutes} minutes and '
        text += f'{clean_seconds} seconds'
    return make_command(
        name=command_types.THERMOCYCLER_SET_BLOCK_TEMP,
        payload={
            'temperature': temperature,
            'hold_time': total_seconds,
            'text': text
        }
    )


def thermocycler_execute_profile(steps, repetitions):
    text = f'Thermocycler starting {repetitions} repetitions' \
            ' of cycle composed of the following steps: {steps}'
    return make_command(
        name=command_types.THERMOCYCLER_EXECUTE_PROFILE,
        payload={
            'text': text,
            'steps': steps
        }
    )


def thermocycler_wait_for_hold():
    text = "Waiting for hold time duration"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_HOLD,
        payload={'text': text}
    )


def thermocycler_wait_for_temp():
    text = "Waiting for Thermocycler to reach target"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_TEMP,
        payload={'text': text}
    )


def thermocycler_set_lid_temperature(temperature):
    temp = round(float(temperature), utils.TC_GCODE_ROUNDING_PRECISION)
    text = f'Setting Thermocycler lid temperature to {temp} °C'
    return make_command(
        name=command_types.THERMOCYCLER_SET_LID_TEMP,
        payload={'text': text}
    )


def thermocycler_deactivate_lid():
    text = "Deactivating Thermocycler lid heating"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE_LID,
        payload={'text': text}
    )


def thermocycler_deactivate_block():
    text = "Deactivating Thermocycler well block heating"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE_BLOCK,
        payload={'text': text}
    )


def thermocycler_deactivate():
    text = "Deactivating Thermocycler"
    return make_command(
        name=command_types.THERMOCYCLER_DEACTIVATE,
        payload={'text': text}
    )


def thermocycler_wait_for_lid_temp():
    text = "Waiting for Thermocycler lid to reach target temperature"
    return make_command(
        name=command_types.THERMOCYCLER_WAIT_FOR_LID_TEMP,
        payload={'text': text}
    )


def thermocycler_close():
    text = "Closing Thermocycler lid"
    return make_command(
        name=command_types.THERMOCYCLER_CLOSE,
        payload={'text': text}
    )
