import os

settings = {}


def refresh():
    """
    Refresh environment.settings dict
    """
    APP_DATA_DIR = os.environ.get('APP_DATA_DIR', os.getcwd())
    settings.clear()

    settings.update({
        'APP_DATA_DIR': APP_DATA_DIR,
        'LOG_DIR': os.path.join(APP_DATA_DIR, 'logs'),
        'LOG_FILE': os.path.join(APP_DATA_DIR, 'logs', 'api.log'),
        'CONTAINERS_DIR': os.path.join(APP_DATA_DIR, 'containers'),
        'CONTAINERS_FILE':
            os.path.join(
                APP_DATA_DIR, 'containers', '_containers_create.json'),
        'CALIBRATIONS_DIR': os.path.join(APP_DATA_DIR, 'calibrations'),
        'CALIBRATIONS_FILE':
            os.path.join(APP_DATA_DIR, 'calibrations', 'calibrations.json'),
        'APP_IS_ALIVE_URL': 'http://localhost:31950',
        'APP_JUPYTER_UPLOAD_URL': 'http://localhost:31950/upload-jupyter',
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
