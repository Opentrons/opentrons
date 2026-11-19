"""Ram the pipette sheath into a front-middle calibration block, then step the plunger up.

Z descends toward the axis travel minimum at a reduced run current; the block
stops it and that stall is treated as contact. Each trial then rams the plunger
down until contact and steps up while capture logs atan2.

Run (on the robot)::

python3 -m hardware_testing.scripts.robot_hes_block_cal --mount right
"""
import argparse
import asyncio
import socket
import sys
import threading
from contextlib import asynccontextmanager
from typing import AsyncIterator, Awaitable, List, Optional, Sequence

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, Axis, CriticalPoint
from opentrons.types import Point
from hardware_testing.opentrons_api import helpers_ot3

INCREMENT_MM = 0.06
TRAVEL_MM = 11.5
SETTLE_S = 0.3
PLATEAU_S = 1.0
SPEED = 5.0
HOME_LIMIT_MM = 0.0
# Pause upward pull here so an ejector-up fixture can be installed (same as Plunger_Test).
PLUNGER_SETUP_MM = 72.9
NUM_TRIALS = 5
ACCESS_POSE = Point(177.32, 75.5, 110.0)
# First Z descent goes this much below ACCESS_POSE.z.
HOVER_DROP_MM = 20.0
Z_MIN_SPEED = 5.0
Z_MIN_CURRENT_A = 0.1
# Approach to hover is far from the block, so it runs fast at full current.
Z_HOVER_SPEED = 65.0
STALL_PLUNGER_MM = 20.0
STALL_PLUNGER_SPEED = 5.0
STALL_PLUNGER_CURRENT_A = 0.15


class RobotPublisher:
    """TCP server: READY / START / MOVING / STEP / STOP / QUIT."""

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
        threading.Thread(target=self._accept_loop, daemon=True).start()

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
            print(f"[bridge] capture connected from {addr[0]}")
            threading.Thread(
                target=self._client_reader, args=(conn,), daemon=True
            ).start()

    def _client_reader(self, conn: socket.socket) -> None:
        conn.settimeout(1.0)
        buf = ""
        while not self._stop.is_set():
            try:
                chunk = conn.recv(256)
            except socket.timeout:
                continue
            except OSError:
                break
            if not chunk:
                break
            buf += chunk.decode("ascii", errors="ignore")
            while "\n" in buf:
                line, buf = buf.split("\n", 1)
                msg = line.strip()
                if msg == "READY":
                    print("[bridge] READY received")
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
            for client in list(self._clients):
                try:
                    client.sendall(payload)
                except OSError:
                    self._clients.remove(client)

    def close(self) -> None:
        self._stop.set()
        with self._lock:
            for client in self._clients:
                try:
                    client.close()
                except OSError:
                    pass
            self._clients.clear()
        try:
            self._srv.close()
        except OSError:
            pass


def wait_enter(what: str) -> None:
    print(f"\n>>> {what}")
    print("    Enter to continue, q then Enter to quit")
    line = input().strip().lower()
    if line.startswith("q"):
        sys.exit("TEST CANCELLED")


def plunger_axis(mnt: OT3Mount) -> Axis:
    return Axis.of_main_tool_actuator(mnt)


async def plunger_mm(api: OT3API, mnt: OT3Mount) -> float:
    pos = await api.current_position_ot3(mnt, refresh=True)
    return pos[plunger_axis(mnt)]


async def move_to_point(api: OT3API, mnt: OT3Mount, point: Point) -> None:
    """Lift, slide XY, then lower to hover. CriticalPoint.NOZZLE.

    This is the approach to hover height, far above the block, so it runs fast at
    full motor current. The later descent onto the block is slowed and current-limited.
    """
    cp = CriticalPoint.NOZZLE
    home_z = api.get_instrument_max_height(mnt, cp)
    pos = await api.current_position_ot3(mnt, refresh=True, critical_point=cp)
    # Right after home Z is already up; skipping that move avoids a bounds warning
    # from re-commanding X/Y at their home limits.
    if pos[Axis.by_mount(mnt)] < home_z - 0.1:
        await api.move_to(mnt, Point(pos[Axis.X], pos[Axis.Y], home_z))
    await api.move_to(mnt, Point(point.x, point.y, home_z))
    print(f"Lowering Z to hover {point.z:.2f} mm at {Z_HOVER_SPEED:.1f} mm/s, full current")
    await api.move_to(mnt, Point(point.x, point.y, point.z), speed=Z_HOVER_SPEED)


def z_current_now(api: OT3API, mnt: OT3Mount) -> Optional[float]:
    """Run current the driver is actually holding for the Z axis, if known."""
    settings = getattr(api._backend, "_current_settings", None)
    z_ax = Axis.by_mount(mnt)
    if not settings or z_ax not in settings:
        return None
    return settings[z_ax].run_current


