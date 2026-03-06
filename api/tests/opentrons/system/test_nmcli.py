from typing import List, Optional, Tuple

import pytest
from pytest import MonkeyPatch

from opentrons.system import network_constants, nmcli


def test_parse_colonsep() -> None:
    assert nmcli._parse_colonsep_response(
        "dank mimos\\: slow zone:100:yes:wpa2\n"
        "some other network:20:no:wep\n"
        "blah:4:yes:none\n"
    ) == [
        ["dank mimos: slow zone", "100", "yes", "wpa2"],
        ["some other network", "20", "no", "wep"],
        ["blah", "4", "yes", "none"],
    ]


def test_sanitize_args() -> None:
    cmd = [
        "nmcli",
        "connection",
        "add",
        "wifi.ssid",
        "Opentrons",
        "wifi-sec.psk",
        "test-password",
        "wifi-sec.key-mgmt",
        "wpa2-psk",
    ]
    sanitized = nmcli.sanitize_args(cmd)
    # Check preconditions
    assert "test-password" in cmd
    # Check output
    assert "test-password" not in sanitized

    cmd2 = ["nmcli", "connection", "modify", "+wifi-sec.psk", "test-password"]
    sanitized = nmcli.sanitize_args(cmd2)
    assert "test-password" in cmd2
    assert "test-password" not in sanitized


def test_output_transformations() -> None:
    fields = ["name", "type", "autorun", "active", "iface", "state"]
    should_have = [
        ["static-eth0", "802-3-ethernet", "yes", "yes", "eth0", "activated"],
        ["wifi-wlan0", "802-11-wireless", "yes", "no", "wlan0", "--"],
    ]
    # This test input is taken from the result of
    # nmcli -t -f name,type,autoconnect,active,device,state connection show
    test_input = """static-eth0:802-3-ethernet:yes:yes:eth0:activated
wifi-wlan0:802-11-wireless:yes:no:wlan0:--
"""
    # No transforms: correctly parse fields
    split = nmcli._dict_from_terse_tabular(fields, test_input)
    assert len(split) == 2
    for outp in zip(split, should_have):
        # All fields, in order, should be in the output
        assert fields == list(outp[0].keys())
        assert outp[1] == list(outp[0].values())

    # Transforms for some but not all keys
    transforms = {"name": lambda s: s.upper(), "active": lambda s: s == "yes"}
    split = nmcli._dict_from_terse_tabular(fields, test_input, transforms)
    assert split[0]["name"] == should_have[0][0].upper()
    assert split[1]["name"] == should_have[1][0].upper()
    assert split[0]["active"] is True
    assert split[1]["active"] is False


async def test_available_ssids(monkeypatch: MonkeyPatch) -> None:
    mock_nmcli_output = """mock_wpa2:90:no:WPA2
mock_no_security:80:no:
mock_enterprise:70:no:WPA1 WPA2 802.1X
mock_connected:60:yes:WPA2
mock_bad_security:50:no:foobar
--:40:no:"""

    expected_cmds = iter(
        (
            ["device", "wifi", "rescan"],
            [
                "--terse",
                "--fields",
                "ssid,signal,active,security",
                "device",
                "wifi",
                "list",
            ],
        )
    )

    expected = [
        {
            "ssid": "mock_wpa2",
            "signal": 90,
            "active": False,
            "security": "WPA2",
            "securityType": "wpa-psk",
        },
        {
            "ssid": "mock_no_security",
            "signal": 80,
            "active": False,
            "security": "",
            "securityType": "none",
        },
        {
            "ssid": "mock_enterprise",
            "signal": 70,
            "active": False,
            "security": "WPA1 WPA2 802.1X",
            "securityType": "wpa-eap",
        },
        {
            "ssid": "mock_connected",
            "signal": 60,
            "active": True,
            "security": "WPA2",
            "securityType": "wpa-psk",
        },
        {
            "ssid": "mock_bad_security",
            "signal": 50,
            "active": False,
            "security": "foobar",
            "securityType": "unsupported",
        },
        # note entry for 'ssid': '--' is expected to be filterd out
    ]

    async def mock_call(
        cmd: List[str], suppress_err: Optional[bool] = False
    ) -> Tuple[str, str, int]:
        assert cmd == next(expected_cmds)
        return mock_nmcli_output, "", 0

    monkeypatch.setattr(nmcli, "_call", mock_call)
    result = await nmcli.available_ssids(True)
    assert result == expected


