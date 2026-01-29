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
    env = os.environ.copy()
    env["I_AM_THE_WORKER"] = "true"

    subprocess.Popen(["bash", "run_background.sh"], env=env)
