# TODO (ben 2018-04-26): move relevant methods and data into `opentrons.config`
import os
import sys

settings: dict = {}

IS_WIN = sys.platform.startswith('win')
IS_OSX = sys.platform == 'darwin'
IS_LINUX = sys.platform.startswith('linux')

PI_DATA_PATH = '/data/user_storage/opentrons_data/'


def infer_app_data_dir():
    home = os.path.expanduser('~')
    app_data_dir_suffix = ['OT One App 2', 'otone_data']

    app_data = None
    if IS_OSX:
        app_data = os.path.join(home, 'Library', 'Application Support')
    if IS_WIN:
        app_data = os.path.join(os.environ.get('APPDATA', ''))
    if IS_LINUX:
        app_data = os.path.join(home, '.config')

    if not app_data:
        return os.getcwd()

    app_data = os.path.join(app_data, *app_data_dir_suffix)

    if os.environ.get('RUNNING_ON_PI'):
        app_data = PI_DATA_PATH

    if not os.path.exists(app_data):
        # todo (Ben Morris 2017-10-12): create the directory if it does not
        # exist
        pass

    return app_data


def refresh():
    """
    Refresh environment.settings dict
    """
    APP_DATA_DIR = os.environ.get('APP_DATA_DIR', infer_app_data_dir())
    settings.clear()

    settings.update({
        'APP_DATA_DIR': APP_DATA_DIR,
        'OT_CONFIG_FILE': os.path.join(APP_DATA_DIR, 'config.json'),
        'LOG_DIR': os.path.join(APP_DATA_DIR, 'logs'),
        'LOG_FILE': os.path.join(APP_DATA_DIR, 'logs', 'api.log'),
        'SERIAL_LOG_FILE': os.path.join(APP_DATA_DIR, 'logs', 'serial.log'),
        'CONTAINERS_DIR': os.path.join(APP_DATA_DIR, 'containers'),
        'CONTAINERS_FILE':
            os.path.join(
                APP_DATA_DIR, 'containers', '_containers_create.json'),
        'CALIBRATIONS_DIR': os.path.join(APP_DATA_DIR, 'calibrations'),
        'CALIBRATIONS_FILE':
            os.path.join(APP_DATA_DIR, 'calibrations', 'calibrations.json'),
        'DATABASE_FILE':
            os.path.join(APP_DATA_DIR, 'opentrons.db'),
        'APP_IS_ALIVE_URL': 'http://localhost:31950',
        'WIFI_KEYS_DIR': os.path.join(APP_DATA_DIR, 'network_keys'),
        'HARDWARE_CONTROLLER_LOCKFILE': os.path.join(APP_DATA_DIR,
                                                     'hardware.lock')
    })

    return settings


def get_path(key):
    """
    For a given key returns a full path and
    creates the path if missing. The caller is guaranteed
    the path exists if exception is not thrown.

    For *_DIR it will create a directory, for *_FILE it will
    create a directory tree to the file. Throws exception if neither.
    """

    if key not in settings:
        raise ValueError(
            'Key "{}" not found in environment settings'.format(key))

    if key.endswith('_DIR'):
        path = settings[key]
    elif key.endswith('_FILE'):
        path, _ = os.path.split(settings[key])
    else:
        raise ValueError(
            'Expected key suffix as _DIR or _FILE. "{}" received'.format(key))

    if not os.path.exists(path):
        os.makedirs(path)

    return settings[key]


refresh()
