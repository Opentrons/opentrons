"""Create Jira tickets for robots with errors."""

from typing import List, Tuple, Any, Dict
from dataclasses import dataclass, field
from abr_testing.data_collection import read_robot_logs, abr_google_drive, get_run_logs
from abr_testing.data_collection.robot_fleet_error_config import (
    LocalMachineConfig,
    RobotFleetRuntimeConfig,
    validate_local_machine_config,
    load_robot_fleet_config,
)
from abr_testing.data_collection.robot_fleet_error_constants import (
    COMPONENT_FLEX_INTERNAL_RELEASE,
    COMPONENT_FLEX_RABR,
    COMPONENT_FLEX_STACKER,
    LABEL_VERSION_8_2_0,
    OPENTRONS_VERSION_HEADER,
    PARENT_NAME_VERSION_BUGS_SUFFIX,
    PROJECT_KEY_RABR,
    PROJECT_KEY_RQA,
    ROBOT_HTTP_PORT,
    ROBOT_ODD_DEBUG_PORT,
    ROBOT_SSH_USER,
    TICKET_ASSIGNEE_ID,
    TICKET_DESCRIPTION_TEMPLATE,
    TICKET_ISSUE_TYPE,
    TICKET_PRIORITY,
    VERSION_LABEL_8_2_SUBSTRING,
)
import requests
from abr_testing.automation import jira_tool
import shutil
import os
import subprocess
import platform
import sys
import json
import re
from pathlib import Path
import time
import base64
import websocket  # type: ignore[import-untyped,import-not-found]


def open_folder(path: str) -> None:
    """Open file folder on mac or windows."""
    system = platform.system()
    if system == "Windows":
        subprocess.Popen(["explorer", path])
    elif system == "Darwin":
        subprocess.Popen(["open", path])
    else:
        raise OSError("Unsupported operating system")


def retrieve_protocol_images(
    run_id: str,
    robot_ip: str,
    storage: str,
    ssh_key_path: Path | None = None,
) -> str:
    """Save all capture images for a run."""
    save_dir = Path(f"{storage}")
    new_save_dir = save_dir / run_id
    key_path = ssh_key_path or (save_dir / "robot_key")
    zip_path = save_dir / f"{run_id}_images"
    command = [
        "scp",
        "-i",
        str(key_path),
        "-o",
        "StrictHostKeyChecking=no",
        "-r",
        f"root@{robot_ip}:/data/images/{run_id}/",
        save_dir,
    ]
    new_save_dir.mkdir(parents=True, exist_ok=True)
    odd_path = new_save_dir / "odd_pic.png"
    try:
        # Get the CDP websocket URL
        targets = requests.get(
            f"http://{robot_ip}:{ROBOT_ODD_DEBUG_PORT}/json", timeout=5
        ).json()
        ws_url = targets[0]["webSocketDebuggerUrl"].replace("localhost", robot_ip)
        # Connect and send Page.captureScreenshot
        ws = websocket.create_connection(ws_url, timeout=10)
        ws.send(
            json.dumps(
                {
                    "id": 1,
                    "method": "Page.captureScreenshot",
                    "params": {"format": "png"},
                }
            )
        )
        result = json.loads(ws.recv())
        ws.close()
        image_data = base64.b64decode(result["result"]["data"])
        odd_path.write_bytes(image_data)
        print(f"ODD screenshot saved: {odd_path}")
    except Exception as e:
        print(f"Failed to capture ODD screenshot: {e}")
    try:
        subprocess.run(command, check=True)  # type: ignore
        shutil.make_archive(
            base_name=str(zip_path),
            format="zip",
            root_dir=new_save_dir,
        )
        subprocess.run(["rm", "-r", new_save_dir], check=True)
        print("Image folder transfered successful!")
        return str(zip_path) + ".zip"
    except subprocess.CalledProcessError as e:
        print(f"Error during file transfer: {e}")
    return ""


