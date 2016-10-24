from pathlib import Path
import os
import sys

from opentrons_sdk.json_importer import JSONProtocolProcessor
from opentrons_sdk.robot import Robot


def get_frozen_root():
    """
    :return: Returns app path when app is packaged by pyInstaller
    """
    return sys._MEIPASS if getattr(sys, 'frozen', False) else None


def convert_byte_stream_str(stream):
    return ''.join([line.decode() for line in stream])


def load_json(json_byte_stream):
    json_str = convert_byte_stream_str(json_byte_stream)

    api_response = {'error': None, 'warnings': []}

    robot = Robot.get_instance()
    robot.reset()

    jpp = None
    try:
        jpp = JSONProtocolProcessor(json_str)
        jpp.process()
        robot.simulate()
    except Exception as e:
        api_response['error'] = str(e)
    api_response['warnings'] = robot.get_warnings()


    from pprint import pprint as pp
    pp([i.description for i in robot._commands])

    return api_response

