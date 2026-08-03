"""HTTP service for manually jogging and confirming gravimetric liquid height.

Run this service on the robot before starting the gravimetric protocol. The
protocol and this service coordinate through ``manual_lld.json`` while jog
movements are sent to the active Protocol Engine run over Robot Server HTTP.
"""

from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import os
from pathlib import Path
import threading
import time
from typing import Any, Dict, Mapping, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4


DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8088
DEFAULT_ROBOT_SERVER_URL = "http://localhost:31950"
DEFAULT_STATE_FILE = "/data/testing_data/manual_lld.json"
DEFAULT_MAX_JOG_MM = 5.0
DEFAULT_JOG_STEP_MM = 0.1
ROBOT_API_VERSION = "3"


class ManualLLDError(Exception):
    """An expected manual LLD request error."""


def _idle_state() -> Dict[str, object]:
    """Build a state that cannot be mistaken for a confirmed calibration."""
    return {
        "version": 1,
        "session_id": None,
        "status": "idle",
        "confirmed": False,
        "cumulative_z_mm": 0.0,
        "jog_step_mm": DEFAULT_JOG_STEP_MM,
        "height_from_bottom_mm": None,
        "server_started_at": time.time(),
    }


class StateStore:
    """Read and atomically update the shared state file."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.lock = threading.Lock()

    def initialize(self) -> Dict[str, object]:
        """Reset stale confirmation whenever the service starts."""
        with self.lock:
            state = _idle_state()
            self._write_unlocked(state)
            return state

    def read(self) -> Dict[str, object]:
        """Read current state."""
        with self.lock:
            return self._read_unlocked()

    def reset(self) -> Dict[str, object]:
        """Reset current state to idle."""
        with self.lock:
            state = _idle_state()
            self._write_unlocked(state)
            return state

    def _read_unlocked(self) -> Dict[str, object]:
        with self.path.open(encoding="utf-8") as state_file:
            state = json.load(state_file)
        if not isinstance(state, dict):
            raise ManualLLDError("manual_lld.json must contain a JSON object.")
        return state

    def _write_unlocked(self, state: Mapping[str, object]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = self.path.with_name(f"{self.path.name}.{uuid4().hex}.tmp")
        with temporary_path.open("w", encoding="utf-8") as state_file:
            json.dump(state, state_file, indent=2, sort_keys=True)
            state_file.flush()
            os.fsync(state_file.fileno())
        os.replace(temporary_path, self.path)


class RobotServerClient:
    """Minimal client for the local Robot Server run-command API."""

    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")

    def move_relative(self, pipette_id: str, distance_mm: float) -> Dict[str, object]:
        """Jog the given pipette Z axis in the current running run."""
        current_run = self._get_current_run()
        run_status = current_run.get("status")
        if run_status != "running":
            raise ManualLLDError(
                "The current run must be running for jog commands to execute "
                f"immediately; current status is {run_status!r}."
            )
        run_id = current_run.get("id")
        if not isinstance(run_id, str) or not run_id:
            raise ManualLLDError("Robot Server did not return a current run ID.")

        command = self._request_json(
            "POST",
            f"/runs/{run_id}/commands?"
            + urlencode({"waitUntilComplete": "true", "timeout": 30000}),
            {
                "data": {
                    "commandType": "moveRelative",
                    "intent": "protocol",
                    "params": {
                        "pipetteId": pipette_id,
                        "axis": "z",
                        "distance": distance_mm,
                    },
                }
            },
        )
        command_data = command.get("data")
        if not isinstance(command_data, dict):
            raise ManualLLDError("Robot Server returned no jog command data.")
        command_status = command_data.get("status")
        if command_status != "succeeded":
            raise ManualLLDError(
                f"Jog command did not succeed; status is {command_status!r}."
            )
        return command_data

    def _get_current_run(self) -> Dict[str, object]:
        runs = self._request_json("GET", "/runs?pageLength=1")
        links = runs.get("links")
        if not isinstance(links, dict):
            raise ManualLLDError("Robot Server returned no current-run link.")
        current = links.get("current")
        if not isinstance(current, dict):
            raise ManualLLDError("There is no current robot run.")
        href = current.get("href")
        if not isinstance(href, str) or not href:
            raise ManualLLDError("The current-run link has no href.")
        response = self._request_json("GET", href)
        run_data = response.get("data")
        if not isinstance(run_data, dict):
            raise ManualLLDError("Robot Server returned no current run data.")
        return run_data

    def _request_json(
        self,
        method: str,
        path: str,
        body: Optional[Mapping[str, object]] = None,
    ) -> Dict[str, object]:
        request_body = None if body is None else json.dumps(body).encode("utf-8")
        request = Request(
            f"{self.base_url}{path}",
            data=request_body,
            method=method,
            headers={
                "Opentrons-Version": ROBOT_API_VERSION,
                "Content-Type": "application/json",
            },
        )
        try:
            with urlopen(request, timeout=35) as response:
                response_data = json.loads(response.read())
        except HTTPError as error:
            details = error.read().decode("utf-8", errors="replace")
            raise ManualLLDError(
                f"Robot Server returned HTTP {error.code}: {details}"
            ) from error
        except URLError as error:
            raise ManualLLDError(
                f"Could not connect to Robot Server at {self.base_url}: {error.reason}"
            ) from error
        if not isinstance(response_data, dict):
            raise ManualLLDError("Robot Server returned a non-object JSON response.")
        return response_data


class ManualLLDHTTPServer(ThreadingHTTPServer):
    """HTTP server containing shared manual LLD dependencies."""

    daemon_threads = True

    def __init__(
        self,
        server_address: tuple[str, int],
        state_store: StateStore,
        robot_client: RobotServerClient,
        max_jog_mm: float,
    ) -> None:
        super().__init__(server_address, ManualLLDRequestHandler)
        self.state_store = state_store
        self.robot_client = robot_client
        self.max_jog_mm = max_jog_mm


class ManualLLDRequestHandler(BaseHTTPRequestHandler):
    """Serve status, jog, confirmation, cancellation, and reset requests."""

    server: ManualLLDHTTPServer

    def do_OPTIONS(self) -> None:
        """Allow browser-based calibration tools."""
        self.send_response(HTTPStatus.NO_CONTENT)
        self._send_common_headers()
        self.end_headers()

    def do_GET(self) -> None:
        """Return service health or the current calibration state."""
        try:
            if self.path in ("/", "/health"):
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "status": "ok",
                        "endpoints": [
                            "GET /status",
                            "POST /step",
                            "POST /jog",
                            "POST /confirm",
                            "POST /cancel",
                            "POST /reset",
                        ],
                    },
                )
            elif self.path == "/status":
                self._send_json(HTTPStatus.OK, self.server.state_store.read())
            else:
                self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
        except ManualLLDError as error:
            self._send_error(HTTPStatus.CONFLICT, str(error))
        except Exception as error:
            self._send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def do_POST(self) -> None:
        """Process one manual calibration action."""
        try:
            if self.path == "/jog":
                self._handle_jog(self._read_json_body())
            elif self.path == "/step":
                self._handle_step(self._read_json_body())
            elif self.path == "/confirm":
                self._handle_confirm()
            elif self.path == "/cancel":
                self._handle_cancel()
            elif self.path == "/reset":
                state = self.server.state_store.reset()
                self._send_json(HTTPStatus.OK, state)
            else:
                self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
        except ManualLLDError as error:
            self._send_error(HTTPStatus.CONFLICT, str(error))
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self._send_error(HTTPStatus.BAD_REQUEST, str(error))
        except Exception as error:
            self._send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def _handle_jog(self, body: Mapping[str, object]) -> None:
        distance_value = body.get("distance_mm", body.get("distance"))
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            if distance_value is None:
                direction = body.get("direction")
                jog_step = self._numeric_state_value(state, "jog_step_mm")
                if direction == "up":
                    distance_mm = jog_step
                elif direction == "down":
                    distance_mm = -jog_step
                else:
                    raise ValueError(
                        "Provide distance_mm, or set direction to 'up' or 'down'."
                    )
            else:
                distance_mm = self._positive_or_negative_number(
                    distance_value, "distance_mm"
                )
            if distance_mm == 0:
                raise ValueError("distance_mm must be non-zero.")
            if abs(distance_mm) > self.server.max_jog_mm:
                raise ValueError(
                    f"A single jog cannot exceed {self.server.max_jog_mm:g} mm."
                )
            cumulative_z = self._numeric_state_value(state, "cumulative_z_mm")
            start_height = self._numeric_state_value(
                state, "start_height_from_bottom_mm"
            )
            minimum_height = self._numeric_state_value(
                state, "minimum_height_from_bottom_mm"
            )
            maximum_height = self._numeric_state_value(
                state, "maximum_height_from_bottom_mm"
            )
            next_cumulative_z = cumulative_z + distance_mm
            next_height = start_height + next_cumulative_z
            if not minimum_height <= next_height <= maximum_height:
                raise ManualLLDError(
                    f"Jog would place the tip at {next_height:.3f} mm from the well "
                    f"bottom; allowed range is {minimum_height:.3f} to "
                    f"{maximum_height:.3f} mm."
                )
            pipette_id = state.get("pipette_id")
            if not isinstance(pipette_id, str) or not pipette_id:
                raise ManualLLDError("The active session has no pipette_id.")

            command = self.server.robot_client.move_relative(
                pipette_id=pipette_id, distance_mm=distance_mm
            )
            result = command.get("result")
            position = result.get("position") if isinstance(result, dict) else None
            state.update(
                {
                    "cumulative_z_mm": next_cumulative_z,
                    "height_from_bottom_mm": next_height,
                    "last_jog_mm": distance_mm,
                    "last_jog_at": time.time(),
                    "last_robot_position": position,
                }
            )
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_step(self, body: Mapping[str, object]) -> None:
        step_value = body.get("step_mm", body.get("step"))
        step_mm = self._positive_or_negative_number(step_value, "step_mm")
        if step_mm <= 0:
            raise ValueError("step_mm must be greater than zero.")
        if step_mm > self.server.max_jog_mm:
            raise ValueError(f"step_mm cannot exceed {self.server.max_jog_mm:g} mm.")

        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            if state.get("status") not in ("idle", "waiting"):
                raise ManualLLDError(
                    "Jog step can only be changed while idle or waiting; "
                    f"current status is {state.get('status')!r}."
                )
            state.update({"jog_step_mm": step_mm, "step_updated_at": time.time()})
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_confirm(self) -> None:
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            height = self._numeric_state_value(state, "height_from_bottom_mm")
            minimum_height = self._numeric_state_value(
                state, "minimum_height_from_bottom_mm"
            )
            source_well_depth = self._numeric_state_value(state, "source_well_depth_mm")
            if not minimum_height <= height <= source_well_depth:
                raise ManualLLDError(
                    f"Cannot confirm {height:.3f} mm. Jog the tip inside the well "
                    f"between {minimum_height:.3f} and {source_well_depth:.3f} mm."
                )
            state.update(
                {
                    "status": "confirmed",
                    "confirmed": True,
                    "confirmed_at": time.time(),
                }
            )
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    def _handle_cancel(self) -> None:
        store = self.server.state_store
        with store.lock:
            state = store._read_unlocked()
            self._require_waiting_state(state)
            state.update(
                {
                    "status": "cancelled",
                    "confirmed": False,
                    "cancelled_at": time.time(),
                }
            )
            store._write_unlocked(state)
        self._send_json(HTTPStatus.OK, state)

    @staticmethod
    def _require_waiting_state(state: Mapping[str, object]) -> None:
        if state.get("status") != "waiting" or state.get("confirmed") is not False:
            raise ManualLLDError(
                "There is no active calibration waiting for input. "
                f"Current status is {state.get('status')!r}."
            )
        if not state.get("session_id"):
            raise ManualLLDError("The waiting calibration has no session_id.")

    @staticmethod
    def _positive_or_negative_number(value: object, name: str) -> float:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be a number.")
        result = float(value)
        if not math.isfinite(result):
            raise ValueError(f"{name} must be finite.")
        return result

    @staticmethod
    def _numeric_state_value(state: Mapping[str, object], key: str) -> float:
        value = state.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ManualLLDError(f"The active session has no numeric {key}.")
        return float(value)

    def _read_json_body(self) -> Dict[str, object]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0 or content_length > 65536:
            raise ValueError("Request body must contain a small JSON object.")
        body = json.loads(self.rfile.read(content_length))
        if not isinstance(body, dict):
            raise ValueError("Request body must be a JSON object.")
        return body

    def _send_json(self, status: HTTPStatus, body: Mapping[str, object]) -> None:
        payload = json.dumps(body, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self._send_common_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: HTTPStatus, message: str) -> None:
        self._send_json(status, {"error": message, "status": status.value})

    def _send_common_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")

    def log_message(self, format: str, *args: Any) -> None:
        """Log requests with a stable service prefix."""
        print(f"[manual-lld] {self.address_string()} - {format % args}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve HTTP Z jog controls for gravimetric manual LLD."
    )
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--robot-url", default=DEFAULT_ROBOT_SERVER_URL)
    parser.add_argument("--state-file", default=DEFAULT_STATE_FILE)
    parser.add_argument("--max-jog-mm", type=float, default=DEFAULT_MAX_JOG_MM)
    return parser.parse_args()


def main() -> None:
    """Start the manual LLD HTTP service."""
    args = _parse_args()
    if not math.isfinite(args.max_jog_mm) or args.max_jog_mm <= 0:
        raise ValueError("--max-jog-mm must be a positive finite number.")
    state_store = StateStore(Path(args.state_file))
    state_store.initialize()
    server = ManualLLDHTTPServer(
        (args.host, args.port),
        state_store=state_store,
        robot_client=RobotServerClient(args.robot_url),
        max_jog_mm=args.max_jog_mm,
    )
    print(f"Manual LLD service listening on http://{args.host}:{args.port}")
    print(f"State file reset to idle: {state_store.path}")
    print(f"Robot Server: {args.robot_url}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping manual LLD service.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
