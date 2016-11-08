import copy
import json
import os
import sys

from opentrons.util.vector import (Vector, VectorEncoder)
from opentrons.robot.command import Command


JSON_ERROR = None
if sys.version_info > (3, 4):
    JSON_ERROR = ValueError
else:
    JSON_ERROR = json.decoder.JSONDecodeError


CALIBRATIONS_FOLDER = 'calibrations'
CALIBRATIONS_FILE = 'calibrations.json'


class Instrument(object):

    def __init__(self):
        self.name = None
        self.axis = None

        self.calibration_data = {}

        self.positions = {}
        self.max_volume = None

    def reset(self):
        pass

    def setup_simulate(self, mode='use_driver'):
        if mode == 'skip_driver':
            self.motor.simulate()
        elif mode == 'use_driver':
            self.motor.live()

    def teardown_simulate(self):
        self.motor.live()

    def create_command(self, do, setup=None, description=None, enqueue=True):

        command = Command(do=do, setup=setup, description=description)

        if enqueue:
            self.robot.add_command(command)
        else:
            command()

    def get_calibration_dir(self):
        DATA_DIR = os.environ.get('APP_DATA_DIR') or os.getcwd()
        return os.path.join(DATA_DIR, CALIBRATIONS_FOLDER)

    def get_calibration_file_path(self):
        return os.path.join(self.get_calibration_dir(), CALIBRATIONS_FILE)

    def init_calibrations(self):
        """
        Creates empty calibrations data if not already present. Idempotent
        :return:
        """
        if not os.path.isdir(self.get_calibration_dir()):
            os.mkdir(self.get_calibration_dir())

        file_path = self.get_calibration_file_path()
        if not os.path.isfile(file_path):
            with open(file_path, 'a') as f:
                f.write(json.dumps({}))

    def update_calibrations(self):
        last_persisted_data = self.read_calibrations()

        calibration_key = "{axis}:{instrument_name}".format(
            axis=self.axis,
            instrument_name=self.name
        )

        last_persisted_data[calibration_key] = (
            self.strip_vector(
                self.build_calibration_data())
        )

        last_persisted_data = self.strip_vector(last_persisted_data)

        with open(self.get_calibration_file_path(), 'w') as f:
            f.write(json.dumps(last_persisted_data, indent=4))

    def load_persisted_data(self):
        last_persisted_data = self.get_calibration()
        if last_persisted_data:
            last_persisted_data = self.restore_vector(last_persisted_data)
            for key, val in last_persisted_data.items():
                setattr(self, key, val)

    def get_calibration(self):
        return self.read_calibrations().get('{}:{}'.format(
            self.axis, self.name))

    def build_calibration_data(self):
        calibration = {}
        calibration['positions'] = copy.copy(self.positions)
        calibration['max_volume'] = self.max_volume
        calibration['calibration_data'] = self.calibration_data
        return calibration

    def delete_calibration_data(self):
        self.calibration_data = {}
        self.max_volume = self.min_volume + 1
        for key in self.positions.keys():
            self.positions[key] = None

        self.update_calibrations()

    def read_calibrations(self):
        """
        Reads calibration data from file system.
        :return: json of calibration data
        """
        with open(self.get_calibration_file_path()) as f:
            try:
                loaded_json = json.load(f)
            except json.decoder.JSONDecodeError:
                loaded_json = {}
            return self.restore_vector(loaded_json)

    def delete_calibrations(self):
        file_path = self.get_calibration_file_path()
        if os.path.exists(file_path):
            os.remove(file_path)

    def strip_vector(self, obj, root=True):
        obj = (copy.deepcopy(obj) if root else obj)
        for key, val in obj.items():
            if isinstance(val, Vector):
                res = json.dumps(val, cls=VectorEncoder)
                obj[key] = res
            elif isinstance(val, dict):
                self.strip_vector(val, root=False)

        return obj

    def restore_vector(self, obj, root=True):
        obj = (copy.deepcopy(obj) if root else obj)
        for key, val in obj.items():
            if isinstance(val, dict):
                self.restore_vector(val, root=False)
            elif isinstance(val, str):
                try:
                    res = Vector(json.loads(val))
                    obj[key] = res
                except JSON_ERROR:
                    pass
        return obj
