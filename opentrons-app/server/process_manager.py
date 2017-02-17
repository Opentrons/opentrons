import json
import os
import psutil
import sys


PID_FILENAME = 'otone_server.pid'


def write_pid_file(pid_file_path):
    current_pid = os.getpid()
    with open(pid_file_path, 'w') as pid_file:
        pid_file.write(json.dumps({'pid': current_pid}))


def get_pid_from_file(pid_file_path):
    with open(pid_file_path, 'r') as pid_file:
        return int(json.load(pid_file).get('pid'))


def check_is_running(pid_dir):
    pid_file_path = os.path.join(pid_dir, PID_FILENAME)

    # If the file doesn't exist, write the current process ID to the file
    if not os.path.exists(pid_file_path):
        write_pid_file(pid_file_path)
        return False

    last_pid = None
    try:
        last_pid = get_pid_from_file(pid_file_path)
    except ValueError:
        last_pid = None
        os.remove(pid_file_path)

    if last_pid and psutil.pid_exists(last_pid):
        return True

    write_pid_file(pid_file_path)
    return False


def run_once(pid_dir):
    """
    Ensures the current code is running through one process.
    Note that this is dependent on location of pid_dir

    :pid_dir: path to store PID file
    :return: None
    """
    if check_is_running(pid_dir):
        print('Silently exiting due to previous running process')
        sys.exit()
