#!/usr/bin/env python3
"""
TMAG5273 linear-tracking data capture.
Reads CSV magnetic-field lines (Bx,By,Bz in mT) from the STM32 over serial
and logs them with timestamps to a CSV file for gap comparison.
"""

import argparse
import csv
import math
import os
import socket
import statistics
import sys
import threading
import time
from datetime import datetime

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
        """Try to reopen a dropped serial port. Returns True on success."""
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
                      end="")
        print(f"\nCould not reopen {self.port} after {tries} attempts. Stopping capture.")
        return False

    def read_sensor_line(self, reconnect_tries, reconnect_delay):
        """Read and return the next valid 3-field CSV line.
        Retries silently on empty or banner lines; reconnects on port drop.
        Returns the raw CSV string, or None if the port is unrecoverable."""
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
            # Empty or banner line — try again

    def convert_to_mT(self, raw):
        """Convert a raw CSV line to a tuple of floats (Bx, By, Bz in mT)."""
        try:
            bx, by, bz = (float(p) for p in raw.split(","))
            return bx, by, bz
        except ValueError:
            return None


def angle_diff(a, b):
    """Smallest absolute difference between two angles in degrees (handles the
    +180/-180 wraparound so a step across that boundary isn't seen as a big jump)."""
    return abs((a - b + 180.0) % 360.0 - 180.0)


def finalize_step(step_idx, angles, prev_step_angle, quiet_count,
                  angle_stop_deg, stop_after_steps):
    """Score one completed step. Returns (prev_step_angle, quiet_count, stop_now)."""
    if not angles:
        return prev_step_angle, quiet_count, False
    step_angle = statistics.median(angles)
    if prev_step_angle is not None:
        if angle_diff(step_angle, prev_step_angle) < angle_stop_deg:
            quiet_count += 1
        else:
            quiet_count = 0
        print(f"\n[auto-stop] step {step_idx}: angle={step_angle:.2f}° "
              f"(quiet {quiet_count}/{stop_after_steps})")
    return step_angle, quiet_count, quiet_count >= stop_after_steps

try:
    import serial  # pyserial
except ImportError:
    sys.exit("pyserial not installed. Run:  pip install pyserial")


class RobotBridge:
    """Client that connects to the robot and receives step/position events.

    The robot (server) sends newline-terminated messages:
        START                          -> begin recording
        STEP,<i>,<z>,<enc>,<rel>       -> current step + positions (mm)
        STOP                           -> stop recording
    A background thread keeps the latest step context so every captured sample
    can be tagged with the robot position it belongs to.
    """

    def __init__(self, host, port):
        self._host = host
        self._port = port
        self._sock = None
        self._lock = threading.Lock()
        # "moving" starts True so nothing is logged until the robot announces its
        # first plateau (STEP). It flips True on MOVING (pipette raising) and False
        # on STEP (settled plateau), gating whether samples get recorded.
        self._ctx = {"step": -1, "z": float("nan"),
                     "enc": float("nan"), "rel": float("nan"), "moving": True}
        self.started = threading.Event()
        self.stopped = threading.Event()
        self._reader = None

    def connect(self, retry_secs=60.0):
        """Block until connected to the robot (or give up after retry_secs)."""
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
                             f"({e}). Is the robot script running?")
                print(f"\rWaiting for robot at {self._host}:{self._port} ...",
                      end="")
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
            if not data:  # robot closed the connection
                break
            buf += data.decode("ascii", errors="ignore")
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                self._handle(line.strip())
        self.stopped.set()

    def _handle(self, line):
        if not line:
            return
        if line == "START":
            self.started.set()
        elif line == "STOP":
            self.stopped.set()
        elif line == "MOVING":
            # Pipette is being raised between plateaus: pause recording.
            with self._lock:
                self._ctx["moving"] = True
        elif line.startswith("STEP"):
            parts = line.split(",")
            try:
                with self._lock:
                    self._ctx = {
                        "step": int(parts[1]),
                        "z": float(parts[2]),
                        "enc": float(parts[3]),
                        "rel": float(parts[4]),
                        "moving": False,  # settled on a plateau: record again
                    }
            except (IndexError, ValueError):
                return
            self.started.set()  # a STEP also means the run has begun

    def context(self):
        with self._lock:
            return dict(self._ctx)

    def send(self, msg):
        """Send a line back to the robot (e.g. READY / QUIT)."""
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
    """Connect to the robot bridge, send READY, and wait for the run to start.
    Returns a connected RobotBridge, or None if robot_ip is not set."""
    if not robot_ip:
        return None
    bridge = RobotBridge(robot_ip, bridge_port)
    bridge.connect()
    print("Sensor ready. Sending READY to start the robot test ...")
    bridge.send("READY")
    print("Waiting for robot START / first STEP ...")
    try:
        while not bridge.started.is_set():
            if bridge.stopped.is_set():
                sys.exit("Robot disconnected before starting.")
            time.sleep(0.05)
    except KeyboardInterrupt:
        sys.exit("\nCanceled while waiting for robot.")
    pcba.ser.reset_input_buffer()  # discard anything buffered during the wait
    print("Robot started stepping - recording now. Ctrl+C to stop early.\n")
    return bridge


