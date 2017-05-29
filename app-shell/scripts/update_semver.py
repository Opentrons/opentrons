import json
import os

import requests

# The project_root_dir depends on the location of this file, so it cannot be
# moved without updating this line
project_root_dir = \
    os.path.dirname(                                  # going up 1 level
        os.path.dirname(os.path.realpath(__file__)))  # folder dir of this


def get_s3_config():
    pkg_json_path = os.path.join(project_root_dir, "package.json")
    with open(pkg_json_path) as f:
        pkg_json = json.load(f)
        return pkg_json.get('build').get('publish')


def get_s3_url(s3_config : dict):
    pass


def update_semver():
    s3_config = get_s3_config()
    print(s3_config)


if __name__ == '__main__':
    update_semver()
