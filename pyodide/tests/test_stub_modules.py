"""Tests for the hardware stub modules built by opentrons_pyodide_shims.

These run in a normal CPython environment so all opentrons imports are
skipped.  We test only the stub-building helpers and the helper utilities
that live entirely in the shims module itself.
"""

import sys
import types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import opentrons_pyodide_shims as shims  # noqa: E402, I001


# ---------------------------------------------------------------------------
# _make_module
# ---------------------------------------------------------------------------


def test_make_module_returns_module_type() -> None:
    mod = shims._make_module("foo")
    assert isinstance(mod, types.ModuleType)


def test_make_module_name() -> None:
    mod = shims._make_module("foo.bar")
    assert mod.__name__ == "foo.bar"


def test_make_module_package_set_for_dotted_name() -> None:
    mod = shims._make_module("foo.bar")
    assert mod.__package__ == "foo"


def test_make_module_package_set_for_simple_name() -> None:
    mod = shims._make_module("foo")
    assert mod.__package__ == "foo"


def test_make_module_attributes_set() -> None:
    mod = shims._make_module("foo", {"x": 42, "y": "hello"})
    assert mod.x == 42
    assert mod.y == "hello"


def test_make_module_no_attributes_by_default() -> None:
    mod = shims._make_module("empty")
    assert not hasattr(mod, "x")


def test_make_module_path_is_list() -> None:
    mod = shims._make_module("foo")
    assert isinstance(mod.__path__, list)


# ---------------------------------------------------------------------------
# _make_exception
# ---------------------------------------------------------------------------


def test_make_exception_is_exception() -> None:
    exc_cls = shims._make_exception("MyError")
    assert issubclass(exc_cls, Exception)


def test_make_exception_name() -> None:
    exc_cls = shims._make_exception("MyError")
    assert exc_cls.__name__ == "MyError"


def test_make_exception_custom_base() -> None:
    exc_cls = shims._make_exception("MyOSError", OSError)
    assert issubclass(exc_cls, OSError)


def test_make_exception_can_be_raised_and_caught() -> None:
    exc_cls = shims._make_exception("MyError")
    raised = False
    try:
        raise exc_cls("boom")
    except Exception as e:
        raised = True
        assert "boom" in str(e)
    assert raised


# ---------------------------------------------------------------------------
# Serial stubs
# ---------------------------------------------------------------------------


def test_serial_stubs_keys_present() -> None:
    stubs = shims._build_serial_stubs()
    expected = {
        "serial",
        "serial.serialutil",
        "serial.tools",
        "serial.tools.list_ports",
        "serial.tools.list_ports_common",
        "serial.tools.list_ports_linux",
        "serial.tools.list_ports_posix",
        "serial.tools.list_ports_osx",
    }
    assert expected.issubset(stubs.keys())


def test_serial_stubs_has_serial_class() -> None:
    stubs = shims._build_serial_stubs()
    assert hasattr(stubs["serial"], "Serial")


def test_fake_serial_open_close() -> None:
    stubs = shims._build_serial_stubs()
    FakeSerial = stubs["serial"].Serial
    s = FakeSerial(port="/dev/ttyUSB0", baudrate=115200)
    assert not s.is_open
    s.open()
    assert s.is_open
    s.close()
    assert not s.is_open


def test_fake_serial_context_manager() -> None:
    stubs = shims._build_serial_stubs()
    FakeSerial = stubs["serial"].Serial
    with FakeSerial(port="/dev/null") as s:
        assert s.is_open
    assert not s.is_open


def test_fake_serial_read_returns_bytes() -> None:
    stubs = shims._build_serial_stubs()
    FakeSerial = stubs["serial"].Serial
    s = FakeSerial()
    assert isinstance(s.read(10), bytes)


def test_fake_serial_write_returns_length() -> None:
    stubs = shims._build_serial_stubs()
    FakeSerial = stubs["serial"].Serial
    s = FakeSerial()
    assert s.write(b"hello") == 5


def test_serial_for_url() -> None:
    stubs = shims._build_serial_stubs()
    serial_for_url = stubs["serial"].serial_for_url
    s = serial_for_url("/dev/ttyUSB0")
    assert s.port == "/dev/ttyUSB0"


def test_serial_comports_returns_empty_list() -> None:
    stubs = shims._build_serial_stubs()
    comports = stubs["serial.tools.list_ports"].comports
    result = comports()
    assert isinstance(result, list)
    assert len(result) == 0


