"""Behavioral tests for persistent gripper calibration and resumed progress."""

import json
from pathlib import Path
import stat
from typing import Any

import pytest

from hardware_testing.gravimetric.offset_calibration import storage
from hardware_testing.gravimetric.offset_calibration.storage import (
    CalibrationStore,
    Route,
)


_ROUTE = Route("stacker_to_deck", "B4", "B1")
_A3_ROUTE = Route("deck_to_stacker", "A3", "D4")
_CONFIRMED = {"x": 0.25, "y": -0.5, "z": 0.0}


@pytest.fixture
def baseline(tmp_path: Path) -> Path:
    """Copy the real complete production baseline, including the A3 routes."""
    source = (
        Path(__file__).parents[3]
        / "hardware_testing/gravimetric/protocol_replacement"
        / "gravimetric_stacker_drop_offsets.json"
    )
    path = tmp_path / "baseline.json"
    path.write_bytes(source.read_bytes())
    return path


def _store(
    baseline: Path,
    *,
    robot_serial: str = "robot-1",
    rack_type: str = "opentrons_flex_96_tiprack_200ul",
    fingerprint: str = "gripper-calibration-1",
) -> CalibrationStore:
    return CalibrationStore(
        baseline.parent / "data" / "gravimetric_stacker_drop_offsets.json",
        baseline,
        robot_serial,
        rack_type,
        fingerprint,
    )


def test_initialization_is_read_only_and_covers_all_routes(baseline: Path) -> None:
    """Reading defaults must not activate a new calibration file."""
    store = _store(baseline)

    assert len(store.routes) == 80
    assert len(set(store.routes)) == 80
    assert sum("A3" in (route.source, route.target) for route in store.routes) == 8
    assert store.pending_routes() == store.routes
    assert not store.target_path.parent.exists()
    returned = store.get(_ROUTE)
    returned["x"] = 999.0
    assert store.get(_ROUTE)["x"] == 2.0


def test_routes_can_be_listed_without_configuration() -> None:
    """An offline route list does not need a robot or baseline file."""
    routes = storage.all_routes()

    assert len(routes) == len(set(routes)) == 80
    assert sum(route.direction == "stacker_to_deck" for route in routes) == 40
    assert sum(route.direction == "deck_to_stacker" for route in routes) == 40


def test_save_only_updates_confirmed_route_and_preserves_baseline(
    baseline: Path,
) -> None:
    """A confirmation activates one change and keeps the full route table intact."""
    baseline_bytes = baseline.read_bytes()
    store = _store(baseline)
    before = {route: store.get(route) for route in store.routes}

    store.save(_A3_ROUTE, _CONFIRMED)

    assert store.is_completed(_A3_ROUTE)
    assert len(store.pending_routes()) == 79
    reopened = _store(baseline)
    for route in store.routes:
        assert reopened.get(route) == (
            _CONFIRMED if route == _A3_ROUTE else before[route]
        )
    assert reopened.is_completed(_A3_ROUTE)
    assert baseline.read_bytes() == baseline_bytes
    document = json.loads(store.target_path.read_text())
    assert set(document) == {"stacker_to_deck", "deck_to_stacker"}
    assert len(list(store.backup_dir.glob("*.json"))) == 1
    history = json.loads(store.history_path.read_text())
    assert history["records"][0]["route"] == _A3_ROUTE.key


def test_existing_partial_file_is_rejected_without_changing_offsets(
    baseline: Path,
) -> None:
    """Package offsets must not silently replace production built-in defaults."""
    store = _store(baseline)
    store.target_path.parent.mkdir()
    existing = b'{"stacker_to_deck":{"B4":{"B1":{"x":1.25,"y":0,"z":0}}}}\n'
    store.target_path.write_bytes(existing)
    with pytest.raises(ValueError, match="production built-in defaults"):
        _store(baseline)

    assert store.target_path.read_bytes() == existing
    assert not store.history_path.exists()
    assert not store.backup_dir.exists()


def test_existing_file_with_missing_axis_is_rejected(baseline: Path) -> None:
    """Do not replace an implicit zero axis with a package offset."""
    store = _store(baseline)
    store.target_path.parent.mkdir()
    document = json.loads(baseline.read_text())
    del document["stacker_to_deck"]["B4"]["B1"]["x"]
    store.target_path.write_text(json.dumps(document))

    with pytest.raises(ValueError, match="complete XYZ"):
        _store(baseline)


def test_atomic_replacement_preserves_existing_file_permissions(baseline: Path) -> None:
    """Saving must not remove the robot service's existing read permission."""
    store = _store(baseline)
    store.save(_A3_ROUTE, _CONFIRMED)
    assert stat.S_IMODE(store.target_path.stat().st_mode) == 0o644
    store.target_path.chmod(0o640)

    store.save(_ROUTE, _CONFIRMED)

    assert stat.S_IMODE(store.target_path.stat().st_mode) == 0o640


def test_complete_existing_file_is_authoritative_and_backed_up_exactly(
    baseline: Path,
) -> None:
    """An existing full configuration replaces the baseline, without merging it."""
    store = _store(baseline)
    store.target_path.parent.mkdir()
    document = json.loads(baseline.read_text())
    document["stacker_to_deck"]["B4"]["B1"]["x"] = 1.25
    existing = json.dumps(document).encode()
    store.target_path.write_bytes(existing)
    baseline.unlink()
    store = _store(baseline)

    store.save(_A3_ROUTE, _CONFIRMED)

    assert store.get(_ROUTE)["x"] == 1.25
    assert next(store.backup_dir.glob("*.json")).read_bytes() == existing
    saved = json.loads(store.target_path.read_bytes())
    document["deck_to_stacker"]["A3"]["D4"] = _CONFIRMED
    assert saved == document


