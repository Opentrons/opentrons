"""Compatibility layer for running opentrons in Pyodide (browser/WASM).

Three-step usage in Pyodide's runPythonAsync:

    import opentrons_pyodide_shims
    opentrons_pyodide_shims.install()        # 1. inject hardware stubs into sys.modules
    import opentrons                         # 2. now safe to import
    opentrons_pyodide_shims.patch_for_pyodide()  # 3. patch threading / event-loop

Then call the async entry points:

    result = await opentrons_pyodide_shims.analyze_pyodide(text, file_name)
    log    = await opentrons_pyodide_shims.simulate_pyodide(text, file_name)

See README.md for full documentation.
"""

from __future__ import annotations

import asyncio
import selectors
import sys
import types
from typing import Any, Dict, List, Optional


def _make_module(name: str, attrs: Dict[str, Any] | None = None) -> types.ModuleType:
    mod = types.ModuleType(name)
    mod.__package__ = name.rsplit(".", 1)[0] if "." in name else name
    mod.__path__ = []  # type: ignore[attr-defined]
    if attrs:
        for k, v in attrs.items():
            setattr(mod, k, v)
    return mod


def _make_exception(name: str, base: type = Exception) -> type:
    return type(name, (base,), {})


# ---------------------------------------------------------------------------
# _WasmSafeLoop — shared SelectorEventLoop subclass for Pyodide
# ---------------------------------------------------------------------------


class _WasmSafeLoop(asyncio.SelectorEventLoop):
    """SelectorEventLoop that works in WASM/Pyodide.

    Stubs out the self-pipe mechanism (requires ``socket.socketpair``,
    unavailable in WASM) and makes ``_run_once`` re-entrant-safe so that
    synchronous code running inside a callback can pump the loop to drive
    concurrent tasks (needed by ``ChildThreadTransport``).
    """

    def _make_self_pipe(self) -> None:
        pass

    def _close_self_pipe(self) -> None:
        pass

    def _write_to_self(self) -> None:
        pass

    def run_until_complete(self, future: Any) -> Any:
        old = asyncio.events._get_running_loop()
        asyncio.events._set_running_loop(None)
        try:
            return super().run_until_complete(future)
        finally:
            asyncio.events._set_running_loop(old)

    def _run_once(self) -> None:  # type: ignore[override]
        import heapq

        sched_count = len(self._scheduled)
        if sched_count > 100 and self._timer_cancelled_count / sched_count > 0.5:
            new_scheduled: list[Any] = []
            for handle in self._scheduled:
                if handle._cancelled:
                    handle._scheduled = False
                else:
                    new_scheduled.append(handle)
            heapq.heapify(new_scheduled)
            self._scheduled = new_scheduled
            self._timer_cancelled_count = 0
        else:
            while self._scheduled and self._scheduled[0]._cancelled:
                self._timer_cancelled_count -= 1
                handle = heapq.heappop(self._scheduled)
                handle._scheduled = False

        timeout = None
        if self._ready or self._stopping:
            timeout = 0
        elif self._scheduled:
            when = self._scheduled[0]._when
            timeout = min(max(0, when - self.time()), 24 * 3600)

        event_list = self._selector.select(timeout)
        self._process_events(event_list)

        end_time = self.time() + self._clock_resolution
        while self._scheduled:
            handle = self._scheduled[0]
            if handle._when >= end_time:
                break
            handle = heapq.heappop(self._scheduled)
            handle._scheduled = False
            self._ready.append(handle)

        ntodo = len(self._ready)
        for _ in range(ntodo):
            if not self._ready:
                break
            handle = self._ready.popleft()
            if handle._cancelled:
                continue
            handle._run()
        handle = None  # type: ignore[assignment]


def _make_wasm_safe_loop() -> _WasmSafeLoop:
    return _WasmSafeLoop(selectors.SelectSelector())


