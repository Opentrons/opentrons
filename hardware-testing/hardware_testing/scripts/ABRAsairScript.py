import subprocess as sbp
import sys
import paramiko as pmk
from threading import Thread


def execute(client: pmk.SSHClient, command: str) -> None:
    print("Executing command:", command)
    try:
        stdin, stdout, stderr = client.exec_command(command, get_pty=True)
        stdout_lines = []
        stderr_lines = []

        # Reading stdout and stderr
        while not stdout.channel.exit_status_ready():
            if stdout.channel.recv_ready():
                output = stdout.readline()
                stdout_lines.append(output)
                print(output, end="")

            if stderr.channel.recv_ready():
                error_output = stderr.readline()
                stderr_lines.append(error_output)
                print("Error output:", error_output, end="")

        client.close()

        if stdout.channel.recv_exit_status() != 0:
            print("Command failed with error:", "".join(stderr_lines))

    except Exception as e:
        print("Error:", e)
        client.close()


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
    ssh = connect_ssh(curr_ip)
    execute(
        ssh,
        cd
        + command_template.format(name=robot_names[index], duration=540, frequency=5),
    )


threads = []
for index in range(len(robot_ips)):
    thread = Thread(target=run_command_on_ip, args=(index,))
    threads.append(thread)
    thread.start()

for thread in threads:
    thread.join()  # Wait for all threads to finish
