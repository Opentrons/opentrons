"""Entrypoint for the USB-TCP bridge application."""
import asyncio
import logging
import time
from typing import NoReturn

from . import cli, usb_config, usb_monitor, tcp_conn, listener
from .default_config import get_gadget_config, PHY_NAME

from .serial_thread import create_worker_thread

LOG = logging.getLogger(__name__)


async def main() -> NoReturn:
    """Entrypoint for USB-TCP bridge."""
    parser = cli.build_root_parser()
    args = parser.parse_args()

    numeric_level = getattr(logging, args.log_level.upper())
    logging.basicConfig(level=numeric_level)

    LOG.info("Starting USB-TCP bridge")

    config = usb_config.SerialGadget(
        driver=usb_config.OSDriver(), config=get_gadget_config()
    )

    try:
        config.configure_and_activate()
        LOG.debug("Configured UDC as USB gadget")
    except BaseException as err:
        LOG.error("Failed to configure UDC as USB gadget")
        LOG.error(f"Exception: {format(err)}")
        exit(-1)

    # Give the kernel a couple seconds to set up the handle
    timeout = time.time() + 2.0
    while time.time() < timeout and not config.handle_exists():
        time.sleep(0.1)

    if not config.handle_exists():
        LOG.error("udev did not generate a serial handle")
        exit(-1)

    ser = None

    monitor = usb_monitor.USBConnectionMonitorFactory.create(
        phy_udev_name=PHY_NAME, udc_folder=config.udc_folder()
    )

    # Create a tcp connection that will be managed by `listen`
    tcp = tcp_conn.TCPConnection()

    # After the gadget starts up, need time to populate state
    time.sleep(1)

    monitor.begin()

    thread, queue = create_worker_thread()

    thread.start()

    if monitor.host_connected():
        LOG.debug("USB connected on startup")
        ser = listener.update_ser_handle(config, ser, True, tcp)

    while True:
        ser = listener.listen(monitor, config, ser, tcp, queue)


if __name__ == "__main__":
    asyncio.run(main())
