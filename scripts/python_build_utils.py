""" Tools to bridge the Makefiles and the python build environment
(or provide utilities) for python subprojects

NOTE: This file must be python2.7 compatible
"""

import argparse
import json
import os
import subprocess
from collections import namedtuple


PackageEntry = namedtuple("PackageEntry", ("pkg_json", "br_version_prefix"))


HERE = os.path.dirname(__file__)

# current working directory for shell calls. will only be empty if running
# from script directory.
CWD = HERE or '.'


package_entries = {
    'api': PackageEntry(
        os.path.join(HERE, '..', 'api', 'src', 'opentrons', 'package.json'),
        'opentrons_api'),
    'update-server': PackageEntry(
        os.path.join(HERE, '..', 'update-server', 'otupdate', 'package.json'),
        'update_server'),
    'robot-server': PackageEntry(
        os.path.join(HERE, '..', 'robot-server', 'robot_server', 'package.json'),
        'robot_server')
}


def get_version(project):
    pkg_json_path = package_entries[project].pkg_json
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


def _ref_from_sha(sha):
    # codebuild leaves us in detached HEAD, so we need to pull some
    # gymnastics to get a nice branch name. First, get all the tag and head
    # refs
    allrefs = subprocess.check_output(
        ['git', 'show-ref', '--tags', '--heads'],
        cwd=CWD).strip().decode().split('\n')
    # Keep...
    matching = [
        this_ref for this_sha, this_ref in   # the refs
        [ref_plus_sha.split(' ')
         for ref_plus_sha in allrefs if ref_plus_sha]
        if this_sha == sha  # matching the HEAD SHA
    ]
    # matching is now a list of refs pointing precisely to this sha. we
    # can now prioritize and pick the best:
    # tags are the best
    for match in matching:
        if 'tags' in match:
            return match.split('/')[-1]
    # local branches are next best
    for match in matching:
        if 'remotes' not in match:
            return match.split('/')[-1]
    # remote branches are ok I guess but we need to avoid remotes/origin/HEAD
    for match in matching:
        if 'HEAD' not in match:
            return match.split('/')[-1]
    # Just return an abbreviated sha because we officially have no idea
    return sha[:12]


def dump_br_version(project):
    """ Dump an enhanced version json including
    - The version from package.json
    - The current branch (if it can be found)
    - The current sha
    """
    normalized = get_version(project)
    sha = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=CWD).strip().decode()
    branch = _ref_from_sha(sha)
    pref = package_entries[project].br_version_prefix
    return json.dumps({pref+'_version': normalized,
                       pref+'_sha': sha,
                       pref+'_branch': branch})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='project', metavar='SUBPROJECT', type=str,
                        choices=package_entries.keys())
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version', 'dump_br_version'])
    args = parser.parse_args()
    print(locals()[args.task](args.project))
