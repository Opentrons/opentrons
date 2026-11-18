"""Scan and provision or clear the identity of one left Flex pipette.

Deploy hardware_testing.drivers.provision_pipette_protocol with hardware-testing.
See provision_pipette_ot3.md for scanner setup and the confirmation workflow.
"""

import asyncio
import http.client
import importlib.util
import json
from pathlib import Path
import re
import shutil
import socket
import struct
import subprocess
import sys
from time import monotonic
from typing import Any, Callable, Dict, List, NamedTuple, Optional

from opentrons.protocol_api import ParameterContext, ProtocolContext


metadata = {"protocolName": "Flex left pipette identity provisioning / clearing"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}

WORKER_MODULE = "hardware_testing.drivers.provision_pipette_protocol"
WORKER_TIMEOUT_SECONDS = 30.0
TARGET_MOUNT = "left"
SCAN_TIMEOUT_SECONDS = 600.0
ROBOT_SERVER_SOCKET = "/run/aiohttp.sock"
ROBOT_SERVER_SERVICE = "opentrons-robot-server.service"
RESTART_UNIT = "opentrons-pipette-provision-restart"
RESTART_CONFIRMATION = (
    "已安排服务重启：本次协议成功结束后，robot-server 服务将自动重启，App 会短暂断连。" "请等待重连再开始新运行，并核对左侧移液器识别。"
)

# Executed by systemd in a separate service, never by the protocol process.
# The program is passed in memory; it creates no script or provisioning log file.
RESTART_PROGRAM = r"""
import http.client
import json
import re
import socket
import subprocess
import sys
import time

SOCKET_PATH = "/run/aiohttp.sock"
WAIT_SECONDS = 180.0
SERVICE = "opentrons-robot-server.service"

def get(path, status_only=False):
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as stream:
        stream.settimeout(3.0)
        stream.connect(SOCKET_PATH)
        connection = http.client.HTTPConnection("localhost", timeout=3.0)
        connection.sock = stream
        try:
            connection.request("GET", path, headers={"Opentrons-Version": "*"})
            response = connection.getresponse()
            if status_only:
                return response.status
            if response.status == 503:
                return None
            if response.status != 200:
                raise RuntimeError("Robot server request failed")
            value = json.loads(response.read())
            if not isinstance(value, dict):
                raise ValueError("Invalid robot server response")
            return value
        finally:
            connection.close()

def main(run_path, systemctl, confirmation_message):
    if re.fullmatch(r"/runs/[A-Za-z0-9_-]+", run_path) is None:
        return 2
    if not systemctl.startswith("/"):
        return 2
    deadline = time.monotonic() + WAIT_SECONDS
    while time.monotonic() < deadline:
        try:
            run = get(run_path)["data"]
            if run.get("id") != run_path.rsplit("/", 1)[1]:
                return 2
            current = get("/runs?pageLength=1")["links"]["current"]
            if current is not None and current.get("href") != run_path:
                return 3
            state = run.get("status")
            if state == "succeeded":
                # Wait for the engine's finish steps AND the server's normal
                # completed-run persistence, so restart does not lose run state.
                saved = get(run_path + "/commandsAsPreSerializedList")
                persisted = False
                if saved is not None:
                    commands = saved["data"]
                    if not isinstance(commands, list):
                        return 4
                    for encoded in commands:
                        if not isinstance(encoded, str):
                            return 4
                        command = json.loads(encoded)
                        if (
                            command.get("commandType") == "comment"
                            and command.get("status") == "succeeded"
                            and command.get("params", {}).get("message") == confirmation_message
                        ):
                            persisted = True
                if persisted:
                    # Recheck after persistence; never follow a different run.
                    current = get("/runs?pageLength=1")["links"]["current"]
                    if current is not None and current.get("href") != run_path:
                        return 3
                    if get("/maintenance_runs/current_run", True) != 404:
                        return 3
                    subprocess.run(
                        [systemctl, "--no-ask-password", "--no-block", "restart", SERVICE],
                        stdin=subprocess.DEVNULL,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        check=True,
                        timeout=10,
                    )
                    return 0
            elif state not in {
                "running", "finishing", "paused", "blocked-by-open-door",
                "awaiting-recovery", "awaiting-recovery-paused",
                "awaiting-recovery-blocked-by-open-door",
            }:
                return 3
        except (OSError, ValueError, KeyError, TypeError, AttributeError,
                http.client.HTTPException, RuntimeError, subprocess.SubprocessError):
            return 4
        time.sleep(0.5)
    return 5

if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2], sys.argv[3]))
"""