def main():
    ap = argparse.ArgumentParser(description="Capture TMAG5273 field data.")
    ap.add_argument("--port", default="COM6",
                    help="Serial port (e.g. COM5 or /dev/ttyACM0). Defaults to COM6.")
    ap.add_argument("--baud", type=int, default=115200)
    ap.add_argument("--gap", default="unknown",
                    help="Air-gap label for this run, e.g. 3mm or 10mm")
    ap.add_argument("--duration", type=float, default=300.0,
                    help="Capture duration in seconds (standalone mode only)")
    ap.add_argument("--out", default=None,
                    help="Output CSV filename (auto-named if omitted)")
    ap.add_argument("--robot-ip", default=None,
                    help="Robot IP/hostname (SSH address). Omit to run capture "
                         "alone. If set, opens the sensor then sends READY so "
                         "Robot_HES_Test starts stepping.")
    ap.add_argument("--bridge-port", type=int, default=5005,
                    help="TCP port the robot publishes step events on")
    ap.add_argument("--angle-stop-deg", type=float, default=1.0,
                    help="Bridge mode: a step whose median angle changes by less "
                         "than this (deg) from the previous step counts as 'quiet'")
    ap.add_argument("--stop-after-steps", type=int, default=0,
                    help="Bridge mode: stop both programs after this many "
                         "consecutive quiet steps. 0 (default) disables angle "
                         "auto-stop, so the run ends when the robot finishes its "
                         "70 steps.")
    ap.add_argument("--reconnect-tries", type=int, default=15,
                    help="If the serial port drops mid-run, how many times to try "
                         "reopening it before giving up (0 = don't reconnect).")
    ap.add_argument("--reconnect-delay", type=float, default=1.0,
                    help="Seconds to wait between serial reconnect attempts.")
    args = ap.parse_args()

    # Open the sensor first so capture always works on its own. Bridge is optional.
    print(f"Opening {args.port} @ {args.baud} ...")
    pcba = Stm32Pcba(args.port, args.baud)
    pcba.connect()

    bridge = connect_bridge(args.robot_ip, args.bridge_port, pcba)
    if bridge is None:
        print(f"Recording {args.duration:.0f}s (standalone, no robot bridge) ...")
        print("Slide the magnet across the sensor now. Ctrl+C to stop early.\n")
        print("Tip: add --robot-ip <robot> to trigger Robot_HES_Test.py")

    # Collect samples in memory; we decide where (and whether) to save afterwards.
    # Base row: [t, gap, bx, by, bz, b_mag, angle_deg]; in bridge mode four robot
    # columns are appended: step, z_target_mm, z_encoder_mm, rel_mm.
    rows = []
    t0 = time.time()

    # Auto-stop tracking (bridge mode): when the robot's step index advances we
    # finalize the step just completed, compare its median angle to the previous
    # step's, and count consecutive "quiet" steps. Enough of them -> stop both.
    active_step = None          # step index currently accumulating samples
    active_angles = []          # angle samples for the active step
    prev_step_angle = None      # median angle of the previous completed step
    quiet_count = 0             # consecutive quiet steps so far

    try:
        while True:
            # Stop condition: robot said STOP (bridge mode) or duration elapsed.
            if bridge is not None:
                if bridge.stopped.is_set():
                    break
            elif time.time() - t0 >= args.duration:
                break

            # The board can drop off USB mid-run or when the run ends (cable
            # strain, power management, reset/unplug). Try to reopen the port and
            # keep going; if it's truly gone, stop cleanly so we still save what
            # we captured instead of crashing out and losing every sample.
            raw = pcba.read_sensor_line(args.reconnect_tries, args.reconnect_delay)
            if raw is None:
                break
            result = pcba.convert_to_mT(raw)
            if result is None:
                continue
            bx, by, bz = result

            # Calculate the vector sum (magnitude)
            b_mag = math.sqrt(bx**2 + by**2 + bz**2)

            # Calculate the linear tracking angle in degrees
            angle_deg = math.degrees(math.atan2(by, bz))

            t = time.time() - t0

            # Bridge mode: only log at plateaus. While the robot is raising the
            # pipette (MOVING) we drain the serial port but record nothing, so
            # each step's rows are pure settled-plateau samples.
            if bridge is not None and bridge.context().get("moving", False):
                print(f"\r t={t:5.1f}s  (raising pipette - not recording)  "
                      f"({len(rows)} samples)", end="")
                continue

            # Add all values to the row array
            row = [t, args.gap, bx, by, bz, b_mag, angle_deg]
            step = None
            if bridge is not None:
                c = bridge.context()
                step = c["step"]
                row += [step, c["z"], c["enc"], c["rel"]]
            rows.append(row)

            # Auto-stop bookkeeping: detect when the robot advances to a new step.
            # Only runs if angle auto-stop is enabled (--stop-after-steps > 0);
            # otherwise the run simply ends when the robot finishes its 70 steps.
            if (bridge is not None and args.stop_after_steps > 0
                    and step is not None and step >= 0):
                if active_step is None:
                    active_step = step
                elif step != active_step:
                    prev_step_angle, quiet_count, stop_now = finalize_step(
                        active_step, active_angles, prev_step_angle, quiet_count,
                        args.angle_stop_deg, args.stop_after_steps)
                    active_step = step
                    active_angles = []
                    if stop_now:
                        print(f"[auto-stop] {args.stop_after_steps} consecutive "
                              f"quiet steps - stopping robot and capture.")
                        bridge.send("QUIT")
                        break
                active_angles.append(angle_deg)

            # Live readout
            tag = f"  step={bridge.context()['step']}" if bridge is not None else ""
            print(f"\r t={t:5.1f}s  Bx={bx:7.2f}  Bz={bz:7.2f}  "
                  f"|B|={b_mag:7.2f}  Angle={angle_deg:7.2f}°{tag}  "
                  f"({len(rows)} samples)", end="")
    except KeyboardInterrupt:
        print("\nStopped by user.")

    pcba.disconnect()
    if bridge is not None:
        bridge.close()
    print(f"\nDone. {len(rows)} samples recorded.")

    if not rows:
        print("No data captured, nothing to plot or save.")
        return

    save_prompt(rows, args.out, args.gap)
    plot_data(rows, args.gap)


