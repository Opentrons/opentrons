"""Test Peripherals."""
import asyncio
from pathlib import Path
from subprocess import run as run_subprocess, Popen, CalledProcessError
from typing import List, Union, Optional
from urllib.request import urlopen

from opentrons.hardware_control.ot3api import OT3API
from opentrons.system import nmcli

from hardware_testing.data import create_datetime_string
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

SERVER_PORT = 8083
SERVER_CMD = "{0} -m http.server {1} --directory {2}"

CAM_PIC_FILE_NAME = "camera_{0}.jpg"

CAM_CMD_OT3 = (
    "v4l2-ctl --device /dev/video0 --set-fmt-video=width=640,height=480,pixelformat=MJPG "
    "--stream-mmap --stream-to={0} --stream-count=1"
)


async def _get_ip(api: OT3API) -> Optional[str]:
    _ip: Optional[str] = None
    if api.is_simulator:
        assert nmcli.iface_info
        _ip = "127.0.0.1"
    else:
        ethernet_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.ETH_LL)
        wifi_status = await nmcli.iface_info(nmcli.NETWORK_IFACES.WIFI)
        if ethernet_status["ipAddress"]:
            _ip = ethernet_status["ipAddress"]
        elif wifi_status["ipAddress"]:
            _ip = wifi_status["ipAddress"]
    return _ip


async def _take_picture(api: OT3API, report: CSVReport, section: str) -> Optional[Path]:
    cam_pic_name = CAM_PIC_FILE_NAME.format(create_datetime_string())
    if api.is_simulator:
        cam_pic_name = cam_pic_name.replace(".jpg", ".txt")
    cam_pic_path = report.parent / cam_pic_name

    process_cmd = CAM_CMD_OT3.format(str(cam_pic_path))
    print(process_cmd)
    try:
        if api.is_simulator:
            with open(cam_pic_path, "w") as f:
                f.write(str(cam_pic_name))  # create a test file
        else:
            run_subprocess(process_cmd.split(" "))  # take a picture
        result = CSVResult.from_bool(cam_pic_path.exists())
    except CalledProcessError as e:
        print(e)
        result = CSVResult.FAIL
    print(f"camera-active: {result}")
    report(section, "camera-active", [result])
    if bool(result):
        return cam_pic_path
    else:
        return None


async def _run_image_check_server(
    api: OT3API, report: CSVReport, section: str, file_path: Path
) -> None:
    result = CSVResult.FAIL
    server_process: Optional[Popen] = None

    async def _run_check() -> None:
        nonlocal result
        nonlocal server_process
        _ip = await _get_ip(api)
        if not _ip:
            print("error: no IP address")
            return
        server_address = f"{_ip}:{SERVER_PORT}"
        for py in ["python3", "python"]:
            process_cmd = SERVER_CMD.format(py, SERVER_PORT, str(file_path.parent))
            print(process_cmd)
            try:
                server_process = Popen(process_cmd.split(" "))
                break
            except Exception as e:
                print(e)
        if not server_process:
            print("error: unable to start http server")
            return
        await asyncio.sleep(0.5)  # give server time to start
        address = f"http://{server_address}/{file_path.name}"
        print(f"\n\nopen your web browser, and go to:\n\n\t{address}\n\n")
        if api.is_simulator:
            try:
                contents = urlopen(address).read()
            except Exception as e:
                print(e)
                return
            result = CSVResult.from_bool(
                contents.decode("utf-8") == file_path.name
            )
        else:
            inp = input("image OK? (y/n): ")
            result = CSVResult.from_bool("y" in inp)

    try:
        await _run_check()
    finally:
        if server_process:
            server_process.kill()
        print(f"camera-image: {result}")
        report(section, "camera-image", [result])


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("screen-on", [CSVResult]),
        CSVLine("screen-touch", [CSVResult]),
        CSVLine("deck-lights-on", [CSVResult]),
        CSVLine("deck-lights-off", [CSVResult]),
        CSVLine("status-light-on", [CSVResult]),
        CSVLine("door-switch", [CSVResult]),
        CSVLine("camera-active", [CSVResult]),
        CSVLine("camera-image", [CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""

    def _get_user_confirmation(question: str) -> bool:
        if api.is_simulator:
            return True
        return "y" in input(f"{question} (y/n): ").lower()

    # ODD
    result = _get_user_confirmation("is ODD on?")
    report(section, "screen-on", [CSVResult.from_bool(result)])
    result = _get_user_confirmation("is ODD touchscreen working?")
    report(section, "screen-touch", [CSVResult.from_bool(result)])

    # DECK LIGHTS
    result = _get_user_confirmation("are the DECK-LIGHTS on?")
    report(section, "deck-lights-on", [CSVResult.from_bool(result)])
    # TODO: enable once we are able to turn off the deck lights
    # result = "y" in input("are the DECK-LIGHTS off? (y/n): ")
    # report(section, "deck-lights-off", [CSVResult.from_bool(result)])

    # STATUS LIGHTS
    result = _get_user_confirmation("is the STATUS-LIGHT on?")
    report(section, "status-light-on", [CSVResult.from_bool(result)])
    # TODO: do more testing (colors, on/off, etc.) once implemented

    # DOOR SWITCH
    # TODO: add test once implemented

    # CAMERA
    cam_pic_path = await _take_picture(api, report, section)
    if cam_pic_path:
        await _run_image_check_server(api, report, section, cam_pic_path)
        cam_pic_path.unlink()
    else:
        print("skipping checking the image, because taking a picture failed")
