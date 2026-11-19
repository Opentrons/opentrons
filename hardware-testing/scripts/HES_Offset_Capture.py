#!/usr/bin/env python3
r"""
HES offset capture: dial and atan2 at hover (nozzle then tip).

Each hover window is averaged to one (dial_mm, atan2_deg) per piece
(nozzle, then A1-A12). After the loaded contact hold the robot lifts
1 mm and samples again as ``<piece>_off`` so dial-spring force on atan2
can be measured. Tip overlap uses the loaded (on-dial) atan2:

    overlap_mm = angle_to_rel_mm(atan2)

rel_mm is already absolute (sheath-contact stall = 0), so the bare
nozzle is NOT subtracted from the tips. The nozzle row is only a
datum diagnostic. Pass --cal with Robot_HES_Block_Cal / V2 capture
CSVs (rel_mm, Angle_deg). Optional --datum-offset / --use-nozzle-datum
subtract a constant after inversion.
"""

import argparse
import bisect
import csv
import glob
import math
import os
import socket
import statistics
import sys
import threading
import time
from datetime import datetime
from queue import Empty, Queue
from typing import Dict, List, Optional, Tuple

try:
    import serial  # pyserial
    from serial.tools.list_ports import comports
except ImportError:
    sys.exit("pyserial not installed. Run:  pip install pyserial")

try:
    import numpy
except ImportError:
    numpy = None


RECORD_S = 1.0
SETTLE_BEFORE_RECORD_S = 0.0


class Mitutoyo_Digimatic_Indicator:
    """Driver for Mitutoyo ABSOLUTE Digimatic Indicator ID-S (same as robot driver)."""

    def __init__(self, port: str = "COM7", baudrate: int = 9600) -> None:
        self.PORT = port
        self.BAUDRATE = baudrate
        self.TIMEOUT = 0.1
        self.GCODE = {"READ": "r"}
        self.gauge = None

    def connect(self) -> None:
        try:
            self.gauge = serial.Serial(
                port=self.PORT,
                baudrate=self.BAUDRATE,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=self.TIMEOUT,
            )
        except serial.SerialException:
            raise serial.SerialException("Unable to access Serial port")

    def disconnect(self) -> None:
        if self.gauge is not None:
            self.gauge.close()

    def _send_packet(self, packet: str) -> None:
        if self.gauge is not None:
            self.gauge.flush()
            self.gauge.reset_input_buffer()
            self.gauge.write(packet.encode())

    def _get_packet(self) -> str:
        packet = ""
        if self.gauge is not None:
            self.gauge.reset_output_buffer()
            packet = self.gauge.readline().decode("utf-8")
        return packet

    def read_raw(self, timeout: Optional[float] = None) -> str:
        """Return the gauge's ASCII reading unchanged (no rounding)."""
        self._send_packet(self.GCODE["READ"])
        time.sleep(0.001)
        then = time.monotonic()
        while True:
            if timeout and (time.monotonic() - then) > timeout:
                raise RuntimeError("Timeout reading")
            data = self._get_packet().strip()
            time.sleep(0.01)
            if data != "":
                try:
                    float(data)
                except ValueError:
                    continue
                return data

    def read(self, timeout: Optional[float] = None) -> float:
        return float(self.read_raw(timeout))

    def read_stable(self, timeout: float = 5) -> float:
        then = time.monotonic()
        values = [
            self.read(timeout),
            self.read(timeout),
            self.read(timeout),
            self.read(timeout),
            self.read(timeout),
        ]
        while (time.monotonic() - then) < timeout:
            if numpy is not None:
                settled = numpy.allclose(values, list(reversed(values)))
            else:
                settled = all(
                    abs(values[i] - values[-1 - i]) < 1e-4
                    for i in range(len(values))
                )
            if settled:
                return values[-1]
            values = values[1:] + [self.read(timeout)]
        raise RuntimeError("Couldn't settle")


def find_dial(skip_port: Optional[str] = None) -> Optional[Mitutoyo_Digimatic_Indicator]:
    """Probe serial ports for a responding Digimatic (skip the HES COM port)."""
    for info in comports():
        port = info.device
        if skip_port and port.upper() == skip_port.upper():
            continue
        dial = None
        try:
            dial = Mitutoyo_Digimatic_Indicator(port)
            dial.connect()
            dial.read(1)
            return dial
        except Exception:
            if dial is not None:
                try:
                    dial.disconnect()
                except Exception:
                    pass
    return None


