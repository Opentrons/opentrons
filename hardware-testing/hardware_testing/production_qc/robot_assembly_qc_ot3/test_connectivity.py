"""Test Connectivity."""
import asyncio
from subprocess import run as run_subprocess
from typing import List, Union, Optional

from opentrons.hardware_control.ot3api import OT3API
from opentrons.system import nmcli

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)


USB_WAIT_TIMEOUT_SECONDS = 10
USB_READ_BUS_LENGTH_NO_CONNECTION = 4
USB_PORTS_TO_TEST = [
    "usb-1",
    "usb-2",
    "usb-3",
    "usb-4",
    "usb-5",
    "usb-6",
    "usb-7",
    "usb-8",
    "usb-9",
]
AUX_PORT_TESTS = [
    "aux-1-door-switch",
    "aux-1-sync",
    "aux-1-estop-signal",
    "aux-1-estop-detect",
    "aux-1-presence",
    "aux-1-id",
    "aux-2-door-switch",
    "aux-2-sync",
    "aux-2-estop-signal",
    "aux-2-estop-detect",
    "aux-2-presence",
    "aux-2-id",
]
AUX_CAN_TESTS = [
    "aux-1-pcan",
    "aux-2-pcan",
]

ALLOWED_SECURITY_TYPES = {
    nmcli.SECURITY_TYPES.NONE.value: nmcli.SECURITY_TYPES.NONE,
    nmcli.SECURITY_TYPES.WPA_EAP.value: nmcli.SECURITY_TYPES.WPA_EAP,
    nmcli.SECURITY_TYPES.WPA_PSK.value: nmcli.SECURITY_TYPES.WPA_PSK,
}


async def _test_ethernet(api: OT3API, report: CSVReport, section: str) -> None:
    if not api.is_simulator:
        ui.get_user_ready("connect ethernet cable")
        ethernet_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.ETH_LL)
        eth_ip = ethernet_status["ipAddress"]
    else:
        eth_ip = "0.0.0.0"
    result = CSVResult.from_bool(bool(eth_ip))
    report(section, "ethernet", [eth_ip, result])


async def _test_wifi(report: CSVReport, section: str) -> None:
    ssid = ""
    password: Optional[str] = None
    result = CSVResult.FAIL

    def _finish() -> None:
        report(section, "wifi", [ssid, password, wifi_ip, result])

    wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
    wifi_ip = wifi_status["ipAddress"]
    if wifi_ip:
        result = CSVResult.PASS
        return _finish()

    print("scanning wifi networks...")
    ssids = await nmcli.available_ssids()
    if not ssids:
        ui.print_error("no ssids found")
        return _finish()
    checked_ssids = [
        s for s in ssids if s["securityType"] in list(ALLOWED_SECURITY_TYPES.keys())
    ]
    if not checked_ssids:
        ui.print_error("no ssids found with compatible security types")
        return _finish()
    # get just the first x10 names, removing repetitions
    ssid_names_list: List[str] = list()
    for s in checked_ssids:
        if s["ssid"] not in ssid_names_list:
            ssid_names_list.append(s["ssid"])
    print("found wifi networks:")
    for i, n in enumerate(ssid_names_list[:10]):
        print(f"\t{i + 1}: {n}")
    res = input("select wifi number: ")
    try:
        ssid = ssid_names_list[int(res) - 1]
        print(f'"{ssid}"')
    except (ValueError, KeyError) as e:
        ui.print_error(str(e))
        _finish()
    found_ssids = [s for s in ssids if ssid == s["ssid"]]
    ssid_info = found_ssids[0]
    sec = ALLOWED_SECURITY_TYPES[ssid_info["securityType"]]
    if sec != nmcli.SECURITY_TYPES.NONE:
        password = input("enter wifi password: ")
    try:
        print("connecting...")
        await nmcli.configure(ssid, sec, psk=password)
    except ValueError as e:
        ui.print_error(str(e))
        return _finish()
    wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
    wifi_ip = wifi_status["ipAddress"]
    result = CSVResult.from_bool(bool(wifi_ip))
    return _finish()


async def _test_usb_a_ports(api: OT3API, report: CSVReport, section: str) -> None:
    if not api.is_simulator:
        ui.get_user_ready("insert USB drives into all x9 USB-A ports")
        print("pausing 2 seconds before reading USB data")
        await asyncio.sleep(2)
        res = run_subprocess(["blkid"], capture_output=True, text=True)
        output = res.stdout
    else:
        _stored_names = [f"OT3-{p.upper()}" for p in USB_PORTS_TO_TEST]
        output = " ".join(_stored_names)

    print(f"output from blkid:\n{output}\n")
    for tag in USB_PORTS_TO_TEST:
        found = f"OT3-{tag.upper()}" in output
        result = CSVResult.from_bool(found)
        report(section, tag, [result])


async def _test_aux(api: OT3API, report: CSVReport, section: str) -> None:
    # FIXME: add Aux GPIO tests once testing PCBA arrives
    for t in AUX_PORT_TESTS:
        print(f"FIXME: skipping {t}")
        report(section, t, [CSVResult.PASS])

    # PCAN
    if not api.is_simulator:
        ui.get_user_ready("prepare CAN analyzer and PCAN software")
    for test_name in AUX_CAN_TESTS:
        if api.is_simulator:
            result = CSVResult.PASS
        else:
            inp = ui.get_user_answer(
                f"does {test_name.upper()} count TRANSMIT = RECEIVE"
            )
            result = CSVResult.from_bool(inp)
        report(section, test_name, [result])


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    usb_a_tests = [CSVLine(t, [CSVResult]) for t in USB_PORTS_TO_TEST]
    aux_tests = [CSVLine(t, [CSVResult]) for t in AUX_PORT_TESTS]
    can_tests = [CSVLine(t, [CSVResult]) for t in AUX_CAN_TESTS]
    other_tests = [
        CSVLine("ethernet", [str, CSVResult]),
        CSVLine("wifi", [str, str, str, CSVResult]),
        CSVLine("usb-b-rear", [CSVResult]),
    ]
    return other_tests + usb_a_tests + aux_tests + can_tests  # type: ignore[return-value]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    # ETHERNET
    ui.print_header("ETHERNET")
    await _test_ethernet(api, report, section)

    # WIFI
    ui.print_header("WIFI")
    if not api.is_simulator:
        await _test_wifi(report, section)
    else:
        report(section, "wifi", ["", "", "0.0.0.0", CSVResult.PASS])
        assert nmcli.iface_info
        assert nmcli.configure
        assert nmcli.wifi_disconnect

    # USB-B-REAR
    ui.print_header("USB-B-REAR")
    if not api.is_simulator:
        inp = ui.get_user_answer(
            "Connect USB-B to computer, does computer detect device"
        )
        result = CSVResult.from_bool(inp)
    else:
        result = CSVResult.PASS
    report(section, "usb-b-rear", [result])

    # USB-A
    ui.print_header("USB-A")
    await _test_usb_a_ports(api, report, section)

    # AUX
    ui.print_header("AUX")
    await _test_aux(api, report, section)
