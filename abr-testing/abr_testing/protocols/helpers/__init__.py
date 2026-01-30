"""Helpers for abr protocols."""
import os
import subprocess

"""
Checks if it is inside a "worker" process. Prevents that code block from accidentally getting run
from inside its sub process
"""
if not os.environ.get("I'M THE WORKER"):
    # gets this package's directory
    package_dir = os.path.dirname(os.path.abspath(__file__))

    # adds script name to the end
    script_full_path = os.path.join(package_dir, "run_background.sh")

    env = os.environ.copy()
    env["I'M THE WORKER"] = "true"

    subprocess.Popen(["bash", script_full_path], env=env)