def setup_dial(port: Optional[str], skip_port: str) -> Optional[Mitutoyo_Digimatic_Indicator]:
    if port:
        dial = Mitutoyo_Digimatic_Indicator(port)
        dial.connect()
        dial.read(timeout=1)
        print(f"Dial on {port}")
        return dial
    dial = find_dial(skip_port=skip_port)
    if dial is None:
        print("No Digimatic found — HES only (no nozzle/tip travel).")
        return None
    print(f"Dial on {dial.PORT}")
    return dial


class Stm32Pcba():
    def __init__(self, port, baud):
        self.port = port
        self.baud = baud
        self.ser = None

    def connect(self):
        try:
            self.ser = serial.Serial(self.port, self.baud, timeout=1.0)
        except serial.SerialException as e:
            sys.exit(f"Could not open port: {e}")
        time.sleep(0.5)
        self.ser.reset_input_buffer()

    def disconnect(self):
        if self.ser is not None:
            try:
                self.ser.close()
            except (serial.SerialException, OSError):
                pass

    def read_line(self):
        try:
            raw = self.ser.readline().decode("ascii", errors="ignore").strip()
            return raw
        except (serial.SerialException, OSError) as e:
            print(f"\nSerial port dropped ({e}).")
            self.disconnect()
            return None

    def reconnect(self, tries, delay):
        for attempt in range(1, tries + 1):
            time.sleep(delay)
            try:
                self.ser = serial.Serial(self.port, self.baud, timeout=1.0)
                time.sleep(0.5)
                self.ser.reset_input_buffer()
                print(f"\nSerial port reopened on attempt {attempt}. Resuming.")
                return True
            except (serial.SerialException, OSError):
                print(f"\rReconnecting to {self.port} ... attempt {attempt}/{tries}",
                      end="", flush=True)
        print(f"\nCould not reopen {self.port} after {tries} attempts. Stopping capture.")
        return False

    def read_sensor_line(self, reconnect_tries, reconnect_delay):
        while True:
            raw = self.read_line()
            if raw is None:
                if reconnect_tries <= 0:
                    return None
                if not self.reconnect(reconnect_tries, reconnect_delay):
                    return None
                continue
            if raw and len(raw.split(",")) == 3:
                return raw

    def convert_to_mT(self, raw):
        try:
            bx, by, bz = (float(p) for p in raw.split(","))
            return bx, by, bz
        except ValueError:
            return None


class RobotBridge:
    """Client that connects to the robot.

    Robot messages used here: START / HOVER,<step>,<well> / MOVING /
    STEP,<step>,<x>,<y>,<z>,<enc_z> / STOP.
    """

    def __init__(self, host, port):
        self._host = host
        self._port = port
        self._sock = None
        self._lock = threading.Lock()
        self._moving = True
        self._events = Queue()
        self.started = threading.Event()
        self.stopped = threading.Event()
        self._reader = None
        self._last_pose = None

    def connect(self, retry_secs=60.0):
        deadline = time.time() + retry_secs
        while True:
            try:
                self._sock = socket.create_connection((self._host, self._port),
                                                       timeout=5.0)
                self._sock.settimeout(1.0)
                break
            except OSError as e:
                if time.time() > deadline:
                    sys.exit(f"Could not reach robot at {self._host}:{self._port} "
                             f"({e}). Is hes_offset_motion.py running?")
                print(f"\rWaiting for robot at {self._host}:{self._port} ...",
                      end="", flush=True)
                time.sleep(1.0)
        print(f"\nConnected to robot at {self._host}:{self._port}")
        self._reader = threading.Thread(target=self._read_loop, daemon=True)
        self._reader.start()

    def _read_loop(self):
        buf = ""
        while not self.stopped.is_set():
            try:
                data = self._sock.recv(1024)
            except socket.timeout:
                continue
            except OSError:
                break
            if not data:
                break
            buf += data.decode("ascii", errors="ignore")
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                self._handle(line.strip())
        self.stopped.set()

    def _parse_step_pose(self, parts):
        """Parse STEP payload: new x,y,z,enc or legacy z,enc,extra."""
        if len(parts) >= 6:
            return {
                "x": float(parts[2]),
                "y": float(parts[3]),
                "z": float(parts[4]),
                "enc_z": float(parts[5]),
            }
        if len(parts) >= 4:
            return {
                "z": float(parts[2]),
                "enc_z": float(parts[3]),
            }
        return None

    def _handle(self, line):
        if not line:
            return
        if line == "START":
            self.started.set()
        elif line == "STOP":
            self.stopped.set()
        elif line == "MOVING":
            with self._lock:
                self._moving = True
        elif line.startswith("HOVER"):
            parts = line.split(",")
            try:
                step = int(parts[1])
            except (IndexError, ValueError):
                return
            well = parts[2] if len(parts) > 2 else ("nozzle" if step == 0 else f"tip{step}")
            self.started.set()
            self._events.put(("hover", step, well))
            print(f"\n[bridge] hover ({well}) — reading dial.", flush=True)
        elif line.startswith("STEP"):
            parts = line.split(",")
            try:
                step = int(parts[1])
            except (IndexError, ValueError):
                return
            try:
                pose = self._parse_step_pose(parts)
            except ValueError:
                pose = None
            if pose is not None:
                self._last_pose = pose
            with self._lock:
                self._moving = False
            self.started.set()
            self._events.put(("step", step, pose))
            if pose is not None:
                print_encoder_block(step, pose, prefix="[bridge] ")
            else:
                print(f"\n[bridge] hover hold (step {step}) — recording atan2.",
                      flush=True)

    def last_pose(self):
        with self._lock:
            return dict(self._last_pose) if self._last_pose else None

    def wait_event(self):
        """Return ('hover'|'step', idx, info) or None if the robot stopped.

        info is well name on hover, pose dict on step.
        """
        while True:
            try:
                return self._events.get(timeout=0.25)
            except Empty:
                if self.stopped.is_set():
                    return None

    def is_held(self):
        if self.stopped.is_set():
            return False
        with self._lock:
            return not self._moving

    def send(self, msg):
        if self._sock is None:
            return
        try:
            self._sock.sendall((msg + "\n").encode("ascii"))
        except OSError:
            pass

    def close(self):
        self.stopped.set()
        if self._sock is not None:
            try:
                self._sock.close()
            except OSError:
                pass


