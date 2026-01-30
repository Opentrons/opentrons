"""Helpers for abr protocols."""
import os
import subprocess

"""
Pattern used:

1. Package is imported
2. Subprocess with infinite loop is started ("I'M THE WORKER not set yet)
    a) set environment varialbe to "I'M THE WORKER"
3. Subprocess initializes background_helpers
    a) checks if "I'M THE WORKER" during initialization
        i) False: continue running subprocess
        ii) True: break out to prevent recursive explosion
"""
if not os.environ.get("I'M THE WORKER"):
    # gets this package's directory
    package_dir = os.path.dirname(os.path.abspath(__file__))

    # adds script name to the end
    script_full_path = os.path.join(package_dir, "run_background.sh")

    env = os.environ.copy()
    env["I'M THE WORKER"] = "true"

    subprocess.Popen(["bash", script_full_path], env=env)