def build_figure(rows, gap):
    """Build the interactive multi-plot figure for magnetic fields and angle."""
    try:
        import plotly.graph_objs as go
        from plotly.subplots import make_subplots
    except ImportError:
        print("plotly not installed, skipping plot. "
              "Run:  pip install plotly")
        return None

    t = [r[0] for r in rows]
    bx = [r[2] for r in rows]
    by = [r[3] for r in rows]
    bz = [r[4] for r in rows]
    b_mag = [r[5] for r in rows]
    angle_deg = [r[6] for r in rows]

    # Create a 2-row subplot. shared_xaxes locks zooming/panning between the two.
    fig = make_subplots(
        rows=2, cols=1, 
        shared_xaxes=True,
        vertical_spacing=0.1,
        subplot_titles=(f"TMAG5273 Fields (Gap = {gap})", "Linear Tracking Angle")
    )

    # Row 1: The Magnetic Field Lines
    fig.add_trace(go.Scatter(x=t, y=bx, mode="lines", name="Bx (mT)"), row=1, col=1)
    fig.add_trace(go.Scatter(x=t, y=by, mode="lines", name="By (mT)"), row=1, col=1)
    fig.add_trace(go.Scatter(x=t, y=bz, mode="lines", name="Bz (mT)"), row=1, col=1)
    fig.add_trace(go.Scatter(x=t, y=b_mag, mode="lines", name="|B| (mT)", 
                             line=dict(dash='dot', width=3)), row=1, col=1)
    
    # Row 2: The Angle
    fig.add_trace(go.Scatter(x=t, y=angle_deg, mode="lines", name="Angle (°)", 
                             line=dict(color='purple')), row=2, col=1)
                             
    # Clean up the layout, add axis labels, and set the hover behavior
    fig.update_layout(
        height=700,  # Make the window a bit taller to fit both graphs nicely
        hovermode="x unified" # Shows a clean tooltip for all lines at the cursor's time
    )
    
    # Lock the angle Y-axis strictly to the bounds of atan2
    fig.update_yaxes(title_text="Field (mT)", row=1, col=1)
    fig.update_yaxes(title_text="Angle (°)", range=[-180, 180], row=2, col=1)
    fig.update_xaxes(title_text="Time (s)", row=2, col=1)
    
    return fig