def test_list_port_info_indexing() -> None:
    stubs = shims._build_serial_stubs()
    ListPortInfo = stubs["serial.tools.list_ports_common"].ListPortInfo
    port = ListPortInfo("/dev/ttyUSB0")
    assert port[0] == "/dev/ttyUSB0"
    assert port[1] == "/dev/ttyUSB0"
    assert isinstance(port[2], str)


def test_list_port_info_index_error() -> None:
    stubs = shims._build_serial_stubs()
    ListPortInfo = stubs["serial.tools.list_ports_common"].ListPortInfo
    port = ListPortInfo("/dev/ttyUSB0")
    raised = False
    try:
        _ = port[99]
    except IndexError:
        raised = True
    assert raised


def test_serial_exceptions_hierarchy() -> None:
    stubs = shims._build_serial_stubs()
    SerialException = stubs["serial"].SerialException
    SerialTimeoutException = stubs["serial"].SerialTimeoutException
    assert issubclass(SerialTimeoutException, SerialException)
    assert issubclass(SerialException, Exception)


def test_serial_version_string() -> None:
    stubs = shims._build_serial_stubs()
    assert stubs["serial"].VERSION == "3.5"


def test_serial_constants() -> None:
    stubs = shims._build_serial_stubs()
    serial = stubs["serial"]
    assert serial.EIGHTBITS == 8
    assert serial.PARITY_NONE == "N"
    assert serial.STOPBITS_ONE == 1


# ---------------------------------------------------------------------------
# aionotify stubs
# ---------------------------------------------------------------------------


def test_aionotify_stubs_keys_present() -> None:
    stubs = shims._build_aionotify_stubs()
    assert "aionotify" in stubs


def test_aionotify_has_watcher_attribute() -> None:
    stubs = shims._build_aionotify_stubs()
    assert hasattr(stubs["aionotify"], "Watcher")


def test_aionotify_has_flags_attribute() -> None:
    stubs = shims._build_aionotify_stubs()
    assert hasattr(stubs["aionotify"], "Flags")


def test_fake_watcher_instantiates() -> None:
    stubs = shims._build_aionotify_stubs()
    Watcher = stubs["aionotify"].Watcher
    w = Watcher()
    assert w is not None


def test_fake_watcher_watch_no_op() -> None:
    stubs = shims._build_aionotify_stubs()
    Watcher = stubs["aionotify"].Watcher
    w = Watcher()
    w.watch("/tmp", 0)  # should not raise


def test_fake_watcher_close_no_op() -> None:
    stubs = shims._build_aionotify_stubs()
    Watcher = stubs["aionotify"].Watcher
    w = Watcher()
    w.close()  # should not raise


# ---------------------------------------------------------------------------
# usb stubs
# ---------------------------------------------------------------------------


def test_usb_stubs_keys_present() -> None:
    stubs = shims._build_usb_stubs()
    expected = {"usb", "usb.core", "usb.util", "usb.backend", "usb.backend.libusb1"}
    assert expected.issubset(stubs.keys())


def test_usb_find_returns_none() -> None:
    stubs = shims._build_usb_stubs()
    find = stubs["usb.core"].find
    assert find() is None
    assert find(idVendor=0x1234, idProduct=0x5678) is None


def test_usb_error_is_exception() -> None:
    stubs = shims._build_usb_stubs()
    USBError = stubs["usb.core"].USBError
    assert issubclass(USBError, Exception)


def test_usb_backend_libusb1_present() -> None:
    stubs = shims._build_usb_stubs()
    assert "usb.backend.libusb1" in stubs


# ---------------------------------------------------------------------------
# Pyro5 stubs
# ---------------------------------------------------------------------------


def test_pyro5_stubs_keys_present() -> None:
    stubs = shims._build_pyro5_stubs()
    expected = {"Pyro5", "Pyro5.api", "Pyro5.errors"}
    assert expected.issubset(stubs.keys())


def test_pyro5_daemon_class_exists() -> None:
    stubs = shims._build_pyro5_stubs()
    assert hasattr(stubs["Pyro5.api"], "Daemon")


def test_pyro5_proxy_class_exists() -> None:
    stubs = shims._build_pyro5_stubs()
    assert hasattr(stubs["Pyro5.api"], "Proxy")


