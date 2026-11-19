"""Tip-offset cycle: robot motion + V2-style bridge (dial/angle on the laptop).

Sequence
--------
1. Home.
2. Jog the nozzle onto tip A1 and press Enter; that pose is the pick height.
3. Bare nozzle and every tip: travel to the same DIAL_APPROACH (identical encoder Z).
4. Descend onto the dial by a tip-dependent distance so everyone finishes at the
   same contact plane. Hold for atan2, lift ``UNLOAD_LIFT_MM`` (1 mm) off the
   dial and hold again, then retract the rest of the way.

Tip-on: ``contact_mm`` down (default 7 mm). Bare nozzle: ``contact_mm + exposed
tip mm`` down so the nozzle reaches the same plane the tip end reaches.
"""
from __future__ import annotations

import argparse
import asyncio
import socket
import sys
import termios
import threading
import tty
from typing import Dict, List, Optional

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, Axis, CriticalPoint
from opentrons.types import Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)

# Absolute deck poses (mm). Bare-nozzle dial approach (no tip on pipette).
DIAL_APPROACH = Point(-24.28, 149.51, 145.01)
DIAL_APPROACH_CP = CriticalPoint.NOZZLE
# Tip end sits this far above the dial face at approach (before contact descent).
DIAL_TIP_CLEARANCE_MM = 10.0
# Same downward stroke onto the dial for nozzle and every tip (mm).
DIAL_CONTACT_DESCENT_MM = 7.0
DIAL_DESCENT_SPEED = 5.0
ENCODER_MATCH_TOL_MM = 0.05
# Must match pick_up_tip(..., tip_length=tip_length[size] - TIP_SEAT_OFFSET_MM).
TIP_SEAT_OFFSET_MM = 10.5
TIP_LENGTH_MM = {
    "T1K": 95.6,
    "T200": 58.35,
    "T50": 57.9,
    "T20": 52.0,
}
# Nozzle pose over tip A1, just before pick_up_tip presses in.
TIP_A1 = Point(178.8, 179.8, 99.31)
TIP_PITCH_MM = 9.0
ROWS = "ABCDEFGH"

def exposed_tip_mm(tip_size: str) -> float:
    """How far the tip end hangs below the nozzle after pick_up_tip."""
    return TIP_LENGTH_MM[tip_size] - TIP_SEAT_OFFSET_MM


def unified_dial_approach(
    tip_size: str,
    contact_mm: float,
    clearance_mm: float,
    override_z: Optional[float] = None,
) -> Point:
    """One shared nozzle/encoder approach for bare nozzle and all tips.

    Tip end sits ``clearance_mm`` above the dial face inferred from
    ``DIAL_APPROACH`` and ``contact_mm``.
    """
    if override_z is not None:
        return DIAL_APPROACH._replace(z=override_z)
    dial_face_z = DIAL_APPROACH.z - contact_mm
    tip_end_z = dial_face_z + clearance_mm
    nozzle_z = tip_end_z + exposed_tip_mm(tip_size)
    return DIAL_APPROACH._replace(z=nozzle_z)


def dial_descent_mm(has_tip: bool, tip_size: str, contact_mm: float) -> float:
    """Downstroke onto dial: tip uses ``contact_mm``; bare nozzle goes further."""
    if has_tip:
        return contact_mm
    return contact_mm + exposed_tip_mm(tip_size)


# Capture reads a dial (~0.3–1 s) then atan2 for 1 s; hold both windows.
HOLD_S = 2.5
SETTLE_S = 0.0
# After the loaded contact hold, lift this much and sample atan2 again.
UNLOAD_LIFT_MM = 1.0


def getch() -> str:
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


