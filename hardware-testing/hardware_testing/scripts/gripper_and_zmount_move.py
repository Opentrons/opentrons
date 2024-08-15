"""Test and record z mount functionality."""
import argparse
import asyncio
import datetime
import time
import csv
import requests
import os
import json
from abr_testing.automation import jira_tool  # type: ignore[import]
from opentrons_shared_data.errors.exceptions import (
    StallOrCollisionDetectedError,
    PythonException,
)
from hardware_testing.opentrons_api.types import (
    OT3Mount,
    Axis,
    Point,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)


def get_travel(mount_name: str) -> float:
    """Gets and confirms z axis travel."""
    limit = 150
    if mount_name != "gripper":
        limit = 210
    while True:
        try:
            travel = float(
                input(
                    f"How far would you like the z axis to travel? \
The range is between 1 and {str(limit)}: "
                )
            )
            if 0 < int(travel) <= limit:
                break
            else:
                print(f"Please choose a value between 1 and {str(limit)}.")
        except ValueError:
            print("Please enter a number.")
    return travel


def get_summary(file_path: str, count: int, errored: bool, error_message: str) -> str:
    """Creates a summary of the results of the z axis test."""
    with open(file_path, newline="") as csvfile:
        csvobj = csv.reader(csvfile, delimiter=",")

        full_list = list(csvobj)
        row_of_interest = full_list[count]
        cropped_cycle = str(row_of_interest).split("'")[1]
        cropped_time = str(row_of_interest).split("'")[3]
        cropped_time = cropped_time[1:]

    if errored is True:
        comment_message = f"This test failed due to \
{error_message} on {cropped_cycle} and {cropped_time}."
    else:
        comment_message = (
            f"This test successfully completed at {cropped_cycle} and {cropped_time}."
        )
    return comment_message


def get_robot_ip() -> str:
    """Gets and confirms robot IP address."""
    while True:
        ip = input("Robot IP: ")
        # From health: robot name
        try:
            response = requests.get(
                f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
            )
            # confirm connection of IP
            if str(response) == "<Response [200]>":
                break
            else:
                print("Please input a valid IP address")
        except BaseException:
            print("Please input a valid IP address")
    return ip


def get_robot_info(ip: str, mount_name: str) -> tuple[str, str]:
    """Grabs robot name and instrument serial."""
    response = requests.get(
        f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
    )
    health_data = response.json()
    robot_name = health_data.get("name", "")
    # from pipettes/instruments we get pipette/gripper serial
    if mount_name == "gripper":
        response = requests.get(
            f"http://{ip}:31950/instruments", headers={"opentrons-version": "3"}
        )
        instruments = response.json()
        for item in instruments["data"]:
            if item["mount"] == "extension":
                instrument_serial = item["serialNumber"]

    else:
        response = requests.get(
            f"http://{ip}:31950/pipettes", headers={"opentrons-version": "3"}
        )
        pipette_data = response.json()
        instrument_serial = pipette_data[mount_name].get("id", "")
    if str(instrument_serial) == "None":
        raise Exception("Please specify a valid mount.")
    return robot_name, instrument_serial


