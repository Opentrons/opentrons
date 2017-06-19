#!/usr/bin/env python

from collections import OrderedDict
import glob
import json
import os
import platform
import re
import shutil
import subprocess
import time


import util
import cantor


script_tag = "[OT-App frontend build] "
script_tab = "                        "

# The project_root_dir depends on the location of this file, so it cannot be
# moved without updating this line
project_root_dir = \
    os.path.dirname(                                  # going up 1 level
        os.path.dirname(os.path.realpath(__file__)))  # folder dir of this


def get_app_version():
    """
    Returns OT App version from versioneer
    E.g: "2.4.0"
    """
    import opentrons
    return opentrons.__version__.split('+')[0]


def get_app_version_with_build():
    """
    Returns OT App version from versioneer with build
    E.g: "2.4.0+5"
    """
    import opentrons
    return '{}.{}.{}+{}'.format(*get_version_parts(opentrons.__version__))


def get_app_version_with_build_encoded():
    """
    Returns OT App version with patch and build numbers encoded into the
    patch number
    """
    import opentrons
    major, minor, patch, build = get_version_parts(opentrons.__version__)
    print('version parts are', major, minor, patch, build)

    # Encode patch into build if build and patch exist
    if build:
        patch = cantor.cantor_calculate(int(patch), int(build)) + 1000

    return '{}.{}.{}'.format(major, minor, patch)


def update_pkg_json_app_version(version):
    """
    Overwrites app/package.json "version" attribute for electron-builder
    """
    app_json_path = os.path.join(project_root_dir, "app", "package.json")
    with open(app_json_path, 'r') as json_file:
        app_json = json.load(json_file, object_pairs_hook=OrderedDict)

    print(script_tab, 'Writing app version to file:', version)
    app_json['version'] = version
    with open(app_json_path, 'w') as json_file:
        json.dump(app_json, json_file, indent=2)


def get_version_parts(version):
    # matches: "2.4.0" or "2.4.0+55"

    rest = version
    major, rest = rest.split('.', 1)
    minor, rest = rest.split('.', 1)
    patch = rest.split('+')[0]

    if '+' in version:
        rest = version.split('+')[1]
        build = version.split('.', 1)[0]
    else:
        build = None
    return (major, minor, patch, build)


def remove_directory(dir_to_remove):
    """ :param dir_to_remove: Directory to remove. """
    if os.path.exists(dir_to_remove):
        print(script_tab + "Removing directory %s" % dir_to_remove)
        shutil.rmtree(dir_to_remove)
    else:
        print(script_tab + "Directory %s was not found." % dir_to_remove)


def get_build_tag(os_type, app_version):
    """
    Gets the OS, CPU architecture (32 vs 64 bit), and current time stamp and
    appends CI branch, commit, or pull request info
    :return: string of os, arch, and time stamp and if CI info if available
    """
    arch_time_stamp = "{}{}_{}".format(
        platform.system(),
        64,  # struct.calcsize('P') * 8,
        time.strftime("%Y-%m-%d_%H.%M")
    )

    ci_tag = None

    if os_type in {"mac", "linux"}:
        print(script_tag + "Checking Travis-CI environment variables for tag:")
        ci_tag = tag_from_ci_env_vars(
            ci_name='Travis-CI',
            pull_request_var='TRAVIS_PULL_REQUEST',
            branch_var='TRAVIS_BRANCH',
            commit_var='TRAVIS_COMMIT'
        )

    if os_type == "win":
        print(script_tag + "Checking Appveyor-CI enironment variables for tag:")
        ci_tag = tag_from_ci_env_vars(
            ci_name='Appveyor-CI',
            pull_request_var='APPVEYOR_PULL_REQUEST_NUMBER',
            branch_var='APPVEYOR_REPO_BRANCH',
            commit_var='APPVEYOR_REPO_COMMIT'
        )

    build_tag = "v{app_version}-{arch_time_stamp}".format(
        app_version=app_version,
        arch_time_stamp=arch_time_stamp
    )

    if ci_tag:
        return "{}_{}".format(build_tag, ci_tag)
    return build_tag



def tag_from_ci_env_vars(ci_name, pull_request_var, branch_var, commit_var):
    pull_request = os.environ.get(pull_request_var)
    branch = os.environ.get(branch_var)
    commit = os.environ.get(commit_var)

    if pull_request and pull_request != 'false':
        try:
            pr_number = int(re.findall("\d+", pull_request)[0])
            print(script_tab + "Pull Request valid {} variable found: "
                               "{}".format(ci_name, pr_number))
            return 'pull_{}'.format(pr_number)
        except (ValueError, TypeError):
            print(script_tab + 'The pull request environmental variable {} '
                               'value {} from {} is not a valid number'.format(
                pull_request_var, pull_request, ci_name
            ))

    if branch and commit:
        print(script_tab + "\tBranch and commit valid {} variables found "
                           "{} {}".format(
            ci_name, branch, commit
        ))
        return "{}_{}".format(branch, commit[:10])

    print(script_tab + "The environmental variables for {} were deemed "
                       "invalid".format(ci_name))
    print(script_tab + "--{}: {}".format(pull_request_var, pull_request))
    print(script_tab + "--{}: {}".format(branch_var, branch))
    print(script_tab + "--{}: {}".format(commit_var, commit))

    return None


