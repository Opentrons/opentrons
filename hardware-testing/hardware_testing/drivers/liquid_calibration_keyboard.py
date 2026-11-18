"""Read liquid calibration, Yes/No and channel keys from a Linux USB keyboard."""

import errno
import fcntl
import logging
import os
import struct
import sys
from dataclasses import dataclass
from pathlib import Path
from time import monotonic
from typing import Callable, Optional, Tuple

# Use the robot's API logger so these records are included in exported api.log.
log = logging.getLogger("opentrons.hardware_testing.liquid_calibration_keyboard")
INPUT_REVISION = "2026-10-29.1"


@dataclass(frozen=True)
class _Interface:
    path: Path
    name: str
    physical: str
    identity: str
    keys: int
    num_led: bool


def _read_text(path: Path, default: str = "") -> str:
    try:
        return path.read_text().strip()
    except FileNotFoundError:
        return default


def _capabilities(path: Path) -> int:
    words = _read_text(path, "0").split()
    word_bits = struct.calcsize("L") * 8
    return sum(int(w, 16) << (i * word_bits) for i, w in enumerate(reversed(words)))


class LiquidCalibrationKeyboard:
    """Own the relevant event interfaces of one physical USB keyboard."""

    KEYS = {
        103: "UP",  # KEY_UP
        72: "UP",  # KEY_KP8
        9: "UP",  # KEY_8
        108: "DOWN",  # KEY_DOWN
        80: "DOWN",  # KEY_KP2
        3: "DOWN",  # KEY_2
        28: "OK",  # KEY_ENTER
        96: "OK",  # KEY_KPENTER
        1: "CANCEL",  # KEY_ESC
    }
    REQUIRED_KEY_GROUPS: Tuple[Tuple[int, ...], ...] = (
        (103, 72, 9),
        (108, 80, 3),
        (28, 96),
        (1,),
    )
    REJECT_COMMAND = "CANCEL"
    EVENT = struct.Struct("llHHi")
    GRAB = 0x40044590  # EVIOCGRAB
    CLOCK = 0x400445A0  # EVIOCSCLOCKID
    KEY_STATE = 0x80604518  # EVIOCGKEY(96)
    LED_STATE = 0x80014519  # EVIOCGLED(1)
    NUM_LOCK_KEY = 69
    HELD_WARNING_SECONDS = 5.0
    DISCONNECTED = (errno.ENODEV, errno.ENXIO, errno.EBADF)

    def __init__(
        self,
        fd: int,
        name: str,
        *,
        path: str = "",
        identity: str = "",
        num_led: bool = True,
        writable: bool = True,
        notice: Optional[Callable[[str], None]] = None,
    ) -> None:
        """Use an already opened and exclusively grabbed event device."""
        self.fd, self.name, self.path, self.identity = fd, name, path, identity
        self._notice = notice or (lambda message: None)
        self._children: list[LiquidCalibrationKeyboard] = []
        self._led_controller: Optional[LiquidCalibrationKeyboard] = None
        self.not_before = self._opened_at = monotonic()
        self._held: set[int] = set()
        self._held_since: dict[int, float] = {}
        self._held_warned: set[int] = set()
        # Num Lock is a keyboard LED state key, never a QC command. Keep its
        # edge state separately so a stuck/repeating Num Lock cannot affect
        # the held-key filtering for Enter/Esc.
        self._num_lock_pressed = False
        self._seen_key = False
        self._dropped = False
        self._resync()
        self._original_num_lock: Optional[bool] = None
        self._num_lock_changed = False
        self._led_enabled = num_led and writable
        if self._led_enabled:
            try:
                self._original_num_lock = self._read_num_lock()
            except OSError as error:
                self._led_error("read initial state", error)
        else:
            log.info(
                "keyboard=%s NumLock LED control unavailable on this interface", path
            )

    def set_notice(self, notice: Callable[[str], None]) -> None:
        """Send status to the session queue, never directly to a protocol thread."""
        self._notice = notice
        for child in self._children:
            child.set_notice(notice)

    def _resync(self) -> None:
        state = bytearray(96)
        fcntl.ioctl(self.fd, self.KEY_STATE, state)
        keys = set(self.KEYS)
        self._held = {k for k in keys if state[k // 8] & (1 << (k % 8))}
        self._held_since = {k: monotonic() for k in self._held}
        self._held_warned.clear()

    def _read_num_lock(self) -> bool:
        state = bytearray(1)
        fcntl.ioctl(self.fd, self.LED_STATE, state)
        return bool(state[0] & 1)

    def _write_num_lock(self, enabled: bool) -> None:
        events = self.EVENT.pack(0, 0, 0x11, 0, int(enabled)) + self.EVENT.pack(
            0, 0, 0, 0, 0
        )
        if os.write(self.fd, events) != len(events):
            raise OSError("Incomplete Num Lock LED write")

    def _led_error(self, operation: str, error: OSError) -> None:
        log.warning("keyboard=%s NumLock %s failed: %s", self.path, operation, error)
        if error.errno in self.DISCONNECTED:
            raise error
        self._led_enabled = False
        self._notice("Num Lock 灯控制失败，键盘按键输入继续可用。")

    def _toggle_num_lock(self) -> None:
        if self._led_controller is not None and self._led_controller is not self:
            self._led_controller._toggle_num_lock()
            return
        if not self._led_enabled:
            return
        try:
            enabled = not self._read_num_lock()
            self._num_lock_changed = True
            self._write_num_lock(enabled)
            actual = self._read_num_lock()
            if actual != enabled:
                raise OSError("Num Lock LED readback did not match requested state")
            log.info("keyboard=%s NumLock=%s readback=%s", self.path, enabled, actual)
        except OSError as error:
            self._led_error("toggle/readback", error)

    @classmethod
    def _discover(cls, sys_input: Path, dev_input: Path) -> list[list[_Interface]]:
        groups: dict[str, list[_Interface]] = {}
        for event in sorted(sys_input.glob("event*")):
            try:
                device = event / "device"
                if int(_read_text(device / "id/bustype", "0"), 16) != 3:
                    continue
                keys = _capabilities(device / "capabilities/key")
                if not any(keys & (1 << k) for k in (*cls.KEYS, cls.NUM_LOCK_KEY)):
                    continue
                name = _read_text(device / "name", event.name)
                usb = next(
                    (p for p in device.resolve().parents if (p / "idVendor").is_file()),
                    None,
                )
                vendor = _read_text(device / "id/vendor")
                product = _read_text(device / "id/product")
                serial = _read_text(device / "uniq")
                if usb is not None:
                    vendor = _read_text(usb / "idVendor", vendor)
                    product = _read_text(usb / "idProduct", product)
                    serial = _read_text(usb / "serial", serial)
                phys = _read_text(device / "phys").rsplit("/input", 1)[0]
                physical = str(usb) if usb else phys or str(device.resolve())
                identity = f"{vendor}:{product}:{serial}:{name}"
                item = _Interface(
                    dev_input / event.name,
                    name,
                    physical,
                    identity,
                    keys,
                    bool(_capabilities(device / "capabilities/led") & 1),
                )
                groups.setdefault(physical, []).append(item)
                log.info(
                    "keyboard candidate path=%s usb=%s identity=%s keys=%x num_led=%s",
                    item.path,
                    physical,
                    identity,
                    keys,
                    item.num_led,
                )
            except (OSError, ValueError) as error:
                log.warning("keyboard discovery %s failed: %s", event, error)
        eligible = []
        for group in groups.values():
            keys = 0
            for item in group:
                keys |= item.keys
            if all(
                any(keys & (1 << k) for k in needed)
                for needed in cls.REQUIRED_KEY_GROUPS
            ):
                eligible.append(group)
        return eligible

    @classmethod
    def _open_interface(
        cls, item: _Interface, notice: Callable[[str], None]
    ) -> "LiquidCalibrationKeyboard":
        fd = None
        try:
            writable = True
            try:
                fd = os.open(item.path, os.O_RDWR | os.O_NONBLOCK | os.O_CLOEXEC)
            except PermissionError:
                writable = False
                fd = os.open(item.path, os.O_RDONLY | os.O_NONBLOCK | os.O_CLOEXEC)
            fcntl.ioctl(fd, cls.CLOCK, struct.pack("i", 1))
            fcntl.ioctl(fd, cls.GRAB, 1)
            return cls(
                fd,
                item.name,
                path=str(item.path),
                identity=item.identity,
                num_led=item.num_led,
                writable=writable,
                notice=notice,
            )
        except (OSError, ValueError):
            if fd is not None:
                os.close(fd)
            raise

    @classmethod
    def open(
        cls,
        comment: Callable[[str], None],
        sys_input: Path = Path("/sys/class/input"),
        dev_input: Path = Path("/dev/input"),
        *,
        identity: Optional[str] = None,
    ) -> Optional["LiquidCalibrationKeyboard"]:
        """Open all control interfaces of an unambiguous physical USB keyboard."""
        if sys.platform != "linux":
            return None
        groups = cls._discover(sys_input, dev_input)
        if identity is not None:
            groups = [g for g in groups if any(i.identity == identity for i in g)]
        if len(groups) != 1:
            if groups:
                names = "; ".join(f"{g[0].name} ({g[0].physical})" for g in groups)
                comment(f"检测到多个候选键盘，请仅连接一个控制键盘，仍可扫码：{names}")
            return None
        opened = []
        try:
            for item in groups[0]:
                opened.append(cls._open_interface(item, comment))
        except (OSError, ValueError) as error:
            for keyboard in opened:
                keyboard.close()
            comment(f"键盘接口无法打开，仍可扫码：{error}")
            log.warning("keyboard open failed: %s", error)
            return None
        primary, *children = opened
        primary._children = children
        controller = next((k for k in opened if k._led_enabled), None)
        for keyboard in opened:
            keyboard._led_controller = controller
        if controller is None:
            comment("键盘灯不支持控制或无写入权限，按键输入仍可使用。")
        paths = ", ".join(str(i.path) for i in groups[0])
        comment(f"已打开键盘 {primary.name}，等待有效按键。")
        log.info(
            "keyboard opened identity=%s physical=%s interfaces=%s",
            primary.identity,
            groups[0][0].physical,
            paths,
        )
        return primary

    def _press(
        self, code: int, value: int, timestamp: float, now: float
    ) -> Optional[Tuple[str, float]]:
        if code == self.NUM_LOCK_KEY:
            if value == 0:
                self._num_lock_pressed = False
            elif value == 1 and not self._num_lock_pressed:
                self._num_lock_pressed = True
                # LED feedback is best effort. Num Lock never becomes a
                # pending command and never produces a user-facing warning.
                self._toggle_num_lock()
            log.debug(
                "keyboard=%s NumLock event value=%d ignored for QC command input",
                self.path,
                value,
            )
            return None
        was_held = code in self._held
        if value == 0:
            self._held.discard(code)
            self._held_since.pop(code, None)
            self._held_warned.discard(code)
            reason = "release"
        else:
            self._held.add(code)
            if code in self.KEYS:
                self._held_since.setdefault(code, now)
            cutoff = self.not_before
            if code not in self.KEYS:
                reason = "unmapped"
            elif value != 1 or was_held:
                reason = "repeat/held"
            elif not cutoff <= timestamp <= now or now - timestamp > 3:
                reason = "stale/future"
            else:
                reason = "accepted"
        if (
            reason == "repeat/held"
            and code not in self._held_warned
            and now - self._held_since[code] >= self.HELD_WARNING_SECONDS
        ):
            self._held_warned.add(code)
            key_name = f"key code {code}"
            log.warning(
                "keyboard=%s %s remains held; waiting for release", self.path, key_name
            )
            self._notice(
                f"键盘 {key_name} 持续处于按住状态，重复事件不会用于确认。" "请松开后重新按键；仍无响应时，请重新连接键盘。"
            )
        emit = log.debug if value == 2 else log.info
        emit(
            "keyboard=%s code=%d value=%d age=%.6f reason=%s",
            self.path,
            code,
            value,
            now - timestamp,
            reason,
        )
        if reason != "accepted":
            return None
        if not self._seen_key:
            self._seen_key = True
            self._notice(f"已收到键盘有效按键：{self.name}。")
        if code == self.NUM_LOCK_KEY:
            self._toggle_num_lock()
            return None
        return self.KEYS[code], timestamp

    def _poll_one(self) -> Optional[Tuple[str, float]]:
        try:
            data = os.read(self.fd, self.EVENT.size * 256)
        except BlockingIOError:
            return None
        if not data or len(data) % self.EVENT.size:
            raise OSError("Keyboard disconnected or returned an incomplete event")
        command = None
        now = monotonic()
        for sec, usec, kind, code, value in self.EVENT.iter_unpack(data):
            if kind == 0 and code == 3:  # SYN_DROPPED
                self._dropped = True
                command = None
                log.warning(
                    "keyboard=%s SYN_DROPPED; discard until SYN_REPORT", self.path
                )
            elif self._dropped:
                if kind == 0 and code == 0:  # SYN_REPORT
                    self._resync()
                    self.not_before = self._opened_at = monotonic()
                    self._dropped = False
            elif kind == 1:
                candidate = self._press(code, value, sec + usec / 1_000_000, now)
                if candidate and (
                    command is None or candidate[0] == self.REJECT_COMMAND
                ):
                    command = candidate
        return command

    def poll(self) -> Optional[Tuple[str, float]]:
        """Read every interface, including releases and Num Lock during motion."""
        command = self._poll_one()
        for child in self._children:
            child.not_before = self.not_before
            candidate = child.poll()
            if candidate and (command is None or candidate[0] == self.REJECT_COMMAND):
                command = candidate
        return command

    def close(self) -> None:
        """Restore changed LEDs and release every interface, including on errors."""
        for child in self._children:
            try:
                child.close()
            except OSError as error:
                log.warning(
                    "Could not close keyboard interface %s: %s", child.path, error
                )
        self._children.clear()
        if self.fd >= 0:
            fd = self.fd
            try:
                if self._num_lock_changed and self._original_num_lock is not None:
                    try:
                        fcntl.ioctl(fd, self.GRAB, 0)
                        self._write_num_lock(self._original_num_lock)
                    except OSError as error:
                        log.warning(
                            "Could not restore Num Lock on %s: %s", self.path, error
                        )
            finally:
                self.fd = -1
                try:
                    os.close(fd)
                except OSError as error:
                    log.warning(
                        "Could not close keyboard interface %s: %s", self.path, error
                    )


class YesNoKeyboard(LiquidCalibrationKeyboard):
    """Use Enter/Y for Yes and Escape/N for No, with no calibration commands."""

    KEY_ENTER = 28
    KEY_KPENTER = 96
    KEY_ESC = 1
    # 28/96 are Enter and keypad Enter; 21/49 are the physical Y/N keys.
    # Supporting both layouts avoids silently accepting a keyboard that uses
    # letter keys for the operator's Yes/No buttons.
    KEYS = {
        KEY_ENTER: "YES",
        KEY_KPENTER: "YES",
        21: "YES",
        KEY_ESC: "NO",
        49: "NO",
    }
    REQUIRED_KEY_GROUPS = ((KEY_ENTER, KEY_KPENTER, 21), (KEY_ESC, 49))
    REJECT_COMMAND = "NO"


@dataclass
class _ChannelEntry:
    characters: list[str]
    submitted: bool = False


class ChannelSelectionKeyboard(LiquidCalibrationKeyboard):
    """Collect channel digits until Enter, independently of Num Lock state."""

    # Preserve unsupported keys as invalid characters: silently ignoring a
    # decimal point or letter could turn an invalid answer into valid channels.
    KEYS = {
        **dict.fromkeys(range(1, 768), "?"),
        **dict(zip(range(2, 12), "1234567890")),
        **dict(zip((71, 72, 73, 75, 76, 77, 79, 80, 81, 82), "7894561230")),
        **dict(zip(range(16, 26), "qwertyuiop")),
        **dict(zip(range(30, 39), "asdfghjkl")),
        **dict(zip(range(44, 51), "zxcvbnm")),
        1: "CLEAR",
        14: "BACKSPACE",
        28: "SUBMIT",
        96: "SUBMIT",
        12: "-",
        13: "=",
        51: ",",
        52: ".",
        53: "/",
        55: "*",
        57: " ",
        74: "-",
        78: "+",
        83: ".",
        98: "/",
    }
    REQUIRED_KEY_GROUPS = (
        (2, 79),
        (3, 80),
        (4, 81),
        (5, 75),
        (6, 76),
        (7, 77),
        (8, 71),
        (9, 72),
        (28, 96),
    )
    REJECT_COMMAND = ""

    def __init__(
        self,
        fd: int,
        name: str,
        *,
        path: str = "",
        identity: str = "",
        num_led: bool = True,
        writable: bool = True,
        notice: Optional[Callable[[str], None]] = None,
    ) -> None:
        """Start each opened or reconnected keyboard with an empty answer."""
        self._entry = _ChannelEntry([])
        super().__init__(
            fd,
            name,
            path=path,
            identity=identity,
            num_led=num_led,
            writable=writable,
            notice=notice,
        )

    def _press(
        self, code: int, value: int, timestamp: float, now: float
    ) -> Optional[Tuple[str, float]]:
        candidate = super()._press(code, value, timestamp, now)
        if candidate is None or self._entry.submitted:
            return None
        action, timestamp = candidate
        if action == "SUBMIT":
            raw = "".join(self._entry.characters)
            self._entry.characters.clear()
            self._entry.submitted = True
            return f"CHANNELS:{raw}", timestamp
        if action == "CLEAR":
            self._entry.characters.clear()
        elif action == "BACKSPACE":
            if self._entry.characters:
                self._entry.characters.pop()
        else:
            if self._held.intersection((29, 42, 54, 56, 97, 100)):
                action = "?"
            self._entry.characters.append(action)
        self._notice(f"漏液通道输入：{''.join(self._entry.characters) or '（空）'}，按 Enter 提交。")
        return None

    def _channel_events(self) -> list[tuple[float, int, int, int]]:
        events = []
        while True:
            try:
                data = os.read(self.fd, self.EVENT.size * 256)
            except BlockingIOError:
                return events
            if not data or len(data) % self.EVENT.size:
                raise OSError("Keyboard disconnected or returned an incomplete event")
            events.extend(
                (sec + usec / 1_000_000, kind, code, value)
                for sec, usec, kind, code, value in self.EVENT.iter_unpack(data)
            )

    def _channel_event(
        self, event: tuple[float, int, int, int], now: float
    ) -> Optional[Tuple[str, float]]:
        timestamp, kind, code, value = event
        if kind == 0 and code == 3:  # SYN_DROPPED
            self._dropped = True
            self._entry.characters[:] = ["?"]
            self._notice("键盘输入事件丢失，请按 Esc 清空后重新输入漏液通道。")
        elif self._dropped:
            if kind == 0 and code == 0:  # SYN_REPORT
                self._resync()
                self.not_before = self._opened_at = monotonic()
                self._dropped = False
        elif kind == 1:
            return self._press(code, value, timestamp, now)
        return None

    def poll(self) -> Optional[Tuple[str, float]]:
        """Merge interfaces in event order and submit at most one answer per batch."""
        interfaces = [self, *self._children]
        events = []
        self._entry.submitted = False
        for keyboard in interfaces:
            if not isinstance(keyboard, ChannelSelectionKeyboard):
                raise TypeError("Channel keyboard interfaces must use the same reader")
            keyboard._entry = self._entry
            keyboard.not_before = max(keyboard.not_before, self.not_before)
            events.extend((event, keyboard) for event in keyboard._channel_events())
        now = monotonic()
        command = None
        for event, keyboard in sorted(events, key=lambda item: item[0][0]):
            candidate = keyboard._channel_event(event, now)
            if event[1:3] == (0, 3):
                command = None
                self._entry.submitted = True
            if candidate is not None and command is None:
                command = candidate
        return command