class _RestartPlan(NamedTuple):
    """Bind a restart request to this run and the available service commands."""

    run_path: str
    systemd_run: str
    systemctl: str


NAME_CODES = {
    "P1KS": 0,
    "P1KM": 1,
    "P50S": 2,
    "P50M": 3,
    "P1KH": 4,
    "P50H": 5,
    "P2HH": 6,
    "P1KP": 7,
}
SERIAL_PATTERN = re.compile(
    r"(P1KS|P1KM|P50S|P50M|P1KH|P50H|P2HH|P1KP)V([0-9]{2})([A-Za-z0-9]{1,12})"
)


def add_parameters(parameters: ParameterContext) -> None:
    """Select the identity operation and whether a write should restart the service."""
    parameters.add_str(
        variable_name="operation",
        display_name="操作模式",
        default="write",
        choices=[
            {"display_name": "只读检查", "value": "inspect"},
            {"display_name": "直接写入", "value": "write"},
            {"display_name": "空白移液器首次烧录", "value": "bootstrap"},
            {"display_name": "清除后写入", "value": "clear_then_write"},
        ],
        description=(
            "固定左侧。写入模式只扫新码，无需匹配原码；空白移液器首次烧录需在协议启动时暂不连接移液器，"
            "扫码后按暂停提示安装；协议不提供仅清除身份，避免留下无法识别的空白身份。"
        ),
    )
    parameters.add_bool(
        variable_name="restart_service",
        display_name="写入后重启服务",
        default=False,
        description=(
            "仅对直接写入、空白首次烧录和清除后写入生效。开启后，EEPROM 验证通过且协议成功结束时自动重启 robot-server；"
            "关闭时不重启，但 App 可能暂时保留旧的移液器身份缓存。"
        ),
    )


def _scanner_reader(ctx: ProtocolContext) -> Callable[[], Optional[str]]:
    """Read the already connected scanner on its hardware loop or remote proxy."""
    from opentrons.hardware_control import SynchronousAdapter
    from opentrons.hardware_control.peripherals.barcode_scanner import BarcodeScanner

    hardware = ctx._core.get_hardware()
    scanners = [
        device
        for device in hardware.attached_peripherals
        if callable(getattr(device, "scan_barcode", None))
    ]
    if not scanners:
        raise RuntimeError("未检测到扫码枪。请将受支持的 USB 扫码枪连接到 Flex 后重新运行。")
    if len(scanners) != 1:
        raise RuntimeError("检测到多支扫码枪。请只保留一支，避免读取错误的输入设备。")
    scanner = scanners[0]
    if isinstance(scanner, BarcodeScanner):
        return SynchronousAdapter(scanner).scan_barcode

    # Remote hardware returns async proxy methods that forward to the daemon.
    # Only these wrappers may use a new event loop; local serial drivers cannot.
    try:
        from opentrons.util.pyro.pyro_client_async_adapter import _ACPO
    except ImportError as error:
        raise RuntimeError("当前软件不支持该扫码枪的硬件代理，请检查机器人软件版本。") from error
    if not isinstance(scanner, _ACPO):
        raise RuntimeError("扫码枪硬件接口不受支持，请检查机器人软件版本。")
    read_barcode = getattr(scanner, "scan_barcode")

    def read_remote() -> Optional[str]:
        return asyncio.run(read_barcode())

    return read_remote


