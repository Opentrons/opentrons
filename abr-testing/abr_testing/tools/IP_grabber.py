"""IP Grabber Test"""
from typing import Set, Dict, Any
import argparse
import os
import json
import requests
import sys
from abr_testing.data_collection import read_robot_logs
from abr_testing.automation import google_drive_tool

storage_directory = args.storage_directory[0] #make sure this is above where storage directory is called

def get_ips(storage_directory: str) -> None:
    """GET ALL RUN LOGS.

    Connect to each ABR robot to read run log data.
    Read each robot's list of unique run log IDs and compare them to all IDs in storage.
    Any ID that is not in storage, download the run log and put it in storage.
    """
    ip_json_file = os.path.join(storage_directory, "IPs.json")
    try:
        ip_file = json.load(open(ip_json_file))
    except FileNotFoundError:
        print(f"Add .json file with robot IPs to: {storage_directory}.")
        sys.exit()
    ip_address_list = ip_file["ip_address_list"]
    for ip in ip_address_list:
        print("haha")
        #do smth to grab ip ad

# Set up IP sheet
    try:
        ip_path = os.path.join(storage_directory, "IP_addy.json")
    except FileNotFoundError:
        print("No IP sheet. Add IP addresses to storage notebook.")
    # google_sheet = google_sheets_tool.google_sheet(
    #     credentials_path, file_name, tab_number=0
    #)

"""notes
could storage dir be "C:\Users\NicholasShiland\Desktop\ABR" - IT IS YAY

OKAY, so basically I need to make a JSON source file with the robot name, IP's, and corresponding volume changes and put it into the "


"""