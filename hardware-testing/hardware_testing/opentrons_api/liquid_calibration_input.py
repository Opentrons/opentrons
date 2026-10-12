"""Continuously read keyboard events while scanner and robot operations run."""

import asyncio
import hashlib
import logging
from pathlib import Path
from queue import Empty, SimpleQueue
from threading import Lock
from time import monotonic
from typing import Awaitable, Callable, Optional, Tuple

from hardware_testing.drivers import liquid_calibration_keyboard as keyboard_driver
from hardware_testing.drivers.liquid_calibration_keyboard import (
    LiquidCalibrationKeyboard,
)

log = logging.getLogger("opentrons.hardware_testing.liquid_calibration_input")
Command = Tuple[Optional[str], float]
INPUT_REVISION = "2026-09-21.1"


def log_input_versions() -> None:
    """Record the files actually loaded on the robot in exported API logs."""
    for filename, revision in (
        (keyboard_driver.__file__, keyboard_driver.INPUT_REVISION),
        (__file__, INPUT_REVISION),
    ):
        path = Path(filename)
        try:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
        except OSError:
            digest = "unavailable"
        log.info(
            "QC keyboard module path=%s sha256=%s loaded_revision=%s",
            path,
            digest,
            revision,
        )


class LiquidCalibrationInput:
    """Own the keyboard receiver, replacement devices and one scanner read."""

    POLL_SECONDS = 0.02
    RECONNECT_SECONDS = 1.0

    def __init__(
        self,
        keyboard: LiquidCalibrationKeyboard,
        comment: Callable[[str], None],
        keyboard_type: type[LiquidCalibrationKeyboard] = LiquidCalibrationKeyboard,
    ) -> None:
        """Create a session; start its receiver on the hardware event loop."""
        self.keyboard: Optional[LiquidCalibrationKeyboard] = keyboard
        self._keyboard_type = keyboard_type
        self._identity = (
            keyboard.identity if isinstance(keyboard.identity, str) else None
        )
        self._comment = comment
        self._notices: SimpleQueue[str] = SimpleQueue()
        self._last_notice: Optional[str] = None
        keyboard.set_notice(self._notice)
        self._lock = Lock()
        self._receiver: Optional[asyncio.Task[None]] = None
        self._scan: Optional[asyncio.Task[Command]] = None
        self._discard_scan = False
        self._pending_key: Optional[Tuple[str, float]] = None
        self._not_before = 0.0
        self._accept_commands = False
        self._closed = False
        self._next_reconnect = 0.0
        self._next_health_log = monotonic() + 10
        self.last_source = ""

    def _notice(self, message: str) -> None:
        # Background work must never call ctx.comment (protocol engine thread).
        if message != self._last_notice:
            self._notices.put(message)
            self._last_notice = message

    async def _scan_once(self, scan: Callable[[], Awaitable[Optional[str]]]) -> Command:
        value = await scan()
        return value, monotonic()

    def _poll_keyboard(self) -> None:
        with self._lock:
            if self._closed:
                return
            if self.keyboard is None:
                if monotonic() < self._next_reconnect:
                    return
                self._next_reconnect = monotonic() + self.RECONNECT_SECONDS
                self.keyboard = self._keyboard_type.open(
                    self._notice, identity=self._identity
                )
                if self.keyboard is None:
                    return
                self._notice(f"键盘已重新连接：{self.keyboard.name}。请松开后重新按键。")
                self._pending_key = None
                self._not_before = monotonic()
                log.info("keyboard reconnected identity=%s", self._identity)
            try:
                key = self.keyboard.poll()
            except OSError as error:
                log.warning("keyboard input failed; reconnect scheduled: %s", error)
                self.keyboard.close()
                self.keyboard = None
                self._pending_key = None
                self._next_reconnect = monotonic() + self.RECONNECT_SECONDS
                self._notice(f"键盘已断开，正在尝试重连，仍可扫码：{error}")
                return
            if monotonic() >= self._next_health_log:
                self._next_health_log = monotonic() + 10
                log.info(
                    "keyboard receiver active identity=%s interfaces=%s accepting_commands=%s",
                    self._identity,
                    self.keyboard.path,
                    self._accept_commands,
                )
            if key is None:
                return
            if key[1] < self._not_before or (
                not self._accept_commands and self._pending_key is None
            ):
                log.info(
                    "keyboard command=%s discarded: movement/previous input in progress",
                    key[0],
                )
                return
            if (
                self._pending_key is None
                or key[0] == self._keyboard_type.REJECT_COMMAND
            ):
                self._pending_key = key
                self._accept_commands = False

    async def _receive_keyboard(self) -> None:
        while not self._closed:
            try:
                self._poll_keyboard()
            except Exception as error:
                # A broken ioctl/read must not terminate the receiver task.
                # Once this task exits, subsequent synchronous reads see a
                # completed task and the protocol appears to ignore keys.
                log.exception("keyboard receiver crashed; scheduling recovery")
                with self._lock:
                    keyboard = self.keyboard
                    self.keyboard = None
                    self._pending_key = None
                    self._accept_commands = False
                    self._next_reconnect = monotonic() + self.RECONNECT_SECONDS
                if keyboard is not None:
                    try:
                        keyboard.close()
                    except Exception:
                        log.exception("failed to close crashed keyboard interface")
                self._notice(f"键盘输入异常，正在重连：{error}")
            await asyncio.sleep(self.POLL_SECONDS)

    def _take_key(self) -> Optional[Tuple[str, float]]:
        with self._lock:
            key, self._pending_key = self._pending_key, None
            if key is not None:
                self._accept_commands = False
        return key

    def _received(self, result: Command, source: str) -> Command:
        self.last_source = source
        if result[0]:
            log.info("calibration input source=%s command=%r", source, result[0])
            # Only log control words on screen; scanners can also return IDs.
            if str(result[0]).strip().upper() in {
                "UP",
                "DOWN",
                "OK",
                "CANCEL",
                "YES",
                "NO",
            }:
                self._notice(
                    f"输入来源：{'键盘' if source == 'keyboard' else '扫码'}，指令：{result[0]}。"
                )
            with self._lock:
                self._accept_commands = False
        return result

    async def read(self, scan: Callable[[], Awaitable[Optional[str]]]) -> Command:
        """Return one input; keep handling key releases and LEDs between calls."""
        with self._lock:
            if self._closed:
                raise RuntimeError("Keyboard input session is closed")
            if self._pending_key is None:
                self._accept_commands = True
        if self._receiver is None:
            self._receiver = asyncio.create_task(self._receive_keyboard())
        elif self._receiver.done():
            self._receiver.result()  # Never hide an unexpected receiver failure.
        if self._scan is None:
            self._discard_scan = False
            self._scan = asyncio.create_task(self._scan_once(scan))
        await asyncio.sleep(self.POLL_SECONDS)
        if self._receiver.done():
            self._receiver.result()
        key = self._take_key()
        if key is not None:
            self._discard_scan = True
            return self._received(key, "keyboard")
        if self._scan.done():
            task, self._scan = self._scan, None
            result = task.result()
            if not self._discard_scan:
                return self._received(result, "scanner")
        return None, monotonic()

    def report_disconnect(self) -> None:
        """Drain connection and input notices on the protocol thread."""
        while True:
            try:
                self._comment(self._notices.get_nowait())
            except Empty:
                return

    def discard_pending(self) -> None:
        """Clear queued actions after a move without suppressing Num Lock."""
        with self._lock:
            self._pending_key = None
            self._not_before = monotonic()
            self._accept_commands = False
        self._discard_scan = True

    def close_keyboard(self) -> None:
        """Release the current device even if the hardware-loop adapter fails."""
        with self._lock:
            self._closed = True
            self._pending_key = None
            if self.keyboard is not None:
                self.keyboard.close()
                self.keyboard = None

    async def close(self) -> None:
        """Stop the receiver, release ownership and finish the serial read."""
        self.close_keyboard()
        if self._receiver is not None:
            receiver, self._receiver = self._receiver, None
            receiver.cancel()
            try:
                await receiver
            except asyncio.CancelledError:
                pass
            except Exception:
                log.exception("Keyboard receiver failed while closing")
        if self._scan is not None:
            task, self._scan = self._scan, None
            try:
                await task
            except Exception:
                log.exception("Scanner read failed while leaving liquid calibration")


async def read_liquid_calibration_input(
    self, inputs: LiquidCalibrationInput, close: bool = False  # noqa: ANN001
) -> Command:
    """Run input tasks on the hardware loop via the synchronous API adapter."""
    if close:
        await inputs.close()
        return None, monotonic()
    return await inputs.read(self._scan_barcode)
