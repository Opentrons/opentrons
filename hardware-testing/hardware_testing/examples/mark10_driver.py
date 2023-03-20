"""Example using Mark10 Force Gauge."""
import argparse
import asyncio
from typing import Union

from hardware_testing.drivers import find_port, list_ports_and_select
from hardware_testing.drivers.mark10 import Mark10, SimMark10


def _get_gauge(is_simulating: bool) -> Union[Mark10, SimMark10]:
    if is_simulating:
        return SimMark10()
    else:
        try:
            port = find_port(*Mark10.vid_pid())
        except RuntimeError:
            port = list_ports_and_select("Mark10 Force Gauge")
        print(f"Setting up force gauge at port: {port}")
        return Mark10.create(port=port)


async def _main(is_simulating: bool) -> None:
    gauge = _get_gauge(is_simulating)
    gauge.connect()
    while True:
        input("ENTER to read from gauge:")
        print(gauge.read_force())


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    asyncio.run(_main(args.simulate))