async def test_networking_status(monkeypatch: MonkeyPatch) -> None:
    async def mock_call(cmd: List[str]) -> Tuple[str, str, int]:
        # Command: `nmcli networking connectivity`
        if "connectivity" in cmd:
            res = "full"
        elif "wlan0" in cmd:
            res = """GENERAL.HWADDR:B8:27:EB:5F:A6:89
IP4.ADDRESS[1]:--
IP4.GATEWAY:--
GENERAL.TYPE:wifi
GENERAL.STATE:30 (disconnected)"""
        elif "eth0" in cmd:
            res = """GENERAL.HWADDR:B8:27:EB:39:C0:9A
IP4.ADDRESS[1]:169.254.229.173/16
GENERAL.TYPE:ethernet
GENERAL.STATE:100 (connected)"""
        else:
            res = "incorrect nmcli call"

        return res, "", 0

    monkeypatch.setattr(nmcli, "_call", mock_call)

    assert await nmcli.is_connected() == "full"
    assert await nmcli.iface_info(network_constants.NETWORK_IFACES.WIFI) == {
        # test "--" gets mapped to None
        "ipAddress": None,
        "macAddress": "B8:27:EB:5F:A6:89",
        # test "--" gets mapped to None
        "gatewayAddress": None,
        "state": "disconnected",
        "type": "wifi",
    }

    assert await nmcli.iface_info(network_constants.NETWORK_IFACES.ETH_LL) == {
        "ipAddress": "169.254.229.173/16",
        "macAddress": "B8:27:EB:39:C0:9A",
        # test missing output gets mapped to None
        "gatewayAddress": None,
        "state": "connected",
        "type": "ethernet",
    }

    async def dummy_error_mock_call(cmd: List[str]) -> Tuple[str, str, int]:
        if "connectivity" in cmd:
            return "full", "", 0
        else:
            return "", "this is a dummy error", 10

    monkeypatch.setattr(nmcli, "_call", dummy_error_mock_call)
    assert await nmcli.is_connected() == "full"
    with pytest.raises(ValueError, match="this is a dummy error"):
        await nmcli.iface_info(network_constants.NETWORK_IFACES.WIFI)


@pytest.mark.parametrize(
    "output,name_result",
    [
        (
            "I would download a car (be7403d6-603c-4215-be24-c2d8d3a401ab) cloned as I would download a car-2 (a6d7ab31-f0e3-498f-a124-aa0cdb0b3127).",
            "I would download a car-2",
        ),
        (
            "(be7403d6-603c-4215-be24-c2d8d3a401ac) (be7403d6-603c-4215-be24-c2d8d3a401ab) cloned as (a6d7ab31-f0e3-498f-a124-aa0cdb0b3444)-2 (a6d7ab31-f0e3-498f-a124-aa0cdb0b3127).",
            "(a6d7ab31-f0e3-498f-a124-aa0cdb0b3444)-2",
        ),
        (
            "I would download a car cloned as (be7403d6-603c-4215-be24-c2d8d3a401ab) cloned as I would download a car cloned as-2 (a6d7ab31-f0e3-498f-a124-aa0cdb0b3127).",
            "I would download a car cloned as-2",
        ),
    ],
)
def test_nmcli_clone_result_re(output: str, name_result: str) -> None:
    assert nmcli._parse_clone_result(output) == name_result


CLONE_RESULT_TEMPLATE = (
    "{name} (be7403d6-603c-4215-be24-c2d8d3a401ab)"
    " cloned as {clone} (a6d7ab31-f0e3-498f-a124-aa0cdb0b3127)."
)


async def test_backed_up_modify_result_before_exit() -> None:
    cm = nmcli.BackedUpModify("test-conn")
    with pytest.raises(RuntimeError, match="Results not yet available"):
        cm.result()


async def test_backed_up_modify_enter_clones_connection(
    monkeypatch: MonkeyPatch,
) -> None:
    calls: List[List[str]] = []

    async def mock_connection_exists(ssid: str) -> Optional[str]:
        return None

    async def mock_call(
        cmd: List[str], suppress_err: bool = False
    ) -> Tuple[str, str, int]:
        calls.append(cmd)
        if cmd[:2] == ["connection", "clone"]:
            return (
                CLONE_RESULT_TEMPLATE.format(name="test-conn", clone="test-conn-1"),
                "",
                0,
            )
        return "", "", 0

    monkeypatch.setattr(nmcli, "connection_exists", mock_connection_exists)
    monkeypatch.setattr(nmcli, "_call", mock_call)

    cm = nmcli.BackedUpModify("test-conn")
    clone_name = await cm.__aenter__()
    assert clone_name == "test-conn-1"
    assert ["connection", "clone", "test-conn", "test-conn-1"] in calls


async def test_backed_up_modify_enter_skips_existing_clone_names(
    monkeypatch: MonkeyPatch,
) -> None:
    existing = {"test-conn-1", "test-conn-2"}

    async def mock_connection_exists(ssid: str) -> Optional[str]:
        return ssid if ssid in existing else None

    async def mock_call(
        cmd: List[str], suppress_err: bool = False
    ) -> Tuple[str, str, int]:
        if cmd[:2] == ["connection", "clone"]:
            assert cmd == ["connection", "clone", "test-conn", "test-conn-3"]
            return (
                CLONE_RESULT_TEMPLATE.format(name="test-conn", clone="test-conn-3"),
                "",
                0,
            )
        return "", "", 0

    monkeypatch.setattr(nmcli, "connection_exists", mock_connection_exists)
    monkeypatch.setattr(nmcli, "_call", mock_call)

    cm = nmcli.BackedUpModify("test-conn")
    assert await cm.__aenter__() == "test-conn-3"