def connect_bridge(robot_ip, bridge_port, pcba):
    if not robot_ip:
        return None
    bridge = RobotBridge(robot_ip, bridge_port)
    bridge.connect()
    print("Sensor ready. Sending READY to start hes_offset_motion ...")
    bridge.send("READY")
    print("Waiting for robot START ...")
    try:
        while not bridge.started.is_set():
            if bridge.stopped.is_set():
                sys.exit("Robot disconnected before starting.")
            time.sleep(0.05)
    except KeyboardInterrupt:
        sys.exit("\nCanceled while waiting for robot.")
    pcba.ser.reset_input_buffer()
    print("Robot is live. Dial and atan2 are recorded at hover only.\n")
    return bridge


def parse_mm(v):
    if v is None:
        return float("nan")
    try:
        return float(v)
    except (TypeError, ValueError):
        return float("nan")


def print_encoder_block(step, pose, *, prefix="", title=None):
    """Print nozzle/encoder pose at hover (robot + laptop consoles)."""
    if not pose:
        return
    label = title or f"step {step}"
    lines = [
        f"{prefix}ENCODER @ hover — {label}",
        f"  Z logical = {pose['z']:8.3f} mm",
        f"  Z encoder = {pose['enc_z']:8.3f} mm",
    ]
    if "x" in pose and "y" in pose:
        lines.insert(1, f"  X         = {pose['x']:8.3f} mm")
        lines.insert(2, f"  Y         = {pose['y']:8.3f} mm")
    bar = "-" * 52
    print(f"\n{bar}")
    for ln in lines:
        print(ln)
    print(f"{bar}\n", flush=True)


def format_encoder_short(pose):
    if not pose:
        return "enc= n/a"
    return f"enc_z={pose['enc_z']:.3f} mm  z={pose['z']:.3f} mm"


