"""IP Grabber Test"""
from typing import Set, Dict, Any
import os
import json
import sys

storage_directory = r"C:\Users\NicholasShiland\ABR_Liquid_Measurement_Data"


"""GET ALL ROBOT IP's AND VOLUMES

DO some things idk
"""
robot = "PVT1ABR7"
#setup IP sheet
ip_json_file = os.path.join(storage_directory, "IP_N_VOLUMES.json")
#try to create an array copying the contents of IP_N_Volumes
try:
    ip_file = json.load(open(ip_json_file))
except FileNotFoundError:
    print(f"Add .json file with robot IPs to: {storage_directory}.")
    sys.exit()
tot_info = ip_file["STUFF"]
robot_info = tot_info[robot]
IP_add = robot_info["IP"]
exp_volume = robot_info["volume"]

print(IP_add)
print(exp_volume)

    #do smth to grab ip ad


"""notes
OKAY, so basically I need to make a JSON source file with the robot name, IP's, and corresponding volume changes and put it into the thing

need to find out how to read from a json file properly

{"DVT1ABR1" : {
	"IP": "ABR1's IP",
	"volume": "some volume"
	}
}

{"DVT1ABR4" : {
	"IP": "ABR4's IP",
	"volume": "some volume"
	}
}

{"PVT1ABR8" : {
	"IP": "ABR8's IP",
	"volume": "-495.6"
	}
}

{"PVT1ABR9" : {
	"IP": "ABR9's IP",
	"volume": "-47520"
	}
}

{"PVT1ABR10" : {
	"IP": "ABR10's IP",
	"volume": "-14400"
	}
}

{"PVT1ABR11" : {
	"IP": "ABR11's IP",
	"volume": "-19200"
	}
}

"""