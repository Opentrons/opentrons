"""Validate and atomically persist confirmed gripper route offsets."""

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import stat
import tempfile
from typing import Any, Iterator
from uuid import uuid4


STACKER_SLOTS = ("A4", "B4", "C4", "D4")
DECK_SLOTS = ("D2", "D3", "C2", "C3", "B1", "B2", "B3", "A1", "A2", "A3")
_AXES = ("x", "y", "z")


@dataclass(frozen=True)
class Route:
    """One directed transfer, whose offset applies at its destination."""

    direction: str
    source: str
    target: str

    @property
    def key(self) -> str:
        """Return a stable key for saved progress."""
        return f"{self.direction}/{self.source}/{self.target}"


def all_routes() -> list[Route]:
    """List all 80 supported directed routes without reading configuration."""
    return [
        Route("stacker_to_deck", stacker, deck)
        for stacker in STACKER_SLOTS
        for deck in DECK_SLOTS
    ] + [
        Route("deck_to_stacker", deck, stacker)
        for deck in DECK_SLOTS
        for stacker in STACKER_SLOTS
    ]


def _offset(value: Any, *, complete: bool) -> dict[str, float]:
    if not isinstance(value, dict) or set(value) - set(_AXES):
        raise ValueError("An offset must contain only x, y and z.")
    if complete and set(value) != set(_AXES):
        raise ValueError("A confirmed offset must contain x, y and z.")
    result = {}
    for axis in _AXES:
        number = value.get(axis, 0.0)
        if (
            isinstance(number, bool)
            or not isinstance(number, (int, float))
            or not math.isfinite(number)
        ):
            raise ValueError(f"Offset {axis} must be a finite number.")
        result[axis] = float(number)
    return result


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def _read_json(contents: bytes) -> Any:
    return json.loads(contents, object_pairs_hook=_unique_object)


def _parse_offsets(contents: bytes, *, complete: bool) -> dict[Route, dict[str, float]]:
    raw = _read_json(contents)
    if not isinstance(raw, dict):
        raise ValueError("The offset file must contain a JSON object.")
    routes = set(all_routes())
    parsed = {}
    for direction, sources in raw.items():
        if direction not in {"stacker_to_deck", "deck_to_stacker"}:
            raise ValueError(f"Unknown offset direction: {direction}")
        if not isinstance(sources, dict):
            raise ValueError(f"Invalid source table for {direction}.")
        for source, targets in sources.items():
            if not isinstance(targets, dict):
                raise ValueError(f"Invalid destination table for {source}.")
            for target, value in targets.items():
                route = Route(direction, source, target)
                if route not in routes:
                    raise ValueError(f"Unknown calibration route: {route.key}")
                parsed[route] = _offset(value, complete=complete)
    if complete and set(parsed) != routes:
        raise ValueError(
            "Configuration must contain all 80 directed routes, including A3."
        )
    return parsed


def _encode(value: Any) -> bytes:
    return (json.dumps(value, indent=2, allow_nan=False) + "\n").encode("utf-8")


def _digest(contents: bytes | None) -> str | None:
    return hashlib.sha256(contents).hexdigest() if contents is not None else None


def _read_optional(path: Path) -> bytes | None:
    try:
        return path.read_bytes()
    except FileNotFoundError:
        return None


