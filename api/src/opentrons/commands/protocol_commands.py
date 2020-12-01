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
    minutes, seconds = divmod(td.seconds, 60)

    text = f"Delaying for {minutes} minutes and {seconds} seconds"
    if msg:
        text = f"{text}. {msg}"
    return make_command(
        name=command_types.DELAY,
        payload={
            'minutes': minutes,
            'seconds': seconds,
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