def _scan_serial(
    ctx: ProtocolContext,
    prompt: str = "请扫描左侧移液器实物标签上的完整序列号。",
) -> str:
    """Show the scan step in the App before every read, including retries."""
    read_barcode = _scanner_reader(ctx)
    deadline = monotonic() + SCAN_TIMEOUT_SECONDS
    wait_message = f"{prompt}等待扫码，最长 10 分钟；扫码成功后自动继续。"
    while monotonic() < deadline:
        # Enter the engine before each read so an already stopped run cannot scan.
        ctx.delay(seconds=0.1, msg=wait_message)
        if monotonic() >= deadline:
            break
        # Match the QC scanner workflow: keep the scan prompt as the latest
        # App command while the hardware read blocks, not an unnamed delay.
        ctx.comment(wait_message)
        raw = read_barcode()
        # Check for stop/cancel before accepting a result and starting preflight.
        ctx.delay(seconds=0.1, msg="正在核对扫码内容。")
        if monotonic() >= deadline:
            break
        if raw is not None and not isinstance(raw, str):
            raise RuntimeError("扫码枪返回了非文本数据，请检查扫码枪配置。")
        serial = raw.strip(" \t\r\n") if raw else ""
        if not serial:
            ctx.comment(f"尚未读到条码，请继续扫码。{prompt}")
            continue
        try:
            _target_hex(serial)
        except ValueError:
            ctx.comment(f"扫码内容不是有效的移液器序列号：{serial!r}。{prompt}请重新扫描。")
            continue
        ctx.comment(f"已扫码：左侧（left），序列号 {serial}。")
        return serial
    raise TimeoutError("10 分钟内未扫到有效的移液器序列号，未开始 EEPROM 操作。请重新运行。")


def _target_hex(serial: str) -> str:
    """Encode the expected identity independently of worker success claims."""
    match = SERIAL_PATTERN.fullmatch(serial)
    if match is None:
        raise ValueError("序列号必须为已知型号前缀 + V + 两位版本 + 1–12 位 ASCII 字母数字尾码。")
    prefix, model, code = match.groups()
    return struct.pack(
        ">HH16s", NAME_CODES[prefix], int(model), code.encode("ascii")
    ).hex()


def _worker_command() -> List[str]:
    """Find the hardware-testing driver without executing it in the protocol."""
    try:
        spec = importlib.util.find_spec(WORKER_MODULE)
    except (ImportError, ValueError):
        spec = None
    if spec is None or not isinstance(spec.origin, str):
        raise RuntimeError(
            f"当前 Python（{sys.executable}）无法定位 {WORKER_MODULE}。"
            "请从工程根目录执行 make -C hardware-testing setup push-ot3 host=<机器人IP>，"
            "部署包含烧录驱动的 hardware_testing，再重新上传本协议并创建新运行。"
        )
    worker_path = Path(spec.origin).resolve()
    if worker_path.suffix != ".py" or not worker_path.is_file():
        raise RuntimeError(f"烧录驱动文件不可用：{worker_path}。请重新部署 hardware-testing。")
    return [sys.executable, "-m", WORKER_MODULE]


def _robot_server_get(path: str) -> Dict[str, Any]:
    """Read run state from the local robot server without creating files."""
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as stream:
        stream.settimeout(3.0)
        stream.connect(ROBOT_SERVER_SOCKET)
        connection = http.client.HTTPConnection("localhost", timeout=3.0)
        connection.sock = stream
        try:
            connection.request("GET", path, headers={"Opentrons-Version": "*"})
            response = connection.getresponse()
            if response.status != 200:
                raise RuntimeError(f"无法读取本次运行状态，HTTP {response.status}。")
            result = json.loads(response.read())
            if not isinstance(result, dict):
                raise RuntimeError("机器人服务返回的运行状态格式错误。")
            return result
        finally:
            connection.close()


