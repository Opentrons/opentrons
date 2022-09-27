"""Entrypoint for the USB-TCP bridge application."""
import asyncio
import logging
from typing import NoReturn
from .src import cli, usb_config, default_config

LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    """Entrypoint for USB-TCP bridge."""
    parser = cli.build_root_parser()
    args = parser.parse_args()

    numeric_level = getattr(logging, args.log_level.upper())
    logging.basicConfig(level=numeric_level)

    LOG.info("Starting USB-TCP bridge")

    config = usb_config.SerialGadget(
        driver=usb_config.OSDriver(), config=default_config.default_gadget
    )

    try:
        config.configure_and_activate()
        LOG.info("Configured UDC as USB gadget")
    except BaseException as err:
        LOG.error("Failed to configure UDC as USB gadget")
        LOG.error(f"Exception: {format(err)}")
        exit(-1)

    if not config.handle_exists():
        LOG.error("Cannot find UDC serial handle")
        exit(-1)

    ser = config.get_handle()

    while True:
        data = ser.readline()
        LOG.debug(f"Received: {data}")
        ser.write(data)


if __name__ == "__main__":
    asyncio.run(main())
