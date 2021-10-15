"""Subscriber client application."""
import asyncio
import argparse
from typing import List

from notify_server.clients.subscriber import create


async def run(host_address: str, topics: List[str]) -> None:
    """Run the subscriber client."""
    print(f"Connecting to {host_address} for topics '{topics}'")
    sub = create(host_address, topics)
    async for e in sub:
        print(
            f"{e.event.createdOn}: topic={e.topic}, "
            f"publisher={e.event.publisher}, data={e.event.data}"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog="opentrons-subscriber",
        description="Opentrons notify-server subscriber client",
    )
    parser.add_argument(
        "-s",
        "--server-address",
        required=True,
        help="The address of the notify-server, for " "example tcp://localhost:5555",
    )
    parser.add_argument(
        "topics", nargs="+", help="At least one topic that will be subscribed to."
    )
    args = parser.parse_args()
    asyncio.run(run(host_address=args.server_address, topics=args.topics))
