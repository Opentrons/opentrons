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


def get_upload_proof_robot(robot):
    methods_to_stash = [
        'connect',
        'disconnect',
        'move_head',
        'move_plunger',
        'reset',
        'send_to_app'
    ]

    def mock(*args, **kwargs):
        pass

    stashed_methods = {}
    for method in methods_to_stash:
        stashed_methods[method] = getattr(robot, method)
        setattr(robot, method, mock)

    def restore():
        for method_name, method_obj in stashed_methods.items():
            setattr(robot, method_name, method_obj)
        return robot

    patched_robot = robot
    return (patched_robot, restore)


def load_python(robot, code: str) -> tuple:
    exception_msg = []
    commands = []
    try:
        robot.reset()
        exec(code, globals())
        commands = robot._commands
    except Exception:
        exception_msg = traceback.format_exc()
    return (commands, exception_msg)


def simulate_protocol(robot, code: str) -> tuple:
    """
    :param robot: robot instance for protocol
    :param code: str of protocol
    :return:
    """
    robot.set_connection('simulate')
    res = load_python(robot, code)
    robot.set_connection('live')
    return res


def timestamp(seconds: int):
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return "%d:%02d:%02d" % (hours, minutes, seconds)