def _pump_until_complete(loop: asyncio.AbstractEventLoop, coro: Any) -> Any:
    """Schedule *coro* on *loop* and pump the loop until it finishes.

    Used by the ``run_coroutine_threadsafe`` patch: instead of blocking on
    a ``concurrent.futures.Future`` (which deadlocks when we're on the same
    thread as the loop), we drive the loop ourselves.

    CPython tracks the "currently running task" per event loop and prevents
    re-entrance (``RuntimeError: Cannot enter into task … while another task
    … is being executed``).  Since we're called from *within* a running
    task's step (e.g. ``run_protocol`` → ``ChildThreadTransport``), we
    temporarily clear the current-task record so that nested task steps
    created by pumping can execute.
    """
    import asyncio.tasks as _tasks

    saved_task = _tasks._current_tasks.pop(loop, None)

    task = loop.create_task(coro)
    try:
        while not task.done():
            if not loop._ready and not loop._stopping:  # type: ignore[attr-defined]
                loop.call_soon(lambda: None)
            loop._run_once()  # type: ignore[attr-defined]
    finally:
        if saved_task is not None:
            _tasks._current_tasks[loop] = saved_task
        else:
            _tasks._current_tasks.pop(loop, None)

    return task.result()


# ---------------------------------------------------------------------------
# serial (pyserial) stubs
# ---------------------------------------------------------------------------


def _build_serial_stubs() -> Dict[str, types.ModuleType]:
    stubs: Dict[str, types.ModuleType] = {}

    SerialException = _make_exception("SerialException")
    SerialTimeoutException = _make_exception("SerialTimeoutException", SerialException)

    class FakeSerial:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            self.port = kwargs.get("port", "/dev/null")
            self.baudrate = kwargs.get("baudrate", 9600)
            self.timeout = kwargs.get("timeout", None)
            self.write_timeout = kwargs.get("write_timeout", None)
            self.is_open = False

        def open(self) -> None:
            self.is_open = True

        def close(self) -> None:
            self.is_open = False

        def read(self, size: int = 1) -> bytes:
            return b""

        def read_until(self, expected: bytes = b"\n", size: int | None = None) -> bytes:
            return b""

        def write(self, data: bytes) -> int:
            return len(data)

        def reset_input_buffer(self) -> None:
            pass

        def reset_output_buffer(self) -> None:
            pass

        def flush(self) -> None:
            pass

        def __enter__(self) -> "FakeSerial":
            self.open()
            return self

        def __exit__(self, *args: Any) -> None:
            self.close()

    def serial_for_url(url: str, *args: Any, **kwargs: Any) -> FakeSerial:
        return FakeSerial(port=url, **kwargs)

    serial_mod = _make_module(
        "serial",
        {
            "Serial": FakeSerial,
            "serial_for_url": serial_for_url,
            "SerialException": SerialException,
            "SerialTimeoutException": SerialTimeoutException,
            "VERSION": "3.5",
            "EIGHTBITS": 8,
            "PARITY_NONE": "N",
            "STOPBITS_ONE": 1,
        },
    )
    stubs["serial"] = serial_mod

    serial_util = _make_module(
        "serial.serialutil",
        {
            "SerialException": SerialException,
            "SerialTimeoutException": SerialTimeoutException,
        },
    )
    stubs["serial.serialutil"] = serial_util

    serial_tools = _make_module("serial.tools")
    stubs["serial.tools"] = serial_tools

    class ListPortInfo:
        def __init__(self, device: str = "") -> None:
            self.device = device
            self.name = device
            self.description = ""
            self.hwid = ""
            self.vid = None
            self.pid = None
            self.serial_number = None
            self.location = None
            self.manufacturer = None
            self.product = None
            self.interface = None

        def __getitem__(self, idx: int) -> str:
            if idx == 0:
                return self.device
            if idx == 1:
                return self.name
            if idx == 2:
                return self.description
            raise IndexError(idx)

    def comports(*args: Any, **kwargs: Any) -> List[Any]:
        return []

    serial_lp = _make_module("serial.tools.list_ports", {"comports": comports})
    stubs["serial.tools.list_ports"] = serial_lp

    serial_lpc = _make_module(
        "serial.tools.list_ports_common",
        {
            "ListPortInfo": ListPortInfo,
        },
    )
    stubs["serial.tools.list_ports_common"] = serial_lpc

    serial_lpl = _make_module("serial.tools.list_ports_linux", {"comports": comports})
    stubs["serial.tools.list_ports_linux"] = serial_lpl

    serial_lpp = _make_module("serial.tools.list_ports_posix", {"comports": comports})
    stubs["serial.tools.list_ports_posix"] = serial_lpp

    serial_lpo = _make_module("serial.tools.list_ports_osx", {"comports": comports})
    stubs["serial.tools.list_ports_osx"] = serial_lpo

    return stubs


