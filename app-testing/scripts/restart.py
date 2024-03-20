import argparse
import json
import sys

from requests import post
from rich import get_console

headers = {"opentrons-version": "*"}
console = get_console()


def restart(args: argparse.Namespace):
    url = f"http://{args.host}:31950/server/restart"
    console.print(f"Requesting -> restart of {args.host}\n")

    response = post(url=url, headers=headers, json={})
    if response.status_code == 200:
        console.print(f"Response -> [bold green]{json.loads(response.text)['message']}")
    else:
        console.print("Response -> [bold red] restart failed")
        console.print_json(response.text)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Restart the robot.")
    parser.add_argument(
        "host",
        help="The robot's IP address",
    )
    args = parser.parse_args()
    restart(args)