@pytest.mark.parametrize(
    "number", [float("nan"), float("inf"), -float("inf"), True, "1"]
)
def test_rejects_nonfinite_or_nonnumeric_values(baseline: Path, number: Any) -> None:
    """Never persist values that cannot describe a finite physical correction."""
    store = _store(baseline)
    with pytest.raises(ValueError, match="finite number"):
        store.save(_ROUTE, {"x": number, "y": 0.0, "z": 0.0})
    assert not store.target_path.exists()


@pytest.mark.parametrize(
    "contents",
    [
        b"{invalid",
        b"[]",
        b'{"stacker_to_deck":{"B4":{"B1":{"x":NaN}}}}',
        b'{"stacker_to_deck":{"B4":{"B1":{"z":Infinity}}}}',
        b'{"stacker_to_deck":{"B4":{"C1":{"x":1}}}}',
        b'{"stacker_to_deck":{},"stacker_to_deck":{}}',
    ],
)
def test_rejects_corrupt_selected_configuration(
    baseline: Path, contents: bytes
) -> None:
    """A bad machine file must never silently fall back to the package baseline."""
    store = _store(baseline)
    store.target_path.parent.mkdir()
    store.target_path.write_bytes(contents)

    with pytest.raises(ValueError):
        _store(baseline)


def test_rejects_incomplete_baseline(baseline: Path) -> None:
    """Require the extra A3 routes even though production currently uses nine slots."""
    document = json.loads(baseline.read_text())
    del document["stacker_to_deck"]["A4"]["A3"]
    baseline.write_text(json.dumps(document))

    with pytest.raises(ValueError, match="80"):
        _store(baseline)


def test_interrupted_replace_keeps_original_and_backup(
    baseline: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A failed atomic replacement cannot leave a truncated production document."""
    store = _store(baseline)
    store.save(_A3_ROUTE, _CONFIRMED)
    original = store.target_path.read_bytes()
    original_history = store.history_path.read_bytes()
    replace = storage.os.replace

    def fail_target(source: Path, destination: Path) -> None:
        if destination == store.target_path:
            raise OSError("interrupted write")
        replace(source, destination)

    monkeypatch.setattr(storage.os, "replace", fail_target)

    with pytest.raises(OSError, match="interrupted"):
        store.save(_ROUTE, _CONFIRMED)

    assert store.target_path.read_bytes() == original
    assert store.history_path.read_bytes() == original_history
    assert not store.is_completed(_ROUTE)
    assert original in [path.read_bytes() for path in store.backup_dir.glob("*.json")]
    assert not list(store.target_path.parent.glob(f".{store.target_path.name}.*"))


@pytest.mark.parametrize("changed_file", ["target_path", "history_path"])
def test_external_modification_refuses_to_overwrite(
    baseline: Path, changed_file: str
) -> None:
    """Reject stale in-memory data when another process updates either file."""
    store = _store(baseline)
    store.save(_A3_ROUTE, _CONFIRMED)
    path = getattr(store, changed_file)
    external = path.read_bytes() + b"\n"
    path.write_bytes(external)

    with pytest.raises(RuntimeError, match="changed externally"):
        store.save(_ROUTE, _CONFIRMED)

    assert path.read_bytes() == external


def test_second_store_cannot_overwrite_first_store_confirmation(baseline: Path) -> None:
    """Two calibration sessions cannot accidentally replace each other's results."""
    first = _store(baseline)
    second = _store(baseline)
    first.save(_A3_ROUTE, _CONFIRMED)

    with pytest.raises(RuntimeError, match="changed externally"):
        second.save(_ROUTE, _CONFIRMED)

    assert _store(baseline).is_completed(_A3_ROUTE)


@pytest.mark.parametrize(
    "changed_context",
    [
        {"robot_serial": "robot-2"},
        {"rack_type": "opentrons_flex_96_tiprack_1000ul"},
        {"fingerprint": "gripper-calibration-2"},
    ],
)
def test_context_changes_require_reconfirmation(
    baseline: Path, changed_context: dict[str, str]
) -> None:
    """Progress is valid only for the robot, rack and calibration actually checked."""
    store = _store(baseline)
    store.save(_ROUTE, _CONFIRMED)

    assert _store(baseline).is_completed(_ROUTE)
    changed = _store(baseline, **changed_context)
    assert not changed.is_completed(_ROUTE)
    assert changed.get(_ROUTE) == _CONFIRMED


def test_offset_changed_since_confirmation_requires_retest(baseline: Path) -> None:
    """A historical confirmation cannot validate a subsequently edited value."""
    store = _store(baseline)
    store.save(_ROUTE, _CONFIRMED)
    document = json.loads(store.target_path.read_text())
    document["stacker_to_deck"]["B4"]["B1"]["x"] = 0.75
    store.target_path.write_text(json.dumps(document))

    assert not _store(baseline).is_completed(_ROUTE)


def test_history_write_failure_keeps_offsets_but_not_progress(
    baseline: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """After a metadata failure the confirmed value is intact and safely retestable."""
    store = _store(baseline)
    write = storage._atomic_write

    def fail_history(path: Path, contents: bytes) -> None:
        if path == store.history_path:
            raise OSError("history storage failure")
        write(path, contents)

    monkeypatch.setattr(storage, "_atomic_write", fail_history)

    with pytest.raises(
        RuntimeError, match="Confirmed offsets were saved.*history storage"
    ):
        store.save(_ROUTE, _CONFIRMED)

    reopened = _store(baseline)
    assert reopened.get(_ROUTE) == _CONFIRMED
    assert not reopened.is_completed(_ROUTE)
