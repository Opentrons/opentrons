"""A script to test canbus loading."""
import argparse
import asyncio
import dataclasses
import enum
import logging
import json
from logging.config import dictConfig
from typing import Set, Optional, Dict
import time

from opentrons_hardware.drivers.can_bus import CanDriver
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
    DeviceInfoResponse,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.scripts.can_args import add_can_args


log = logging.getLogger(__name__)

LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "stream_handler": {
            "class": "logging.StreamHandler",
            "formatter": "basic",
            "level": logging.DEBUG,
        },
    },
    "loggers": {
        "": {
            "handlers": ["stream_handler"],
            "level": logging.DEBUG,
        },
    },
}


async def build_messenger(
    interface: str, bitrate: int, channel: Optional[str] = None
) -> CanMessenger:
    """Build a canbus messenger."""
    log.info(f"Connecting to {interface} {bitrate} {channel}")
    driver = await CanDriver.build(
        bitrate=bitrate, interface=interface, channel=channel
    )
    messenger = CanMessenger(driver=driver)
    messenger.start()
    return messenger


class BusProber:
    """Listener/sender to probe which nodes are active on the bus."""

    def __init__(self) -> None:
        """Build the prober."""
        self._detected_nodes: Set[NodeId] = set()
        self._done = asyncio.Event()

    async def run(
        self, messenger: CanMessenger, response_timeout_s: float = 1.0
    ) -> Set[NodeId]:
        """Run a probe and return detected devices."""
        try:
            messenger.add_listener(self)
            await asyncio.wait([self._stimulate(messenger)], timeout=response_timeout_s)
        except asyncio.TimeoutError:
            pass
        finally:
            messenger.remove_listener(self)
        return self._detected_nodes

    async def _stimulate(self, messenger: CanMessenger) -> None:
        self._done.clear()
        await messenger.send(node_id=NodeId.broadcast, message=DeviceInfoRequest())
        await self._done.wait()

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Incoming message callback."""
        if isinstance(message, DeviceInfoResponse):
            self._detected_nodes.add(
                NodeId(arbitration_id.parts.originating_node_id.value)
            )
        else:
            log.warning(f"Surprising message during probe: {message}")


class Modes(str, enum.Enum):
    """Command line option modes."""

    individual_one = "Send messages to one particular node and wait for responses"
    individual_all = "Send individual messages to each node and wait for responses"
    broadcast = "Send broadcasts and wait for responses from each node"


@dataclasses.dataclass
class LoadResults:
    """Quick dict to store results."""

    messages_sent: Dict[NodeId, int]
    messages_received: Dict[NodeId, int]


class BusLoader:
    """Main class for loading the bus and gathering data."""

    @classmethod
    def build_from_args(
        cls,
        mode: Modes,
        messenger: CanMessenger,
        rate: float,
        known: Set[NodeId],
        which: Optional[NodeId],
    ) -> "BusLoader":
        """Build an instance from typical command line args."""
        if mode == Modes.broadcast:
            return cls(1 / rate, messenger, set([NodeId.broadcast]), known)
        elif mode == Modes.individual_one:
            assert which, "Specify which for individual_one"
            return cls(1 / rate, messenger, set([which]), set([which]))
        elif mode == Modes.individual_all:
            return cls(1 / rate, messenger, known, known)
        else:
            raise RuntimeError(f"Invalid mode {mode}")

    def __init__(
        self,
        period: float,
        messenger: CanMessenger,
        targets: Set[NodeId],
        responders: Set[NodeId],
    ) -> None:
        """Build a loader with specified behavior."""
        self._period = period
        self._messenger = messenger
        self._targets = targets
        self._responders = responders
        self._stats = LoadResults({}, {})

    def __call__(
        self, message: MessageDefinition, arbitration_id: ArbitrationId
    ) -> None:
        """Message receive callback."""
        if isinstance(message, DeviceInfoResponse):
            node_id = NodeId(arbitration_id.parts.originating_node_id.value)
            try:
                self._stats.messages_received[node_id] += 1
            except KeyError:
                log.warning(f"unexpected response from {node_id}")
                self._stats.messages_received[node_id] = 1
        else:
            log.warning(f"unexpected message {type(message)}")

    async def _load_bus(self) -> None:
        warned = False
        then = time.time()
        while True:
            for node in self._targets:
                await self._messenger.send(node_id=node, message=DeviceInfoRequest())
                self._stats.messages_sent[node] += 1
            now = time.time()
            if now - then > self._period:
                if not warned:
                    log.warning(
                        f"Sending messages took {now-then}s, cannot achieve "
                        f"requested period {self._period}"
                    )
                    warned = True
            else:
                await asyncio.sleep(self._period - (now - then))

    async def run(self, run_for: float) -> LoadResults:
        """Run a load test for a duration."""
        self._stats = LoadResults(
            messages_sent={t: 0 for t in self._targets},
            messages_received={r: 0 for r in self._responders},
        )
        try:
            self._messenger.add_listener(self)
            await asyncio.wait([self._load_bus()], timeout=run_for)
        except asyncio.TimeoutError:
            pass
        except KeyboardInterrupt:
            log.warning("Stopping early, press CTRL-C again to discard data")
        finally:
            self._messenger.remove_listener(self)
        return self._stats


async def run(
    mode: Modes,
    messenger: CanMessenger,
    rate: float,
    which: Optional[NodeId],
    duration: float,
) -> LoadResults:
    """Main entrypoint."""
    nodes = await BusProber().run(messenger)
    log.info(f'Detected {", ".join([n.name for n in nodes])} on the bus')
    if mode == "individual-one" and which not in nodes:
        raise RuntimeError(f"Node {which} not detected on the bus")
    loader = BusLoader.build_from_args(mode, messenger, rate, nodes, which)
    return await loader.run(duration)


def cli_entry() -> None:
    """Entrypoint for CLI."""
    parser = argparse.ArgumentParser(
        description="Test the behavior of the canbus under heavy message load."
    )
    parser.add_argument(
        "mode",
        metavar="MODE",
        dest="mode",
        type=str,
        help="Stimulus mode. \n" + "\n\t".join([m.value for m in Modes]),
        choices=[m.name for m in Modes],
    )
    parser.add_argument(
        "duration",
        metavar="DURATION",
        dest="duration",
        type=float,
        help="How long to run in seconds",
    )
    parser.add_argument(
        "-r",
        "--rate",
        help="Stimulus messages to send per second",
        type=float,
        default=50,
        dest="rate",
    )
    parser.add_argument(
        "-w",
        "--which",
        dest="which",
        type=str,
        help="If using individual-one mode, select the target",
        choices=[n.name for n in NodeId],
        default=None,
    )
    parser.add_argument(
        "-o", "--output-file", type=argparse.FileType("w"), dest="output_file"
    )
    add_can_args(parser)
    args = parser.parse_args()
    dictConfig(LOG_CONFIG)
    messenger = asyncio.run(build_messenger(args.interface, args.bitrate, args.channel))
    results = asyncio.run(
        run(
            Modes[args.mode],
            messenger,
            args.rate,
            NodeId[args.which],
            args.duration,
        )
    )
    if args.output_file:
        json.dump(results, args.output_file)
    print(results)
    if NodeId.broadcast in results.messages_sent:
        total_responses = sum(results.messages_received.values())
        total_sent = sum(results.messages_sent.values())
        expected_responses = total_sent * len(list(results.messages_received.keys()))
        percent = int(total_responses / expected_responses * 100)
        print(f"Got {total_responses} from {total_sent} broadcasts: {percent}%")
    else:
        total_sent = 0
        total_received = 0
        for node_id, sent in results.messages_sent.items():
            received = results.messages_received[node_id]
            total_sent += sent
            total_received += received
            percent = int(received / sent * 100)
            print(f"{node_id.name}: sent {sent}, received {received}, {percent}%")
        total_percent = int((total_received / total_sent) * 100)
        print(f"total: sent {total_sent}, received {total_received}, {total_percent}%")
