"""Network error and quality test script.

By sending broadcast messages that incur responses on the canbus network,
we can test whether all nodes get those messages without errors. At a
specified bitrate, knowing the length of the messages lets us stimulate
at a specific percentage of nameplace capacity. We can then generate
logs and stats about how well the test went, and possibly augment with
linux built-in canbus statistics from netutils.
"""

from enum import Enum, auto
import asyncio
import dataclasses
import logging
from logging.config import dictConfig
import argparse
import sys
import re
import time
from typing import Optional, AsyncGenerator, TextIO, Type, Union, Set, Tuple

from opentrons_hardware.firmware_bindings.messages import (
    MessageDefinition,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
    DeviceInfoResponse,
    HeartbeatResponse,
)
from opentrons_hardware.firmware_bindings.messages.payloads import EmptyPayload
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.drivers.can_bus.abstract_driver import AbstractCanDriver
from opentrons_hardware.drivers.can_bus.build import build_driver
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.hardware_control.network import NetworkInfo


IS_LINUX = sys.platform.startswith("linux")


async def detect_bitrate() -> float:
    """Find the current bitrate from OS interfaces."""
    if not IS_LINUX:
        raise RuntimeError("Cannot detect bitrate on a system not using socketcan")
    subproc = await asyncio.create_subprocess_exec(
        "ip -details link can0 get", stdout=asyncio.subprocess.PIPE
    )
    result = await subproc.communicate()
    stdout = result[0].decode()
    found = re.search(r" bitrate (\d+)", stdout)
    if not found:
        raise RuntimeError(
            f"Could not find bitrate in ip link result {repr(result[0])}"
        )
    return float(found.group(1))


async def get_os_stats() -> str:
    """Get the OS statistics for the interface."""
    if not IS_LINUX:
        raise RuntimeError(
            "Cannot use OS stats interface on a system not using socketcan"
        )
    subproc = await asyncio.create_subprocess_exec(
        "ip -statistics link can0 get", stdout=asyncio.subprocess.PIPE
    )
    return (await subproc.communicate())[0].decode()


log = logging.getLogger(__name__)


def _canbus_payload_length_bytes(specified_length_bytes: int) -> int:
    if specified_length_bytes <= 8:
        return specified_length_bytes
    elif specified_length_bytes <= 12:
        return 12
    elif specified_length_bytes <= 16:
        return 16
    elif specified_length_bytes <= 20:
        return 20
    elif specified_length_bytes <= 24:
        return 24
    elif specified_length_bytes <= 32:
        return 32
    elif specified_length_bytes <= 48:
        return 48
    elif specified_length_bytes <= 64:
        return 64
    raise ValueError(specified_length_bytes)


def _canbus_crc_length_bits(data_length_bytes: int) -> int:
    if data_length_bytes <= 16:
        return 17
    else:
        return 21


def _canbus_message_length_bits(for_message: Type[MessageDefinition]) -> int:
    payload_length = _canbus_payload_length_bytes(for_message.payload_type.get_size())
    crc_bits = _canbus_crc_length_bits(payload_length)
    data_bits = payload_length * 8
    return (
        1
        + 3  # SOF
        + 29  # non-id arbitration field elements
        + 4  # id
        + 4  # non-dlc control field elements
        + data_bits  # dlc
        + crc_bits
        + 2
        + 2  # crc delimiter
        + 7  # ack + ack delimiter  # EOF/interframe space
    )


@dataclasses.dataclass
class StatisticElement:
    """A single result event."""

    sec_since_start: float
    sending_node: NodeId
    bits: int
    error: bool


class StimulusMode(Enum):
    """Test modes for achieving the desired load."""

    ONE_TO_NONE = auto()
    #: Send messages that incur no responses, making the host entirely responsible for
    #: driving load. Disables statistics about response rates.
    ONE_TO_ONE = auto()
    #: Send messages to a specific node that incur a response from that node.
    ONE_TO_MANY = auto()
    #: Broadcast messages that incur a response from every node.


async def run_test(
    driver: AbstractCanDriver,
    load_percentage: float,
    bitrate: float,
    mode: StimulusMode,
    duration: Optional[float] = None,
) -> AsyncGenerator[StatisticElement, Optional[bool]]:
    """Run the test and yield results.

    Params
    ------
    driver: A pre-constructed canbus driver to use
    load_percentage: between 0 and 1, how much of the network bandwidth to use
                     during the test.
    bitrate: The network bitrate.
    duration: How long to run the test for. If None, until stopped by a signal.
    mode: The mode to run in (see the docs on StimulusMode)

    Returns
    -------
    An iterator of lists of statistic elements. Because this test may run for a long
    time and generate a lot of data, rather than doing the test blindly it's a
    coroutine that can be controlled by the caller.

    Sending the value True into the generator will stop the test.

    """
    results_queue: "asyncio.Queue[StatisticElement]" = asyncio.Queue()
    task = asyncio.get_event_loop().create_task(
        _do_test(driver, load_percentage, bitrate, results_queue, mode)
    )
    started = time.time()
    should_quit = False
    try:
        while not should_quit:
            results = await results_queue.get()
            sent_in = yield results
            should_quit = bool(sent_in)
            if duration and (time.time() - started > duration):
                should_quit = True
    finally:
        task.cancel()


class WarningsWithCooldown:
    """Issue warnings rate-limited by a cooldown time."""

    last_warning: float
    cooldown_secs: float

    def __init__(self, cooldown_secs: float = 10) -> None:
        """Build the warner."""
        self.last_warning = time.time()
        self.cooldown_secs = cooldown_secs

    def warning(self, message: str) -> None:
        """Send a warning to logging.warning."""
        now = time.time()
        if now > self.last_warning + self.cooldown_secs:
            log.warning(message)
            sys.stderr.write(message)
            self.last_warning = now


