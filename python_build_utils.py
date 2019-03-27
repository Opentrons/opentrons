""" Tools to bridge the Makefiles and the python build environment
(or provide utilities) for python subprojects
"""

import argparse
import json
import os
import subprocess


HERE = os.path.dirname(__file__)

pkg_jsons = {
    'api': os.path.join(
        HERE, 'api', 'src', 'opentrons', 'package.json'),
    'update-server': os.path.join(
        HERE, 'update-server', 'otupdate', 'package.json')
}


br_version_prefixes = {
    'api': 'opentrons_api',
    'update-server': 'update_server'
}


def get_version(project):
    pkg_json_path = pkg_jsons[project]
    return json.load(open(pkg_json_path))['version']


def normalize_version(project):
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
    vers_obj = packaging.version.Version(get_version(project))
    return str(vers_obj)


def dump_br_version(project):
    """ Dump an enhanced version json including
    - The version from package.json
    - The current branch (if it can be found)
    - The current sha
    """
    normalized = get_version(project)
    sha = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=HERE).strip()
    branch = subprocess.check_output(
        ['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd=HERE).strip()
    pref = br_version_prefixes[project]
    return json.dumps({pref+'_version': normalized,
                       pref+'_sha': sha,
                       pref+'_branch': branch})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='project', metavar='SUBPROJECT', type=str,
                        choices=['api', 'update-server'])
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version', 'dump_br_version'])
    args = parser.parse_args()
    print(locals()[args.task](args.project))
