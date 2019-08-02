""" Tools to bridge the Makefiles and the python build environment
(or provide utilities) for python subprojects

NOTE: This file must be python2.7 compatible
"""

import argparse
import glob
import json
import os
import subprocess


HERE = os.path.dirname(__file__)

pkg_jsons = {
    'api': os.path.join(
        HERE, '..', 'api', 'src', 'opentrons', 'package.json'),
    'update-server': os.path.join(
        HERE, '..', 'update-server', 'otupdate', 'package.json')
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


def _ref_from_sha(sha):
    # codebuild leaves us in detached HEAD, so we need to pull some
    # gymnastics to get a nice branch name. First, get all the tag and head
    # refs
    allrefs = subprocess.check_output(
        ['git', 'show-ref', '--tags', '--heads'],
        cwd=HERE).strip().decode().split('\n')
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
        ['git', 'rev-parse', 'HEAD'], cwd=HERE).strip().decode()
    branch = _ref_from_sha(sha)
    pref = br_version_prefixes[project]
    return json.dumps({pref+'_version': normalized,
                       pref+'_sha': sha,
                       pref+'_branch': branch})


def ensure_wheel_size(project):
    """ Explode if the wheel in the project is too large """
    wheelname = {'api': 'opentrons-*.whl',
                 'update-server': 'otupdate-*.whl'}
    wheelf = glob.glob(os.path.join(
        HERE, '..', project, 'dist', wheelname[project]))[0]
    statinfo = os.stat(wheelf)
    assert statinfo.st_size < 1024 * 1024, '%s is larger than 1MiB' % wheelf


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='project', metavar='SUBPROJECT', type=str,
                        choices=['api', 'update-server'])
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version',
                                 'dump_br_version',
                                 'ensure_wheel_size'])
    args = parser.parse_args()
    print(locals()[args.task](args.project))