def _sync_directory(directory: Path) -> None:
    descriptor = os.open(directory, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _atomic_write(path: Path, contents: bytes) -> None:
    try:
        mode = stat.S_IMODE(path.stat().st_mode)
    except FileNotFoundError:
        mode = 0o644
    descriptor, name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            os.fchmod(stream.fileno(), mode)
            stream.write(contents)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        _sync_directory(path.parent)
    finally:
        temporary.unlink(missing_ok=True)


class CalibrationStore:
    """Keep confirmed offsets separate from candidate trials and progress."""

    def __init__(
        self,
        target_path: Path,
        baseline_path: Path,
        robot_serial: str,
        rack_type: str,
        calibration_fingerprint: str = "",
    ) -> None:
        """Read complete machine calibration, or its baseline if not yet present."""
        if not robot_serial or not rack_type:
            raise ValueError("Robot serial and rack type are required.")
        self.target_path = Path(target_path)
        self.baseline_path = Path(baseline_path)
        self.history_path = self.target_path.with_suffix(".calibration.json")
        self.backup_dir = self.target_path.parent / f"{self.target_path.stem}.backups"
        self.routes = all_routes()
        self._context = {
            "robot_serial": robot_serial,
            "rack_type": rack_type,
            "calibration_fingerprint": calibration_fingerprint,
        }
        current = _read_optional(self.target_path)
        if current is not None:
            try:
                self._offsets = _parse_offsets(current, complete=True)
            except ValueError as error:
                raise ValueError(
                    f"Invalid machine calibration: {error} "
                    "An existing file must contain all 80 routes with complete XYZ. "
                    "Merge partial files with the production built-in defaults first; "
                    "package defaults may differ."
                ) from error
        else:
            self._offsets = _parse_offsets(
                self.baseline_path.read_bytes(), complete=True
            )
        self._expected_digest = _digest(current)
        history = _read_optional(self.history_path)
        self._expected_history_digest = _digest(history)
        self._records: list[dict[str, Any]] = []
        if history is not None:
            document = _read_json(history)
            if (
                not isinstance(document, dict)
                or document.get("schema_version") != 1
                or not isinstance(document.get("records"), list)
            ):
                raise ValueError("Invalid calibration history.")
            for record in document["records"]:
                if (
                    not isinstance(record, dict)
                    or record.get("route") not in {route.key for route in self.routes}
                    or not isinstance(record.get("context"), dict)
                ):
                    raise ValueError("Invalid calibration history record.")
                _offset(record.get("offset"), complete=True)
            self._records = document["records"]

    def get(self, route: Route) -> dict[str, float]:
        """Return the currently effective offset without exposing mutable state."""
        return dict(self._offsets[route])

    def is_completed(self, route: Route) -> bool:
        """Require a matching context and unchanged offset for the latest confirmation."""
        current = self.get(route)
        for record in reversed(self._records):
            if record["route"] == route.key:
                return (
                    record["context"] == self._context and record["offset"] == current
                )
        return False

    def pending_routes(self) -> list[Route]:
        """Return routes without a valid confirmation for this setup."""
        return [route for route in self.routes if not self.is_completed(route)]

    @contextmanager
    def _locked(self) -> Iterator[None]:
        self.target_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path = self.target_path.with_suffix(".lock")
        with lock_path.open("a") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)

    def _ensure_unchanged(self) -> bytes | None:
        current = _read_optional(self.target_path)
        if (
            _digest(current) != self._expected_digest
            or _digest(_read_optional(self.history_path))
            != self._expected_history_digest
        ):
            raise RuntimeError(
                "Calibration files changed externally; reload before confirming offsets."
            )
        return current

    def _document(self, offsets: dict[Route, dict[str, float]]) -> dict[str, Any]:
        document: dict[str, Any] = {"stacker_to_deck": {}, "deck_to_stacker": {}}
        for route in self.routes:
            document[route.direction].setdefault(route.source, {})[
                route.target
            ] = offsets[route]
        return document

    def save(self, route: Route, offset: dict[str, float]) -> None:
        """Save one operator-confirmed route, retaining all other route values."""
        if route not in self._offsets:
            raise ValueError(f"Unknown calibration route: {route.key}")
        confirmed = _offset(offset, complete=True)
        with self._locked():
            current = self._ensure_unchanged()
            offsets = {**self._offsets, route: confirmed}
            contents = _encode(self._document(offsets))
            records = self._records + [
                {
                    "route": route.key,
                    "offset": confirmed,
                    "context": self._context,
                    "confirmed_at": datetime.now(timezone.utc).isoformat(),
                    "offset_file_sha256": _digest(contents),
                }
            ]
            history = _encode({"schema_version": 1, "records": records})
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            backup = self.backup_dir / f"{uuid4().hex}.json"
            _atomic_write(
                backup,
                current
                if current is not None
                else _encode(self._document(self._offsets)),
            )
            # Recheck after preparing the backup, including non-cooperating writers.
            self._ensure_unchanged()
            _atomic_write(self.target_path, contents)
            if self.target_path.read_bytes() != contents:
                raise RuntimeError("Saved offset file failed read-back verification.")
            self._offsets = offsets
            self._expected_digest = _digest(contents)
            # If history writing fails, the confirmed offsets remain intact but this
            # route is not marked complete; repeating confirmation is safe.
            try:
                _atomic_write(self.history_path, history)
                if self.history_path.read_bytes() != history:
                    raise RuntimeError(
                        "Saved calibration history failed read-back verification."
                    )
            except Exception as error:
                raise RuntimeError(
                    f"Confirmed offsets were saved to {self.target_path}, but "
                    f"calibration progress could not be saved: {error}. "
                    "Reconfirm this route before treating it as completed."
                ) from error
            self._records = records
            self._expected_history_digest = _digest(history)
