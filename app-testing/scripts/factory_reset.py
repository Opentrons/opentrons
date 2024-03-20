import argparse

from requests import post
from rich import print, print_json

BOOT_SCRIPTS_KEY = "bootScripts"
DECK_CALIBRATION_KEY = "deckCalibration"
TIP_LENGTH_CALIBRATIONS_KEY = "tipLengthCalibrations"
PIPETTE_OFFSET_CALIBRATIONS_KEY = "pipetteOffsetCalibrations"
RUNS_HISTORY_KEY = "runsHistory"
DECK_CONFIGURATION_KEY = "deckConfiguration"
AUTHORIZED_KEYS_KEY = "authorizedKeys"
ALL_KEYS = [
    BOOT_SCRIPTS_KEY,
    DECK_CALIBRATION_KEY,
    TIP_LENGTH_CALIBRATIONS_KEY,
    PIPETTE_OFFSET_CALIBRATIONS_KEY,
    RUNS_HISTORY_KEY,
    DECK_CONFIGURATION_KEY,
    AUTHORIZED_KEYS_KEY,
]


def reset(args: argparse.Namespace):
    url = f"http://{args.host}:31950/settings/reset"
    headers = {"opentrons-version": "*"}
    if args.reset_settings is None:
        args.reset_settings = ALL_KEYS

    body = {key: True for key in args.reset_settings}
    print(f"Requesting reset of {args.host} with: {" ".join(body.keys())}")
    response = post(url=url, headers=headers, json=body)

    print_json(response.text)
    print(f"Requesting restart of {args.host}")
    response = post(url=f"http://{args.host}:31950/server/restart", headers=headers, json={})
    print_json(response.text)



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Factory reset the robot. Omit all flags to reset all settings.")
    parser.add_argument(
        "host",
        help="The robot's IP address",
    )
    parser.add_argument(
        "--boot-scripts",
        help="Remove boot scripts",
        action="append_const",
        dest="reset_settings",
        const="bootScripts",
    )
    parser.add_argument(
        "--deck-calibration",
        help="Remove deck calibration",
        action="append_const",
        dest="reset_settings",
        const="deckCalibration",
    )
    parser.add_argument(
        "--tip-length-calibrations",
        help="Remove tip length calibrations",
        action="append_const",
        dest="reset_settings",
        const="tipLengthCalibrations",
    )
    parser.add_argument(
        "--pipette-offset-calibrations",
        help="Remove pipette offset calibrations",
        action="append_const",
        dest="reset_settings",
        const="pipetteOffsetCalibrations",
    )
    parser.add_argument(
        "--runs-history",
        help="Remove run history",
        action="append_const",
        dest="reset_settings",
        const="runsHistory",
    )
    parser.add_argument(
        "--deck-configuration",
        help="Remove deck configuration",
        action="append_const",
        dest="reset_settings",
        const="deckConfiguration",
    )
    parser.add_argument(
        "--authorized-keys",
        help="Remove authorized keys",
        action="append_const",
        dest="reset_settings",
        const="authorizedKeys",
    )
    args = parser.parse_args()
    reset(args)