def _test_details_for_mode(
    mode: StimulusMode, present: Set[NodeId]
) -> Tuple[NodeId, Union[Type[DeviceInfoRequest], Type[HeartbeatResponse]], int]:
    if mode == StimulusMode.ONE_TO_ONE:
        target = present.pop()
        message: Union[
            Type[DeviceInfoRequest], Type[HeartbeatResponse]
        ] = DeviceInfoRequest
        response_size = _canbus_message_length_bits(DeviceInfoResponse)
    elif mode == StimulusMode.ONE_TO_NONE:
        target = NodeId.broadcast
        message = HeartbeatResponse
        response_size = 0
    else:
        target = NodeId.broadcast
        message = DeviceInfoRequest
        response_size = _canbus_message_length_bits(DeviceInfoResponse) * len(present)
    return target, message, response_size


async def _do_test(
    driver: AbstractCanDriver,
    load_percentage: float,
    bitrate: float,
    result_queue: "asyncio.Queue[StatisticElement]",
    mode: StimulusMode,
) -> None:
    """Run the test.

    This should be inside a task.

    Params
    -----
    driver: A pre-constructed canbus driver to use
    load_percentage: between 0 and 1, how much of the network bandwidth to use
                     during the test.
    bitrate: The network bitrate.
    result_queue: A queue to put stats in.
    mode: The mode to run in (see the docs on StimulusMode)
    """
    messenger = CanMessenger(driver)
    messenger.start()
    warner = WarningsWithCooldown()
    network_info = NetworkInfo(messenger)
    present = set(await network_info.probe(None, 1))
    if not present and mode != StimulusMode.ONE_TO_NONE:
        raise RuntimeError(
            f"No nodes are present and test mode {mode.name} requires at least "
            "one responder"
        )

    target, message, response_size = _test_details_for_mode(
        mode, {NodeId(node) for node in present if node in NodeId}
    )

    message_size = _canbus_message_length_bits(message)
    transaction_size = message_size + response_size

    time_per_transaction = float(transaction_size) / (bitrate * load_percentage)
    started = time.time()

    def listener(definition: MessageDefinition, arb_id: ArbitrationId) -> None:
        result_queue.put_nowait(
            StatisticElement(
                sec_since_start=time.time() - started,
                sending_node=arb_id.parts.originating_node,
                bits=definition.payload.get_size(),
                error=False,
            )
        )

    try:
        messenger.add_listener(listener)
        while True:
            then = time.time()
            try:
                await messenger.send(target, message(payload=EmptyPayload()))
                error = False
                bits = message_size
            except Exception:
                log.exception("failed to send")
                error = True
                bits = 0
            await result_queue.put(
                StatisticElement(
                    sec_since_start=(time.time() - started),
                    sending_node=NodeId.host,
                    bits=bits,
                    error=error,
                )
            )
            now = time.time()
            left = time_per_transaction - now - then
            if left > 0:
                await asyncio.sleep(left)
            else:
                warner.warning(f"cant keep up with messages, overran by {left*-1}sec")
                await asyncio.sleep(0)
    finally:
        await messenger.stop()


class SafeAppendWriter:
    """Write data to an opened file in append mode and flush."""

    fileobj: TextIO

    def __init__(self, filename: str) -> None:
        """Build the writer."""
        self.fileobj = open(filename, "a")

    def append(self, appendval: str) -> None:
        """Append a string to the file."""
        self.fileobj.write(appendval)
        self.fileobj.flush()


async def run(args: argparse.Namespace) -> None:
    """Run the test given a set of parsed arguments.

    Args should be parsed from at least the argument spec
    given by build_args().
    """
    driver = await build_driver(build_settings(args))
    saw = SafeAppendWriter(args.output_file)
    test = run_test(
        driver, args.load_factor, args.test_bitrate, args.mode, args.duration
    )
    saw.append("time_s,sender,bits,error\n")
    try:
        async for stat in test:
            saw.append(
                f"{stat.sec_since_start},{stat.sending_node.name},"
                f"{stat.bits},{stat.error}\n"
            )
    except KeyboardInterrupt:
        log.info("Quit due to CTRL-C")
        await test.asend(True)
    finally:
        await test.aclose()


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "/var/log/network_test.log",
            "maxBytes": 5000000,
            "level": logging.INFO,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.INFO,
        },
    },
}


def build_args() -> argparse.ArgumentParser:
    """Build arguments."""
    parser = argparse.ArgumentParser(description="Bus load testing")
    add_can_args(parser)
    parser.add_argument(
        "output_file", metavar="OUTPUT_FILE", type=str, help="Path to write output"
    )
    parser.add_argument(
        "load_factor",
        metavar="LOAD_FACTOR",
        type=float,
        help="What percentage of the bus bandwidth to use during the test. "
        "In [0, 1.0].",
    )
    parser.add_argument(
        "-r",
        "--test-bitrate",
        default=None,
        action="store",
        type=float,
        help="The bitrate the bus is using. If unspecified, autodetected.",
    )
    parser.add_argument(
        "-d",
        "--duration",
        default=None,
        action="store",
        type=float,
        help="Duration of the test; if not specified, unlimited",
    )
    parser.add_argument(
        "-m",
        "--mode",
        default=StimulusMode.ONE_TO_MANY,
        choices=list(StimulusMode),
        type=lambda val: StimulusMode[val],
        help="Testing mode. Use ONE_TO_MANY for broadcast+response",
    )
    return parser


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)
    parser = build_args()
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