def retrieve_live_image(
    robot_ip: str,
    storage: str,
    robot_name: str,
    ssh_key_path: Path | None = None,
) -> str:
    """Capture a live camera image and ODD screenshot, return path to zip."""
    save_dir = Path(storage)
    key_path = ssh_key_path or (save_dir / "robot_key")
    captured = []
    # turn the live stream on if it is not already
    update_camera_status("ON", robot_ip, str(key_path))
    time.sleep(3)
    # grab one frame from camera live stream
    camera_path = save_dir / "robot_pic.jpg"
    stream_url = f"http://{robot_ip}:{ROBOT_HTTP_PORT}/hls/stream.m3u8"
    try:
        subprocess.run(
            ["ffmpeg", "-i", stream_url, "-frames:v", "1", str(camera_path), "-y"],
            check=True,
            capture_output=True,
            timeout=30,
        )
        captured.append(camera_path)
        print(f"Camera image saved: {camera_path}")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print(f"Failed to capture camera image for {robot_name}: {e}")
    update_camera_status("OFF", robot_ip, str(key_path))
    # ODD screenshot via port 9223
    odd_path = save_dir / "odd_pic.png"
    try:
        # Get the CDP websocket URL
        targets = requests.get(
            f"http://{robot_ip}:{ROBOT_ODD_DEBUG_PORT}/json", timeout=5
        ).json()
        ws_url = targets[0]["webSocketDebuggerUrl"].replace("localhost", robot_ip)
        # Connect and send Page.captureScreenshot
        ws = websocket.create_connection(ws_url, timeout=10)
        ws.send(
            json.dumps(
                {
                    "id": 1,
                    "method": "Page.captureScreenshot",
                    "params": {"format": "png"},
                }
            )
        )
        result = json.loads(ws.recv())
        ws.close()
        image_data = base64.b64decode(result["result"]["data"])
        odd_path.write_bytes(image_data)
        captured.append(odd_path)
        print(f"ODD screenshot saved: {odd_path}")
    except Exception as e:
        print(f"Failed to capture ODD screenshot for {robot_name}: {e}")

    if not captured:
        return ""

    zip_base = str(save_dir / f"{robot_name}_live_images")
    tmp_dir = save_dir / f"{robot_name}_live_images_tmp"
    tmp_dir.mkdir(exist_ok=True)
    for f in captured:
        shutil.copy(f, tmp_dir / f.name)
    shutil.make_archive(zip_base, "zip", tmp_dir)
    shutil.rmtree(tmp_dir)
    for f in captured:
        try:
            os.remove(f)
        except OSError:
            pass

    return zip_base + ".zip"


def update_camera_status(status: str, robot_ip: str, key_path: str) -> None:
    """Set the live-stream camera status on the robot via SSH and restart the stream service."""
    status_upper = str(status).upper()
    ssh_command = [
        "ssh",
        "-i",
        key_path,
        "-o",
        "StrictHostKeyChecking=no",
        f"{ROBOT_SSH_USER}@{robot_ip}",
        (
            f"sed -i 's/^STATUS=.*/STATUS={status_upper}/'"
            " /data/opentrons-live-stream.env"
            " && systemctl restart opentrons-live-stream"
        ),
    ]
    try:
        # Run the command and capture output
        subprocess.run(ssh_command, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Command failed with exit code {e.returncode}.")
        if e.stderr:
            print(f"Error details: {e.stderr.strip()}")

    except FileNotFoundError:
        print("Error: The 'ssh' command was not found on this system.")


def retrieve_protocol_file(
    protocol_id: str,
    robot_ip: str,
    storage: str,
    ssh_key_path: Path | None = None,
) -> Path | str:
    """Find and copy protocol file on robot with error handling."""
    save_dir = Path(storage)
    key_path = ssh_key_path or (save_dir / "robot_key")
    list_folder_command = [
        "ssh",
        "-i",
        str(key_path),
        "-o",
        "StrictHostKeyChecking=no",
        f"root@{robot_ip}",
        "ls /var/lib/opentrons-robot-server",
    ]
    try:
        result = subprocess.run(
            list_folder_command, check=True, capture_output=True, text=True
        )
        folders = []
        for line in result.stdout.splitlines():
            try:
                num = float(line)
                folders.append(int(num) if num.is_integer() else int(num))
            except ValueError:
                pass
        folders.sort(reverse=True)
    except subprocess.CalledProcessError:
        print("Could not find folder.")
        return ""

    if not folders:
        print("No folders found.")
        return ""

    for folder_num in folders:
        protocol_dir = (
            f"/var/lib/opentrons-robot-server/{folder_num}/protocols/{protocol_id}"
        )
        command = [
            "scp",
            "-i",
            str(key_path),
            "-o",
            "StrictHostKeyChecking=no",
            "-r",
            f"root@{robot_ip}:{protocol_dir}",
            str(save_dir),
        ]
        try:
            subprocess.run(command, check=True)
            print("File transfer successful!")
            return save_dir
        except subprocess.CalledProcessError:
            continue  # try next version folder

    print(f"Error during file transfer: protocol not found in versions {folders}")
    return ""


def read_each_log(
    folder_path: str, ticket: jira_tool.JiraTicket, issue_key: str
) -> None:
    """Read log and comment error portion on JIRA ticket."""
    for file_name in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file_name)
        not_found_words = []
        if file_path.endswith(".log"):
            with open(file_path) as file:
                lines = file.readlines()
            words = [
                "error",
                "traceback",
                "error frame encountered",
                "did not receive",
                "collision_detected",
                "fail",
                "warning",
                "failure",
                "homingfail",
                "timed out",
                "exception",
            ]
            error_lines = ""
            for word in words:
                content_list = []
                for line_index, line in enumerate(lines):
                    if word in line.lower():
                        lines_before = max(0, line_index - 10)
                        lines_after = min(len(lines), line_index + 10)
                        error_lines = "".join(lines[lines_before:lines_after])
                        code_lines = {
                            "type": "codeBlock",
                            "content": [{"type": "text", "text": error_lines}],
                        }
                        content_list.append(code_lines)
                num_times = len(content_list)
                if num_times == 0:
                    not_found_words.append(word)
                else:
                    message = f"Key word '{word.upper()}' found in {file_name} {num_times} TIMES."
                    line_1 = {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": message}],
                    }
                    content_list.insert(0, line_1)
                    ticket.comment(content_list, issue_key)
            no_word_found_message = (
                f"Key words '{not_found_words} were not found in {file_name}."
            )
            no_word_found_dict = {
                "type": "paragraph",
                "content": [{"type": "text", "text": no_word_found_message}],
            }
            content_list.append(no_word_found_dict)
            ticket.comment(content_list, issue_key)


