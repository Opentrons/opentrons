""" Tools to bridge the Makefile and the python build environment
(or provide utilities)
"""

import argparse
import json
import os
import subprocess


HERE = os.path.dirname(__file__)


def get_version():
    pkg_json_path = os.path.join(HERE, 'src', 'opentrons', 'package.json')
    return json.load(open(pkg_json_path))['version']


def normalize_version():
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
    vers_obj = packaging.version.Version(get_version())
    return str(vers_obj)


def dump_br_version():
    """ Dump an enhanced version json including
    - The version from package.json
    - The current branch (if it can be found)
    - The current sha
    """
    normalized = get_version()
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=HERE).strip()
    branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd=HERE).strip()
    return json.dumps({'opentrons_api_version': normalized,
                       'opentrons_api_sha': sha,
                       'opentrons_api_branch': branch})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version', 'dump_br_version'])
    args = parser.parse_args()
    print(locals()[args.task]())