def main():
    ap = argparse.ArgumentParser(
        description="Record hover dials and hover atan2 (piecewise)."
    )
    ap.add_argument("--port", default="COM6",
                    help="Serial port (e.g. COM5 or /dev/ttyACM0). Defaults to COM6.")
    ap.add_argument("--baud", type=int, default=115200)
    ap.add_argument("--gap", default="offset",
                    help="Label for this run")
    ap.add_argument("--duration", type=float, default=RECORD_S,
                    help="Seconds of atan2 at each hover (default: 1)")
    ap.add_argument("--out", default=None,
                    help="Output CSV filename (auto-named if omitted)")
    ap.add_argument("--robot-ip", default=None,
                    help="Robot IP/hostname. Omit to run capture alone.")
    ap.add_argument("--bridge-port", type=int, default=5005,
                    help="TCP port the robot publishes events on")
    ap.add_argument("--reconnect-tries", type=int, default=15)
    ap.add_argument("--reconnect-delay", type=float, default=1.0)
    ap.add_argument(
        "--dial-port",
        default=None,
        help="Mitutoyo serial port (default: auto-find, skipping --port). "
             "e.g. COM7",
    )
    ap.add_argument(
        "--cal", nargs="+", default=None,
        help="Block-cal CSVs (rel_mm, Angle_deg). Glob patterns ok. "
             "Required to report overlap_mm from atan2.",
    )
    ap.add_argument(
        "--datum-offset", type=float, default=0.0, dest="datum_offset",
        help="mm subtracted from every tip's calibrated overlap after "
             "inverting the block-cal curve (default 0).",
    )
    ap.add_argument(
        "--use-nozzle-datum", action="store_true", dest="use_nozzle_datum",
        help="Subtract (nozzle calibrated rel_mm - nozzle dial) from each tip.",
    )
    args = ap.parse_args()

    cal_curve = None
    if args.cal:
        cal_paths = []
        for pattern in args.cal:
            matched = glob.glob(pattern)
            cal_paths += matched if matched else [pattern]
        print(f"Loading block-cal curve from {len(cal_paths)} file(s):")
        for p in cal_paths:
            print(f"  {p}")
        cal_curve = load_calibration(cal_paths)
        angles_asc, rel_at_angle = cal_curve
        print(
            f"Calibration angle range: {angles_asc[0]:.2f} to {angles_asc[-1]:.2f} deg "
            f"-> rel_mm {min(rel_at_angle):.3f} .. {max(rel_at_angle):.3f}\n"
        )
    else:
        print("No --cal given; CSV will have averaged dial/atan2 only "
              "(no overlap_mm).")

    print(f"Opening HES {args.port} @ {args.baud} ...")
    pcba = Stm32Pcba(args.port, args.baud)
    pcba.connect()

    dial = setup_dial(args.dial_port, skip_port=args.port)

    bridge = connect_bridge(args.robot_ip, args.bridge_port, pcba)

    dials = {}  # piece name -> dial raw string (snapshot at HOVER)
    samples = {}  # piece name -> list of (dial_mm, atan2_deg)
    encoders = {}  # piece name -> pose dict from STEP
    names = {}  # step idx -> piece name

    def still_held():
        return bridge is None or bridge.is_held()

    def read_dial_now(label):
        if dial is None:
            print(f"{label}: no dial — skipped.")
            return None
        time.sleep(0.3)
        try:
            raw = dial.read_raw(timeout=1.0)
        except Exception as e:
            print(f"{label}: dial read failed ({e}).")
            return None
        print(f"{label}: dial = {raw} mm", flush=True)
        return raw

    def record_hover(phase, label):
        samples.setdefault(phase, [])
        if SETTLE_BEFORE_RECORD_S > 0:
            print(f"{label}: waiting {SETTLE_BEFORE_RECORD_S:.0f}s at hover ...",
                  flush=True)
            settle_until = time.time() + SETTLE_BEFORE_RECORD_S
            while time.time() < settle_until:
                if not still_held():
                    print("Robot left hover before it sat still — not recording.")
                    return
                time.sleep(0.05)
        if not still_held():
            print("Robot left hover before it sat still — not recording.")
            return
        if pcba.ser is not None:
            pcba.ser.reset_input_buffer()

        latest = {"v": None}
        stop = threading.Event()

        def _dial_loop():
            if dial is None:
                return
            while not stop.is_set():
                try:
                    latest["v"] = dial.read_raw(timeout=0.5)
                except Exception:
                    pass

        th = threading.Thread(target=_dial_loop, daemon=True)
        th.start()

        t0 = time.time()
        deadline = t0 + args.duration
        pose = encoders.get(phase)
        enc_short = format_encoder_short(pose)
        print(f"Recording {label} dial + atan2 for {args.duration:.0f}s ...")
        print(f"  {enc_short}", flush=True)
        while time.time() < deadline:
            if not still_held():
                print("\nRobot started moving — stopping this window.", flush=True)
                break
            raw = pcba.read_sensor_line(
                args.reconnect_tries, args.reconnect_delay
            )
            if raw is None:
                break
            result = pcba.convert_to_mT(raw)
            if result is None:
                continue
            bx, by, bz = result
            angle_deg = math.degrees(math.atan2(by, bz))
            disp = latest["v"]
            if disp is None and dials.get(phase) is not None:
                disp = dials[phase]
            if disp is None:
                continue
            try:
                disp_f = float(disp)
            except (TypeError, ValueError):
                continue
            left = max(0.0, deadline - time.time())
            samples[phase].append((disp_f, angle_deg))
            print(f"\r dial={disp_f:.4f} mm  atan2={angle_deg:.3f}°  "
                  f"{enc_short}  "
                  f"({len(samples[phase])} samples, {left:4.1f}s left)",
                  end="", flush=True)

        stop.set()
        th.join(timeout=1.0)
        print(f"\nStopped recording ({label}). "
              f"{len(samples[phase])} dial+atan2 samples.",
              flush=True)

    try:
        if bridge is not None:
            seen = set()
            print("Waiting for hover holds (until robot STOP) ...", flush=True)
            while not bridge.stopped.is_set():
                ev = bridge.wait_event()
                if ev is None:
                    break
                kind, step, info = ev
                if kind == "hover" and info:
                    names[step] = info
                phase = names.get(step, "nozzle" if step == 0 else f"tip{step}")
                key = (kind, step, phase)
                if key in seen:
                    continue
                label = f"{phase} hover"
                if kind == "hover":
                    dials[phase] = read_dial_now(label)
                elif kind == "step":
                    if info:
                        encoders[phase] = info
                        print_encoder_block(step, info, title=phase)
                    record_hover(phase, f"{phase} atan2")
                seen.add(key)
        else:
            try:
                answer = input(
                    f"\nPress Enter to record {args.duration:.0f} seconds "
                    f"(q = quit): "
                ).strip().lower()
            except (KeyboardInterrupt, EOFError):
                answer = "q"
            if answer not in ("q", "quit"):
                record_hover("nozzle", "standalone")
    except KeyboardInterrupt:
        print("\nStopped by user.")

    pcba.disconnect()
    if dial is not None:
        dial.disconnect()
    if bridge is not None:
        bridge.close()

    n_ang = sum(len(v) for v in samples.values())
    print(f"\nDone. {n_ang} dial+atan2 samples.")
    if encoders:
        print("\nEncoder summary @ each hover:")
        bar = "-" * 52
        print(bar)
        summary_pieces = piece_order(samples)
        for k in encoders:
            if k not in summary_pieces:
                summary_pieces.append(k)
        for phase in summary_pieces:
            pose = encoders.get(phase)
            if not pose:
                continue
            xy = ""
            if "x" in pose and "y" in pose:
                xy = f"  X={pose['x']:.3f}  Y={pose['y']:.3f}"
            print(
                f"  {phase:8s}{xy}  "
                f"Z={pose['z']:.3f} mm  enc_z={pose['enc_z']:.3f} mm"
            )
        print(bar)
    save_prompt(
        dials, samples, args.out, args.gap, encoders,
        cal_curve=cal_curve,
        datum_offset=args.datum_offset,
        use_nozzle_datum=args.use_nozzle_datum,
    )


