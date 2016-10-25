import copy
import json
import os

from opentrons_sdk.util import vector


CALIBRATIONS_FOLDER = 'calibrations'
CALIBRATIONS_FILE = 'calibrations.json'


class Instrument(object):

    def __init__(self):
        # parameters saved with persistent calibrations
        self.calibration_data = {}
        self.name = None
        self.positions = {}
        self.axis = None
        self.min_volume = None
        self.max_volume = None

        self.setup_calibrations()

    def setup_calibrations(self):
        init_calibrations()
        load_persisted_data(self)

    def save_calibrations(self):
        update_calibrations(self)


def get_calibration_dir():
    DATA_DIR = os.environ.get('APP_DATA_DIR')
    if not DATA_DIR:
        DATA_DIR = os.path.dirname(os.path.abspath(__file__))
        # raise Exception('APP_DATA_DIR has not been set')
    return os.path.join(DATA_DIR, CALIBRATIONS_FOLDER)


def get_calibration_file_path():
    return os.path.join(get_calibration_dir(), CALIBRATIONS_FILE)


def init_calibrations():
    """
    Creates empty calibrations data if not already present. Idempotent
    :return:
    """
    if not os.path.isdir(get_calibration_dir()):
        os.mkdir(get_calibration_dir())

    file_path = get_calibration_file_path()
    if not os.path.isfile(file_path):
        with open(file_path, 'a') as f:
            f.write(json.dumps({}))


def update_calibrations(instrument):
    last_persisted_data = read_calibrations()

    calibration_key = "{axis}:{instrument_name}".format(
        axis=instrument.axis,
        instrument_name=instrument.name
    )

    last_persisted_data[calibration_key] = (
        strip_vector(build_calibration_data_from_instrument(instrument))
    )

    last_persisted_data = strip_vector(last_persisted_data)

    with open(get_calibration_file_path(), 'w') as f:
        f.write(json.dumps(last_persisted_data, indent=4))


def load_persisted_data(instrument):
    last_persisted_data = get_instrument_calibration(instrument)
    if last_persisted_data:
        last_persisted_data = restore_vector(last_persisted_data)
        for key, val in last_persisted_data.items():
            setattr(instrument, key, val)


def get_instrument_calibration(instrument):
    return read_calibrations().get('{}:{}'.format(
        instrument.axis, instrument.name))


def build_calibration_data_from_instrument(instrument):
    calibration = {}
    calibration['positions'] = copy.copy(instrument.positions)
    calibration['min_volume'] = instrument.min_volume
    calibration['max_volume'] = instrument.max_volume
    calibration['calibration_data'] = instrument.calibration_data
    return calibration


def read_calibrations():
    """
    Reads calibration data from file system.
    :return: json of calibration data
    """
    with open(get_calibration_file_path()) as f:
        try:
            loaded_json = json.load(f)
        except json.decoder.JSONDecodeError:
            loaded_json = {}
        return restore_vector(loaded_json)


def delete_calibrations():
    file_path = get_calibration_file_path()
    if os.path.exists(file_path):
        os.remove(file_path)


def strip_vector(obj, root=True):
    obj = (copy.deepcopy(obj) if root else obj)
    for key, val in obj.items():
        if isinstance(val, vector.Vector):
            res = ['vector', dict(zip(['x', 'y', 'z'], val))]
            obj[key] = res
        elif isinstance(val, dict):
            strip_vector(val, root=False)

    return obj


def restore_vector(obj, root=True):
    obj = (copy.deepcopy(obj) if root else obj)
    for key, val in obj.items():
        if isinstance(val, list) and val[0] == 'vector':
            res = vector.Vector(val[1])
            obj[key] = res
        elif isinstance(val, dict):
            restore_vector(val, root=False)
    return obj
