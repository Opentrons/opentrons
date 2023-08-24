# Run from the robot-server directory with:
#   pipenv run python foo/bar/benchmark_analysis_fetches.py

import argparse
import contextlib
import sys
import time

import requests


BIG_PROTOCOL = """
import itertools


requirements = {"apiLevel": "2.15", "robotType": "OT-2"}


def run(protocol):
    well_plate = protocol.load_labware(
        "appliedbiosystemsmicroamp_384_wellplate_40ul", 1
    )

    tip_racks = [
        protocol.load_labware("opentrons_96_filtertiprack_20ul", slot)
        for slot in [2, 3, 4, 5]
    ]
    tips = list(itertools.chain.from_iterable(t.wells() for t in tip_racks))

    pipette = protocol.load_instrument(
        "p20_single_gen2", mount="left"
    )

    for _ in range(4):
        for tip, well in zip(tips, well_plate.wells()):
            pipette.pick_up_tip(tip)
            pipette.mix(repetitions=4, volume=20, location=well)
            pipette.drop_tip(tip)
"""


@contextlib.contextmanager
def print_time(message):
    print(message)
    begin = time.monotonic()
    yield
    end = time.monotonic()
    print(f"done {message} ({end-begin:.3f}s)")


def wait_for_analyses_to_settle(session, base_url):
    """Wait until all protocols' analyses have completed.

    Return a list of (protocol_id, analysis_id) tuples.
    """
    while True:
        all_protocols_response = session.get(f"{base_url}/protocols")
        all_protocols_response.raise_for_status()

        protocols = all_protocols_response.json()["data"]

        all_analysis_statuses = [
            analysis_summary["status"]
            for protocol in protocols
            for analysis_summary in protocol["analysisSummaries"]
        ]

        analysis_is_complete = all(
            analysis_status == "completed" for analysis_status in all_analysis_statuses
        )
        if analysis_is_complete:
            return [
                (protocol["id"], analysis_summary["id"])
                for protocol in protocols
                for analysis_summary in protocol["analysisSummaries"]
            ]
        else:
            time.sleep(1)
            # Continue polling.


if __name__ == "__main__":
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument("--base-url", default="http://localhost:31950")
    argument_parser.add_argument("--upload", action="store_true")
    argument_parser.add_argument("--retrieve", action="store_true")

    arguments = argument_parser.parse_args()
    base_url = arguments.base_url
    upload = arguments.upload
    retrieve = arguments.retrieve

    if (not upload) and (not retrieve):
        print("You must specify at least one of --upload or --retrieve.")
        sys.exit(1)

    session = requests.Session()
    session.headers["Opentrons-Version"] = "*"

    if upload:
        with print_time("uploading protocol"):
            post_protocol_response = session.post(
                url=f"{base_url}/protocols",
                files={"files": ("protocol.py", BIG_PROTOCOL)},
            )
        post_protocol_response.raise_for_status()

    if retrieve:
        with print_time("waiting until all protocols' analyses have completed"):
            all_protocol_id_analysis_id_pairs = wait_for_analyses_to_settle(
                session, base_url
            )

        with print_time("fetching all analyses as documents"):
            for protocol_id, analysis_id in all_protocol_id_analysis_id_pairs:
                with print_time(
                    f"fetching protocol {protocol_id} analysis {analysis_id} as a document"
                ):
                    response = session.get(
                        f"{base_url}/protocols/{protocol_id}/analyses/{analysis_id}/asDocument"
                    )
                    response.raise_for_status()
                    print(f"{len(response.content)} bytes")

        with print_time("fetching all analyses the old way (may be cached)"):
            for protocol_id, analysis_id in all_protocol_id_analysis_id_pairs:
                with print_time(
                    f"fetching protocol {protocol_id} analysis {analysis_id} the old way (may be cached)"
                ):
                    response = session.get(
                        f"{base_url}/protocols/{protocol_id}/analyses/{analysis_id}"
                    )
                    response.raise_for_status()
                    print(f"{len(response.content)} bytes")
