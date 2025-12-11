"""Push one or more folders to one or more robots."""
import subprocess
import json
from multiprocessing import Process, Queue


def push_subroutine(cmd: list[str], queue: Queue) -> None:
    """Pushes specified folder to specified robot."""
    message = f'folder {cmd[2]} to ip {cmd[-1].split("=")[1]}'
    try:
        subprocess.run(cmd)
        queue.put(f"SUCCESS: sent {message}!\n")
    except Exception as e:
        print("Failed to push folder:", e)
        queue.put(f"FAILURE: could not send {message}.\n")


def get_robot_ips() -> set[str]:
    """Get robot ips from the user."""
    user_input = input("Type in robots ip (type all for all): ")
    if user_input.lower() == "all":
        robot_ip_path = input("Path to robot ips: ")
        with open(robot_ip_path, "r") as ip_file:
            robot_json = json.load(ip_file)
            robot_ips_dict = robot_json.get("ip_address_list")
            return set(robot_ips_dict.keys())
    else:
        return {user_input}


def get_folder_names() -> set[str]:
    """Get folder names from the user."""
    folder_input = input("Type in folder names separated by commas: ")
    folder_names = {name.strip() for name in folder_input.split(",")}
    return folder_names


def main(folder_to_push: set[str], robot_ips: set[str]) -> int:
    """Builds commands to push folders to specified robots."""
    processes: list[Process] = []
    queue: Queue = Queue()
    for folder_name in folder_to_push:
        for robot in robot_ips:
            push_cmd = ["make", "-C", folder_name, "push-ot3", f"host={robot}"]
            process = Process(
                target=push_subroutine,
                args=(
                    push_cmd,
                    queue,
                ),
            )
            process.start()
            processes.append(process)
    for process in processes:
        process.join()
        result = queue.get()
        print(f"\n{result}")
    return 0


if __name__ == "__main__":
    print("Welcome to the batch Opentrons robot push-folder tool.")
    print("This tool has been tested on the abr-testing & hardware-testing repos.")
    folder_to_push = get_folder_names()
    robot_to_push = get_robot_ips()
    print(main(folder_to_push, robot_to_push))
