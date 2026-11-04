"""Exercise operator confirmation gates without connecting to hardware."""

from contextlib import contextmanager
import importlib.util
import os
from pathlib import Path
import pty
import termios
import tty
from types import SimpleNamespace
from typing import Callable, Iterator
from unittest.mock import MagicMock

import pytest

from hardware_testing.gravimetric.offset_calibration.__main__ import (
    configuration_paths,
    main,
    parser,
    selected_routes,
)
from hardware_testing.gravimetric.offset_calibration.operator import (
    OperatorAbort,
    run_routes,
)
from hardware_testing.gravimetric.offset_calibration.storage import Route
from hardware_testing.gravimetric.offset_calibration.terminal import Terminal


ROUTE = Route("stacker_to_deck", "A4", "D2")


class FakeTerminal:
    """Capture prompts and return predetermined operator keystrokes."""

    def __init__(self, keys: list[str]) -> None:
        """Create an isolated terminal transcript for one scenario."""
        self.keys = iter(keys)
        self.messages: list[str] = []
        self.flushes = 0

    def read_key(self) -> str:
        """Read the next scripted key."""
        return next(self.keys)

    def write(self, message: str) -> None:
        """Record an operator-facing message."""
        self.messages.append(message)

    def discard_pending(self) -> None:
        """Count attempts to flush keys buffered during motion."""
        self.flushes += 1


class FakeMotion:
    """Represent observable movement state without controlling hardware."""

    def __init__(self) -> None:
        """Begin with an empty gripper and a known source offset."""
        self.holding_labware = False
        self.at_drop_height = False
        self.candidate = {"x": 2.0, "y": 0.0, "z": 0.0}
        self.events: list[str | tuple[str, float]] = []

    def initialize_route(self, route: Route) -> None:
        """Record empty-shuttle preparation."""
        self.events.append("initialize")

    def prepare_route(self, route: Route, offset: dict[str, float]) -> None:
        """Represent the rack as held at the initial offset."""
        self.holding_labware = True
        self.candidate = dict(offset)
        self.events.append("pickup")

    def jog(self, axis: str, delta: float) -> None:
        """Apply one operator correction to the candidate offset."""
        self.candidate[axis] += delta
        self.events.append((axis, delta))

    def candidate_offset(self) -> dict[str, float]:
        """Expose a copy of the candidate correction."""
        return dict(self.candidate)

    def lower_to_drop_height(self) -> None:
        """Record the explicit descent required before release."""
        self.at_drop_height = True
        self.events.append("lower")

    def release(self) -> dict[str, float]:
        """Release the rack and return its actual candidate offset."""
        self.holding_labware = False
        self.events.append("release")
        return dict(self.candidate)

    def finish_route(self) -> None:
        """Record acknowledgement that the operator removed the rack."""
        self.events.append("finish")


Scenario = tuple[
    SimpleNamespace,
    MagicMock,
    FakeMotion,
    Callable[[list[str]], tuple[int, FakeTerminal]],
]


@pytest.fixture
def scenario() -> Scenario:
    """Provide fake session, persistence and motion for one route."""

    @contextmanager
    def context() -> Iterator[object]:
        yield object()

    session = SimpleNamespace(
        unsafe_to_restart=False,
        protocol_context=context,
        stacker_serials={"A4": "STACKER-A4"},
        raise_if_interrupted=MagicMock(),
    )
    store = MagicMock()
    store.get.return_value = {"x": 2.0, "y": 0.0, "z": 0.0}
    motion = FakeMotion()

    def run(keys: list[str]) -> tuple[int, FakeTerminal]:
        terminal = FakeTerminal(keys)
        count = run_routes(
            session, store, [ROUTE], terminal, lambda *_, **kw: motion, "T200"
        )
        return count, terminal

    return session, store, motion, run


def test_hover_cannot_release_and_confirmation_saves_actual_offset(
    scenario: Scenario,
) -> None:
    """Require descent and operator approval before persisting the final correction."""
    session, store, motion, run = scenario
    count, terminal = run(
        ["ENTER", "ENTER", "ENTER", "RIGHT", "d", "d", "ENTER", "ENTER", "y", "ENTER"]
    )
    assert count == 1
    assert motion.events == [
        "initialize",
        "pickup",
        ("x", 0.1),
        "lower",
        "release",
        "finish",
    ]
    store.save.assert_called_once_with(ROUTE, {"x": 2.1, "y": 0.0, "z": 0.0})
    assert not session.unsafe_to_restart
    assert any("尚在悬停高度" in message for message in terminal.messages)
    assert terminal.flushes >= 10


def test_declining_confirmation_does_not_save(scenario: Scenario) -> None:
    """Keep production offsets untouched when the operator rejects the landing."""
    session, store, motion, run = scenario
    count, _ = run(["ENTER", "ENTER", "d", "d", "ENTER", "ENTER", "n", "ENTER"])
    assert count == 0
    store.save.assert_not_called()
    assert not session.unsafe_to_restart