OFF_SUFFIX = "_off"


def is_off_piece(name):
    return name.endswith(OFF_SUFFIX)


def contact_piece(name):
    return name[: -len(OFF_SUFFIX)] if is_off_piece(name) else name


def piece_order(samples):
    """Nozzle first, then A1-A12 (each followed by ``_off`` if present)."""
    keys = [k for k in samples if samples[k]]
    bases = []
    if any(contact_piece(k) == "nozzle" for k in keys):
        bases.append("nozzle")
    for i in range(1, 13):
        name = f"A{i}"
        if any(contact_piece(k) == name for k in keys):
            bases.append(name)
    for k in keys:
        b = contact_piece(k)
        if b not in bases:
            bases.append(b)
    ordered = []
    for b in bases:
        if b in keys:
            ordered.append(b)
        off = b + OFF_SUFFIX
        if off in keys:
            ordered.append(off)
    return ordered


def circular_mean_deg(angles):
    """Mean of atan2 angles in degrees, wrapping correctly at +/-180."""
    if not angles:
        return float("nan")
    s = sum(math.sin(math.radians(a)) for a in angles)
    c = sum(math.cos(math.radians(a)) for a in angles)
    return math.degrees(math.atan2(s, c))


def signed_angle_diff_deg(a, b):
    """Signed (a - b) in degrees, wrapping at +/-180."""
    return (a - b + 180.0) % 360.0 - 180.0


def print_dial_force_delta(averaged):
    """atan2 on the dial vs 1 mm off — dial spring pushing on the tip."""
    rows = []
    for piece in piece_order(averaged):
        if is_off_piece(piece):
            continue
        off = piece + OFF_SUFFIX
        if piece not in averaged or off not in averaged:
            continue
        dial_on, ang_on, _n_on = averaged[piece]
        dial_off, ang_off, _n_off = averaged[off]
        d_ang = signed_angle_diff_deg(ang_off, ang_on)
        rows.append((piece, ang_on, ang_off, d_ang, dial_on, dial_off))
    if not rows:
        return rows
    print("\nDial-force check: atan2 on dial vs 1 mm off")
    print(
        f"{'piece':8s}  {'on_dial':>10s}  {'off_1mm':>10s}  "
        f"{'d_deg':>8s}  {'dial_on':>9s}  {'dial_off':>9s}"
    )
    for piece, ang_on, ang_off, d_ang, dial_on, dial_off in rows:
        print(
            f"{piece:8s}  {ang_on:+10.3f}  {ang_off:+10.3f}  "
            f"{d_ang:+8.3f}  {dial_on:9.4f}  {dial_off:9.4f}"
        )
    deltas = [r[3] for r in rows]
    print(
        f"\natan2 shift (off minus on): mean {statistics.mean(deltas):+.3f} deg, "
        f"range {min(deltas):+.3f} .. {max(deltas):+.3f} deg, "
        f"n={len(deltas)}"
    )
    print("If d_deg is ~0, dial spring is not moving the sheath magnet.")
    return rows


