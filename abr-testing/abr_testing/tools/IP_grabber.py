"""IP Grabber Test"""
from typing import Set, Dict, Any
import argparse
import os
import json
import requests
import sys

storage_directory = "C:\Users\NicholasShiland\ABR_Liquid_Measurement_Data"


def get_ips(storage_directory: str) -> None:
    """GET ALL ROBOT IP's AND VOLUMES

    DO some things idk
    """
    robot = input("Robot: ")
    #setup IP sheet
    ip_json_file = os.path.join(storage_directory, "IP_N_Volumes.json")
    #try to create an array copying the contents of IP_N_Volumes
    try:
        ip_file = json.load(open(ip_json_file))
    except FileNotFoundError:
        print(f"Add .json file with robot IPs to: {storage_directory}.")
        sys.exit()
    robot_info = ip_file[robot]
    
    
    for ip in robot_info:
        print("haha")
        #do smth to grab ip ad


"""notes
OKAY, so basically I need to make a JSON source file with the robot name, IP's, and corresponding volume changes and put it into the thing

need to find out how to read from a json file properly

{'DVT1ABR1': 'IP address' : 'volume displaced'}
{'DVT1ABR2': 'IP address' : ''}
{'DVT1ABR3': 'IP address' : ''}
{'DVT1ABR4': 'IP address' : 'volume displaced'}
{'DVT2ABR5': 'IP address' : ''}
{'DVT2ABR6': 'IP address' : ''}
{'PVT1ABR7': 'IP address' : 'volume displaced'}
{'PVT1ABR8': 'IP address' : 'volume displaced'}
{'PVT1ABR9': 'IP address' : 'volume displaced'}
{'PVT1ABR10': 'IP address' : 'volume displaced'}
{'PVT1ABR11': 'IP address' : 'volume displaced'}
{'PVT1ABR12': 'IP address' : ''}
"""