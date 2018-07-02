import json
import os

PATH = os.path.abspath(os.path.dirname(__file__))
filepath = os.path.join(PATH, 'ignore.json')


def _set_ignored_version(version):
    """
    Private helper function that writes the most updated
    API version that was ignored by a user in the app
    :param version: Most recent ignored API update
    """
    data = {'version': version}
    with open(filepath, 'w') as data_file:
        json.dump(data, data_file)


def _get_ignored_version():
    """
    :return: Most recently ignored API version
    """
    if os.path.exists(filepath):
        with open(filepath) as data_file:
            data = json.load(data_file)
            version = data.get('version')
    else:
        version = None
    return version