@pytest.mark.parametrize("key", ["q", "ESC"])
def test_abort_while_holding_requires_recovery_and_never_releases(
    scenario: Scenario, key: str
) -> None:
    """An abort must retain the held rack and require explicit recovery."""
    session, store, motion, run = scenario
    with pytest.raises(OperatorAbort):
        run(["ENTER", "ENTER", key])
    assert session.unsafe_to_restart
    assert motion.holding_labware
    assert "release" not in motion.events
    store.save.assert_not_called()


def test_partial_pickup_failure_is_unsafe(scenario: Scenario) -> None:
    """A partially executed pickup cannot be assumed to leave an empty gripper."""
    session, store, motion, run = scenario
    motion.prepare_route = MagicMock(side_effect=OSError("position unknown"))
    with pytest.raises(OSError):
        run(["ENTER", "ENTER"])
    assert session.unsafe_to_restart
    assert "release" not in motion.events
    store.save.assert_not_called()


def test_failed_release_never_saves_or_restores_service(scenario: Scenario) -> None:
    """A failed release cannot produce a confirmation or safe restart."""
    session, store, motion, run = scenario
    motion.release = MagicMock(side_effect=OSError("lost motor connection"))
    with pytest.raises(OSError):
        run(["ENTER", "ENTER", "d", "d", "ENTER", "ENTER"])
    assert session.unsafe_to_restart
    store.save.assert_not_called()


def test_large_step_at_drop_height_is_blocked(scenario: Scenario) -> None:
    """Allow only fine corrections after the descent to the landing point."""
    session, store, motion, run = scenario
    run(
        [
            "ENTER",
            "ENTER",
            "d",
            "d",
            "1",
            "RIGHT",
            "4",
            "LEFT",
            "ENTER",
            "ENTER",
            "y",
            "ENTER",
        ]
    )
    assert ("x", 1.0) not in motion.events
    store.save.assert_called_once_with(ROUTE, {"x": 1.95, "y": 0.0, "z": 0.0})


def test_skip_does_not_start_motion_or_write(scenario: Scenario) -> None:
    """Skipping an unprepared route cannot trigger motion or persistence."""
    session, store, motion, run = scenario
    assert run(["s"])[0] == 0
    assert motion.events == []
    store.save.assert_not_called()


def test_list_covers_all_80_routes_without_robot_import(
    capsys: pytest.CaptureFixture[str],
) -> None:
    """The offline CLI route list includes every direction and the A3 routes."""
    assert main(["--list"]) == 0
    output = capsys.readouterr().out
    assert len([line for line in output.splitlines() if " -> " in line]) == 80
    assert "A4 -> A3" in output and "A3 -> D4" in output


def test_filters_include_both_directions_and_reject_empty_routes() -> None:
    """Route filters preserve both directions and reject unsupported transfers."""
    assert len(selected_routes(parser().parse_args(["--stacker", "B4"]))) == 20
    assert selected_routes(
        parser().parse_args(["--source", "A4", "--target", "D2"])
    ) == [ROUTE]
    with pytest.raises(ValueError, match="没有对应路线"):
        selected_routes(parser().parse_args(["--source", "A1", "--target", "D2"]))


def test_new_override_preserves_effective_persistent_baseline(tmp_path: Path) -> None:
    """A missing override must inherit the lower-priority machine calibration."""
    override = tmp_path / "new-override.json"
    persistent = tmp_path / "gravimetric" / "gravimetric_stacker_drop_offsets.json"
    persistent.parent.mkdir()
    persistent.write_text("{}")
    assert configuration_paths(tmp_path, override) == (override, persistent)
    assert configuration_paths(tmp_path, None) == (persistent, persistent)


def test_terminal_discards_buffered_jogs_and_decodes_keys() -> None:
    """Decode real terminal escape sequences and discard queued repeat input."""
    master, slave = pty.openpty()
    terminal = object.__new__(Terminal)
    terminal.fd = slave
    original = termios.tcgetattr(slave)
    try:
        tty.setcbreak(slave)
        os.write(master, b"\x1b[A")
        assert terminal.read_key() == "UP"
        os.write(master, b"\x1b[6~")
        assert terminal.read_key() == "PAGEDOWN"
        os.write(master, b"ignored-repeat\n")
        # Read one byte to ensure the driver has delivered the queued data.
        assert os.read(slave, 1) == b"i"
        terminal.discard_pending()
        os.write(master, b"d")
        assert terminal.read_key() == "d"
    finally:
        termios.tcsetattr(slave, termios.TCSANOW, original)
        os.close(slave)
        os.close(master)


def test_desktop_launcher_quotes_remote_args_and_rejects_option_hosts(
    tmp_path: Path,
) -> None:
    """Keep remote arguments literal and reject hosts that could be SSH options."""
    launcher_path = (
        Path(__file__).resolve().parents[3] / "gravimetric_offset_calibration.py"
    )
    spec = importlib.util.spec_from_file_location("offset_launcher", launcher_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    key = tmp_path / "key with spaces"
    key.write_text("test fixture")
    command = module.ssh_command(
        "192.168.6.177", str(key), ["--target", "$(unexpected)"]
    )
    assert command[command.index("-i") + 1] == str(key)
    assert "'$(unexpected)'" in command[-1]
    assert "root@192.168.6.177" in command
    with pytest.raises(ValueError):
        module.ssh_command("-oProxyCommand=anything", None, [])