@asynccontextmanager
async def z_run_current(
    api: OT3API, mnt: OT3Mount, run_current: float
) -> AsyncIterator[float]:
    """Drive the Z axis at a reduced run current, restoring the default after.

    This is the same mechanism helpers_ot3.move_plunger_absolute_ot3 uses for its
    motor_current argument: the backend context manager sends set_run_current for
    the axis and puts the previous value back on exit.
    """
    z_ax = Axis.by_mount(mnt)
    default = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(
        api, z_ax
    ).run_current
    async with api._backend.motor_current(run_currents={z_ax: run_current}):
        applied = z_current_now(api, mnt)
        applied_str = "simulated" if applied is None else f"{applied:.3f} A"
        print(
            f"{z_ax.name} run current {default:.3f} A -> {run_current:.3f} A "
            f"(driver reports {applied_str})"
        )
        yield default
    print(f"{z_ax.name} run current restored to {default:.3f} A")


async def move_z_to_axis_min(
    api: OT3API, mnt: OT3Mount, run_current: float = Z_MIN_CURRENT_A
) -> float:
    """Lower Z toward the axis travel minimum; the block stops it first.

    The block sits well above the axis minimum, so contact arrives as a
    stall/collision. The descent runs at a reduced Z run current so contact is
    gentle, and the stall is the intended end of the move: it is caught and Z is
    rewritten from the encoder so the nozzle stays resting on the block.
    """
    z_ax = Axis.by_mount(mnt)
    cp = CriticalPoint.NOZZLE
    here = await api.gantry_position(mnt, refresh=True, critical_point=cp)
    home_z = api.get_instrument_max_height(mnt, cp)
    lo, hi = api._backend.axis_bounds[z_ax]
    z_min = home_z - (hi - lo)
    print(
        f"Lowering Z toward axis min {z_min:.2f} mm at {Z_MIN_SPEED:.1f} mm/s "
        f"(home {home_z:.2f}, span {hi - lo:.1f}); block contact ends the move"
    )
    async with z_run_current(api, mnt, run_current):
        await ram_until_stall(
            api.move_to(
                mnt,
                Point(here.x, here.y, z_min),
                speed=Z_MIN_SPEED,
                expect_stalls=True,
            ),
            api,
            [z_ax],
        )
    after = await api.gantry_position(mnt, refresh=True, critical_point=cp)
    print(f"Z resting at {after.z:.2f} mm (encoder)")
    return after.z


async def ram_until_stall(move_coro: Awaitable[None], api: OT3API, axes: Sequence[Axis]) -> None:
    try:
        await move_coro
    except Exception as e:
        print(f"stall override: {type(e).__name__}: {e}")
    await api._update_position_estimation(list(axes))
    await api.refresh_positions()


async def ram_plunger_into_block(
    api: OT3API,
    mnt: OT3Mount,
    run_current: float = STALL_PLUNGER_CURRENT_A,
) -> float:
    """Drive plunger down until stall; encoder pose is the trial zero.

    Runs at a reduced plunger run current as well as the slow speed, so the
    sheath lands on the block gently. motor_current is applied by helpers_ot3
    through the same backend context manager used for the Z descent.
    """
    current = await plunger_mm(api, mnt)
    target = current + STALL_PLUNGER_MM
    print(
        f"Ramming plunger down {STALL_PLUNGER_MM:.1f} mm "
        f"({current:.3f} -> {target:.3f}) at {STALL_PLUNGER_SPEED:.1f} mm/s, "
        f"{run_current:.3f} A"
    )
    await ram_until_stall(
        helpers_ot3.move_plunger_absolute_ot3(
            api,
            mnt,
            target,
            motor_current=run_current,
            speed=STALL_PLUNGER_SPEED,
            expect_stalls=True,
        ),
        api,
        [plunger_axis(mnt)],
    )
    zero = await plunger_mm(api, mnt)
    print(f"Sheath contact zero at plunger {zero:.3f} mm")
    return zero


def step_msg(i: int, plunger: float, rel: float) -> str:
    return "STEP,{},{:.4f},{:.4f}".format(i, plunger, rel)


async def run_pull(
    api: OT3API,
    mnt: OT3Mount,
    publisher: RobotPublisher,
    zero: float,
    increment: float,
    num_steps: int,
    settle_s: float,
    plateau_s: float,
) -> None:
    publisher.send(step_msg(0, zero, 0.0))
    await asyncio.sleep(plateau_s)
    fixture_paused = False
    for i in range(1, num_steps + 1):
        if publisher.quit_requested():
            print("[bridge] capture requested stop")
            return
        current = await plunger_mm(api, mnt)
        target = current - increment
        if target < HOME_LIMIT_MM:
            print("Reached plunger home, stopping.")
            return
        # First time the up-step would cross setup height: stop at 72.9, pause capture.
        if not fixture_paused and target < PLUNGER_SETUP_MM <= current:
            publisher.send("MOVING")
            await helpers_ot3.move_plunger_absolute_ot3(
                api, mnt, PLUNGER_SETUP_MM, speed=SPEED
            )
            await asyncio.sleep(settle_s)
            plunger = await plunger_mm(api, mnt)
            wait_enter(
                f"plunger at {plunger:.3f} mm — install ejector-up fixture, "
                "then Enter to resume recording"
            )
            fixture_paused = True
            rel = zero - plunger
            publisher.send(step_msg(i, plunger, rel))
            await asyncio.sleep(plateau_s)
            print(f"Step {i}/{num_steps}  plunger={plunger:.3f}  rel={rel:.3f}")
            continue
        publisher.send("MOVING")
        await helpers_ot3.move_plunger_absolute_ot3(
            api, mnt, target, speed=SPEED
        )
        await asyncio.sleep(settle_s)
        plunger = await plunger_mm(api, mnt)
        rel = zero - plunger
        publisher.send(step_msg(i, plunger, rel))
        await asyncio.sleep(plateau_s)
        print(f"Step {i}/{num_steps}  plunger={plunger:.3f}  rel={rel:.3f}")