# ---------------------------------------------------------------------------
# aionotify stubs
# ---------------------------------------------------------------------------


def _build_aionotify_stubs() -> Dict[str, types.ModuleType]:
    stubs: Dict[str, types.ModuleType] = {}

    class FakeWatcher:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        def watch(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def setup(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def get_event(self, *args: Any, **kwargs: Any) -> None:
            return None

        def close(self) -> None:
            pass

        def unwatch(self, *args: Any, **kwargs: Any) -> None:
            pass

    class FakeFlags:
        MODIFY = 0x2
        CREATE = 0x100
        DELETE = 0x200
        MOVED_FROM = 0x40
        MOVED_TO = 0x80
        ATTRIB = 0x4

    aionotify_mod = _make_module(
        "aionotify",
        {
            "Watcher": FakeWatcher,
            "Flags": FakeFlags,
        },
    )
    stubs["aionotify"] = aionotify_mod

    aioutils = _make_module("aionotify.aioutils")
    stubs["aionotify.aioutils"] = aioutils

    return stubs


# ---------------------------------------------------------------------------
# usb (pyusb) stubs
# ---------------------------------------------------------------------------


def _build_usb_stubs() -> Dict[str, types.ModuleType]:
    stubs: Dict[str, types.ModuleType] = {}

    usb_mod = _make_module("usb")
    stubs["usb"] = usb_mod

    USBError = _make_exception("USBError")

    def find(*args: Any, **kwargs: Any) -> None:
        return None

    usb_core = _make_module(
        "usb.core",
        {
            "find": find,
            "USBError": USBError,
        },
    )
    stubs["usb.core"] = usb_core

    usb_util = _make_module("usb.util")
    stubs["usb.util"] = usb_util

    usb_backend = _make_module("usb.backend")
    stubs["usb.backend"] = usb_backend

    usb_backend_libusb1 = _make_module("usb.backend.libusb1")
    stubs["usb.backend.libusb1"] = usb_backend_libusb1

    return stubs


# ---------------------------------------------------------------------------
# Pyro5 stubs
# ---------------------------------------------------------------------------


def _build_pyro5_stubs() -> Dict[str, types.ModuleType]:
    stubs: Dict[str, types.ModuleType] = {}

    pyro5_mod = _make_module("Pyro5")
    stubs["Pyro5"] = pyro5_mod

    class FakeProxy:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

    class FakeDaemon:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

    pyro5_api = _make_module(
        "Pyro5.api",
        {
            "Proxy": FakeProxy,
            "Daemon": FakeDaemon,
            "expose": lambda f: f,
            "behavior": lambda *a, **kw: lambda f: f,
            "oneway": lambda f: f,
        },
    )
    stubs["Pyro5.api"] = pyro5_api

    pyro5_server = _make_module(
        "Pyro5.server",
        {
            "expose": lambda f: f,
            "behavior": lambda *a, **kw: lambda f: f,
            "oneway": lambda f: f,
        },
    )
    stubs["Pyro5.server"] = pyro5_server

    pyro5_errors = _make_module(
        "Pyro5.errors",
        {
            "PyroError": _make_exception("PyroError"),
            "CommunicationError": _make_exception("CommunicationError"),
        },
    )
    stubs["Pyro5.errors"] = pyro5_errors

    return stubs


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def _link_submodules(stubs: Dict[str, types.ModuleType]) -> None:
    """Set attributes on parent modules so `import a.b.c` works."""
    for fqn, mod in stubs.items():
        parts = fqn.split(".")
        if len(parts) > 1:
            parent_fqn = ".".join(parts[:-1])
            child_name = parts[-1]
            parent = stubs.get(parent_fqn) or sys.modules.get(parent_fqn)
            if parent is not None:
                setattr(parent, child_name, mod)


def _is_pyodide() -> bool:
    return "pyodide" in sys.modules or "js" in sys.modules


def _patch_thread_manager() -> None:
    """Replace ThreadManager with a Pyodide-compatible version.

    Pyodide's asyncio ``WebLoop`` has a non-blocking ``run_until_complete``.
    Real threads are also unavailable without SharedArrayBuffer.

    We work around this by using a ``_WasmSafeLoop`` (blocking
    ``SelectorEventLoop``) to eagerly build the managed hardware object,
    then wrapping sync calls through a direct adapter.
    """
    import functools
    from typing import Awaitable, Callable

    try:
        from opentrons.hardware_control.thread_manager import ThreadManager
    except ImportError:
        return

    class _FakeThread:
        daemon = True

        def start(self) -> None:
            pass

        def join(self, timeout: Optional[float] = None) -> None:
            pass

        def is_alive(self) -> bool:
            return True

    def _pyodide_init(
        self: Any,
        builder: Callable[..., Awaitable[Any]],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        import threading
        import weakref

        loop = _make_wasm_safe_loop()

        object.__setattr__(self, "_loop", loop)
        object.__setattr__(self, "managed_obj", None)
        object.__setattr__(self, "bridged_obj", None)
        object.__setattr__(self, "_sync_managed_obj", None)

        is_running = threading.Event()
        object.__setattr__(self, "_is_running", is_running)
        object.__setattr__(self, "_cached_modules", weakref.WeakKeyDictionary())
        object.__setattr__(self, "_thread", _FakeThread())

        try:
            old = asyncio.events._get_running_loop()
            asyncio.events._set_running_loop(None)
            try:
                managed_obj = loop.run_until_complete(builder(*args, loop=loop, **kwargs))
            finally:
                asyncio.events._set_running_loop(old)

            object.__setattr__(self, "managed_obj", managed_obj)

            bridged = _DirectBridger(managed_obj, loop)
            object.__setattr__(self, "bridged_obj", bridged)
            object.__setattr__(self, "_sync_managed_obj", _DirectSyncAdapter(managed_obj, loop))
        except Exception:
            import traceback

            traceback.print_exc()
        finally:
            is_running.set()

    class _DirectBridger:
        """Pass-through bridger: no cross-thread dispatch needed."""

        def __init__(self, obj: Any, loop: asyncio.AbstractEventLoop) -> None:
            object.__setattr__(self, "_obj", obj)
            object.__setattr__(self, "_loop", loop)

        def __getattr__(self, name: str) -> Any:
            obj = object.__getattribute__(self, "_obj")
            return getattr(obj, name)

    class _DirectSyncAdapter:
        """Sync adapter that calls async methods via the managed loop."""

        def __init__(self, obj: Any, loop: asyncio.AbstractEventLoop) -> None:
            object.__setattr__(self, "_obj", obj)
            object.__setattr__(self, "_loop", loop)

        def __getattr__(self, name: str) -> Any:
            obj = object.__getattribute__(self, "_obj")
            loop = object.__getattribute__(self, "_loop")
            attr = getattr(obj, name)

            if asyncio.iscoroutinefunction(attr):

                @functools.wraps(attr)
                def wrapper(*a: Any, **kw: Any) -> Any:
                    return loop.run_until_complete(attr(*a, **kw))

                return wrapper

            return attr

    ThreadManager.__init__ = _pyodide_init  # type: ignore[assignment]

    def _pyodide_clean_up_tm(self: Any) -> None:
        loop = object.__getattribute__(self, "_loop")
        if loop and not loop.is_closed():
            try:
                loop.close()
            except Exception:
                pass
        import weakref

        object.__setattr__(self, "_cached_modules", weakref.WeakKeyDictionary())

    ThreadManager.clean_up_tm = _pyodide_clean_up_tm  # type: ignore[assignment]


def install() -> None:
    """Install all hardware-dependency stubs into sys.modules.

    Call this once before importing opentrons. Idempotent.
    """
    builders = [
        _build_serial_stubs,
        _build_aionotify_stubs,
        _build_usb_stubs,
        _build_pyro5_stubs,
    ]
    for builder in builders:
        stubs = builder()
        _link_submodules(stubs)
        for name, mod in stubs.items():
            if name not in sys.modules:
                sys.modules[name] = mod


def _patch_asyncio_run() -> None:
    """Patch asyncio.run() to work inside Pyodide's already-running event loop.

    Pyodide runs Python inside an async context, so asyncio.run() fails with
    'cannot be called from a running event loop'. We replace it with a version
    that temporarily detaches the running loop, runs the coroutine on a
    ``_WasmSafeLoop``, then restores the original.
    """
    _original_run = asyncio.run

    def _pyodide_run(
        main: Any,
        *,
        debug: bool = False,
        loop_factory: Any = None,
    ) -> Any:
        running = asyncio.events._get_running_loop()
        if running is None:
            return _original_run(main, debug=debug)

        asyncio.events._set_running_loop(None)
        loop = _make_wasm_safe_loop()
        try:
            if debug is not None:
                loop.set_debug(debug)
            return loop.run_until_complete(main)
        finally:
            try:
                _cancel_all_tasks(loop)
                loop.run_until_complete(loop.shutdown_asyncgens())
            except Exception:
                pass
            finally:
                loop.close()
                asyncio.events._set_running_loop(running)

    def _cancel_all_tasks(loop: asyncio.AbstractEventLoop) -> None:
        to_cancel = asyncio.all_tasks(loop)
        if not to_cancel:
            return
        for task in to_cancel:
            task.cancel()
        loop.run_until_complete(asyncio.gather(*to_cancel, return_exceptions=True))

    asyncio.run = _pyodide_run  # type: ignore[assignment]


def _patch_anyio_threads() -> None:
    """Patch anyio.to_thread.run_sync to run synchronously.

    In Pyodide, threads can't be created (without SharedArrayBuffer).
    ``anyio`` uses ``to_thread.run_sync()`` for file I/O (via ``anyio.Path``).
    We replace it with a direct synchronous call since we're single-threaded.

    The public API ``anyio.to_thread.run_sync`` dispatches through
    ``get_async_backend().run_sync_in_worker_thread()``, which resolves to
    ``AsyncIOBackend.run_sync_in_worker_thread`` (a classmethod). We patch
    both the public API and the backend classmethod so that every call site
    is covered regardless of how the caller imported or dispatched the call.
    """
    try:
        import anyio.to_thread
    except ImportError:
        return

    async def _run_sync_inline(
        func: Any,
        *args: Any,
        abandon_on_cancel: bool = False,
        cancellable: bool = False,
        limiter: Any = None,
    ) -> Any:
        return func(*args)

    anyio.to_thread.run_sync = _run_sync_inline  # type: ignore[assignment]

    try:
        import anyio._backends._asyncio as _aio_backend

        @classmethod  # type: ignore[misc]
        async def _run_sync_no_thread(
            cls: Any,
            func: Any,
            args: tuple = (),
            abandon_on_cancel: bool = False,
            limiter: Any = None,
        ) -> Any:
            return func(*args)

        _aio_backend.AsyncIOBackend.run_sync_in_worker_thread = _run_sync_no_thread  # type: ignore[assignment]
    except (ImportError, AttributeError):
        pass


def _patch_run_coroutine_threadsafe() -> None:
    """Patch ``asyncio.run_coroutine_threadsafe`` to work single-threaded.

    ``ChildThreadTransport`` and ``SynchronousAdapter`` call
    ``run_coroutine_threadsafe(coro, loop).result()`` to bridge sync code to
    async Protocol Engine methods.  Normally the sync code runs in a worker
    thread and the loop runs in the main thread, so ``.result()`` blocks the
    worker until the main-thread loop finishes the coroutine.

    In Pyodide everything is single-threaded: the sync code (``run_protocol``)
    runs *inline* on the event-loop thread (via our ``to_thread.run_sync``
    patch).  Calling ``.result()`` deadlocks because the loop can't process
    the scheduled coroutine while we're blocking it.

    Fix: schedule the coroutine as a Task, then manually pump the event loop
    with ``_run_once()`` until the Task completes.  Our ``_WasmSafeLoop``
    has a re-entrant-safe ``_run_once`` that guards against items being
    consumed by nested calls.
    """
    import concurrent.futures

    _original = asyncio.run_coroutine_threadsafe

    def _pyodide_run_coroutine_threadsafe(
        coro: Any,
        loop: asyncio.AbstractEventLoop,
    ) -> "concurrent.futures.Future[Any]":
        if not isinstance(loop, _WasmSafeLoop):
            return _original(coro, loop)

        f: concurrent.futures.Future[Any] = concurrent.futures.Future()
        try:
            result = _pump_until_complete(loop, coro)
            f.set_result(result)
        except BaseException as e:
            f.set_exception(e)
        return f

    asyncio.run_coroutine_threadsafe = _pyodide_run_coroutine_threadsafe  # type: ignore[assignment]


def _patch_synchronous_adapter() -> None:
    """Patch ``SynchronousAdapter`` to use loop-pumping instead of threads.

    ``SynchronousAdapter.__getattribute__`` wraps coroutine methods with
    ``call_coroutine_sync(loop, method)`` which uses
    ``run_coroutine_threadsafe``.  Our global ``run_coroutine_threadsafe``
    patch handles the ``_WasmSafeLoop`` case, but ``SynchronousAdapter``
    also accesses ``obj._loop`` directly.  We ensure it uses the correct
    loop and handles awaitable properties.
    """
    try:
        from opentrons.hardware_control.adapters import SynchronousAdapter
    except ImportError:
        return

    @staticmethod  # type: ignore[misc]
    def _pyodide_call_coroutine_sync(
        loop: asyncio.AbstractEventLoop,
        to_call: Any,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        if isinstance(loop, _WasmSafeLoop):
            return _pump_until_complete(loop, to_call(*args, **kwargs))
        fut = asyncio.run_coroutine_threadsafe(to_call(*args, **kwargs), loop)
        return fut.result()

    SynchronousAdapter.call_coroutine_sync = _pyodide_call_coroutine_sync  # type: ignore[assignment]


def patch_for_pyodide() -> None:
    """Apply Pyodide-specific patches (call AFTER importing opentrons)."""
    _patch_thread_manager()
    _patch_asyncio_run()
    _patch_anyio_threads()
    _patch_run_coroutine_threadsafe()
    _patch_synchronous_adapter()


# ---------------------------------------------------------------------------
# Pyodide-specific entry points for PE analysis / simulation
# ---------------------------------------------------------------------------


async def analyze_pyodide(
    protocol_text: str,
    file_name: str = "protocol.py",
    labware_files: Optional[List[tuple]] = None,
    csv_file: Optional[tuple] = None,
) -> Any:
    """Analyze a protocol using the Protocol Engine path.

    Args:
        protocol_text: The full text of the protocol file.
        file_name: Name to save the protocol as (used for type detection).
        labware_files: List of (name, text) tuples for custom labware JSON files.
        csv_file: Optional (name, text) tuple for a CSV RTP file.

    Returns the ``RunResult`` NamedTuple (commands, state_summary,
    parameters, command_annotations, command_preconditions).
    """
    import pathlib
    import tempfile

    from opentrons.protocol_reader import ProtocolReader
    from opentrons.protocol_runner.create_simulating_orchestrator import (
        create_simulating_orchestrator,
    )
    from opentrons.protocol_runner.run_orchestrator import ParseMode

    async def _run_analysis() -> Any:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = pathlib.Path(tmp)

            main_file = tmp_path / file_name
            main_file.write_text(protocol_text, encoding="utf-8")
            all_files: List[pathlib.Path] = [main_file]

            # Write custom labware files alongside the protocol.
            for lw_name, lw_text in labware_files or []:
                lw_path = tmp_path / lw_name
                lw_path.write_text(lw_text, encoding="utf-8")
                all_files.append(lw_path)

            # Write CSV RTP file if provided.
            csv_path: Optional[pathlib.Path] = None
            if csv_file is not None:
                csv_name, csv_text = csv_file
                csv_path = tmp_path / csv_name
                csv_path.write_text(csv_text, encoding="utf-8")

            protocol_source = await ProtocolReader().read_saved(
                files=all_files,
                directory=None,
                files_are_prevalidated=False,
            )

            orchestrator = await create_simulating_orchestrator(
                robot_type=protocol_source.robot_type,
                protocol_config=protocol_source.config,
            )

            # Build run_time_param_paths from variable_name → Path if CSV provided.
            rtp_paths = None
            if csv_path is not None:
                # Find the CSV parameter variable name from the protocol's RTPs.
                # We match by variable name so the user doesn't have to supply it.
                await orchestrator.load(
                    protocol_source=protocol_source,
                    parse_mode=ParseMode.NORMAL,
                    run_time_param_values=None,
                    run_time_param_paths=None,
                )
                rtp_defs = orchestrator.get_run_time_parameters()
                csv_var_names = [
                    p.variableName for p in rtp_defs if getattr(p, "type", None) == "csv_file"
                ]
                if csv_var_names:
                    rtp_paths = {csv_var_names[0]: csv_path}
                    # Re-create orchestrator for fresh load with paths.
                    orchestrator = await create_simulating_orchestrator(
                        robot_type=protocol_source.robot_type,
                        protocol_config=protocol_source.config,
                    )
                    await orchestrator.load(
                        protocol_source=protocol_source,
                        parse_mode=ParseMode.NORMAL,
                        run_time_param_values=None,
                        run_time_param_paths=rtp_paths,
                    )
            else:
                await orchestrator.load(
                    protocol_source=protocol_source,
                    parse_mode=ParseMode.NORMAL,
                    run_time_param_values=None,
                    run_time_param_paths=None,
                )

            result = await orchestrator.run(deck_configuration=[])
            return result

    return asyncio.run(_run_analysis())


async def simulate_pyodide(
    protocol_text: str,
    file_name: str = "protocol.py",
    labware_files: Optional[List[tuple]] = None,
    csv_file: Optional[tuple] = None,
) -> str:
    """Simulate a protocol and return a human-readable run log.

    This is a convenience wrapper around ``analyze_pyodide`` that formats
    the ``RunResult`` into a readable string (similar to what
    ``opentrons.simulate.format_runlog`` produces).
    """
    result = await analyze_pyodide(protocol_text, file_name, labware_files, csv_file)

    lines: List[str] = []
    for cmd in result.commands:
        params = cmd.params
        text = getattr(cmd, "commandType", str(type(cmd)))
        detail = ""
        if hasattr(params, "displayName"):
            detail = params.displayName or ""
        elif hasattr(params, "message"):
            detail = params.message or ""
        elif hasattr(cmd, "key"):
            detail = cmd.key or ""
        lines.append(f"{text}: {detail}" if detail else str(text))

    status = result.state_summary.status if result.state_summary else "unknown"
    errors = result.state_summary.errors if result.state_summary else []

    header = f"Protocol simulation: {status}"
    summary = f"{len(result.commands)} commands executed"

    parts = [header, summary, ""]
    parts.extend(lines)

    if errors:
        parts.append("")
        parts.append("Errors:")
        for err in errors:
            parts.append(f"  - {err.errorType}: {err.detail}")

    return "\n".join(parts)