def _current_run_path() -> str:
    """Capture the actual current run, never the most recently created run."""
    links = _robot_server_get("/runs?pageLength=1").get("links")
    current = links.get("current") if isinstance(links, dict) else None
    path = current.get("href") if isinstance(current, dict) else None
    if not isinstance(path, str) or re.fullmatch(r"/runs/[A-Za-z0-9_-]+", path) is None:
        raise RuntimeError("无法确定当前协议运行。请通过 App 启动本协议。")
    run = _robot_server_get(path).get("data", {})
    if (
        not isinstance(run, dict)
        or run.get("id") != path.rsplit("/", 1)[1]
        or run.get("current") is not True
        or run.get("status") != "running"
    ):
        raise RuntimeError("当前运行状态不允许安排服务重启。")
    return path


def _prepare_service_restart() -> _RestartPlan:
    """Check prerequisites before writing, without starting a restart task."""
    systemd_run = shutil.which("systemd-run")
    systemctl = shutil.which("systemctl")
    if systemd_run is None or systemctl is None:
        raise RuntimeError("缺少 systemd-run 或 systemctl，无法自动重启服务；未开始烧录。")
    try:
        status = subprocess.run(
            [
                systemctl,
                "--no-ask-password",
                "show",
                "--property=LoadState",
                "--property=ActiveState",
                ROBOT_SERVER_SERVICE,
            ],
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            check=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise RuntimeError("无法检查机器人服务，未开始烧录。") from error
    properties = dict(
        line.split("=", 1) for line in status.stdout.splitlines() if "=" in line
    )
    if (
        properties.get("LoadState") != "loaded"
        or properties.get("ActiveState") != "active"
    ):
        raise RuntimeError("机器人服务未处于已加载且运行的状态，未开始烧录。")
    return _RestartPlan(_current_run_path(), systemd_run, systemctl)


def _schedule_service_restart(ctx: ProtocolContext, plan: _RestartPlan) -> None:
    """Ask systemd to wait for this run to finish, then restart only robot-server."""
    ctx.comment("EEPROM 读回核对通过。正在安排本次协议成功结束后的服务重启。")
    if _current_run_path() != plan.run_path:
        raise RuntimeError("EEPROM 已验证，但当前运行已改变，未安排服务重启。")
    try:
        subprocess.run(
            [
                plan.systemd_run,
                "--no-ask-password",
                f"--unit={RESTART_UNIT}",
                "--collect",
                "--quiet",
                "--property=Type=exec",
                "--property=StandardOutput=null",
                "--property=StandardError=null",
                "--property=RuntimeMaxSec=240",
                sys.executable,
                "-c",
                RESTART_PROGRAM,
                plan.run_path,
                plan.systemctl,
                RESTART_CONFIRMATION,
            ],
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            check=True,
            timeout=10,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise RuntimeError(
            "EEPROM 已写入并验证，但自动重启任务未成功安排。请结束协议后手动重启 robot-server 服务。"
        ) from error
    ctx.comment(RESTART_CONFIRMATION)


def _stop_worker(process: subprocess.Popen) -> None:
    """Reap a child on cancellation or deadline; a sent write cannot be undone."""
    if process.poll() is not None:
        return
    try:
        process.terminate()
    except ProcessLookupError:
        process.communicate(timeout=2)
        return
    try:
        process.communicate(timeout=2)
    except subprocess.TimeoutExpired:
        process.kill()
        process.communicate(timeout=2)


def _identity_hex(result: Dict[str, Any], key: str) -> str:
    """Reject incomplete or internally inconsistent identity results."""
    identity = result.get(key)
    if not isinstance(identity, dict):
        raise RuntimeError(f"烧录程序未返回有效的 {key} 身份。")
    raw_hex = identity.get("raw_hex")
    if not isinstance(raw_hex, str) or not re.fullmatch(r"[0-9a-f]{40}", raw_hex):
        raise RuntimeError(f"烧录程序返回的 {key} 身份不是 20 字节。")
    name, model, data = struct.unpack(">HH16s", bytes.fromhex(raw_hex))
    if (
        type(identity.get("name")) is not int
        or type(identity.get("model")) is not int
        or identity["name"] != name
        or identity["model"] != model
        or identity.get("data_hex") != data.hex()
        or identity.get("blank") is not (raw_hex in ("00" * 20, "ff" * 20))
    ):
        raise RuntimeError(f"烧录程序返回的 {key} 身份字段互相矛盾。")
    return raw_hex


def _identity_label(raw_hex: str) -> str:
    """Describe the validated bytes without trusting the worker's serial label."""
    if raw_hex in ("00" * 20, "ff" * 20):
        return f"空白身份（20 字节全 {raw_hex[:2].upper()}）"
    name, model, data = struct.unpack(">HH16s", bytes.fromhex(raw_hex))
    prefix = next((key for key, value in NAME_CODES.items() if value == name), None)
    if prefix is not None and model <= 99:
        try:
            tail = data.rstrip(b"\x00").decode("ascii")
        except UnicodeDecodeError:
            pass
        else:
            serial = f"{prefix}V{model:02d}{tail}"
            if SERIAL_PATTERN.fullmatch(serial) and _target_hex(serial) == raw_hex:
                return serial
    return f"非空白身份（无法解析为有效条码，raw_hex={raw_hex}）"


def _require_matching_original(before: str, serial: str) -> None:
    """Require a matching original scan before clearing a nonblank identity."""
    if before in ("00" * 20, "ff" * 20, _target_hex(serial)):
        return
    current = _identity_label(before)
    detail = f"左侧移液器已有不同身份：{current}；扫描条码：{serial}。"
    if SERIAL_PATTERN.fullmatch(current) is None:
        advice = "当前非空白数据无法解析为有效条码，不能通过原码核对并清除。若需替换身份，请核对实物和目标条码后选择“直接写入”。"
    else:
        advice = "扫描的原码与当前身份不匹配。请核对左侧实物，先扫描匹配的原码，不能用新码代替原码。"
    raise RuntimeError(detail + advice)


def _worker_failure(result: Dict[str, Any], action: str, serial: str) -> RuntimeError:
    """Include the observed identity and explain an older worker's write policy."""
    detail = f"烧录程序失败：{result.get('error') or result.get('status')}"
    if result.get("before") is not None:
        before = _identity_hex(result, "before")
        detail += (
            f"。操作前身份：{_identity_label(before)}；扫描条码：{serial}；" f"raw_hex={before}。"
        )
    if action in {"inspect", "write"} and result.get("error") == (
        "Existing identity is nonblank and differs from the requested serial. "
        "Overwrite is not supported."
    ):
        detail += "机器人上的 worker 仍是会拒绝身份差异的旧版；请重新部署 hardware-testing，" "同时上传新版协议并创建新运行。"
    return RuntimeError(detail)


def _validate_result(
    stdout: str,
    return_code: int,
    action: str,
    which: str,
    serial: str,
    *,
    allow_clear_without_original: bool = False,
) -> Dict[str, Any]:
    """Require a matching response and independently check readback bytes."""
    if action not in {"inspect", "write", "clear"}:
        raise ValueError("Unsupported identity operation.")
    if allow_clear_without_original and action != "clear":
        raise ValueError("Only clear may skip the original barcode match.")
    try:
        result = json.loads(stdout)
    except (ValueError, TypeError) as error:
        raise RuntimeError("烧录程序未返回单个有效 JSON 结果，无法确认操作成功。") from error
    if (
        allow_clear_without_original
        and return_code != 0
        and isinstance(result, dict)
        and isinstance(result.get("error"), str)
        and "unrecognized arguments: --allow-clear-without-original" in result["error"]
    ):
        raise RuntimeError(
            "机器人上的 worker 不支持免核对原码的清除后写入。请重新部署 hardware-testing，" "并重新上传新版协议、创建新运行。"
        )
    if not isinstance(result, dict) or any(
        result.get(key) != value
        for key, value in {
            "schema_version": 1,
            "action": action,
            "which": which,
            "requested_serial": serial,
        }.items()
    ):
        raise RuntimeError("烧录程序返回了不匹配的目标或结果格式。")
    if type(result["schema_version"]) is not int or any(
        type(result.get(key)) is not bool
        for key in ("success", "write_attempted", "changed")
    ):
        raise RuntimeError("烧录程序返回的版本或状态字段类型错误。")
    expected_status = "ready" if action == "inspect" else "success"
    if (
        return_code != 0
        or result.get("success") is not True
        or result.get("status") != expected_status
        or result.get("error") is not None
    ):
        raise _worker_failure(result, action, serial)
    before = _identity_hex(result, "before")
    if action == "inspect":
        if (
            result.get("write_attempted") is not False
            or result.get("changed") is not False
        ):
            raise RuntimeError("只读预检返回了写入标记，拒绝继续。")
    else:
        if action == "clear" and not allow_clear_without_original:
            _require_matching_original(before, serial)
        target = "ff" * 20 if action == "clear" else _target_hex(serial)
        if _identity_hex(result, "after") != target:
            raise RuntimeError("EEPROM 读回值与目标身份不一致。")
        expected_change = before != target
        if any(
            result[key] is not expected_change for key in ("write_attempted", "changed")
        ):
            raise RuntimeError("烧录程序的写入标记与前后身份不一致。")
    return result


def _invoke_worker(
    ctx: ProtocolContext,
    command: List[str],
    action: str,
    which: str,
    serial: str,
    expected_before: Optional[str] = None,
    *,
    allow_clear_without_original: bool = False,
) -> Dict[str, Any]:
    """Run one bounded operation with cancellation checks and in-memory output."""
    if which != TARGET_MOUNT:
        raise ValueError("本协议只允许配置左侧（left）移液器。")
    if allow_clear_without_original and action != "clear":
        raise ValueError("Only clear may skip the original barcode match.")
    argv = command + [
        "--action",
        action,
        "--which",
        which,
        "--serial",
        serial,
        "--interface",
        "socketcan",
        "--channel",
        "can0",
        "--attempts",
        "3",
        "--timeout",
        "1.0",
    ]
    if expected_before is not None:
        argv.extend(["--expected-before-hex", expected_before])
    if allow_clear_without_original:
        argv.append("--allow-clear-without-original")
    ctx.comment(
        {
            "inspect": "正在只读查询移液器。",
            "write": "正在写入并核对移液器序列号。",
            "clear": "正在将移液器的 20 字节身份恢复为全 FF，并读回核对。",
        }[action]
    )
    process = subprocess.Popen(
        argv,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    deadline = monotonic() + WORKER_TIMEOUT_SECONDS
    try:
        while True:
            remaining = deadline - monotonic()
            if remaining <= 0:
                raise TimeoutError("烧录程序超时；如果已进入写入阶段，EEPROM 可能已经改变，请先重新只读预检。")
            try:
                stdout, stderr = process.communicate(timeout=min(0.2, remaining))
                break
            except subprocess.TimeoutExpired:
                # Enter the protocol engine so stop/cancel propagates to cleanup.
                ctx.delay(seconds=0.1)
        result = _validate_result(
            stdout,
            process.returncode,
            action,
            which,
            serial,
            allow_clear_without_original=allow_clear_without_original,
        )
        if (
            expected_before is not None
            and _identity_hex(result, "before") != expected_before
        ):
            raise RuntimeError("写入结果中的原身份与操作员确认时不一致。")
        return result
    finally:
        primary_error = sys.exc_info()[1]
        try:
            _stop_worker(process)
        except BaseException:
            if primary_error is None:
                raise


def run(ctx: ProtocolContext) -> None:
    """Verify one identity operation; only provisioning arranges a service restart."""
    operation = ctx.params.operation  # type: ignore[attr-defined]
    if not isinstance(operation, str) or operation not in {
        "inspect",
        "write",
        "bootstrap",
        "clear_then_write",
        "clear",
    }:
        raise ValueError("请选择有效的操作模式：只读检查、直接写入、清除后写入或仅清除身份。")
    if ctx.is_simulating():
        ctx.comment(
            "序列号配置流程分析完成。真实运行扫码录入，固定配置左侧；默认直接写入。"
            "直接写入允许将当前身份覆盖为扫码新码，不要求新旧条码一致。"
            "空白移液器首次烧录需先在未连接移液器时启动，扫码后暂停安装并写入。"
            "清除后写入也只扫描新码，无需匹配原码，确认后在同一次运行中清除并写入。"
            "写入后是否重启机器人服务由参数决定，默认不重启。"
        )
        return

    which = TARGET_MOUNT
    command = _worker_command()
    write_enabled = operation in {"write", "bootstrap", "clear_then_write"}
    restart_service = getattr(ctx.params, "restart_service", False)
    if not isinstance(restart_service, bool):
        raise ValueError("写入后重启服务参数必须是布尔值。")
    restart_plan = (
        _prepare_service_restart() if write_enabled and restart_service else None
    )
    scan_prompt = {
        "inspect": "只读检查：请扫描左侧移液器实物标签上的完整序列号。",
        "write": "直接写入：请扫描准备写入左侧移液器的新条码，允许与当前身份不同。",
        "bootstrap": "空白移液器首次烧录：请扫描生产系统分配的目标序列号。",
        "clear": "仅清除身份：请扫描左侧移液器当前已烧录身份对应的原条码。",
        "clear_then_write": "清除后写入：请扫描准备写入左侧移液器的新条码，无需扫描原码。",
    }[operation]
    serial = _scan_serial(ctx, prompt=scan_prompt)
    if operation in {"write", "bootstrap"}:
        if operation == "bootstrap":
            ctx.pause(
                "请确认左侧移液器当前未连接，且已扫描生产系统分配的目标序列号。"
                "现在请在机器人保持静止时安装需要首次烧录的空白移液器，"
                "确认连接牢固后点击继续；继续后将直接通过 CAN 写入并读回验证。"
            )
        # The direct-write path is deliberately one worker transaction.  The
        # worker reads the current identity immediately before writing and
        # verifies the new bytes by readback, avoiding a duplicate preflight
        # process and CAN query sequence.
        target_serial = serial
        _target_hex(target_serial)
        written = _invoke_worker(ctx, command, "write", which, target_serial)
        before = _identity_hex(written, "before")
        if _identity_hex(written, "after") != _target_hex(target_serial):
            raise RuntimeError("写入后的读回值不是目标身份，不能判为成功。")
        ctx.comment(f"左侧 EEPROM 原身份：{_identity_label(before)}；目标：{target_serial}。")
        ctx.comment(f"EEPROM 序列号核对通过：左侧（{which}），{target_serial}。")
        if restart_plan is not None:
            _schedule_service_restart(ctx, restart_plan)
        else:
            ctx.comment(
                "EEPROM 身份已验证。按当前参数不重启 robot-server；App 可能暂时保留旧身份缓存，"
                "后续运行前请按现场流程刷新服务或重新建立硬件连接。"
            )
        return

    inspected = _invoke_worker(ctx, command, "inspect", which, serial)
    before = _identity_hex(inspected, "before")
    current = _identity_label(before)
    ctx.comment(f"左侧 EEPROM 当前身份：{current}；扫描条码：{serial}。")
    ctx.comment(f"当前身份原始数据（20 字节）：{before}。")
    if operation == "inspect":
        if before not in ("00" * 20, "ff" * 20, _target_hex(serial)):
            if SERIAL_PATTERN.fullmatch(current):
                ctx.comment("当前非空白身份与扫描条码不同。若需替换，可选择“直接写入”，扫描目标新码后立即写入。")
            else:
                ctx.comment("当前非空白数据无法解析为有效条码。两种写入模式均可在核对实物及新条码后替换；仅清除身份仍需匹配原码。")
        ctx.comment("只读检查完成，未写入 EEPROM，不重启服务。")
        return
    if operation == "clear":
        _require_matching_original(before, serial)
    target_serial = serial
    # Validate the new identity before confirming either writing workflow.
    _target_hex(target_serial)
    target_label = "20 字节全 FF 空白身份" if operation == "clear" else target_serial
    ctx.comment(f"预检通过：{which}，当前身份：{current}；目标：{target_label}。")
    if operation == "clear":
        ctx.pause(
            f"目标固定左侧（{which}），当前身份 {current}，扫码原序列号 {serial}。"
            "继续将仅把 20 字节身份（型号、版本及序列号尾码）写为全 FF。"
            "重新检测后 OT3 将无法正常识别这支移液器，必须重新烧录。"
            "请核对左侧实物标签，勿更换或断开移液器。清除后不重启服务。"
        )
        _invoke_worker(ctx, command, "clear", which, serial, before)
        verified = _invoke_worker(ctx, command, "inspect", which, serial)
        if _identity_hex(verified, "before") != "ff" * 20:
            raise RuntimeError("清除后的独立复查未读到 20 字节全 FF，不能判为成功。")
        ctx.comment(
            f"左侧（{which}）20 字节身份已清除并独立读回确认全 FF。未安排服务重启。"
            "App 可能仍显示缓存的旧条码；请保持连接，在本次运行结束后重新烧录有效条码。"
            "若结束归零或后续运行因未知身份失败，需通过独立 worker 恢复身份；清除不会自动回滚。"
        )
        return

    if operation == "clear_then_write":
        restart_message = (
            "仅验证通过且协议成功结束后重启服务，App 短暂断连。" if restart_service else "当前关闭重启开关，验证通过后不重启服务。"
        )
        ctx.pause(
            f"左侧（{which}），当前身份：{current}；新条码：{target_serial}。"
            "无需匹配原码。请核对实物型号和新码，勿拔插。继续即清除 20 字节身份，"
            "读回全 FF 后写入新码并复查。中断可能留下空白或已改变的身份，不自动回滚，需只读核对。"
            f"{restart_message}"
        )
    if operation == "clear_then_write":
        _invoke_worker(
            ctx,
            command,
            "clear",
            which,
            target_serial,
            before,
            allow_clear_without_original=True,
        )
        cleared = _invoke_worker(ctx, command, "inspect", which, serial)
        before = _identity_hex(cleared, "before")
        if before != "ff" * 20:
            raise RuntimeError("清除后的独立复查未读到 20 字节全 FF，不能继续写入新码。")
    # Let failures and all protocol-engine stop/cancel exceptions propagate.
    # A partially completed clear/write is not rolled back or retried here.
    _invoke_worker(ctx, command, "write", which, target_serial, before)
    verified = _invoke_worker(ctx, command, "inspect", which, target_serial)
    if _identity_hex(verified, "before") != _target_hex(target_serial):
        raise RuntimeError("写入后的独立复查未读到目标身份，不能判为成功。")
    ctx.comment(f"EEPROM 序列号核对通过：左侧（{which}），{target_serial}。")
    if restart_plan is not None:
        _schedule_service_restart(ctx, restart_plan)
    else:
        ctx.comment(
            "EEPROM 身份已验证。按当前参数不重启 robot-server；App 可能暂时保留旧身份缓存，"
            "后续运行前请按现场流程刷新服务或重新建立硬件连接。"
        )
