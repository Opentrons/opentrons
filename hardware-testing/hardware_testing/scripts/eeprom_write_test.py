"""EEPROM write endurance test"""
import asyncio
import logging
import argparse
import dataclasses
from dataclasses import fields as fid
import sys
import atexit
from datetime import datetime
from logging.config import dictConfig
from typing import List, TextIO, Optional

from opentrons_hardware.drivers.can_bus import (
    build,
    CanMessenger,
    WaitableCallback
)
from opentrons_hardware.firmware_bindings.constants import (
    MessageId,
    NodeId,
    FunctionCode,
)
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    payloads,
    fields,
)

from opentrons_hardware.firmware_bindings.message import CanMessage
from opentrons_hardware.firmware_bindings.arbitration_id import (
    ArbitrationId,
    ArbitrationIdParts,
)

from opentrons_hardware.firmware_bindings.messages.messages import get_definition
from opentrons_hardware.scripts.can_args import add_can_args, build_settings
from opentrons_hardware.firmware_bindings.utils import (
    BinarySerializable,
    BinarySerializableException,
    UInt16Field
)

@dataclasses.dataclass
class StyledOutput:
    """Dataclass bundling style and content for terminal output."""

    style: str
    content: str

class Writer:
    """Class that knows where to write and how to safely style output."""

    RESET_STYLE = "\033[0m"

    def __init__(self, destination: TextIO) -> None:
        """Build a writer with a destination.

        Args:
            destination: A TextIO to write to. If this is a canonical output
                         fd (e.g. stdout, stderr) styled output will be used;
                         otherwise (for instance, if destination is a pipe)
                         there will be no output styling.
        """
        self._dest = destination
        self._do_style = self._dest in (sys.stdout, sys.stderr)
        if self._do_style:
            atexit.register(self._reset_shell_style)

    def write(self, output: List[StyledOutput]) -> None:
        """Write styled output to the destination.

        Elements are joined with spaces and the styling is reset after all prints.
        """
        for elem in output:
            if self._do_style:
                self._dest.write(elem.style)
            self._dest.write(elem.content)
            if self._do_style:
                self._dest.write(self.RESET_STYLE)
            self._dest.write(" ")
        self._dest.flush()

    def _reset_shell_style(self) -> None:
        self._dest.write(self.RESET_STYLE)
        self._dest.flush()

async def monitor_task(
    messenger: CanMessenger,
    write_to: TextIO,
) -> None:
    """A task that listens for can messages.

    Args:
        messenger: Messenger
        write_to: Destination to write to

    Returns: Nothing.
    """
    writer = Writer(write_to)
    label_style = "\033[0;37;40m"

    info_header_style = "\033[0;36;40m"
    info_data_style = "\033[1;36;40m"

    warn_header_style = "\033[0;33;40m"
    warn_data_style = "\033[1;33;40m"

    err_header_style = "\033[0;31;40m"
    err_data_style = "\033[1;31;40m"

    with WaitableCallback(messenger) as cb:
        async for message, arbitration_id in cb:
            try:
                msg_name = MessageId(arbitration_id.parts.message_id).name
                from_node = NodeId(arbitration_id.parts.originating_node_id).name
                to_node = NodeId(arbitration_id.parts.node_id).name
                arb_id_str = f"{msg_name} ({from_node}->{to_node})"
            except ValueError:
                arb_id_str = f"0x{arbitration_id.id:x}"

            if arbitration_id.parts.message_id == MessageId.error_message:
                err_msg = err_msg = cast(ErrorMessage, message)
                if (
                    ErrorSeverity(err_msg.payload.severity.value)
                    == ErrorSeverity.warning
                ):
                    header_style = warn_header_style
                    data_style = warn_data_style
                else:
                    header_style = err_header_style
                    data_style = err_data_style
            else:
                header_style = info_header_style
                data_style = info_data_style

            # writer.write(
            #     [
            #         StyledOutput(style=header_style, content=str(datetime.now())),
            #         StyledOutput(style=data_style, content=arb_id_str + "\n"),
            #     ]
            # )
            # for name, value in (
            #     dict(
            #         (field.name, getattr(message.payload, field.name))
            #         for field in fid(message.payload)
            #     )
            # ).items():
            #     writer.write(
            #         [
            #             StyledOutput(style=label_style, content=f"\t{name}:"),
            #             StyledOutput(style=data_style, content=str(value) + "\n"),
            #         ]
            #     )

            if(msg_name == "read_eeprom_response"):
                out = message.payload.data.value
                out_str = ""
                for data_val in out:
                    out_str += str(data_val)
                    out_str += "-"
                print(out_str)




async def output_task(
    can_driver: CanMessenger,
    input_file: TextIO,
    output_file: TextIO,
) -> None:
    """UI task to create and send messages.

    Args:
        can_driver: Can driver
        input_file: IO buf to read from
        output_file: IO buf to write to
    """
    head_node_id = NodeId.head
    # can_message = await get_input(input_file, output_file, False)
    # if can_message:
    #     await can_driver.send(can_message)
    # while True:
    #     can_message = await get_input(input_file, output_file)
    #     if can_message:
    #         await can_driver.send(can_message)
    for cycle in range(4000000):
        print(cycle)
        cycle_print = cycle%255
        data_load = bytes([cycle_print,cycle_print,cycle_print,cycle_print,
                           cycle_print,cycle_print,cycle_print,cycle_print])
        write_msg = message_definitions.WriteToEEPromRequest(
                payload=payloads.EEPromDataPayload(
                    address=UInt16Field(150),
                    data_length=UInt16Field(8),
                    data=fields.EepromDataField(data_load),
                )
            )
        error = await can_driver.send(head_node_id, write_msg)


        read_msg = message_definitions.ReadFromEEPromRequest(
                payload=payloads.EEPromReadPayload(
                    address=UInt16Field(150),
                    data_length=UInt16Field(8)
                )
            )
        error = await can_driver.send(head_node_id, read_msg)


async def run(args: argparse.Namespace) -> None:
    """Entry point for script."""
    async with build.driver(build_settings(args)) as driver, CanMessenger(
        driver
    ) as messenger:
        try:
            all_fut = asyncio.gather(
                monitor_task(messenger, args.output),
                output_task(messenger, args.input, args.output),
            )
            await all_fut
        except KeyboardInterrupt:
            all_fut.cancel()
        except asyncio.CancelledError:
            pass


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "/var/log/eeprom_write_test.log",
            "maxBytes": 5000000,
            "level": logging.WARNING,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.WARNING,
        },
    },
}


def main() -> None:
    """Entry point."""
    dictConfig(LOG_CONFIG)

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o",
        "--output",
        help="Where to write monitored canbus output to",
        type=argparse.FileType("w"),
        default="-",
    )
    parser.add_argument(
        "-i",
        "--input",
        help="Where to listen for canbus input",
        type=argparse.FileType("r"),
        default="-",
    )
    add_can_args(parser)

    args = parser.parse_args()

    try:
        asyncio.run(run(args))
    except KeyboardInterrupt:
        args.output.write("Quitting...\n")
        args.output.flush()


if __name__ == "__main__":
    main()
