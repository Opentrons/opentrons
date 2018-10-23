""" Tools to bridge the Makefile and the python build environment
(or provide utilities)
"""

import argparse
import json
import os

# Pipenv requires setuptools >= 36.2.1. Since 36.2.1, setuptools changed
# the way they vendor dependencies, like the packaging module that
# provides the way to normalize version numbers for wheel file names. So
# we try all the possible ways to find it.
try:
    # new way
    from setuptools.extern import packaging
except ImportError:
    # old way
    from pkg_resources.extern import packaging


def normalize_version():
    pkg_json_path = os.path.join('src', 'opentrons', 'package.json')
    old_ver = json.load(open(pkg_json_path))['version']
    vers_obj = packaging.version.Version(old_ver)
    return str(vers_obj)


def write_local_env():

    here = os.getcwd()

    with open('./.env', 'w') as dotenv:
        dotenv.write('OVERRIDE_SETTINGS_DIR={}'.format(here))

    shared_data = os.path.join(here, os.pardir, 'shared-data')
    test_data = os.path.join(here, 'tests', 'opentrons', 'data')
    local_index = {
        "labware": {
            "baseDefinitionDir": os.path.join(shared_data, 'definitions'),
            "userDefinitionDir": os.path.join(test_data, 'labware-def',
                                              'definitions'),
            "offsetDir": os.path.join(test_data, 'labware-def', 'offsets')
        },
        "pipetteConfigFile": os.path.join(shared_data, 'robot-data',
                                          'pipette-config.json'),
        "featureFlagFile": os.path.join(shared_data, 'settings.json'),
        "deckCalibrationFile": os.path.join(test_data,
                                            'configs',
                                            'deckCalibration.json'),
        "robotSettingsFile": os.path.join(test_data, 'configs',
                                          'robotSettings.json')
    }

    with open('./index.json', 'w') as index:
        index.write(json.dumps(local_index))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version', 'write_local_env'])
    args = parser.parse_args()
    print(locals()[args.task]())