async def test_backed_up_modify_enter_clone_failure_raises(
    monkeypatch: MonkeyPatch,
) -> None:
    async def mock_connection_exists(ssid: str) -> Optional[str]:
        return None

    async def mock_call(
        cmd: List[str], suppress_err: bool = False
    ) -> Tuple[str, str, int]:
        return "", "no such connection profile", 10

    monkeypatch.setattr(nmcli, "connection_exists", mock_connection_exists)
    monkeypatch.setattr(nmcli, "_call", mock_call)

    cm = nmcli.BackedUpModify("nonexistent")
    with pytest.raises(RuntimeError, match="Failed to clone nonexistent"):
        await cm.__aenter__()


async def test_backed_up_modify_success(monkeypatch: MonkeyPatch) -> None:
    """Clone comes up, original removed, clone renamed."""
    calls: List[List[str]] = []
    removed: List[Optional[str]] = []

    async def mock_connection_exists(ssid: str) -> Optional[str]:
        return None

    async def mock_call(
        cmd: List[str], suppress_err: bool = False
    ) -> Tuple[str, str, int]:
        calls.append(cmd)
        if cmd[:2] == ["connection", "clone"]:
            return (
                CLONE_RESULT_TEMPLATE.format(name="my-wifi", clone="my-wifi-1"),
                "",
                0,
            )
        if cmd == ["connection", "up", "id", "my-wifi-1"]:
            return "Connection successfully activated", "", 0
        if cmd == ["connection", "modify", "id", "my-wifi-1", "id", "my-wifi-1"]:
            return "", "", 0
        assert False, f"Unexpected call: {cmd}"

    async def mock_remove(
        ssid: Optional[str] = None, name: Optional[str] = None
    ) -> Tuple[bool, str]:
        removed.append(name)
        return True, "successfully deleted"

    monkeypatch.setattr(nmcli, "connection_exists", mock_connection_exists)
    monkeypatch.setattr(nmcli, "_call", mock_call)
    monkeypatch.setattr(nmcli, "remove", mock_remove)

    cm = nmcli.BackedUpModify("my-wifi")
    async with cm as clone_name:
        assert clone_name == "my-wifi-1"

    ok, msg = cm.result()
    assert ok is True
    assert "successfully activated" in msg
    assert "my-wifi" in removed
    assert "my-wifi-1" not in removed
    assert ["connection", "modify", "id", "my-wifi-1", "id", "my-wifi-1"] in calls


async def test_backed_up_modify_clone_up_fails(monkeypatch: MonkeyPatch) -> None:
    """Clone fails to come up: clone removed, original kept, result is failure."""
    removed: List[Optional[str]] = []

    async def mock_connection_exists(ssid: str) -> Optional[str]:
        return None

    async def mock_call(
        cmd: List[str], suppress_err: bool = False
    ) -> Tuple[str, str, int]:
        if cmd[:2] == ["connection", "clone"]:
            return (
                CLONE_RESULT_TEMPLATE.format(name="my-wifi", clone="my-wifi-1"),
                "",
                0,
            )
        if cmd == ["connection", "up", "id", "my-wifi-1"]:
            return "Error: activation failed", "connection timed out", 4
        assert False, f"Unexpected call: {cmd}"

    async def mock_remove(
        ssid: Optional[str] = None, name: Optional[str] = None
    ) -> Tuple[bool, str]:
        removed.append(name)
        return True, "successfully deleted"

    monkeypatch.setattr(nmcli, "connection_exists", mock_connection_exists)
    monkeypatch.setattr(nmcli, "_call", mock_call)
    monkeypatch.setattr(nmcli, "remove", mock_remove)

    cm = nmcli.BackedUpModify("my-wifi")
    async with cm as clone_name:
        assert clone_name == "my-wifi-1"

    ok, msg = cm.result()
    assert ok is False
    assert "my-wifi-1" in removed
    assert "my-wifi" not in removed


async def test_backed_up_modify_exception_deletes_clone(
    monkeypatch: MonkeyPatch,
) -> None:
    """On exception in body, clone is deleted and result stays unset."""
    calls: List[List[str]] = []

    async def mock_connection_exists(ssid: str) -> Optional[str]:
        return None

    async def mock_call(
        cmd: List[str], suppress_err: bool = False
    ) -> Tuple[str, str, int]:
        calls.append(cmd)
        if cmd[:2] == ["connection", "clone"]:
            return (
                CLONE_RESULT_TEMPLATE.format(name="my-wifi", clone="my-wifi-1"),
                "",
                0,
            )
        if cmd == ["connection", "delete", "id", "my-wifi-1"]:
            return "Connection 'my-wifi-1' successfully deleted.", "", 0
        assert False, f"Unexpected call: {cmd}"

    monkeypatch.setattr(nmcli, "connection_exists", mock_connection_exists)
    monkeypatch.setattr(nmcli, "_call", mock_call)

    cm = nmcli.BackedUpModify("my-wifi")
    with pytest.raises(ValueError, match="something went wrong"):
        async with cm as clone_name:
            assert clone_name == "my-wifi-1"
            raise ValueError("something went wrong")

    assert ["connection", "delete", "id", "my-wifi-1"] in calls
    with pytest.raises(RuntimeError, match="Results not yet available"):
        cm.result()