def match_error_to_component(
    jira_client: jira_tool.JiraTicket,
    project_id: str,
    error_message: str,
    components: List[str],
) -> List[str]:
    """Match error to component based on error message."""
    project_components = jira_client.get_project_components(project_id)
    component_names = [proj_comp["name"] for proj_comp in project_components]
    for component in component_names:
        pattern = re.compile(component, re.IGNORECASE)
        matches = pattern.findall(error_message)
        if matches:
            components.append(component)
    return components


def get_parent_key(
    jira_url: str,
    api_token: str,
    email: str,
    project_key: str,
    parent_name: str,
) -> str:
    """Find a project key from a name."""
    jql = f'project = {project_key} AND summary ~ "{parent_name}"'
    response = requests.post(
        f"{jira_url}/rest/api/3/search/jql",
        json={"jql": jql, "fields": ["summary"], "maxResults": 50},
        auth=(email, api_token),
    )
    response.raise_for_status()
    matches = [
        i
        for i in response.json()["issues"]
        if i["fields"]["summary"].strip().lower() == parent_name.strip().lower()
    ]
    if not matches:
        print(f"No issue named '{parent_name}' in {project_key}")
        return ""
    return matches[0]["key"]


def cleanup_report_folders(storage_directory: str, keep_count: int = 3) -> None:
    """Cleans up report folder."""
    folders = [f for f in Path(storage_directory).iterdir() if f.is_dir()]
    folders.sort(key=lambda f: f.stat().st_mtime)
    # get folders, then sort by modification time

    # if we have more folders than we want, we cut the oldest ones we don't want
    if len(folders) > keep_count:
        folders_to_delete = folders[:-keep_count]

        for folder in folders_to_delete:
            try:
                shutil.rmtree(folder)
                print(f"Deleted folder: {folder.name}")
            except Exception as e:
                print(f"Failed to delete {folder.name}: {e}")


def get_user_id(user_file_path: str, assignee_name: str) -> str:
    """Get assignee account id."""
    users = json.load(open(user_file_path))
    assignee_id = TICKET_ASSIGNEE_ID
    for item in users:
        user = users[item]
        if user["displayName"] == assignee_name:
            assignee_id = user["accountId"]
    return assignee_id


