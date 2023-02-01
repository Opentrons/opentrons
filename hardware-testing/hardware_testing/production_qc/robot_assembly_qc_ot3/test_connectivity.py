"""Test Connectivity."""
import asyncio
from typing import List, Union

from opentrons.drivers.rpi_drivers.usb import USBBus
from opentrons.hardware_control.ot3api import OT3API
from opentrons.system import nmcli

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)


USB_WAIT_TIMEOUT_SECONDS = 10
USB_READ_BUS_LENGTH_NO_CONNECTION = 4
USB_PORTS_TO_TEST = [
    "usb-a-front",
    "usb-a-right-1",
    "usb-a-right-2",
    "usb-a-right-3",
    "usb-a-right-4",
    "usb-a-left-1",
    "usb-a-left-2",
    "usb-a-left-3",
    "usb-a-left-4",
]
# TODO: work with EEs to get Aux-Port tests implemented
AUX_PORT_TESTS = [
    "aux-left-can",
    "aux-left-estop",
    "aux-left-door-switch",
    "aux-right-can",
    "aux-right-estop",
    "aux-right-door-switch",
]


def _count_usb_listings(api: OT3API) -> int:
    board_rev = api._backend.board_revision
    ports = USBBus(board_rev)._read_bus()
    ports_len = len(ports)
    return max(ports_len - USB_READ_BUS_LENGTH_NO_CONNECTION, 0)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    usb_a_tests = [CSVLine(t, [CSVResult]) for t in USB_PORTS_TO_TEST]
    aux_tests = [CSVLine(t, [CSVResult]) for t in AUX_PORT_TESTS]
    other_tests = [
        CSVLine("ethernet", [str, CSVResult]),
        CSVLine("wifi", [str, str, str, CSVResult]),
        CSVLine("usb-b-rear", [CSVResult]),
    ]
    return other_tests + usb_a_tests + aux_tests  # type: ignore[return-value]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    # ETHERNET
    if not api.is_simulator:
        input("connect ethernet, then press ENTER:")
        ethernet_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.ETH_LL)
        # {
        #   'ipAddress': '192.168.1.105/24',
        #   'macAddress': '00:14:2D:69:43:79',
        #   'gatewayAddress': '192.168.1.1',
        #   'state': 'connected',
        #   'type': 'ethernet'
        # }
        eth_ip = ethernet_status["ipAddress"]
    else:
        eth_ip = "0.0.0.0"
    result = CSVResult.from_bool(bool(eth_ip))
    print(f"ethernet IP: {eth_ip} - {result}")
    report(section, "ethernet", [eth_ip, result])

    # WIFI
    if not api.is_simulator:
        wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
        wifi_ip = wifi_status["ipAddress"]
        if wifi_ip:
            print("wifi already connected: PASS")
            result = CSVResult.PASS
            report(section, "wifi", ["", "", wifi_ip, result])
        else:
            ssid = input("enter wifi ssid: ")
            password = input("enter wifi password: ")
            await nmcli.wifi_disconnect(ssid)
            res = await nmcli.configure(
                ssid, nmcli.SECURITY_TYPES.WPA_EAP, psk=password
            )
            if not res[0]:
                result = CSVResult.FAIL
            else:
                result = CSVResult.PASS
                wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
                wifi_ip = wifi_status["ipAddress"]
            report(section, "wifi", [ssid, password, wifi_ip, result])
    else:
        report(section, "wifi", ["", "", "0.0.0.0", CSVResult.PASS])
        assert nmcli.iface_info
        assert nmcli.configure
        assert nmcli.wifi_disconnect

    # USB-B-REAR
    if not api.is_simulator:
        usb_b_res = input(
            "Connect USB-B to computer. Does computer detect device? (y/n): "
        )
        result = CSVResult.from_bool("y" in usb_b_res.lower())
    else:
        result = CSVResult.PASS
    print(f"rear USB-B: {result}")
    report(section, "usb-b-rear", [result])

    # USB-A
    async def _is_usb_device_connected(wait: bool = False) -> bool:
        if api.is_simulator:
            return True
        for _ in range(USB_WAIT_TIMEOUT_SECONDS):
            if wait:
                await asyncio.sleep(1)
            if _count_usb_listings(api) > 0:
                return True
        return False

    if not api.is_simulator:
        input("prepare to test USB, press ENTER when ready:")
    for tag in USB_PORTS_TO_TEST:
        print("unplug all USB devices")
        while not api.is_simulator and await _is_usb_device_connected():
            await asyncio.sleep(0.5)
        print(f"[{tag}] connect a USB device (waiting...)")
        result = CSVResult.from_bool(await _is_usb_device_connected(wait=True))
        print(f"{tag}: {result}")
        report(section, tag, [result])

    # AUX
    # TODO: work with EEs to get Aux-Port tests implemented
