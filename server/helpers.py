import json
import sys

from opentrons.json_importer import JSONProtocolProcessor
from opentrons.robot import Robot


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


def load_json(json_byte_stream):
    json_str = convert_byte_stream_to_str(json_byte_stream)

    api_response = {'error': None, 'warnings': []}

    robot = Robot.get_instance()
    robot.reset()

    jpp = None
    errors, warnings = [], []
    try:
        jpp = JSONProtocolProcessor(json_str)
        jpp.process()
        robot.simulate()
    except JSON_ERROR:
        errors.append('Cannot parse invalid JSON')
    except Exception as e:
        errors.append(str(e))

    if jpp:
        errors.extend(jpp.errors)
        warnings.extend(jpp.warnings)

    if robot.get_warnings():
        warnings.extend(robot.get_warnings())

    api_response['errors'] = errors
    api_response['warnings'] = warnings
    return api_response

