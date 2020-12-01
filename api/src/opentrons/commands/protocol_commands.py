from datetime import timedelta

from .helpers import make_command
from . import types as command_types


def comment(msg):
    text = msg
    return make_command(
        name=command_types.COMMENT,
        payload={
            'text': text
        }
    )


def delay(seconds, minutes, msg=None):
    td = timedelta(minutes=minutes, seconds=seconds)
    actual_min, whole_sec = divmod(td.seconds, 60)
    actual_sec = whole_sec + round(float(seconds) - int(seconds), 3)

    text = f"Delaying for {actual_min} minutes and {actual_sec} seconds"
    if msg:
        text = f"{text}. {msg}"
    return make_command(
        name=command_types.DELAY,
        payload={
            'minutes': actual_min,
            'seconds': actual_sec,
            'text': text
        }
    )


def pause(msg):
    text = 'Pausing robot operation'
    if msg:
        text = text + ': {}'.format(msg)
    return make_command(
        name=command_types.PAUSE,
        payload={
            'text': text,
            'userMessage': msg,
        }
    )


def resume():
    return make_command(
        name=command_types.RESUME,
        payload={
            'text': 'Resuming robot operation'
        }
    )
