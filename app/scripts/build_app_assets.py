#!/usr/bin/env python3

import functools
import glob
import re
import os
import shutil
import platform
import subprocess

from boto.s3.connection import S3Connection
from boto.s3.key import Key

import util


script_tag = "[OT-App Backend build] "
script_tab = "                       "

# The project_root_dir depends on the location of this file, so it cannot be
# moved without updating this line
project_root_dir = \
    os.path.dirname(                                  # going up 1 level
        os.path.dirname(os.path.realpath(__file__)))  # folder dir of this


def generate_static_assets():
    process_args = [
        shutil.which('webpack'), '--config', 'webpack.config.js'
    ]

    if platform.system().lower() == "windows":
        webpack_process = subprocess.Popen(process_args, shell=True)
    else:
        webpack_process = subprocess.Popen(process_args)

    webpack_process.communicate()
    if webpack_process.returncode != 0:
        print(script_tab + "ERROR: webpack returned with exit code: %s" %
              webpack_process.returncode)
        return False
    return True


def upload_to_s3(s3_connection, bucket, key, file_path):
    """
    Given an S3 connection object, 'file_path' to the specified 'bucket'
    at 'key'
    """
    bucket_obj = s3_connection.get_bucket(bucket)
    key_obj = Key(bucket_obj)
    key_obj.key = key
    headers = {'Cache-Control':'max-age=61536000'}
    key_obj.set_contents_from_filename(file_path, headers=headers)
    key_obj.set_acl('public-read')
    print(
        script_tab + "Uploaded {} to {}/{} on S3".format(
            file_path, bucket, key
        )
    )


def get_current_branch():
    """Returns current Travis branch name or branch name of local repo
    """
    res = subprocess.check_output(["git", "branch"])
    # Parses branch name where branch name is a line that starts with an '*'
    branch = re.search(r'\*\s(.*)\s', res.decode()).group(1)
    return '{branch}-{username}'.format(
        branch=branch,
        username=os.environ.get('USER')
    )


def get_current_commit():
    """Returns current Travis commit or commit of HEAD ref
    """
    return os.environ.get(
        'TRAVIS_COMMIT',
        subprocess.check_output(["git", "rev-parse", "HEAD"]).decode()
    )


def build_ot_app_assets():
    print(script_tag + "Build procedure started.")
    print(script_tag + "Checking for OS.")
    os_type = util.get_os()
    print(script_tag + "Building OT-App Backend for %s." % os_type)

    print(script_tag + "Project directory is:     %s" % project_root_dir)
    print(script_tag + "Script working directory: %s" % os.getcwd())

    print(script_tag + "Generating static files (JS/CSS/etc) for Flask app.")
    success = generate_static_assets()
    if not success:
        raise SystemExit(script_tab + "Exiting due to error generating static assets")

    print(script_tag + "Uploading app assets to S3")
    # assets_dir = os.path.join(project_root_dir, 'release-assets', '*')
    assets_dir_glob = os.path.join(project_root_dir, 'release-assets', '*')
    branch = os.environ.get('TRAVIS_BRANCH', get_current_branch())
    s3_connection = S3Connection(
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_KEY')
    )
    upload_build_asset = functools.partial(
        upload_to_s3, s3_connection, 'ot-app-builds'
    )
    def upload(asset_path):
        """
        Uploads an asset_path, e.g. 'release-assets/foo.js
        To S3 in 'ot-app-buids/assets/{branch}/foo.js'
        """
        file_name = os.path.basename(asset_path)
        s3_key = 'assets/{branch}/{file_name}'.format(
            branch=branch,
            file_name=file_name
        )
        upload_build_asset(s3_key, asset_path)

    list(map(upload, glob.glob(assets_dir_glob)))


if __name__ == "__main__":
    build_ot_app_assets()
