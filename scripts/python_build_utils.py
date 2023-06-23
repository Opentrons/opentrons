""" Tools to bridge the Makefiles and the python build environment
(or provide utilities) for python subprojects

NOTE: This file must be python2.7 compatible
"""

import argparse
import json
import os
import subprocess
import sys
from collections import namedtuple


PackageEntry = namedtuple("PackageEntry", ("br_version_prefix"))
ProjectEntry = namedtuple("ProjectEntry", ("tag_prefix"))


HERE = os.path.dirname(__file__)

# current working directory for shell calls. will only be empty if running
# from script directory.
CWD = HERE or '.'

package_entries = {
    'api': PackageEntry('opentrons_api'),
    'update-server': PackageEntry('update_server'),
    'robot-server': PackageEntry('robot_server'),
    'shared-data': PackageEntry('shared_data'),
    'notify-server': PackageEntry('notify_server'),
    'hardware': PackageEntry('opentrons_hardware'),
    'usb-bridge': PackageEntry('usb_bridge'),
    'system-server': PackageEntry('system_server'),
    'server-utils': PackageEntry('server_utils'),
}

project_entries = {
    'ot3': ProjectEntry('ot3@'),
    'robot-stack': ProjectEntry('v'),
    'docs': ProjectEntry('docs@'),
}


def get_version(package, project, extra_tag='', git_dir=None):
    builtin_ver = _latest_version_for_project(project, git_dir)
    if extra_tag:
        version = builtin_ver + '.dev{}'.format(extra_tag)
    else:
        version = builtin_ver
    return version

def normalize_version(package, project, extra_tag='', git_dir=None):
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
    vers_obj = packaging.version.Version(get_version(package, project, extra_tag, git_dir))
    return str(vers_obj)

def _latest_tag_for_prefix(prefix, git_dir):
    check_dir = git_dir or CWD
    try:
        tags_result = subprocess.check_output(
            ['git', 'describe', '--tags', '--abbrev=0', '--match=' + prefix + '*'],
            cwd=check_dir)
    except subprocess.CalledProcessError:
        # This happens if a tag for the project didn't exist. This might be because
        # this is a new project that hasn't been tagged yet; it also might be because
        # this is being run outside the git repo, or possibly the repo was pulled
        # without its tags. We'll print an error (to stderr, since this is called as
        # a shell program by make and printing it to stdout would get captured).
        sys.stderr.write(
            'Could not find tag in {check_dir} matching {prefix} '.format(
                check_dir=check_dir, prefix=prefix)
            + '- build before release or no tags. Using 0.0.0-dev\n')
        tags_result = prefix.encode() + b'0.0.0-dev'
    tags_matching = tags_result.strip().split(b'\n')
    return tags_matching[-1].decode()

def _latest_version_for_project(project, git_dir):
    prefix = project_entries[project].tag_prefix
    tag = _latest_tag_for_prefix(prefix, git_dir)
    return prefix.join(tag.split(prefix)[1:])

def _ref_from_sha(sha):
    # codebuild leaves us in detached HEAD, so we need to pull some
    # gymnastics to get a nice branch name. First, get the branch ref if
    # it exists. Then all the tag and head refs
    branch_name = subprocess.check_output(
        ['git', 'rev-parse', '--symbolic-full-name', '--verify', '--quiet', 'HEAD'],
        cwd=CWD).strip().decode().split('\n')

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
    # if we have a local branch name just use that
    for match in matching:
        if branch_name and branch_name[0] in match:
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


def dump_br_version(package, project, extra_tag='', git_dir=None):
    """ Dump an enhanced version json including
    - The version from the latest git tag
    - The current branch (if it can be found)
    - The current sha
    """
    normalized = get_version(package, project, extra_tag, git_dir)
    sha = subprocess.check_output(
        ['git', 'rev-parse', 'HEAD'], cwd=CWD).strip().decode()
    branch = _ref_from_sha(sha)
    pref = package_entries[package].br_version_prefix
    return json.dumps({pref+'_version': normalized,
                       pref+'_sha': sha,
                       pref+'_branch': branch})

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Perform one of several build-time tasks')
    parser.add_argument(dest='package', metavar='PACKAGE', type=str,
                        choices=package_entries.keys())
    parser.add_argument(dest='project', metavar='PROJECT', type=str,
                        choices=project_entries.keys())
    parser.add_argument(dest='task', metavar='TASK', type=str,
                        choices=['normalize_version', 'dump_br_version', 'get_version'])
    parser.add_argument('-e', '--extra-tag', type=str, default='',
                        help='Extra version tag like a build number',
                        dest='extra_tag')
    args = parser.parse_args()
    print(locals()[args.task](args.package, args.project, args.extra_tag))