def average_piece_samples(samples):
    """One (mean dial_mm, circular-mean atan2_deg, n) per piece."""
    out = {}
    for piece, pts in samples.items():
        if not pts:
            continue
        dials = [d for d, _ in pts]
        angs = [a for _, a in pts]
        out[piece] = (
            sum(dials) / len(dials),
            circular_mean_deg(angs),
            len(pts),
        )
    return out


def _row_rel_mm(row):
    for k in ("rel_mm", "Rel_mm", "rel"):
        if k in row and row[k] not in (None, ""):
            return float(row[k])
    raise KeyError("rel_mm")


def _row_angle(row):
    for k in ("Angle_deg", "Average Angle_deg", "atan2_deg", "angle_deg"):
        if k in row and row[k] not in (None, ""):
            return float(row[k])
    for k, v in row.items():
        if v not in (None, "") and "angle" in k.lower():
            return float(v)
    raise KeyError("Angle_deg")


def load_calibration(paths: List[str]) -> Tuple[List[float], List[float]]:
    """Pool (rel_mm, Angle_deg) from block-cal / V2 capture CSVs.

    Returns (angles_asc, rel_at_angle) for interpolating rel_mm from atan2.
    """
    buckets: Dict[float, List[float]] = {}
    for path in paths:
        with open(path, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    rel_mm = round(_row_rel_mm(row), 3)
                    angle = _row_angle(row)
                except (KeyError, ValueError, TypeError):
                    continue
                buckets.setdefault(rel_mm, []).append(angle)

    if len(buckets) < 2:
        raise SystemExit(
            "Calibration data has fewer than 2 distinct rel_mm points. "
            "Check --cal files have rel_mm and Angle_deg columns."
        )

    points = [
        (rel_mm, statistics.median(angles))
        for rel_mm, angles in buckets.items()
    ]
    points.sort(key=lambda p: p[1])
    return [a for _, a in points], [r for r, _ in points]


def angle_to_rel_mm(
    angle_deg: float, angles_asc: List[float], rel_at_angle: List[float]
) -> Tuple[float, bool]:
    """Linearly interpolate rel_mm at angle_deg. Returns (rel_mm, extrapolated)."""
    lo, hi = angles_asc[0], angles_asc[-1]
    i = bisect.bisect_left(angles_asc, angle_deg)
    i = max(1, min(i, len(angles_asc) - 1))
    a0, a1 = angles_asc[i - 1], angles_asc[i]
    r0, r1 = rel_at_angle[i - 1], rel_at_angle[i]
    if a1 == a0:
        rel = r0
    else:
        rel = r0 + (angle_deg - a0) / (a1 - a0) * (r1 - r0)
    return rel, (angle_deg < lo or angle_deg > hi)


def overlap_from_averages(averaged, cal_curve, datum_offset, use_nozzle_datum):
    """Invert block-cal at each piece's mean atan2.

    Tip overlap is the calibrated rel_mm (sheath-contact stall = 0).
    Nozzle is diagnostic only and is not subtracted from tips.
    """
    if cal_curve is None:
        return None, 0.0
    angles_asc, rel_at_angle = cal_curve
    nozzle_dial, nozzle_angle, _ = averaged.get("nozzle", (float("nan"), float("nan"), 0))
    nozzle_rel, nozzle_extrap = (float("nan"), False)
    if "nozzle" in averaged:
        nozzle_rel, nozzle_extrap = angle_to_rel_mm(
            nozzle_angle, angles_asc, rel_at_angle
        )
    implied = nozzle_rel - nozzle_dial if "nozzle" in averaged else 0.0
    applied = implied if use_nozzle_datum else datum_offset

    print("Bare-nozzle datum (diagnostic, not subtracted from tips):")
    if "nozzle" in averaged:
        print(f"  dial           = {nozzle_dial:8.4f} mm")
        print(f"  angle          = {nozzle_angle:+8.2f} deg")
        print(f"  calibrated     = {nozzle_rel:8.4f} mm rel_mm"
              f"{'  (extrapolated!)' if nozzle_extrap else ''}")
        print(f"  implied offset = {implied:+8.4f} mm "
              "(calibrated - dial; pass --use-nozzle-datum to apply)")
    else:
        print("  (no nozzle piece)")
    if applied:
        print(f"\nApplying datum offset {applied:+.4f} mm.\n")
    else:
        print()

    rows = {}
    print(f"{'piece':8s}  {'angle_deg':>10s}  {'cal_rel_mm':>11s}  "
          f"{'overlap_mm':>11s}  {'dial_mm':>9s}  {'dial_delta_mm':>14s}")
    overlaps = []
    for piece in piece_order(averaged):
        if is_off_piece(piece):
            continue
        dial_mm, angle_deg, n = averaged[piece]
        rel_mm, extrap = angle_to_rel_mm(angle_deg, angles_asc, rel_at_angle)
        if piece == "nozzle":
            overlap = float("nan")
            dial_delta = 0.0
            flag = "  (datum)" + ("  (extrapolated!)" if extrap else "")
            print(f"{piece:8s}  {angle_deg:+10.2f}  {rel_mm:11.4f}  "
                  f"{'n/a':>11s}  {dial_mm:9.4f}  {dial_delta:+14.4f}{flag}")
        else:
            overlap = rel_mm - applied
            dial_delta = dial_mm - nozzle_dial
            flag = "  (extrapolated!)" if extrap else ""
            print(f"{piece:8s}  {angle_deg:+10.2f}  {rel_mm:11.4f}  "
                  f"{overlap:11.4f}  {dial_mm:9.4f}  {dial_delta:+14.4f}{flag}")
            overlaps.append(overlap)
        rows[piece] = (rel_mm, overlap, dial_delta, extrap, n)

    if overlaps:
        print(
            f"\nOverlap: mean {statistics.mean(overlaps):.4f} mm, "
            f"range {min(overlaps):.4f} .. {max(overlaps):.4f} mm, "
            f"spread {max(overlaps) - min(overlaps):.4f} mm, n={len(overlaps)}"
        )
    return rows, applied


def build_figure(samples, gap):
    """atan2 vs dial mm — same axes idea as plunger rel_mm vs Angle_deg."""
    try:
        import plotly.graph_objs as go
    except ImportError:
        print("plotly not installed, skipping plot. Run:  pip install plotly")
        return None

    pieces = piece_order(samples)
    if not pieces:
        return None

    fig = go.Figure()
    for name in pieces:
        xs = [d for d, _ in samples[name]]
        ys = [a for _, a in samples[name]]
        fig.add_trace(go.Scatter(
            x=xs, y=ys,
            mode="lines+markers",
            name=f"{name} atan2 vs dial",
            line=dict(width=3),
            marker=dict(size=6),
        ))
    fig.update_layout(
        title=f"atan2 vs dial displacement — {gap}",
        height=520,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02),
    )
    fig.update_xaxes(title_text="dial_mm")
    fig.update_yaxes(title_text="atan2(By, Bz) (°)", range=[-180, 180])
    return fig