def get_error_runs_from_robot(ip: str) -> Tuple[List[str], List[str]]:
    """Get runs that have errors from robot. Now including error recovery!"""
    error_run_ids: List[str] = []
    protocol_ids: List[str] = []
    recovery_statuses = {
        "awaiting-recovery",
        "awaiting-recovery-paused",
        "awaiting-recovery-blocked-by-open-door",
    }
    try:
        response = requests.get(
            f"http://{ip}:{ROBOT_HTTP_PORT}/runs",
            headers={"opentrons-version": OPENTRONS_VERSION_HEADER},
            timeout=10,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(
            f"Could not fetch runs from robot (HTTP unavailable): {e}\n"
            "No error/recovery runs could be read from the robot."
        )
        return (error_run_ids, protocol_ids)
    run_data = response.json()
    run_list = run_data.get("data", [])
    for run in run_list:
        run_id = run["id"]
        protocol_id = run.get("protocolId")
        if not protocol_id:
            continue
        status = run.get("status", "")
        num_of_errors = len(run.get("errors") or [])
        in_recovery = status in recovery_statuses
        terminal_error = status in ("failed", "stopped") or (
            not run.get("current") and num_of_errors > 0
        )
        if in_recovery or terminal_error:
            error_run_ids.append(run_id)
            protocol_ids.append(protocol_id)
    return (error_run_ids, protocol_ids)


def get_robot_state(
    ip: str,
    reported_string: str,
    project_key: str,
    jira_client: jira_tool.JiraTicket,
) -> Tuple[Any, Any, Any, List[str], List[str], str]:
    """Get robot status in case of non run error."""
    description: Dict[str, Any] = dict()
    # Get robot health info. If the HTTP server is down/erroring we still want
    # to create a ticket from the manually-provided title, just with less info.
    health_data: Dict[str, Any] = {}
    try:
        response = requests.get(
            f"http://{ip}:{ROBOT_HTTP_PORT}/health",
            headers={"opentrons-version": OPENTRONS_VERSION_HEADER},
            timeout=10,
        )
        response.raise_for_status()
        health_data = response.json()
        print(f"Connected to {ip}")
    except requests.exceptions.RequestException as e:
        print(
            f"WARNING: Could not reach robot health endpoint (HTTP unavailable): {e}\n"
            "Robot name, version, instruments, and modules will be omitted from the ticket."
        )
    robot = health_data.get("name", "")
    # Create summary name
    description["robot_name"] = robot
    summary = (robot + ": " + reported_string) if robot else reported_string
    affects_version = health_data.get("api_version", "")
    description["affects_version"] = affects_version
    # Instruments Attached (only if HTTP is responsive)
    if health_data:
        try:
            response = requests.get(
                f"http://{ip}:{ROBOT_HTTP_PORT}/instruments",
                headers={"opentrons-version": OPENTRONS_VERSION_HEADER},
                timeout=10,
            )
            response.raise_for_status()
            instrument_data = response.json()
            for instrument in instrument_data.get("data", []):
                key = (
                    instrument.get("mount")
                    or instrument.get("instrumentType")
                    or instrument.get("subsystem", "unknown")
                )
                description[key] = instrument
        except requests.exceptions.RequestException as e:
            print(f"WARNING: Could not fetch instruments (HTTP unavailable): {e}")
        # Get modules attached to robot
        try:
            response = requests.get(
                f"http://{ip}:{ROBOT_HTTP_PORT}/modules",
                headers={"opentrons-version": OPENTRONS_VERSION_HEADER},
                timeout=10,
            )
            response.raise_for_status()
            module_data = response.json()
            for module in module_data.get("data", []):
                description[module["moduleType"]] = module
        except requests.exceptions.RequestException as e:
            print(f"WARNING: Could not fetch modules (HTTP unavailable): {e}")
    components: List[str] = []
    components = match_error_to_component(
        jira_client=jira_client,
        project_id=project_key,
        error_message=reported_string,
        components=components,
    )
    # if "alpha" in affects_version:
    components.append(COMPONENT_FLEX_INTERNAL_RELEASE)
    if "flexStacker" in str(description):
        components.append(COMPONENT_FLEX_STACKER)
    labels = [robot]
    if VERSION_LABEL_8_2_SUBSTRING in affects_version:
        labels.append(LABEL_VERSION_8_2_0)
    parent_name = affects_version + PARENT_NAME_VERSION_BUGS_SUFFIX
    parent = get_parent_key(
        jira_url=jira_client.url,
        api_token=jira_client.api_token,
        email=jira_client.email,
        project_key=project_key,
        parent_name=parent_name,
    )
    whole_description_str = (
        "{"
        + "\n".join("{!r}: {!r},".format(k, v) for k, v in description.items())
        + "}"
    )
    return (
        summary,
        parent,
        affects_version,
        components,
        labels,
        whole_description_str,
    )


def get_run_error_info_from_robot(
    ip: str,
    one_run: str,
    storage_directory: Path,
    protocol_found: bool,
    project_key: str,
    jira_client: jira_tool.JiraTicket,
) -> Tuple[str, str, str, List[str], List[str], str, str]:
    """Get error information from robot to fill out ticket."""
    description: Dict[str, Any] = dict()
    # get run information
    results = get_run_logs.get_run_data(one_run, ip)
    # Get version file

    # save run information to local directory as .json file
    saved_file_path = read_robot_logs.save_run_log_to_json(
        ip, results, storage_directory
    )
    # Error Printout
    error_dict = read_robot_logs.get_error_info(results)
    error_level = error_dict["Error_Level"]
    error_type = error_dict["Error_Type"]
    error_code = error_dict["Error_Code"]
    error_instrument = error_dict["Error_Instrument"]
    # JIRA Ticket Fields
    robot = results.get("robot_name", "")
    failure_level = "Level " + str(error_level) + " Failure"

    components: List[str] = []
    # components = ["Flex-RABR"] THIS IS WHERE THE COMPONENT STUFF IS ADDED
    components = match_error_to_component(
        jira_client=jira_client,
        project_id=project_key,
        error_message=str(error_type),
        components=components,
    )
    affects_version = results["API_Version"]
    # if "alpha" in affects_version:
    components.append(COMPONENT_FLEX_INTERNAL_RELEASE)
    if project_key == PROJECT_KEY_RABR:
        components.append(failure_level)
        components.append(COMPONENT_FLEX_RABR)
    if "flexStacker" in str(description):
        components.append(COMPONENT_FLEX_STACKER)
    labels = [robot]
    if VERSION_LABEL_8_2_SUBSTRING in affects_version:
        labels.append(LABEL_VERSION_8_2_0)
    if project_key == PROJECT_KEY_RQA:
        parent_name = affects_version + PARENT_NAME_VERSION_BUGS_SUFFIX
        parent = get_parent_key(
            jira_url=jira_client.url,
            api_token=jira_client.api_token,
            email=jira_client.email,
            project_key=project_key,
            parent_name=parent_name,
        )
    else:
        parent_name = robot
        parent = get_parent_key(
            jira_url=jira_client.url,
            api_token=jira_client.api_token,
            email=jira_client.email,
            project_key=project_key,
            parent_name=parent_name,
        )

    summary = robot + "_" + str(one_run) + "_" + str(error_code) + "_" + error_type
    # Description of error
    description["protocol_name"] = results["protocol"]["metadata"].get(
        "protocolName", ""
    )

    # If Protocol was successfully retrieved from the robot
    description["protocol_found_on_robot"] = protocol_found
    """Build ticket description:
    error summary, last protocol step, mount/gripper attachments, and module info"""
    description["error"] = " ".join([error_code, error_type, error_instrument])
    protocol_step = list(results["commands"])[-1]
    description["protocol_step"] = protocol_step
    description["right_mount"] = results.get("right", "No attachment")
    description["left_mount"] = results.get("left", "No attachment")
    description["gripper"] = results.get("extension", "No attachment")
    all_modules = abr_google_drive.get_modules(results)
    print(f"all modules: {str(all_modules)}")
    whole_description = {**description, **all_modules}
    whole_description_str = (
        "{"
        + "\n".join("{!r}: {!r},".format(k, v) for k, v in whole_description.items())
        + "}"
    )

    return (
        summary,
        parent,
        affects_version,
        components,
        labels,
        whole_description_str,
        saved_file_path,
    )


def _fetch_latest_protocol_id(robot_ip: str) -> str:
    """Return the protocolId from the most recent run, or '' on failure."""
    try:
        response = requests.get(
            f"http://{robot_ip}:{ROBOT_HTTP_PORT}/runs",
            headers={"opentrons-version": OPENTRONS_VERSION_HEADER},
            timeout=10,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(
            f"Could not fetch runs from robot (HTTP unavailable): {e}\n"
            "Skipping latest protocol download."
        )
        return ""

    run_list = response.json().get("data") or []
    if not run_list:
        print("No runs found on robot.")
        return ""

    return run_list[-1].get("protocolId") or ""


def _list_version_dirs(robot_ip: str, ssh_key: Path) -> List[int]:
    """Return robot-server version directories sorted newest-first, or [] on failure."""
    try:
        result = subprocess.run(
            [
                "ssh",
                "-i",
                str(ssh_key),
                "-o",
                "StrictHostKeyChecking=no",
                f"root@{robot_ip}",
                "ls /var/lib/opentrons-robot-server",
            ],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"Could not find robot-server data folder: {e}")
        return []

    version_dirs: List[int] = []
    for line in result.stdout.splitlines():
        try:
            num = float(line)
            version_dirs.append(int(num))
        except ValueError:
            pass
    version_dirs.sort(reverse=True)
    return version_dirs


def _find_remote_protocol_path(
    robot_ip: str, ssh_key: Path, version_dirs: List[int], protocol_id: str
) -> str:
    """Return the first remote path that contains protocol_id, or ''."""
    for folder_num in version_dirs:
        candidate = (
            f"/var/lib/opentrons-robot-server/{folder_num}/protocols/{protocol_id}"
        )
        check = subprocess.run(
            [
                "ssh",
                "-i",
                str(ssh_key),
                "-o",
                "StrictHostKeyChecking=no",
                f"root@{robot_ip}",
                f"test -d {candidate}",
            ],
            capture_output=True,
        )
        if check.returncode == 0:
            return candidate
    return ""


def _scp_and_extract_protocol(
    robot_ip: str, ssh_key: Path, remote: str, storage: Path, protocol_id: str
) -> str:
    """SCP remote protocol folder to storage and return the local protocol file path."""
    try:
        subprocess.run(
            [
                "scp",
                "-i",
                str(ssh_key),
                "-o",
                "StrictHostKeyChecking=no",
                "-r",
                f"root@{robot_ip}:{remote}",
                str(storage),
            ],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"Error copying protocol from robot: {e}")
        return ""

    protocol_folder = storage / protocol_id
    for ext in (".py", ".json"):
        for name in os.listdir(protocol_folder):
            if name.endswith(ext):
                dest = storage / name
                shutil.move(str(protocol_folder / name), str(dest))
                shutil.rmtree(protocol_folder, ignore_errors=True)
                print(f"protocol_file: {dest}")
                return str(dest)

    shutil.rmtree(protocol_folder, ignore_errors=True)
    return ""


def save_latest_protocol(
    robot_ip: str,
    storage_directory: str,
    ssh_key_path: Path | None = None,
) -> str:
    """Fetch latest run and SCP protocol into storage_directory."""
    storage = Path(storage_directory)
    ssh_key = ssh_key_path or (storage / "robot_key")

    protocol_id = _fetch_latest_protocol_id(robot_ip)
    if not protocol_id:
        return ""

    version_dirs = _list_version_dirs(robot_ip, ssh_key)
    if not version_dirs:
        return ""

    remote = _find_remote_protocol_path(robot_ip, ssh_key, version_dirs, protocol_id)
    if not remote:
        return ""

    return _scp_and_extract_protocol(robot_ip, ssh_key, remote, storage, protocol_id)


def make_json_file(storage_directory: str, whole_description_str: str) -> str:
    """Makes old Jira description into a json file."""
    save_dir = Path(storage_directory)
    file_path = save_dir / "health.json"
    with open(file_path, "w") as json_file:
        json.dump(whole_description_str, json_file, indent=4)
    absolute_filepath = file_path.resolve()
    return str(absolute_filepath)


def _check_ssh_with_key(ip: str, ssh_key_path: Path, timeout: int = 15) -> bool:
    """Return True when SSH authenticates with the given key."""
    try:
        result = subprocess.run(
            [
                "ssh",
                "-i",
                str(ssh_key_path),
                "-o",
                "StrictHostKeyChecking=no",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=10",
                f"root@{ip}",
                "echo ok",
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def preflight_connection_check(
    ip: str,
    ssh_key_path: Path,
) -> bool:
    """Check HTTP and SSH connectivity up front and let the user decide.

    Returns True if the user wants to proceed, False to skip this robot.
    """
    print(f"\nChecking connections to {ip} ...")
    http_ok = read_robot_logs.check_http_available(ip)
    ssh_ok = _check_ssh_with_key(ip=ip, ssh_key_path=ssh_key_path)

    print(f"  HTTP (port {ROBOT_HTTP_PORT}): {'OK' if http_ok else 'UNAVAILABLE'}")
    print(f"  SSH  (robot_key):  {'OK' if ssh_ok else 'UNAVAILABLE'}")

    if http_ok and ssh_ok:
        print("All connections OK.\n")
        return True

    print("\nSome connections failed. The following data may be missing:")
    if not http_ok:
        print(
            "  - HTTP unavailable: robot name/version, instruments, modules,\n"
            "    run logs, calibration, and HTTP system logs will be skipped."
        )
    if not ssh_ok:
        print(
            "  - SSH unavailable: weston log, VERSION.json, protocol files, and\n"
            "    camera/ODD images will be skipped. Make sure the robot_key is\n"
            "    authorized on this robot (see Opentrons app SSH setup)."
        )
    while True:
        choice = input("\nContinue anyway? (y/n): ").strip().lower()
        if choice in ("y", "yes"):
            print("Continuing with available data...\n")
            return True
        if choice in ("n", "no"):
            print("Aborting.")
            return False
        print("Please enter 'y' or 'n'.")


@dataclass
class TicketInputs:
    """Manual ticket inputs collected at runtime."""

    project_key: str
    ip: str
    run_or_other: str


def prompt_ticket_title() -> str:
    """Prompt for a manual ticket title or empty input for run-error mode."""
    return str(
        input(
            "Press ENTER to report run error. If not, please format title as:\n"
            "feature, brief summary\n> "
        )
    )


def prompt_manual_ticket_title() -> str:
    """Prompt when no failed runs were found for run-error mode."""
    return str(
        input("Please format title as:\nfeature, brief summary\n> ")
    ).strip()


@dataclass
class TicketData:
    """Ticket data."""

    summary: str = ""
    parent: str = ""
    affects_version: str = ""
    components: List[str] = field(default_factory=list)
    labels: List[str] = field(default_factory=list)
    whole_description_str: str = ""
    run_log_file_path: str = ""
    protocol_file_path: str = ""
    one_run: str = ""


def organize_ticket_data(
    inputs: TicketInputs,
    local_machine: LocalMachineConfig,
    error_runs: List,
    protocol_ids: List,
    jira_client: jira_tool.JiraTicket,
) -> TicketData:
    """Collect and organize ticket fields from robot data or a manual title."""
    ticket_data = TicketData()

    if len(inputs.run_or_other) < 1 and error_runs and protocol_ids:
        protocol_folder = retrieve_protocol_file(
            protocol_id=protocol_ids[-1],
            robot_ip=inputs.ip,
            storage=str(local_machine.storage_directory),
            ssh_key_path=local_machine.robot_ssh_key_path,
        )
        protocol_folder_path = os.path.join(protocol_folder, protocol_ids[-1])
        protocol_found = False
        try:
            ticket_data.protocol_file_path = next(
                os.path.join(protocol_folder_path, file_name)
                for file_name in os.listdir(protocol_folder_path)
                if file_name.endswith(".py")
            )
            protocol_found = True
        except (FileNotFoundError, StopIteration):
            print(f"No .py file found or folder not found: {protocol_folder_path}")
        ticket_data.one_run = error_runs[-1]
        (
            ticket_data.summary,
            ticket_data.parent,
            ticket_data.affects_version,
            ticket_data.components,
            ticket_data.labels,
            ticket_data.whole_description_str,
            ticket_data.run_log_file_path,
        ) = get_run_error_info_from_robot(
            ip=inputs.ip,
            one_run=ticket_data.one_run,
            storage_directory=local_machine.storage_directory,
            protocol_found=protocol_found,
            project_key=inputs.project_key,
            jira_client=jira_client,
        )
    else:
        if len(inputs.run_or_other) < 1:
            print("No failed/recovery runs matched filters.")
            inputs.run_or_other = prompt_manual_ticket_title()
        ticket_data.protocol_file_path = save_latest_protocol(
            robot_ip=inputs.ip,
            storage_directory=str(local_machine.storage_directory),
            ssh_key_path=local_machine.robot_ssh_key_path,
        )
        (
            ticket_data.summary,
            ticket_data.parent,
            ticket_data.affects_version,
            ticket_data.components,
            ticket_data.labels,
            ticket_data.whole_description_str,
        ) = get_robot_state(
            ip=inputs.ip,
            reported_string=inputs.run_or_other,
            project_key=inputs.project_key,
            jira_client=jira_client,
        )

    return ticket_data


def get_name_from_ip(ip: str) -> str:
    """Get robot name from IP address."""
    try:
        health = requests.get(
            f"http://{ip}:{ROBOT_HTTP_PORT}/health",
            headers={"opentrons-version": OPENTRONS_VERSION_HEADER},
            timeout=10,
        )
        robot_name = health.json().get("name", ip)
    except Exception:
        robot_name = ip
    return robot_name


def make_error_folder(
    storage_directory: Path,
    issue_key: str,
    error_files: list,
) -> str:
    """Creates and populates the folder attached to each ticket."""
    error_folder_path = os.path.join(storage_directory, issue_key)
    os.makedirs(error_folder_path, exist_ok=True)
    for source_file in error_files:
        if not source_file:
            continue
        try:
            destination_file = os.path.join(
                error_folder_path, os.path.basename(source_file)
            )
            shutil.move(source_file, destination_file)
        except (shutil.Error, FileNotFoundError) as e:
            print(f"Could not move {source_file}: {e}")
            continue
    return error_folder_path


def build_jira_client(config: RobotFleetRuntimeConfig) -> jira_tool.JiraTicket:
    """Build a Jira client from resolved configuration."""
    return jira_tool.JiraTicket(
        api_token=config.jira.api_token,
        email=config.jira.email,
        url=config.jira.url,
    )


def attach_artifacts_to_ticket(
    ticket: jira_tool.JiraTicket,
    issue_key: str,
    error_folder_path: str,
) -> None:
    """Upload local artifacts and add log keyword comments to the Jira ticket."""
    for file_name in os.listdir(error_folder_path):
        file_to_attach = os.path.join(error_folder_path, file_name)
        ticket.post_attachment_to_ticket(issue_key=issue_key, attachment_path=file_to_attach)
    read_each_log(folder_path=error_folder_path, ticket=ticket, issue_key=issue_key)


def process_robot(
    robot_ip: str,
    jira_client: jira_tool.JiraTicket,
    config: RobotFleetRuntimeConfig,
) -> None:
    """Create one Jira ticket for a robot and attach collected error artifacts."""
    if not preflight_connection_check(
        ip=robot_ip,
        ssh_key_path=config.local_machine.robot_ssh_key_path,
    ):
        print(f"Skipping robot {robot_ip}.")
        return

    inputs = TicketInputs(
        project_key=config.jira.project_key,
        ip=robot_ip,
        run_or_other=prompt_ticket_title(),
    )
    error_runs, protocol_ids = get_error_runs_from_robot(ip=robot_ip)
    ticket_data = organize_ticket_data(
        inputs=inputs,
        local_machine=config.local_machine,
        error_runs=error_runs,
        protocol_ids=protocol_ids,
        jira_client=jira_client,
    )

    print(f"Making ticket for {ticket_data.summary}.")
    all_issues = jira_client.issues_on_board(project_key=inputs.project_key)
    issue_key, _ = jira_client.create_ticket(
        summary=ticket_data.summary,
        description=TICKET_DESCRIPTION_TEMPLATE,
        project_key=inputs.project_key,
        assignee_id=TICKET_ASSIGNEE_ID,
        issue_type=TICKET_ISSUE_TYPE,
        priority=TICKET_PRIORITY,
        components=ticket_data.components,
        affects_versions=ticket_data.affects_version,
        labels=ticket_data.labels,
        parent=ticket_data.parent,
    )
    if not issue_key:
        print("Ticket creation failed; skipping attachments for this robot.")
        return

    log_zip_path = read_robot_logs.get_logs(
        storage_directory=config.local_machine.storage_directory,
        ip=robot_ip,
    )
    status_path = make_json_file(
        storage_directory=str(config.local_machine.storage_directory),
        whole_description_str=ticket_data.whole_description_str,
    )
    if len(inputs.run_or_other) < 1:
        image_files = retrieve_protocol_images(
            run_id=ticket_data.one_run,
            robot_ip=robot_ip,
            storage=str(config.local_machine.storage_directory),
            ssh_key_path=config.local_machine.robot_ssh_key_path,
        )
    else:
        robot_name = get_name_from_ip(ip=robot_ip)
        image_files = retrieve_live_image(
            robot_ip=robot_ip,
            storage=str(config.local_machine.storage_directory),
            robot_name=robot_name,
            ssh_key_path=config.local_machine.robot_ssh_key_path,
        )

    to_link = jira_client.match_issues(
        issue_ids=all_issues,
        ticket_summary=ticket_data.summary,
    )
    jira_client.link_issues(to_link=to_link, ticket_key=issue_key)
    jira_client.open_issue(issue_key=issue_key)

    error_files = [
        ticket_data.run_log_file_path,
        ticket_data.protocol_file_path,
        log_zip_path,
        image_files,
        status_path,
    ]
    error_folder_path = make_error_folder(
        storage_directory=config.local_machine.storage_directory,
        issue_key=issue_key,
        error_files=error_files,
    )
    attach_artifacts_to_ticket(
        ticket=jira_client,
        issue_key=issue_key,
        error_folder_path=error_folder_path,
    )
    cleanup_report_folders(
        storage_directory=str(config.local_machine.storage_directory),
        keep_count=config.artifacts.cleanup_keep_count,
    )


def main(config: RobotFleetRuntimeConfig) -> None:
    """Create Jira tickets for the configured robot fleet."""
    jira_client = build_jira_client(config=config)
    validate_local_machine_config(config.local_machine)

    for robot_ip in config.robot_ips:
        process_robot(
            robot_ip=robot_ip,
            jira_client=jira_client,
            config=config,
        )


if __name__ == "__main__":
    try:
        main(load_robot_fleet_config())
    except (ValueError, FileNotFoundError) as exc:
        print(f"Configuration error: {exc}")
        sys.exit(1)
