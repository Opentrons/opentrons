"""Record HEPA UV Testing."""
from datetime import datetime
import argparse from Parser
from typing import List

def create_line_to_add_to_sheet(turning_hepa_fan: str, turning_uv_on: bool, all_robots: List[str]):
    """Create set of lines to add to google sheet."""
    date = datetime.date()
    timestamp = datetime.datetime()
    columns = ["Date", "Robot", "Hepa Filter Serial", "Fan Start Time", "Fan Stop Time", "Fan On Duration (timestamp)", "Fan On Duration (min)", "UV # of Cycles", "UV Duration (min)", "Errors", "Level", "Description"]


if __name__ == "main":
    parser = argparse.ArgumentParser(description = "Record HEPA/UV Actions")
    parser.add_argument(
        "turning_hepa_fan",
        metavar="turning_hepa_fan",
        type=str,
        nargs=1,
        help="'on' or 'off'"
    )
    parser.add_argument(
        "turning_uv_on",
        metavar="TURNING_UV_ON",
        type=bool,
        nargs=1,
        help = "'True' or 'False'"
    )
    parser.add_argument(
        "all_robots",
        metavar="ALL_ROBOTS",
        type=bool,
        nargs=1,
        help="'True' or 'False'"
    )
     parser.add_argument(
        "google_sheet_name",
        metavar="GOOGLE_SHEET_NAME",
        type=str,
        nargs=1,
        help="Google sheet name.",
    )
    args = parser.parse_args()
    turning_hepa_fan = args.turning_hepa_fan[0]
    turning_uv_on = args.turning_uv_on[0]
    all_robots = args.all_robots
    if not all_robots:
        robot_list = input("Enter robots actions are occurring for in a comma seperated list.")
    else:
        robot_list = [
            "DVT1ABR1",
            "DVT1ABR2",
            "DVT1ABR3",
            "DVT1ABR4",
            "DVT2ABR5",
            "DVT2ABR6",
            "PVT1ABR7",
            "PVT1ABR8",
            "PVT1ABR9",
            "PVT1ABR10",
            "PVT1ABR11",
            "PVT1ABR12",
        ]
    
    