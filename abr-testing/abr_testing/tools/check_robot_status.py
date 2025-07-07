"""Check Robot(s) Current State."""
import json
import requests
from abr_testing.automation import slack
import configparser
import os
from typing import List, Dict, Any, Tuple


def get_robot_run_info(ip: str) -> Tuple[str, List[Dict[str, Any]]]:
    """Get robot name."""
    try:
        response = requests.get(
            f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
        )
        health_data = response.json()
        robot_name = health_data.get("name", "")
        response = requests.get(
            f"http://{ip}:31950/runs", headers={"opentrons-version": "3"}
        )
        run_data = response.json()
        run_list = run_data.get("data" "")
        return robot_name, run_list
    except requests.exceptions.RequestException:
        print(f"Could not connect to IP {ip}")
        return "", []


def get_current_run_details_from_robot(
    ip: str,
    slack_bot: slack.Slack,
    running_robots: List[str],
    completed_robots: List[str],
) -> Tuple[List[str], List[str]]:
    """Get current run from robot."""
    robot_name, run_list = get_robot_run_info(ip)
    if len(run_list) > 0:
        most_recent_run = run_list[-1]
        if most_recent_run["current"]:
            run_status = most_recent_run["status"]
            if run_status == "awaiting-recovery":
                if (
                    robot_name not in completed_robots
                    and robot_name not in running_robots
                ):
                    print(f"Run Status of {robot_name}: {run_status}")
                    message = f"⚠️ {robot_name} is in error recovery mode ⚠️"
                    slack_bot.send_slack_message(message)
                    completed_robots.append(robot_name)
            elif run_status == "running":
                print(f"Run Status of {robot_name}: {run_status}")
                running_robots.append(robot_name)
            else:
                print(f"Run Status of {robot_name}: {run_status}")
                completed_robots.append(robot_name)
        else:
            print(f"No run active on {robot_name}")
            completed_at = most_recent_run["completedAt"]
            completed_robots.append(robot_name)
            print(f"Last run completed at {completed_at}")
    return completed_robots, running_robots


if __name__ == "__main__":
    """Check robot statuses and post update in slack."""
    configs_file = None
    # READ CONFIGURATION FILE
    while not configs_file:
        configs_file = input("Please enter path to config.ini: ")
        if os.path.exists(configs_file):
            break
        else:
            configs_file = None
            print("Please enter a valid path")
    try:
        configurations = configparser.ConfigParser()
        configurations.read(configs_file)
    except configparser.ParsingError as e:
        print("Cannot read configuration file\n" + str(e))
    if configurations:
        slack_bot = slack.Slack(
            configurations, "abr-robot-alerts", "Robot Status Checker"
        )
    # GET IP ADDRESSES OF INTEREST
    available_users = slack_bot.get_users_in_channel("C04S59A3FHQ")
    robot_ips = [input("Enter IP of robot (type 'all' to run on all robots): ")]
    if robot_ips[0].lower() == "all":
        ip_file = configurations["DEFAULT"]["ips"]
        with open(ip_file) as file:
            file_dict = json.load(file)
            robot_dict = file_dict.get("ip_address_list")
            robot_ips = list(robot_dict.keys())

    # CHECK STATUS OF ROBOTS IN IP LIST
    running_robots: List[str] = []
    completed_robots: List[str] = []
    for ip in robot_ips:
        completed_robots, running_robots = get_current_run_details_from_robot(
            ip, slack_bot, running_robots, completed_robots
        )
    # PRINT COMPLETED ROBOTS
    len_completed = len(completed_robots)
    completed_message = (
        f"✅Robots {', '.join(completed_robots)} are finished✅ (n = {len_completed})"
    )
    slack_bot.send_slack_message(completed_message)
    # PRINT RUNNING ROBOTS
    len_run = len(running_robots)
    emoji = "\U0001F916"
    running_message = (
        f"{emoji} Robots {', '.join(running_robots)} are running{emoji} (n = {len_run})"
    )
    slack_bot.send_slack_message(running_message)
