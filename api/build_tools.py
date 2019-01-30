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


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version'])
    args = parser.parse_args()
    print(locals()[args.task]())