async def _main() -> None:
    increment = args.increment
    travel_mm = args.travel_mm
    num_steps = int(round(travel_mm / increment))
    publisher = RobotPublisher(port=args.bridge_port)
    print(f"[bridge] listening on port {args.bridge_port}")

    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    try:
        await api.home()
        await api.home_plunger(mount)
        print(f"Plunger after home: {await plunger_mm(api, mount):.3f} mm")
        hover = ACCESS_POSE._replace(z=ACCESS_POSE.z - HOVER_DROP_MM)
        print(
            f"Moving gantry to front-middle hover "
            f"({hover.x:.2f}, {hover.y:.2f}, {hover.z:.2f}) "
            f"({HOVER_DROP_MM:.0f} mm below ACCESS_POSE z={ACCESS_POSE.z:.1f})"
        )
        await move_to_point(api, mount, hover)

        await move_z_to_axis_min(api, mount, args.z_current)

        if not publisher.client_ready():
            print(
                "Waiting for capture READY ...\n"
                "  python HES_Plunger_Capture.py --robot-ip <this-robot-ip>"
            )
        while not publisher.client_ready():
            if publisher.quit_requested():
                print("[bridge] capture quit before start")
                return
            await asyncio.sleep(0.1)

        for trial in range(1, NUM_TRIALS + 1):
            if publisher.quit_requested():
                print("[bridge] capture requested stop")
                break
            print(f"\n=== Trial {trial}/{NUM_TRIALS} ===")
            publisher.send("MOVING")
            zero = await ram_plunger_into_block(api, mount, args.plunger_current)
            await asyncio.sleep(args.settle)
            wait_enter(
                f"trial {trial}: sheath at {zero:.3f} mm — Enter to start "
                f"{travel_mm:.1f} mm up steps"
            )
            publisher.send("TRIAL,{}".format(trial))
            publisher.send("START")
            await run_pull(
                api,
                mount,
                publisher,
                zero,
                increment,
                num_steps,
                args.settle,
                args.plateau,
            )
            publisher.send("MOVING")
    except KeyboardInterrupt:
        pass
    finally:
        try:
            # A collision can leave Z flagged unknown; trust the encoder instead.
            await api._update_position_estimation([Axis.by_mount(mount)])
            await api.refresh_positions()
            here = await api.gantry_position(
                mount, refresh=True, critical_point=CriticalPoint.NOZZLE
            )
            print(f"Lifting Z to {ACCESS_POSE.z:.1f} mm")
            await api.move_to(
                mount,
                Point(here.x, here.y, ACCESS_POSE.z),
                speed=Z_MIN_SPEED,
            )
        except SystemExit:
            print("Skipping Z lift")
        except Exception as e:
            print(f"Z lift failed ({type(e).__name__}: {e}); homing Z instead")
            try:
                await api.home([Axis.by_mount(mount)])
            except Exception as e2:
                print(f"Z home failed: {type(e2).__name__}: {e2}")
        publisher.send("STOP")
        publisher.close()
        await api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", choices=["left", "right"], default="left")
    parser.add_argument("--bridge_port", type=int, default=5005)
    parser.add_argument(
        "--increment",
        type=float,
        default=INCREMENT_MM,
        help=f"mm per plunger step (default {INCREMENT_MM})",
    )
    parser.add_argument(
        "--travel-mm",
        type=float,
        default=TRAVEL_MM,
        dest="travel_mm",
        help=f"total up travel after sheath contact (default {TRAVEL_MM})",
    )
    parser.add_argument(
        "--z-current",
        type=float,
        default=Z_MIN_CURRENT_A,
        dest="z_current",
        help=f"Z run current (amps) during the descent onto the block "
        f"(default {Z_MIN_CURRENT_A})",
    )
    parser.add_argument(
        "--plunger-current",
        type=float,
        default=STALL_PLUNGER_CURRENT_A,
        dest="plunger_current",
        help=f"plunger run current (amps) during the ram into the block "
        f"(default {STALL_PLUNGER_CURRENT_A})",
    )
    parser.add_argument(
        "--settle",
        type=float,
        default=SETTLE_S,
        help=f"seconds to let the plunger stop ringing (default {SETTLE_S})",
    )
    parser.add_argument(
        "--plateau",
        type=float,
        default=PLATEAU_S,
        help=f"seconds held at each step for recording (default {PLATEAU_S})",
    )
    args = parser.parse_args()
    mount = OT3Mount.LEFT if args.mount == "left" else OT3Mount.RIGHT
    asyncio.run(_main())