def test_pyro5_expose_decorator_is_identity() -> None:
    stubs = shims._build_pyro5_stubs()
    expose = stubs["Pyro5.api"].expose

    def my_func() -> int:
        return 42

    assert expose(my_func) is my_func


def test_pyro5_error_is_exception() -> None:
    stubs = shims._build_pyro5_stubs()
    PyroError = stubs["Pyro5.errors"].PyroError
    assert issubclass(PyroError, Exception)


# ---------------------------------------------------------------------------
# install() — puts stubs into sys.modules
# ---------------------------------------------------------------------------

_STUB_PREFIXES = ("serial", "aionotify", "usb", "Pyro5")


def _remove_stub_modules() -> list[str]:
    """Remove all stub modules from sys.modules and return their keys."""
    removed = [k for k in list(sys.modules) if k.startswith(_STUB_PREFIXES)]
    for key in removed:
        sys.modules.pop(key)
    return removed


def test_install_adds_stubs_to_sys_modules() -> None:
    removed = _remove_stub_modules()
    try:
        shims.install()
        assert "serial" in sys.modules
        assert "aionotify" in sys.modules
        assert "usb" in sys.modules
        assert "Pyro5" in sys.modules
    finally:
        for key in list(sys.modules):
            if key.startswith(_STUB_PREFIXES) and key not in removed:
                sys.modules.pop(key, None)


def test_install_does_not_overwrite_existing_module() -> None:
    sentinel = types.ModuleType("serial")
    sentinel.__version__ = "SENTINEL"  # type: ignore[attr-defined]
    sys.modules["serial"] = sentinel
    try:
        shims.install()
        assert sys.modules["serial"] is sentinel
    finally:
        sys.modules.pop("serial", None)


# ---------------------------------------------------------------------------
# _WasmSafeLoop
# ---------------------------------------------------------------------------


def test_wasm_safe_loop_factory_returns_correct_type() -> None:
    loop = shims._make_wasm_safe_loop()
    assert isinstance(loop, shims._WasmSafeLoop)
    loop.close()


def test_wasm_safe_loop_run_until_complete() -> None:
    async def add(x: int, y: int) -> int:
        return x + y

    loop = shims._make_wasm_safe_loop()
    try:
        result = loop.run_until_complete(add(2, 3))
        assert result == 5
    finally:
        loop.close()


def test_wasm_safe_loop_propagates_exception() -> None:
    async def boom() -> None:
        raise ValueError("test error")

    loop = shims._make_wasm_safe_loop()
    raised = False
    try:
        loop.run_until_complete(boom())
    except ValueError as e:
        raised = True
        assert "test error" in str(e)
    finally:
        loop.close()
    assert raised


def test_wasm_safe_loop_self_pipe_stubs_are_no_ops() -> None:
    loop = shims._make_wasm_safe_loop()
    try:
        loop._make_self_pipe()
        loop._close_self_pipe()
        loop._write_to_self()
    finally:
        loop.close()


# ---------------------------------------------------------------------------
# _pump_until_complete
# ---------------------------------------------------------------------------


def test_pump_until_complete_simple_coroutine() -> None:
    async def mul(x: int, y: int) -> int:
        return x * y

    loop = shims._make_wasm_safe_loop()
    try:
        result = shims._pump_until_complete(loop, mul(4, 5))
        assert result == 20
    finally:
        loop.close()


def test_pump_until_complete_exception_propagates() -> None:
    async def fail() -> None:
        raise RuntimeError("pump error")

    loop = shims._make_wasm_safe_loop()
    raised = False
    try:
        shims._pump_until_complete(loop, fail())
    except RuntimeError as e:
        raised = True
        assert "pump error" in str(e)
    finally:
        loop.close()
    assert raised


def test_pump_until_complete_restores_current_task() -> None:
    import asyncio.tasks as _tasks

    async def noop() -> None:
        pass

    loop = shims._make_wasm_safe_loop()
    try:
        fake_task: object = object()
        _tasks._current_tasks[loop] = fake_task  # type: ignore[attr-defined]
        shims._pump_until_complete(loop, noop())
        assert _tasks._current_tasks.get(loop) is fake_task  # type: ignore[attr-defined]
    finally:
        _tasks._current_tasks.pop(loop, None)  # type: ignore[attr-defined]
        loop.close()
