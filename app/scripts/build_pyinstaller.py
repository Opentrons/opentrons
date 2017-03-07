#!/usr/bin/env python3

import os
import shutil
import platform
import subprocess


import util


script_tag = "[OT-App Backend build] "
script_tab = "                       "

# The project_root_dir depends on the location of this file, so it cannot be
# moved without updating this line
project_root_dir = \
    os.path.dirname(                                  # going up 1 level
        os.path.dirname(os.path.realpath(__file__)))  # folder dir of this

exec_folder_name = os.path.join(project_root_dir, "app", "backend-dist")

PYINSTALLER_DISTPATH = os.path.join(project_root_dir, "pyinstaller-dist")
PYINSTALLER_WORKPATH = os.path.join(project_root_dir, "pyinstaller-build")

# verbose_print = print if verbose else lambda *a, **k: None


def remove_directory(dir_to_remove):
    """ :param dir_to_remove: Directory to remove. """
    if os.path.exists(dir_to_remove):
        print(script_tab + "Removing directory %s" % dir_to_remove)
        shutil.rmtree(dir_to_remove)
    else:
        print(script_tab + "Directory %s was not found." % dir_to_remove)


def get_spec_coll_name():
    os_type = util.get_os()
    if os_type == 'win':
        return "otone_server.exe"
    elif os_type in ['mac', 'linux']:
        return "otone_server"
    raise SystemExit(
        'Unable to determine pyinstaller.spec COLL name for OS: {}'.format(
            os_type
        )
    )


def remove_pyinstaller_temps():
    """
    Removes the temporary folders created by PyInstaller (dist and build).
    """
    remove_directory(PYINSTALLER_WORKPATH)
    remove_directory(PYINSTALLER_DISTPATH)


def pyinstaller_build():
    """
    Launches a subprocess running Python PyInstaller with the spec file from the
    package folder. Captures the output streams and checks for errors.
    :return: Boolean indicating the success state of the operation.
    """

    process_args = [
        shutil.which("pyinstaller"),
        "{}".format(os.path.join("scripts", "pyinstaller.spec")),
        "--workpath", PYINSTALLER_WORKPATH,
        "--distpath", PYINSTALLER_DISTPATH
    ]
    print(script_tab + "Command: %s" % process_args)

    if platform.system().lower() == "windows":
        pyinstaller_process = subprocess.Popen(process_args, shell=True)
    else:
        pyinstaller_process = subprocess.Popen(process_args)
    std_op, std_err_op = pyinstaller_process.communicate()

    if pyinstaller_process.returncode != 0:
        print(script_tab + "ERROR: PyInstaller returned with exit code: %s" %
              pyinstaller_process.returncode)
        print(script_tab + "PyInstaller STD OUT: {}".format(std_op))
        print(script_tab + "PyInstaller STD ERR: {}".format(std_err_op))
        return False

    return True


def move_executable_folder(final_exec_dir):
    """
    Moves the PyInstaller executable folder from dist to project root.
    :return: Boolean indicating the success state of the operation.
    """

    original_exec_dir = os.path.join(
        PYINSTALLER_DISTPATH, get_spec_coll_name()
    )

    if os.path.exists(original_exec_dir):
        print(script_tab + "Moving exec files from %s \n" % original_exec_dir +
              script_tab + "to %s" % final_exec_dir)
        shutil.move(original_exec_dir, final_exec_dir)
    else:
        print(script_tab + "ERROR: PyInstaller executable output folder '%s' " %
              original_exec_dir + "not found!")
        return False
    return True


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


def build_ot_python_backend_executable():
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


    print(script_tag + "Removing PyInstaller old temp directories.")
    remove_pyinstaller_temps()

    print(script_tag + "Running PyInstaller process.")
    success = pyinstaller_build()

    if not success:
        print(script_tab + "Removing PyInstaller recent temp directories.")
        remove_pyinstaller_temps()
        raise SystemExit(script_tab + "Exiting as there was an error in the "
                                      "PyInstaller execution.")

    print(script_tag + "Removing old OT-App Backend executable directory.")
    backend_exec_path = os.path.join(
        exec_folder_name, util.get_os(), get_spec_coll_name()
    )
    if os.path.isfile(backend_exec_path):
        os.remove(backend_exec_path)

    print(script_tag + "Moving executable folder to backend-dist.")
    success = move_executable_folder(backend_exec_path)
    if not success:
        print(script_tab + "Removing PyInstaller recent temp directories.")
        remove_pyinstaller_temps()
        raise SystemExit(script_tab + "Exiting now as there was an error in "
                                      "the PyInstaller execution.")

    print(script_tag + "Removing PyInstaller recent temp directories.")
    remove_pyinstaller_temps()

if __name__ == "__main__":
    build_ot_python_backend_executable()
