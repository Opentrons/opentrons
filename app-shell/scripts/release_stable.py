import os

import util
import build_electron_app_with_builder as builder


def build_app():
    os.environ['CHANNEL'] = 'stable'
    os.environ['PUBLISH'] = 'true'
    builder.update_pkg_json_app_version(builder.get_app_version())
    builder.build_electron_app()


def is_tc_tag():
    try:
        res = util.get_cmd_value('git describe --exact-match --tags HEAD')
        return True
    except Exception as e:
        print('Could not detect TC tag')
        return False


if __name__ == '__main__':
    if 'TRAVIS_TAG' in os.environ:
        print('*** Detected Travis Tag')
        build_app()
    elif 'APPVEYOR_REPO_TAG_NAME' in os.environ:
        print('*** Detected AppVeyor Tag')
        build_app()
    elif is_tc_tag():
        print('*** Detected TeamCity Tag')
        build_app()
    else:
        print('*** Tag not detected; Not releasing app')
