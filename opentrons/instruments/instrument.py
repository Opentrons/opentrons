import copy
import json
import os
import sys

from opentrons.containers.calibrator import Calibrator
from opentrons.util.vector import (Vector, VectorEncoder)
from opentrons.util import environment
from opentrons.robot.command import Command
from opentrons import Robot

from opentrons.util.log import get_logger


JSON_ERROR = None
if sys.version_info > (3, 4):
    JSON_ERROR = ValueError
else:
    JSON_ERROR = json.decoder.JSONDecodeError


log = get_logger(__name__)


class Instrument(object):
    """
    This class represents instrument attached to the :any:`Robot`:
    :Pipette:, :Magbead:.

    It gives the instruments ability to CRUD their calibration data,
    and gives access to some common methods across instruments
    """

    calibration_data_version = 1

    calibration_key = "unique_name"
    persisted_attributes = []
    persisted_defaults = {}

    calibrator = Calibrator(Robot()._deck, {})

    def reset(self):
        """
        Placeholder for instruments to reset their state between runs
        """
        pass

    def setup_simulate(self, *args, **kwargs):
        """
        Placeholder for instruments to prepare their state for simulation
        """
        pass

    def teardown_simulate(self, *args, **kwargs):
        """
        Placeholder for instruments to reverse :meth:`setup_simulate`
        """
        pass

    def create_command(self, do, setup=None, description=None, enqueue=True):
        """
        Creates an instance of Command to be appended to the
        :any:`Robot` run queue.

        Parameters
        ----------
        do : callable
            The method to execute on the robot. This usually includes
            moving an instrument's motors, or the robot head

        setup : callable
            The method to execute just before `do()`, which includes
            updating the instrument's state

        description : str
            Human-readable description of the action taking place

        enqueue : bool
            If set to `True` (default), the method will be appended
            to the robots list of commands for executing during
            :any:`run` or :any:`simulate`. If set to `False`, the
            method will skip the command queue and execute immediately

        Examples
        --------
        ..
        >>> instrument = Instrument()
        >>> def setup():
        >>>     print('hello')
        >>> def do():
        >>>     print(' world')
        >>> description = 'printing "hello world"'
        >>> instrument.create_command(do, setup, description)
        hello
        >>> robot.simulate()
        hello world
        >>> instrument.create_command(do, setup, description, enqueue=False)
        hello world
        """

        command = Command(do=do, setup=setup, description=description)

        if enqueue:
            Robot().add_command(command)
        else:
            command()

    def init_calibrations(self, key, attributes=None):
        """
        Creates empty calibrations data if not already present

        Parameters
        ----------
        key : str
            The unique string to save this instrument's calibation data

        attributes : list
            A list of this instrument's attribute names to be saved
        """
        self.calibration_key = key
        if isinstance(attributes, list):
            self.persisted_attributes = attributes
            for key in attributes:
                self.persisted_defaults[key] = copy.copy(getattr(self, key))

        if not os.path.isfile(self._get_calibration_file_path()):
            self._write_blank_calibrations_file()

    def update_calibrations(self):
        """
        Saves the instrument's peristed attributes to file
        """
        last_persisted_data = self._read_calibrations()

        last_persisted_data['data'][self.calibration_key] = (
            self._strip_vector(
                self._build_calibration_data())
        )

        last_persisted_data = self._strip_vector(last_persisted_data)

        with open(self._get_calibration_file_path(), 'w') as f:
            f.write(json.dumps(last_persisted_data, indent=4))

    def load_persisted_data(self):
        """
        Loads and sets the instrument's peristed attributes from file
        """
        last_persisted_data = self._get_calibration()
        if last_persisted_data:
            last_persisted_data = self._restore_vector(last_persisted_data)
            for key, val in last_persisted_data.items():
                setattr(self, key, val)

    def delete_calibration_data(self):
        """
        Set the instrument's properties to their initialized values,
        and saves those initialized values to file
        """
        for key, val in self.persisted_defaults.items():
            setattr(self, key, val)
        self.update_calibrations()

    def _delete_calibration_file(self):
        """
        Deletes the entire calibrations file
        """
        file_path = self._get_calibration_file_path()
        if os.path.exists(file_path):
            os.remove(file_path)

    def _write_blank_calibrations_file(self):
        self._delete_calibration_file()
        with open(self._get_calibration_file_path(), 'w') as f:
            f.write(json.dumps({
                'version': self.calibration_data_version,
                'data': {}
            }))

    def _get_calibration_file_path(self):
        """
        :return: the absolute file path of the calibration file
        """
        return environment.get_path('CALIBRATIONS_FILE')

    def _get_calibration(self):
        """
        :return: this instrument's saved calibrations data
        """
        data = self._read_calibrations()['data']
        return data.get(self.calibration_key)

    def _build_calibration_data(self):
        """
        :return: copy of this instrument's persisted attributes
        """
        calibration = {}
        for attr in self.persisted_attributes:
            calibration[attr] = copy.copy(getattr(self, attr))
        return calibration

    def _read_calibrations(self):
        """
        Reads calibration data from file system.
        Expects a valid valibration format
        :return: json of calibration data
        """
        file_path = self._get_calibration_file_path()
        self._validate_calibration_file(file_path)
        loaded_json = ""
        with open(file_path) as f:
            loaded_json = json.load(f)

        return self._restore_vector(loaded_json)

    def _validate_calibration_file(self, file_path):
        """
        Read calibration file, and checks for version number
        If no version number, file is replaced with version number
        """
        valid = False
        with open(file_path) as f:
            try:
                file = json.load(f)
                version = file.get('version')
                data = file.get('data')
                if version and data and len(file.keys()) == 2:
                    valid = True
            except json.decoder.JSONDecodeError as e:
                log.error(
                    'Error parsing calibration data (file: {}): {}'.format(
                        file_path, e))

        if not valid:
            self._write_blank_calibrations_file()

    def _strip_vector(self, obj, root=True):
        """
        Iterates through a dictionary, converting Vector classes
        to serializable dictionaries
        :return: json of calibration data
        """
        obj = (copy.deepcopy(obj) if root else obj)
        for key, val in obj.items():
            if isinstance(val, Vector):
                res = json.dumps(val, cls=VectorEncoder)
                obj[key] = res
            elif isinstance(val, dict):
                self._strip_vector(val, root=False)

        return obj

    def _restore_vector(self, obj, root=True):
        """
        Iterates through a dictionary, converting serializable
        Vector dictionaries to Vector classes
        :return: json of calibration data
        """
        obj = (copy.deepcopy(obj) if root else obj)
        for key, val in obj.items():
            if isinstance(val, dict):
                self._restore_vector(val, root=False)
            elif isinstance(val, str):
                try:
                    res = Vector(json.loads(val))
                    obj[key] = res
                except JSON_ERROR:
                    pass
        return obj

    @property
    def robot(self):
        return Robot.get_instance()