def which(pgm):
    path = os.getenv('PATH')
    for p in path.split(os.path.pathsep):
        p = os.path.join(p, pgm)
        if os.path.exists(p) and os.access(p, os.X_OK):
            return p


def build_electron_app():
    print(script_tag + "Running electron-builder process.")

    platform_type = util.get_os()
    process_args = [
        os.path.join(project_root_dir, 'node_modules', '.bin', 'build'),
        os.path.join(project_root_dir, 'app'),
        "--{}".format(platform_type),
        "--{}".format(util.get_arch())
    ]

    # If on master branch, publish artifact
    if util.get_branch().strip() == 'master' or os.environ.get('PUBLISH'):
        process_args.extend(["-p", "always"])

    print(process_args)

    if platform_type in {'mac'}:
        electron_builder_process = subprocess.Popen(
            process_args, env=os.environ.copy()
        )
    elif platform_type in {'win', 'linux'}:
        electron_builder_process = subprocess.Popen(
            process_args, shell=True, env=os.environ.copy()
        )

    electron_builder_process.communicate()

    if electron_builder_process.returncode != 0:
        raise SystemExit(script_tag + 'Failed to properly build electron app')

    # Run windows repulish
    # if platform_type == 'win' and 'always' in process_args:
    #     print(os.listdir(os.path.join(project_root_dir, 'dist')))
    #     yml_file = os.path.join(
    #         project_root_dir, 'dist', '{}.yml'.format(os.environ['CHANNEL'])
    #     )
    #     exe_file = glob.glob(
    #         os.path.join(project_root_dir, 'dist', '*.exe')
    #     )[0]
    #     util.republish_win_s3(yml_file, exe_file)

    print(script_tab + 'electron-builder process completed successfully')


def clean_build_dist(build_tag):
    """
    Simply moves application to the releases dir and properly names it.

    For Mac:
        Moves and renames zip & dmg files in <project root>/dist/mac/ to <project root>/releases

    :param build_tag:
    :return:
    """

    platform_type = util.get_os()
    if platform_type == "win":
        platform_dist_dir = ""
    elif platform_type == "linux":
        platform_dist_dir = "linux-unpacked"
    elif platform_type == "mac":
        platform_dist_dir = ""

    electron_builder_dist = os.path.join(project_root_dir, "dist", platform_dist_dir)
    print(script_tab + 'Contents electron-builder dist dir: {}'.format(
        str(os.listdir(os.path.join(project_root_dir, "dist", platform_dist_dir)))
    ))

    print(script_tab + 'Searching for build artifacts in electron-builder '
                       'dist dir: {}'.format(electron_builder_dist))


    build_artifacts_globs = []
    if platform_type == "win":
        build_artifacts_globs = ["RELEASES", "*.nupkg", "*.exe"]
    elif platform_type == "mac":
        build_artifacts_globs = ["*.dmg", "*.zip"]
    elif platform_type == "linux":
        build_artifacts_globs = ["../*.deb"]

    found_build_artifacts = []  # Holds tuples of (filepath, ext)

    for glb in build_artifacts_globs:
        artifact_paths = glob.glob(os.path.join(electron_builder_dist, glb))

        for artifact_path in artifact_paths:
            _, file_extension = os.path.splitext(artifact_path)
            found_build_artifacts.append((artifact_path, file_extension))


    if len(found_build_artifacts) == 0:
        raise SystemExit(script_tab + 'No build artifacts found..')

    # Prepare releases dir where artifacts will be placed
    releases_dir = os.path.join(project_root_dir, 'releases')
    remove_directory(releases_dir)
    os.mkdir(releases_dir)

    for artifact_path, artifact_ext in found_build_artifacts:
        print(script_tab + 'Detected the following artifact for moving to '
                           'releases dir: {} with extension: "{}"'.format(
            artifact_path, artifact_ext
        ))

    for artifact_path, artifact_ext in found_build_artifacts:
        # If a file doesn't have an extension, make the extension the file name
        if not artifact_ext:
            artifact_ext = '-' + os.path.basename(artifact_path)

        new_artifact_path = os.path.join(
            project_root_dir,
            "releases",
            "OpenTrons-{build_tag}{extension}".format(
                build_tag=build_tag, extension=artifact_ext
            )
        )
        shutil.move(artifact_path, new_artifact_path)

    print(script_tab + 'Builds successfully moved to {}'.format(releases_dir))


if __name__ == '__main__':
    print('Detected branch is', util.get_branch(), util.get_branch() == 'master')
    if (
            'CHANNEL' not in os.environ and
            util.is_ci() and
            util.is_master_branch()
    ):
        os.environ['CHANNEL'] = 'beta'
    elif 'CHANNEL' not in os.environ:
        # os.environ['CHANNEL'] = 'dev'
        os.environ['CHANNEL'] = 'beta'

    update_pkg_json_app_version(get_app_version_with_build_encoded())
    build_electron_app()
    build_tag = get_build_tag(util.get_os(), get_app_version_with_build())
    clean_build_dist(build_tag)
