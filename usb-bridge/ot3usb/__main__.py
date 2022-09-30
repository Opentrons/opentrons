"""Entrypoint for the USB-TCP bridge application."""
import asyncio
import logging
import select
import time
from typing import NoReturn
from .src import cli, usb_config, default_config, usb_monitor

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

    # Spin for at least a couple seconds
    timeout = time.time() + 2.0
    while time.time() < timeout and not config.handle_exists():
        time.sleep(0.1)

    if not config.handle_exists():
        LOG.error("udev did not generate a serial handle")
        exit(-1)

    ser = None

    monitor = usb_monitor.USBConnectionMonitor("usbphynop1", "")

    monitor.begin()

    while True:
        rlist = [monitor]
        if ser:
            rlist.append(ser)
        ready = select.select(rlist, [], [])[0]
        if monitor in ready:
            # Read a new udev messages
            monitor.read_message()
            if ser:
                if not monitor.host_connected():
                    LOG.info("USB host disconnected")
                    ser = None
            elif monitor.host_connected():
                LOG.info("New USB host connected")
                ser = config.get_handle()
        if ser and ser in ready:
            # Ready serial data
            data = ser.read()
            LOG.debug(f"Received: {data}")
            ser.write(data)


if __name__ == "__main__":
    asyncio.run(main())
