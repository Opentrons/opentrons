import subprocess as sbp
import sys
import paramiko as pmk
import time
import multiprocessing
from typing import Optional, List


def execute(client: pmk.SSHClient, command: str, args: list) -> Optional[int]:
    command = command.format(name=args[0], duration=args[1], frequency=args[2])
    print(f"{args[0]} Executing command: {command}")

    try:
        stdin, stdout, stderr = client.exec_command(command, get_pty=True)
        stdout_lines: List[str] = []
        stderr_lines: List[str] = []

        time.sleep(15)

        # Check the exit status of the command
        if stdout.channel.exit_status_ready():
            if stdout.channel.recv_exit_status() != 0:
                print(f"{args[0]} command failed:", "".join(stderr_lines))
                client.close()
                # Terminate process on failure
                raise RuntimeError(
                    f"{args[0]} encountered an error and the process will terminate."
                )
        else:
            print(f"{args[0]} command success:", "".join(stdout_lines))
            client.close()
            return 0
    except Exception as e:
        print(f"Error with {args[0]}:", e)
        client.close()
        raise  # Re-raise the exception to propagate it up and terminate the process
    return None


def connect_ssh(ip: str) -> pmk.SSHClient:
    print("Connecting to:", ip)
    client = pmk.SSHClient()
    client.set_missing_host_key_policy(pmk.AutoAddPolicy())
    client.connect(ip, username="root", password=None)
    return client


# Load Robot IPs
file_name = sys.argv[1]
robot_ips = []
robot_names = []

with open(file_name) as file:
    for line in file.readlines():
        info = line.split(",")
        if "Y" in info[2]:
            robot_ips.append(info[0])
            robot_names.append(info[1])

command_template = (
    "python3 -m hardware_testing.scripts.abr_asair_sensor {name} {duration} {frequency}"
)
cd = "cd /opt/opentrons-robot-server && "
print("Executing Script on All Robots:")


def run_command_on_ip(index):
    curr_ip = robot_ips[index]
    try:
        ssh = connect_ssh(curr_ip)
        status = execute(ssh, cd + command_template, [robot_names[index], "540", "5"])
        if status == 0:
            print(f"Envrironmental sensors for {curr_ip}, are now running")
    except Exception as e:
        print(f"Error running command on {curr_ip}: {e}")
        # Terminate this process when an error occurs
        multiprocessing.current_process().terminate()


# Launch the processes for each robot
processes = []
for index in range(len(robot_ips)):
    process = multiprocessing.Process(target=run_command_on_ip, args=(index,))
    processes.append(process)


if __name__ == "__main__":
    # Wait for all processes to finish
    for process in processes:
        process.start()
        time.sleep(20)
        process.terminate()
