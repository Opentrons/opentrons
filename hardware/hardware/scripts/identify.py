"""Script to identify peripherals on the can bus."""
import argparse
import asyncio
from typing import Optional

from hardware.drivers.can_bus import (
    CanDriver,
    MessageId,
    FunctionCode,
    NodeId,
    CanMessage,
    ArbitrationId,
    ArbitrationIdParts,
)


async def request(can_driver: CanDriver) -> None:
    """Send identify request.

    Args:
        can_driver: CanDriver

    Returns:
        None
    """
    parts = ArbitrationIdParts(
        function=FunctionCode.network_management,
        node_id=NodeId.broadcast,
        message_id=MessageId.device_info_request,
    )
    message = CanMessage(arbitration_id=ArbitrationId(parts=parts), data=bytearray())
    await can_driver.send(message=message)


async def wait_responses(can_driver: CanDriver) -> None:
    """Wait for identification responses.

    Display the responses

    Args:
        can_driver: CanDriver

    Returns:
        None
    """
    async for message in can_driver:
        if message.arbitration_id.parts.message_id == MessageId.device_info_response:
            node = NodeId(message.data[0])
            print(f"Received response from Node: {node.name}({node.value:x})")
            print(f"\tArbitration id: {message.arbitration_id}")


async def run(interface: str, bitrate: int, channel: Optional[str] = None) -> None:
    """Entry point for script."""
    ...
    driver = await CanDriver.build(
        bitrate=bitrate, interface=interface, channel=channel
    )
    await request(driver)

    try:
        await wait_responses(driver)
    except KeyboardInterrupt:
        print("Finished.")
    finally:
        driver.shutdown()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Identify peripherals on the can bus.")
    parser.add_argument(
        "--interface",
        type=str,
        required=True,
        help="the interface to use (ie: virtual, pcan, socketcan",
    )
    parser.add_argument(
        "--bitrate", type=int, default=250000, required=False, help="the bitrate"
    )
    parser.add_argument(
        "--channel", type=str, default=None, required=False, help="optional channel"
    )

    args = parser.parse_args()

    asyncio.run(run(args.interface, args.bitrate, args.channel))
