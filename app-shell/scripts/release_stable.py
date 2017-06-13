import os

import util
import build_electron_app_with_builder as builder


def build_app(channel):
    os.environ['CHANNEL'] = channel
    builder.update_pkg_json_app_version(builder.get_app_version())
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

if __name__ == '__main__':
    if is_tag():
        print('*** Detected CI Tag')
        build_app()
    else:
        print('*** Tag not detected; Not releasing app')
