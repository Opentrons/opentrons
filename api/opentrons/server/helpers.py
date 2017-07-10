import json
import sys
import traceback


JSON_ERROR = None
if sys.version_info > (3, 4):
    JSON_ERROR = ValueError
else:
    JSON_ERROR = json.decoder.JSONDecodeError


def get_frozen_root():
    """
    :return: Returns app path when app is packaged by pyInstaller
    """
    return sys._MEIPASS if getattr(sys, 'frozen', False) else None


def convert_byte_stream_to_str(stream):
    return ''.join([line.decode() for line in stream])

def run_protocol(robot, code: str, mode='simulate') -> tuple:
    """
    :param robot: robot instance for protocol
    :param code: str of protocol
    :return:
    """
    robot.set_connection(mode)
    exception_msg = ''
    commands = []
    try:
        robot.reset()
        robot.app_run_mode = True
        exec(code, globals())
        commands = robot._commands
    except Exception:
        exception_msg = traceback.format_exc()
    finally:
        robot.app_run_mode = False
    robot.set_connection('live')
    return (commands, exception_msg)


def timestamp(seconds: int):
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return "%d:%02d:%02d" % (hours, minutes, seconds)
