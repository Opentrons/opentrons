"""Script to identify peripherals on the can bus."""
import argparse
import asyncio
from typing import Optional

from opentrons_hardware.drivers.can_bus import (
    CanDriver,
    MessageId,
    FunctionCode,
    NodeId,
    CanMessage,
    ArbitrationId,
    ArbitrationIdParts,
)
from opentrons_hardware.drivers.can_bus.messages.payloads import DeviceInfoResponseBody
from opentrons_hardware.scripts.can_args import add_can_args


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
            body = DeviceInfoResponseBody.build(message.data)
            node = NodeId(body.node_id.value)
            print(f"Received response from Node: {node.name}({node.value:x})")
            print(f"\tArbitration id: {message.arbitration_id}. Body: {body}")


async def run(interface: str, bitrate: int, channel: Optional[str] = None) -> None:
    """Entry point for script."""
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


def main() -> None:
    """Entry point."""
    parser = argparse.ArgumentParser(description="Identify peripherals on the can bus.")
    add_can_args(parser)

    args = parser.parse_args()

    asyncio.run(run(args.interface, args.bitrate, args.channel))


if __name__ == "__main__":
    main()