async def jog_xyz(api: OT3API, mnt: OT3Mount, cp: CriticalPoint) -> Point:
    """Jog the mount by hand and return the pose saved with Enter."""
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    xy_speed = 60
    za_speed = 65
    print(
        """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    )
    while True:
        key = getch()
        if key == "a":
            sys.stdout.flush()
            await api.move_rel(
                mnt, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif key == "d":
            sys.stdout.flush()
            await api.move_rel(
                mnt, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif key == "w":
            sys.stdout.flush()
            await api.move_rel(
                mnt, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif key == "s":
            sys.stdout.flush()
            await api.move_rel(
                mnt, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif key == "i":
            sys.stdout.flush()
            await api.move_rel(
                mnt, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif key == "k":
            sys.stdout.flush()
            await api.move_rel(
                mnt, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif key == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif key == "+":
            sys.stdout.flush()
            step_length_index = min(step_length_index + 1, 7)

        elif key == "-":
            sys.stdout.flush()
            step_length_index = max(step_length_index - 1, 0)

        elif key == "\r":
            sys.stdout.flush()
            pos = await api.current_position_ot3(mnt, refresh=True, critical_point=cp)
            print("\r\n")
            return point_from_pos(pos, mnt)

        pos = await api.current_position_ot3(mnt, refresh=True, critical_point=cp)
        print(
            "Coordinates: ",
            round(pos[Axis.X], 2),
            ",",
            round(pos[Axis.Y], 2),
            ",",
            round(pos[Axis.by_mount(mnt)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")


def well_pose(a1: Point, row: str, col: int) -> Point:
    """Deck pose of a 96-rack well, measured from A1."""
    r = ROWS.index(row.upper())
    return Point(
        a1.x + TIP_PITCH_MM * (col - 1),
        a1.y - TIP_PITCH_MM * r,
        a1.z,
    )


class RobotPublisher:
    """TCP server: START / MOVING / STEP / STOP (same as Robot_HES_Test.py)."""

    def __init__(self, port: int = 5005, host: str = "0.0.0.0") -> None:
        self._srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._srv.bind((host, port))
        self._srv.listen(1)
        self._srv.settimeout(1.0)
        self._clients: List[socket.socket] = []
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._quit = threading.Event()
        self._ready = threading.Event()
        self._thread = threading.Thread(target=self._accept_loop, daemon=True)
        self._thread.start()

    def _accept_loop(self) -> None:
        while not self._stop.is_set():
            try:
                conn, addr = self._srv.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            with self._lock:
                self._clients.append(conn)
            print(f"[bridge] capture program connected from {addr[0]}")
            print("[bridge] waiting for READY from capture before starting")
            threading.Thread(
                target=self._client_reader, args=(conn,), daemon=True
            ).start()

    def _client_reader(self, conn: socket.socket) -> None:
        conn.settimeout(1.0)
        buf = ""
        while not self._stop.is_set():
            try:
                data = conn.recv(256)
            except socket.timeout:
                continue
            except OSError:
                break
            if not data:
                break
            buf += data.decode("ascii", errors="ignore")
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                msg = line.strip()
                if msg == "READY":
                    print("[bridge] READY received — capture is live")
                    self._ready.set()
                elif msg in ("QUIT", "STOP"):
                    self._quit.set()

    def client_ready(self) -> bool:
        return self._ready.is_set()

    def quit_requested(self) -> bool:
        return self._quit.is_set()

    def send(self, msg: str) -> None:
        payload = (msg + "\n").encode("ascii")
        with self._lock:
            for c in list(self._clients):
                try:
                    c.sendall(payload)
                except OSError:
                    self._clients.remove(c)

    def close(self) -> None:
        self._stop.set()
        with self._lock:
            for c in self._clients:
                try:
                    c.close()
                except OSError:
                    pass
            self._clients.clear()
        try:
            self._srv.close()
        except OSError:
            pass


async def _move_to(
    api: OT3API,
    mnt: OT3Mount,
    point: Point,
    cp: CriticalPoint,
    speed: Optional[float] = None,
) -> None:
    """Absolute move using this critical point (nozzle vs tip end)."""
    kwargs: dict = {}
    if speed is not None:
        kwargs["speed"] = speed
    try:
        await api.move_to(mnt, point, critical_point=cp, **kwargs)
    except TypeError:
        await api.move_to(mnt, point, **kwargs)


async def travel_to_pose(
    api: OT3API,
    mnt: OT3Mount,
    point: Point,
    cp: CriticalPoint,
    where: str,
    speed: Optional[float] = None,
) -> None:
    """Lift, slide XY, then lower to the target pose. No jogging."""
    safe_z = api.get_instrument_max_height(mnt, cp)
    pos = await api.current_position_ot3(mnt, refresh=True, critical_point=cp)
    print(f"Traveling to {where}: ({point.x:.2f}, {point.y:.2f}, {point.z:.2f})")
    await _move_to(api, mnt, Point(pos[Axis.X], pos[Axis.Y], safe_z), cp)
    await _move_to(api, mnt, Point(point.x, point.y, safe_z), cp)
    await _move_to(api, mnt, point, cp, speed=speed)


async def lift_to_safe(api: OT3API, mnt: OT3Mount, cp: CriticalPoint) -> None:
    safe_z = api.get_instrument_max_height(mnt, cp)
    pos = await api.current_position_ot3(mnt, refresh=True, critical_point=cp)
    await _move_to(api, mnt, Point(pos[Axis.X], pos[Axis.Y], safe_z), cp)


def point_from_pos(pos: Dict[Axis, float], mnt: OT3Mount) -> Point:
    return Point(pos[Axis.X], pos[Axis.Y], pos[Axis.by_mount(mnt)])


def highlight_pose(title: str, pt: Point, enc_z: float, extra: str = "") -> None:
    """Print a hard-to-miss block with the saved pipette position."""
    lines = [
        title,
        f"X = {pt.x:8.3f} mm",
        f"Y = {pt.y:8.3f} mm",
        f"Z = {pt.z:8.3f} mm  (nozzle @ DIAL_APPROACH)",
        f"Z encoder = {enc_z:8.3f} mm",
    ]
    if extra:
        lines.append(extra)
    bar = "*" * 68
    body = "\n".join("  ***  " + ln for ln in lines)
    text = f"\n{bar}\n{body}\n{bar}\n"
    sys.stdout.write("\033[1;93m" + text + "\033[0m")
    sys.stdout.flush()


async def read_point_enc(
    api: OT3API, mnt: OT3Mount, cp: CriticalPoint
) -> tuple:
    pos = await api.current_position_ot3(mnt, refresh=True, critical_point=cp)
    enc = await api.encoder_current_position_ot3(mnt, critical_point=cp)
    pt = point_from_pos(pos, mnt)
    return pt, enc[Axis.by_mount(mnt)]


async def dial_contact_and_hold(
    hw_api: OT3API,
    mnt: OT3Mount,
    cp: CriticalPoint,
    what: str,
    step_idx: int,
    well: str,
    publisher: Optional[RobotPublisher],
    descent_mm: float,
    ref_enc_z: Optional[float] = None,
    unload_lift_mm: float = UNLOAD_LIFT_MM,
) -> tuple:
    """Descend ``descent_mm``, hold loaded, lift ``unload_lift_mm``, hold, retract."""
    await asyncio.sleep(SETTLE_S)
    approach, enc_approach = await read_point_enc(hw_api, mnt, cp)
    if ref_enc_z is not None:
        delta = enc_approach - ref_enc_z
        if abs(delta) > ENCODER_MATCH_TOL_MM:
            print(
                f"WARNING: approach encoder Z {enc_approach:.3f} differs from "
                f"reference {ref_enc_z:.3f} by {delta:+.3f} mm"
            )
        else:
            print(
                f"Approach encoder Z {enc_approach:.3f} matches reference "
                f"(delta {delta:+.3f} mm)"
            )

    highlight_pose(
        f"APPROACH — {what}",
        approach,
        enc_approach,
        extra=(
            f"Descent {descent_mm:.1f} mm onto dial; "
            f"then {unload_lift_mm:.1f} mm off for unloaded atan2"
        ),
    )

    if publisher is not None:
        publisher.send("MOVING")
    print(
        f"Descending {descent_mm:.1f} mm onto dial @ {DIAL_DESCENT_SPEED:.1f} mm/s ...",
        flush=True,
    )
    await _move_to(
        hw_api,
        mnt,
        Point(approach.x, approach.y, approach.z - descent_mm),
        cp,
        speed=DIAL_DESCENT_SPEED,
    )
    await asyncio.sleep(SETTLE_S)

    contact, enc_contact = await read_point_enc(hw_api, mnt, cp)
    highlight_pose(f"CONTACT — {what}", contact, enc_contact)

    if publisher is not None:
        publisher.send("HOVER,{},{}".format(step_idx, well))
        publisher.send(
            "STEP,{},{:.4f},{:.4f},{:.4f},{:.4f}".format(
                step_idx, contact.x, contact.y, contact.z, enc_contact
            )
        )
    print(f"Holding {HOLD_S:.1f}s at contact (loaded atan2) ...", flush=True)
    await asyncio.sleep(HOLD_S)

    lift = min(unload_lift_mm, max(0.0, descent_mm))
    if publisher is not None:
        publisher.send("MOVING")
    print(
        f"Lifting {lift:.1f} mm off dial for unloaded atan2 ...",
        flush=True,
    )
    off_pt = Point(contact.x, contact.y, contact.z + lift)
    await _move_to(hw_api, mnt, off_pt, cp, speed=DIAL_DESCENT_SPEED)
    await asyncio.sleep(SETTLE_S)
    off, enc_off = await read_point_enc(hw_api, mnt, cp)
    highlight_pose(f"OFF DIAL {lift:.1f} mm — {what}", off, enc_off)

    if publisher is not None:
        publisher.send("HOVER,{},{}".format(step_idx, well + "_off"))
        publisher.send(
            "STEP,{},{:.4f},{:.4f},{:.4f},{:.4f}".format(
                step_idx, off.x, off.y, off.z, enc_off
            )
        )
    print(
        f"Holding {HOLD_S:.1f}s off dial (unloaded atan2) ...",
        flush=True,
    )
    await asyncio.sleep(HOLD_S)

    if publisher is not None:
        publisher.send("MOVING")
    remain = max(0.0, approach.z - off.z)
    print(f"Retracting remaining {remain:.1f} mm off dial ...", flush=True)
    await _move_to(
        hw_api,
        mnt,
        Point(approach.x, approach.y, approach.z),
        cp,
        speed=DIAL_DESCENT_SPEED,
    )
    await lift_to_safe(hw_api, mnt, cp)
    return contact, enc_contact


async def _main() -> None:
    publisher: Optional[RobotPublisher] = None
    if not args.no_bridge:
        publisher = RobotPublisher(port=args.bridge_port)
        print(f"[bridge] listening on TCP port {args.bridge_port}")

    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    try:
        await hw_api.home()
        await hw_api.cache_instruments()
        await hw_api.home_plunger(mount)
        print("Homed.")
        await travel_to_pose(
            hw_api, mount, TIP_A1, CriticalPoint.NOZZLE, "tip A1 pick height"
        )
        print("Jog if needed, then Enter to zero A1 before pick_up_tip.")
        a1 = await jog_xyz(hw_api, mount, CriticalPoint.NOZZLE)

        row = args.row.upper()
        wells = [
            (f"{row}{col}", well_pose(a1, row, col))
            for col in range(args.col_start, args.col_end + 1)
        ]
        tip_approach = unified_dial_approach(
            args.tip_size,
            args.dial_contact_mm,
            args.dial_tip_clearance_mm,
            args.dial_tip_approach_z,
        )
        bare_descent = dial_descent_mm(False, args.tip_size, args.dial_contact_mm)
        tip_descent = dial_descent_mm(True, args.tip_size, args.dial_contact_mm)
        print(f"Shared dial approach {tip_approach}")
        print(
            f"Descent: bare nozzle {bare_descent:.1f} mm | "
            f"tip-on {tip_descent:.1f} mm "
            f"(same contact plane; tip end ~{args.dial_tip_clearance_mm:.1f} mm "
            f"above dial at approach)"
        )
        print(f"Tip A1      {a1}")
        print(f"Wells       {', '.join(n for n, _ in wells)}")

        if publisher is not None:
            print(
                "Waiting for capture READY ...\n"
                "  On the laptop:\n"
                "  python -u HES_Offset_Capture.py --port COM6 "
                "--robot-ip <this-robot-ip>"
            )
            while not publisher.client_ready():
                if publisher.quit_requested():
                    print("[bridge] capture quit before start.")
                    return
                await asyncio.sleep(0.1)
            publisher.send("START")
            print("[bridge] START sent.")

        await travel_to_pose(
            hw_api,
            mount,
            tip_approach,
            DIAL_APPROACH_CP,
            "dial approach (bare nozzle)",
        )
        _, approach_enc_ref = await read_point_enc(hw_api, mount, DIAL_APPROACH_CP)
        nozzle_contact, nozzle_enc = await dial_contact_and_hold(
            hw_api,
            mount,
            DIAL_APPROACH_CP,
            "bare pipette (no tip)",
            0,
            "nozzle",
            publisher,
            bare_descent,
            ref_enc_z=approach_enc_ref,
            unload_lift_mm=args.unload_lift_mm,
        )

        pick_len = exposed_tip_mm(args.tip_size)
        for i, (well, pose) in enumerate(wells, start=1):
            await travel_to_pose(
                hw_api, mount, pose, CriticalPoint.NOZZLE, f"pick {well}"
            )
            print(f"Picking up {well} ({args.tip_size})")
            await hw_api.pick_up_tip(mount, tip_length=pick_len)
            await travel_to_pose(
                hw_api,
                mount,
                tip_approach,
                DIAL_APPROACH_CP,
                f"dial approach ({well})",
            )
            await dial_contact_and_hold(
                hw_api,
                mount,
                DIAL_APPROACH_CP,
                f"pipette with tip {well}",
                i,
                well,
                publisher,
                tip_descent,
                ref_enc_z=approach_enc_ref,
                unload_lift_mm=args.unload_lift_mm,
            )
            # Tip is attached: aim the TIP END at the well, not the nozzle,
            # or the tip is driven a full tip-length into the rack.
            await travel_to_pose(
                hw_api, mount, pose, CriticalPoint.TIP, f"drop {well}"
            )
            await hw_api.drop_tip(mount)

        highlight_pose(
            "CONTACT — bare pipette (no tip)  [saved]",
            nozzle_contact,
            nozzle_enc,
        )
        print("Done.")

    except KeyboardInterrupt:
        print("\nInterrupted.")
    finally:
        if publisher is not None:
            publisher.send("STOP")
            publisher.close()
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await hw_api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Dial approach + fixed contact descent; tip pickup per well. "
            "Same nozzle/encoder pose every measurement."
        )
    )
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", choices=["left", "right"], default="left")
    parser.add_argument("--tip_size", default="T50", choices=["T1K", "T200", "T50", "T20"])
    parser.add_argument("--bridge_port", type=int, default=5005)
    parser.add_argument(
        "--no_bridge",
        action="store_true",
        help="Skip capture bridge (robot motion only).",
    )
    parser.add_argument("--row", default="A", choices=list(ROWS), help="Tip-rack row")
    parser.add_argument("--col-start", type=int, default=1)
    parser.add_argument("--col-end", type=int, default=12)
    parser.add_argument(
        "--dial-contact-mm",
        type=float,
        default=DIAL_CONTACT_DESCENT_MM,
        dest="dial_contact_mm",
        help=(
            f"Downward move onto dial from approach (default {DIAL_CONTACT_DESCENT_MM} mm). "
            "Use 70 if you intend 7 cm."
        ),
    )
    parser.add_argument(
        "--dial-tip-clearance-mm",
        type=float,
        default=DIAL_TIP_CLEARANCE_MM,
        dest="dial_tip_clearance_mm",
        help=(
            f"Tip end height above dial face at approach (default {DIAL_TIP_CLEARANCE_MM} mm)"
        ),
    )
    parser.add_argument(
        "--dial-tip-approach-z",
        type=float,
        default=None,
        dest="dial_tip_approach_z",
        help="Override shared approach nozzle Z (mm). Default: auto from tip size.",
    )
    parser.add_argument(
        "--unload-lift-mm",
        type=float,
        default=UNLOAD_LIFT_MM,
        dest="unload_lift_mm",
        help=(
            f"After loaded atan2, lift this much off the dial and sample again "
            f"(default {UNLOAD_LIFT_MM} mm)."
        ),
    )
    args = parser.parse_args()
    if not (1 <= args.col_start <= args.col_end <= 12):
        parser.error("--col-start/--col-end must satisfy 1 <= start <= end <= 12")
    mount = OT3Mount.LEFT if args.mount == "left" else OT3Mount.RIGHT
    asyncio.run(_main())
