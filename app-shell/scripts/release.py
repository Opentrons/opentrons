import os

import util
import build_electron_app_with_builder as builder

script_tag = '[OT App Release] '
script_tab = '                 '


def build_app(channel, app_version):
    """
    Builds electron app using electron-builder;
    """
    os.environ['CHANNEL'] = channel
    builder.update_pkg_json_app_version(app_version)
    builder.build_electron_app(publish=True)


def is_tc_tag():
    try:
        res = util.get_cmd_value('git describe --exact-match --tags HEAD')
        return True
    except Exception as e:
        print('Could not detect TC tag')
        return False


def is_tag():
    """Returns true if the current environmen is a
    Travis, AppVeyor, or TeamCity CI tag
    """
    return (
        os.environ.get('TRAVIS_TAG') or
        os.environ.get('APPVEYOR_REPO_TAG_NAME') or
        is_tc_tag() or
        False
    )


def is_release_branch():
    """
    Returns True if a branch starts with "release/"
    """
    branch_name = util.get_branch()
    if branch_name.startswith('release/'):
        return True
    return False


def release():
    """
    Builds and releases application when running on a valid release branch
    """
    if not is_release_branch():
        print(script_tag + 'Valid release branch not detected; Not releasing app')
        exit()

    print(script_tag + 'Valid release detected')
    if is_tag():
        print(script_tag +
                'CI Tag detected; releasing app to **stable** channel')
        build_app('stable', builder.get_app_version())
    else:
        print(script_tag +
                'CI Tag **not** detected; releasing app to **beta** channel')
        build_app('beta', builder.get_app_version_with_build_encoded())


if __name__ == '__main__':
    release()