async def _main(
    mount: OT3Mount, mount_name: str, simulate: bool, time_min: int, z_axis: Axis
) -> None:

    domain_url = "https://opentrons.atlassian.net"

    # make directory for tests. check if directory exists, make if doesn't.
    BASE_DIRECTORY = "/userfs/data/testing_data/z_axis_test/"
    if not os.path.exists(BASE_DIRECTORY):
        os.makedirs(BASE_DIRECTORY)

    travel = get_travel(mount_name)

    # Ask, get, and test Jira ticket link
    connect_jira = False
    while True:
        y_or_no = input("Do you want to attach the results to a JIRA Ticket? Y/N: ")
        if y_or_no == "Y" or y_or_no == "y":
            connect_jira = True
            # grab testing teams jira api info from a local file - MAKE INTO FUNCTION
            storage_directory = "/var/lib/jupyter/notebooks"
            jira_info = os.path.join(storage_directory, "jira_credentials.json")
            # create an dict copying the contents of the testing team jira info
            try:
                jira_keys = json.load(open(jira_info))
                # grab token and email from the dict
                tot_info = jira_keys["information"]
                api_token = tot_info["api_token"]
                email = tot_info["email"]
            except FileNotFoundError:
                raise Exception(
                    f"Please add json file with the testing team \
jira credentials to: {storage_directory}."
                )
            ticket = jira_tool.JiraTicket(domain_url, api_token, email)
            issue_key = ticket.get_ticket()
            break
        elif y_or_no == "N" or y_or_no == "n":
            connect_jira = False
            break
        else:
            print("Please Choose a Valid Option")

    # get and confirm robot IP address then grab robot name and instrument serial
    ip = get_robot_ip()
    robot_info = get_robot_info(ip, mount_name)
    robot_name = robot_info[0]
    instrument_serial = robot_info[1]
    print(instrument_serial)
    print(robot_name)

    # Create csv file and add initial line
    current_datetime = datetime.datetime.now()
    time_start = current_datetime.strftime("%m-%d-%y, at %H-%M-%S")

    init_data = [
        [
            f"Robot: {robot_name}",
            f" Mount: {mount_name}",
            f" Distance: {travel}",
            f" Instrument Serial: {instrument_serial}",
        ],
    ]

    file_path = f"{BASE_DIRECTORY}/{robot_name} test on {time_start}"

    with open(file_path, mode="w", newline="") as creating_new_csv_file:
        writer = csv.writer(creating_new_csv_file)
        writer.writerows(init_data)

    # hw api setup
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=simulate, use_defaults=True
    )
    await asyncio.sleep(1)
    await hw_api.cache_instruments()
    timeout_start = time.time()
    timeout = time_min * 60
    count = 0
    errored = False
    # finding home and starting to move
    error_message = ""
    try:
        await hw_api.home()
        await asyncio.sleep(1)
        await hw_api.move_rel(mount, Point(0, 0, -1))
        while time.time() < timeout_start + timeout:
            # while True:
            await hw_api.move_rel(mount, Point(0, 0, (-1 * int(travel))))
            await hw_api.move_rel(mount, Point(0, 0, int(travel)))
            # grab and print time and move count
            count += 1
            print(f"cycle: {count}")
            runtime = time.time() - timeout_start
            print(f"time: {runtime}")
            # write count and runtime to csv sheet
            run_data = [
                [f"Cycle: {count}", f" Time: {runtime}"],
            ]
            with open(file_path, "a", newline="") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerows(run_data)
        await hw_api.home()
    except StallOrCollisionDetectedError:
        errored = True
        error_message = "Stall or Collision"
    except PythonException:
        errored = True
        error_message = "KeyboardInterupt"
    except BaseException as e:
        errored = True
        errorn = type(e).__name__
        print(f"THIS ERROR WAS: {errorn}")
        error_message = str(errorn)
    finally:
        # Grab info and comment on JIRA
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z, Axis.G])
        await hw_api.clean_up()
        comment_message = get_summary(file_path, count, errored, error_message)
        print(comment_message)
        if connect_jira is True:
            # use REST to comment on JIRA ticket
            comment = ticket.format_jira_comment(comment_message)
            ticket.comment(comment, issue_key)

            # post csv file created to jira ticket
            ticket.post_attachment_to_ticket(issue_key, file_path)


def main() -> None:
    """Run gripper and zmount move commands using arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--time_min", type=int, default=60)
    parser.add_argument(
        "--mount", type=str, choices=["left", "right", "gripper"], default="left"
    )
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
        mount_name = "left"
        z_axis = Axis.Z_L
    elif args.mount == "gripper":
        mount = OT3Mount.GRIPPER
        mount_name = "gripper"
        z_axis = Axis.Z_G
    else:
        mount = OT3Mount.RIGHT
        mount_name = "right"
        z_axis = Axis.Z_R
    asyncio.run(_main(mount, mount_name, args.simulate, args.time_min, z_axis))


if __name__ == "__main__":
    main()