def plot_data(samples, gap):
    fig = build_figure(samples, gap)
    if fig is None:
        return
    import functools
    import http.server
    import socketserver
    import tempfile

    out_dir = tempfile.mkdtemp(prefix="hes_offset_plot_")
    html_name = "plot.html"
    fig.write_html(os.path.join(out_dir, html_name),
                   include_plotlyjs="inline", full_html=True)

    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=out_dir)
    httpd = None
    port = None
    for p in range(8051, 8071):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", p), handler)
            port = p
            break
        except OSError:
            continue
    if httpd is None:
        print(f"Could not start a local server. Open this file manually:\n"
              f"  {os.path.join(out_dir, html_name)}")
        return

    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{port}/{html_name}"
    print("\natan2 vs dial plot:")
    print(f"  {url}")
    print("VS Code: Ctrl+Shift+P → 'Simple Browser: Show' → paste URL.")
    try:
        input("\nLeave this running while you view. Press Enter here to stop...")
    except (KeyboardInterrupt, EOFError):
        pass
    httpd.shutdown()


def save_prompt(dials, samples, out_name, gap, encoders=None,
                cal_curve=None, datum_offset=0.0, use_nozzle_datum=False):
    encoders = encoders or {}
    averaged = average_piece_samples(samples)
    load_rows = print_dial_force_delta(averaged)
    overlap_rows = None
    if cal_curve is not None and averaged:
        print()
        overlap_rows, _ = overlap_from_averages(
            averaged, cal_curve, datum_offset, use_nozzle_datum
        )
    elif averaged:
        print("\nAveraged hover (no --cal, overlap not computed):")
        for piece in piece_order(averaged):
            if is_off_piece(piece):
                continue
            disp, ang, n = averaged[piece]
            print(f"  {piece:8s}  dial={disp:.4f} mm  atan2={ang:+.3f}°  n={n}")

    try:
        answer = input("Save this capture as a CSV on the Desktop? [y/N]: ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\nSave canceled by user. No file saved.")
        return

    if answer not in ("y", "yes"):
        print("Discarded, no file saved.")
        plot_data(samples, gap)
        return

    desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    fname = out_name or f"hes_offset_{gap}_{datetime.now():%Y%m%d_%H%M%S}.csv"
    if not fname.lower().endswith(".csv"):
        fname += ".csv"
    full_path = os.path.join(desktop, fname)

    pieces = piece_order(samples)
    if "nozzle" in dials and "nozzle" not in pieces:
        pieces = ["nozzle"] + pieces
    extra = [k for k in dials if k not in pieces]
    pieces = pieces + extra
    nh = dials.get("nozzle")
    tips = [p for p in pieces if p != "nozzle" and not is_off_piece(p)]

    header = ["nozzle_hover_mm"]
    header += [f"{p}_hover_mm" for p in tips]
    header += [f"hover_diff_{p}_minus_nozzle_mm" for p in tips]
    values = ["" if nh is None else str(nh)]
    values += ["" if dials.get(p) is None else str(dials.get(p)) for p in tips]
    values += [repr(parse_mm(dials.get(p)) - parse_mm(nh)) for p in tips]

    try:
        with open(full_path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(header)
            w.writerow(values)
            w.writerow([])
            w.writerow(["piece", "x_mm", "y_mm", "z_mm", "enc_z_mm"])
            for piece in pieces:
                pose = encoders.get(piece)
                if pose:
                    w.writerow([
                        piece,
                        "" if "x" not in pose else f"{pose['x']:.4f}",
                        "" if "y" not in pose else f"{pose['y']:.4f}",
                        f"{pose['z']:.4f}",
                        f"{pose['enc_z']:.4f}",
                    ])
            w.writerow([])
            if overlap_rows is not None:
                w.writerow([
                    "piece", "dial_mm", "atan2_deg",
                    "cal_rel_mm", "overlap_mm", "dial_delta_mm",
                    "n_samples", "extrapolated",
                ])
            else:
                w.writerow(["piece", "dial_mm", "atan2_deg"])
            for piece in pieces:
                if piece not in averaged or is_off_piece(piece):
                    continue
                disp, ang, n = averaged[piece]
                if overlap_rows is not None and piece in overlap_rows:
                    rel_mm, overlap, dial_delta, extrap, _n = overlap_rows[piece]
                    ov = "" if piece == "nozzle" else f"{overlap:.4f}"
                    w.writerow([
                        piece, f"{disp:.4f}", f"{ang:.6f}",
                        f"{rel_mm:.4f}", ov, f"{dial_delta:.4f}",
                        n, extrap,
                    ])
                else:
                    w.writerow([piece, f"{disp:.4f}", f"{ang:.6f}"])
            if load_rows:
                w.writerow([])
                w.writerow([
                    "piece", "atan2_on_deg", "atan2_off_deg", "d_atan2_deg",
                    "dial_on_mm", "dial_off_mm",
                ])
                for piece, ang_on, ang_off, d_ang, dial_on, dial_off in load_rows:
                    w.writerow([
                        piece,
                        f"{ang_on:.6f}", f"{ang_off:.6f}", f"{d_ang:.6f}",
                        f"{dial_on:.4f}", f"{dial_off:.4f}",
                    ])
        print(f"Saved CSV to {full_path}")
        for piece in pieces:
            if piece in averaged:
                _, _, n = averaged[piece]
                print(f"  {piece}: averaged {n} samples")
        for p in tips:
            print(f"  hover {p}-nozzle = {parse_mm(dials.get(p)) - parse_mm(nh)!r} mm")
    except OSError as e:
        print(f"Could not save file: {e}")
        return

    fig = build_figure(samples, gap)
    if fig is not None:
        html_path = full_path[:-4] + ".html"
        try:
            fig.write_html(html_path, include_plotlyjs="inline", full_html=True)
            print(f"Saved atan2-vs-dial plot to {html_path}")
        except OSError as e:
            print(f"Could not save chart HTML: {e}")

    plot_data(samples, gap)


if __name__ == "__main__":
    main()
