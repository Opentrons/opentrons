#!/usr/bin/env python3

from distutils.sysconfig import get_python_lib
import glob
import os
import shutil
import subprocess
import tarfile
import tempfile
import zipfile

import util


script_tag = "[OT PyEnv Builder] "
script_tab = "                   "

# The project_root_dir depends on the location of this file, so it cannot be
# moved without updating this line
project_root_dir = \
    os.path.dirname(                                  # going up 1 level
        os.path.dirname(os.path.realpath(__file__)))  # folder dir of this


ENV_WORKPATH = os.path.join(project_root_dir, "env-build")
ENV_DISTPATH = os.path.join(project_root_dir, "env-dist")

IS_WIN = util.get_os() == 'win'


def remove_directory(dir_to_remove):
    """ :param dir_to_remove: Directory to remove. """
    if os.path.exists(dir_to_remove):
        print(script_tab + "Removing directory %s" % dir_to_remove)
        shutil.rmtree(dir_to_remove)
    else:
        print(script_tab + "Directory %s was not found." % dir_to_remove)


def alter_activate_script():
    """
    """
    print(script_tab + "Altering VIRUTALENV activate script")

    if IS_WIN:
        virtualenv_scripts_dir = 'Scripts'
    else:
        virtualenv_scripts_dir = 'bin'

    path_to_activate_scripts = glob.glob(
        os.path.join(ENV_WORKPATH, virtualenv_scripts_dir, 'activate*')
    )

    print(script_tab + "found these scripts:", path_to_activate_scripts)

    get_ext = lambda x: os.path.splitext(x)[-1]

    unix_activate_scripts = list(
        filter(lambda x: get_ext(x) == '', path_to_activate_scripts)
    )
    windows_activate_scripts = list(
        filter(lambda x: get_ext(x) == '.bat', path_to_activate_scripts)
    )

    print(script_tab + "Detected the following unix activate scripts: ",
            unix_activate_scripts)
    print(script_tab + "Detected the following windows activate scripts: ",
            windows_activate_scripts)

    def alter(path, alter_val):
        new_activate = path + '.bak'
        new_activate_file = open(new_activate, 'w')
        with open(path) as old_activate:
            for i, line in enumerate(old_activate):
                line = line.replace(ENV_WORKPATH, alter_val)
                new_activate_file.write(line)
        new_activate_file.close()
        os.remove(path)
        os.rename(new_activate, path)

    list(map(lambda x: alter(x, '$1'), unix_activate_scripts))
    list(map(lambda x: alter(x, '%1'), windows_activate_scripts))


def build_environment():
    """Runs virtual env in a subprocess to create the environment and makes
    environment relocatable
    """
    if util.get_os() == 'win':
        # Note: Sys python must be python3 for this to work
        subprocess.call(
            ["virtualenv", ENV_WORKPATH, "--always-copy"]
        )
    else:
        subprocess.call(
            ["virtualenv", ENV_WORKPATH, "-p", "python3", "--always-copy"]
        )

    subprocess.call(["virtualenv", ENV_WORKPATH, "--relocatable"])


def copy_site_packages():
    """Copy python site to virtualenv
    """
    import logging
    python_std_lib_path = os.path.normpath(
        os.path.join(logging.__file__, '..', '..')
    )
    if IS_WIN:
        sys_python = shutil.which('python')
        sys_python = os.path.normpath(
            os.path.join(os.path.realpath(sys_python), '..')
        )
    else:
        sys_python = shutil.which('python3')
        sys_python = os.path.normpath(
            os.path.join(os.path.realpath(sys_python), '..', '..')
        )

    def make_dirs(path):
        dir_path = os.path.splitext(path)[0]
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

    def copy(src, dest):
        for item in os.listdir(src):
            if item in ('site-packages', 'Headers', '__pycache__'):
                continue
            s = os.path.join(src, item)
            d = os.path.join(dest, item)

            if os.path.realpath(s) == os.path.realpath(src):
                continue

            if os.path.isdir(s):
                # shutil.copytree(s, d)
                copy(s, d)
            else:
                if os.path.exists(d):
                    continue
                make_dirs(d)
                shutil.copy(s, d)
    copy(python_std_lib_path, os.path.join(ENV_WORKPATH, 'lib'))
    copy(sys_python, os.path.join(ENV_WORKPATH))


def compress_virtual_env(path):
    """Zips environment located in ENV_WORKPATH into path
    """
    old_cwd = os.getcwd()
    os.chdir(ENV_WORKPATH)

    # Tar virtualenv in order to keep permissions, flags, etc
    tar_name = os.path.join(tempfile.gettempdir(), 'venv.tar')
    tar_output = tarfile.open(tar_name, 'w')
    tar_output.add('.')
    tar_output.close()

    # Zip tar file
    os.chdir(os.path.dirname(tar_name))
    zip_name = os.path.join(path, 'venv.zip')
    zip_output = zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED)
    zip_output.write(os.path.basename(tar_name))
    zip_output.close()

    # Restore working dir
    os.chdir(old_cwd)


def copy_virtual_env_to_release_dir():
    """
    Copies artifact "ENV_DISTPATH/venv.zip" to "releases/venv-{build-tag}.zip"
    """
    tag = util.get_build_tag(util.get_os())
    shutil.copy(
        os.path.join(ENV_DISTPATH, 'venv.zip'),
        os.path.join(project_root_dir, 'releases', 'venv-{}.zip'.format(tag))
    )


def copy_virtual_env_to_app():
    """
    Copies artifact "ENV_DISTPATH/venv.zip" to "releases/venv-{build-tag}.zip"
    """
    shutil.copy(
        os.path.join(ENV_DISTPATH, 'venv.zip'),
        os.path.join(
            project_root_dir, 'app', 'backend-env', util.get_os(), 'venv.zip')
    )


def create_env():
    """Creates standalone, distributable python virtual environment
    and zips it
    """
    print(script_tag + "Creating virtual environment in: {}".format(ENV_WORKPATH))
    remove_directory(ENV_WORKPATH)
    (not os.path.exists(ENV_WORKPATH) and os.mkdir(ENV_WORKPATH))

    print(script_tag + "Running virtualenv cmd in subprocess.")
    build_environment()

    print(script_tag + "Copying python site-packages to virtualenv")
    copy_site_packages()

    print(
        script_tag +\
        "Altering virtualenv activate script "
        "to take env path as an argument"
    )
    alter_activate_script()

    print(script_tag + "Compress virtualenv environment")
    (not os.path.exists(ENV_DISTPATH) and os.mkdir(ENV_DISTPATH))
    compress_virtual_env(ENV_DISTPATH)

    print(script_tag + "Copying virtualenv to release dir")
    copy_virtual_env_to_release_dir()

    # print(script_tag + "Copying virtualenv to app")
    # copy_virtual_env_to_app()


if __name__ == '__main__':
    create_env()
