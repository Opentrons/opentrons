from datetime import timedelta

from . import types as command_types


def comment(msg: str) -> command_types.CommentCommand:
    text = msg
    return {
        'name': command_types.COMMENT,
        'payload': {'text': text}
    }


def delay(
        seconds: float,
        minutes: float,
        msg: str = None) -> command_types.DelayCommand:
    td = timedelta(minutes=minutes, seconds=seconds)
    minutes, seconds = divmod(td.seconds, 60)

    text = f"Delaying for {minutes} minutes and {seconds} seconds"
    if msg:
        text = f"{text}. {msg}"
    return {
        'name': command_types.DELAY,
        'payload': {
            'minutes': minutes,
            'seconds': seconds,
            'text': text
        }
    }


def pause(msg: str = None) -> command_types.PauseCommand:
    text = 'Pausing robot operation'
    if msg:
        text = text + ': {}'.format(msg)
    return {
        'name': command_types.PAUSE,
        'payload': {
            'text': text,
            'userMessage': msg,
        }
    }


def resume() -> command_types.ResumeCommand:
    return {
        'name': command_types.RESUME,
        'payload': {'text': 'Resuming robot operation'}
    }