def plot_data(rows, gap):
    """Save an interactive HTML chart and serve it on localhost so it can be
    viewed inside VS Code's Simple Browser (webviews can't load file:// + JS)."""
    fig = build_figure(rows, gap)
    if fig is None:
        return

    import functools
    import http.server
    import socketserver
    import tempfile
    import threading

    # Write the self-contained interactive HTML into its own temp folder.
    out_dir = tempfile.mkdtemp(prefix="tmag_plot_")
    html_name = "plot.html"
    fig.write_html(os.path.join(out_dir, html_name),
                   include_plotlyjs="inline", full_html=True)

    # Serve just that folder on loopback; try a few ports in case one is busy.
    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=out_dir)
    httpd = None
    for port in range(8051, 8071):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
            break
        except OSError:
            continue
    if httpd is None:
        print(f"Could not start a local server. Open this file manually:\n"
              f"  {os.path.join(out_dir, html_name)}")
        return

    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{port}/{html_name}"

    print("\nInteractive plot is being served at:")
    print(f"  {url}")
    print("To view it inside VS Code:")
    print("  1. Press Ctrl+Shift+P")
    print("  2. Run 'Simple Browser: Show'")
    print("  3. Paste the URL above and press Enter")
    try:
        input("\nLeave this running while you view. Press Enter here to stop...")
    except (KeyboardInterrupt, EOFError):
        pass
    httpd.shutdown()



def csv_header(bridged):
    """Column names for a capture CSV (four robot columns added in bridge mode)."""
    header = ["t_sec", "gap", "Bx_mT", "By_mT", "Bz_mT", "B_mag_mT", "Angle_deg"]
    if bridged:
        header += ["step", "z_target_mm", "z_encoder_mm", "rel_mm"]
    return header


def format_row(r, bridged):
    """Format one in-memory row into CSV string fields (matches csv_header)."""
    t, g, bx, by, bz, b_mag, angle = r[:7]
    out = [f"{t:.3f}", g, f"{bx:.3f}", f"{by:.3f}", f"{bz:.3f}",
           f"{b_mag:.3f}", f"{angle:.3f}"]
    if bridged:
        step, z, enc, rel = r[7:11]
        out += [step, f"{z:.4f}", f"{enc:.4f}", f"{rel:.4f}"]
    return out


def save_prompt(rows, out_name, gap):
    """Ask whether to keep the data; if yes, write the CSV (and an interactive
    HTML copy of the chart) to the Desktop."""
    try:
        answer = input("Save this capture as a CSV on the Desktop? [y/N]: ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\nSave canceled by user. No file saved.")
        return

    if answer not in ("y", "yes"):
        print("Discarded, no file saved.")
        return

    desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    fname = out_name or f"tmag_{gap}_{datetime.now():%Y%m%d_%H%M%S}.csv"
    if not fname.lower().endswith(".csv"):
        fname += ".csv"
    full_path = os.path.join(desktop, fname)

    # In bridge mode each row carries four extra robot columns.
    bridged = len(rows[0]) > 7

    try:
        with open(full_path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(csv_header(bridged))
            for r in rows:
                w.writerow(format_row(r, bridged))
        print(f"Saved {len(rows)} samples to {full_path}")
    except OSError as e:
        print(f"Could not save file: {e}")
        return

    # Also save an interactive HTML copy of the chart next to the CSV.
    fig = build_figure(rows, gap)
    if fig is not None:
        html_path = full_path[:-4] + ".html"
        try:
            fig.write_html(html_path, include_plotlyjs="inline", full_html=True)
            print(f"Saved interactive chart to {html_path}")
        except OSError as e:
            print(f"Could not save chart HTML: {e}")


if __name__ == "__main__":
    main()
