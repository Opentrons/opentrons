"""Test waste-full detection."""

import math
import asyncio
import time
from typing import Any, Awaitable, List, NamedTuple, Optional, Tuple, Union

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module.errors import WasteContainerFull
from opentrons.drivers.vacuum_module.types import VentState


TARGET_PRESSURES = [-600]
# waste_detector.hpp arms within 20 mbar for 2 s, then needs 6 s sealed below
# -800. The wet no-trip must stay in band longer than both.
WET_NEAR_TARGET_MBAR = 20.0
WET_ON_TARGET_MIN_S = 8.0
HOLD_DURATION_S = 60
SAMPLE_PERIOD_S = 0.5
TIMEOUT_S = HOLD_DURATION_S + 30
TRIP_TIME_MIN_S = 2.0
TRIP_TIME_LIMIT_S = 45.0
EMPTY_MAX_PRESSURE_MBAR = -50.0
EQUALIZE_TOLERANCE_MBAR = 8.0
EQUALIZE_WAIT_S = 10


class WasteHoldResult(NamedTuple):
    """Outcome of one waste hold."""

    tripped: bool
    trip_t_s: Optional[float]
    elapsed_s: float
    pulled: bool
    equalized: bool
    on_target_s: float


def _empty_tag(target: int) -> str:
    """CSV tag for an empty-bottle hold."""
    return f"waste-empty-no-trip-{target}"


def _wet_tag(target: int) -> str:
    """CSV tag for a wet-plate no-trip hold."""
    return f"waste-wet-no-trip-{target}"


def _full_tag(target: int) -> str:
    """CSV tag for a full-bottle hold."""
    return f"waste-full-trip-{target}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV lines."""
    hold_fields = [
        CSVResult,
        float,  # trip_t_s; -1 if no trip
        float,  # elapsed_s
    ]
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("waste-config-roundtrip", [CSVResult]),
        CSVLine(
            "waste-config-tunings",
            [
                float,  # g_sealed_max
                float,  # stable_hold_ms
                float,  # stable_hold_deep_ms
                float,  # min_waste_depth_mbar
            ],
        ),
    ]
    wet_fields = list(hold_fields) + [float]  # on_target_s
    for target in TARGET_PRESSURES:
        lines.append(CSVLine(_empty_tag(target), list(hold_fields)))
    for target in TARGET_PRESSURES:
        lines.append(CSVLine(_wet_tag(target), wet_fields))
    for target in TARGET_PRESSURES:
        lines.append(CSVLine(_full_tag(target), list(hold_fields)))
    return lines


def _is_waste_full_error(exc: BaseException) -> bool:
    """Return True if ``exc`` is an ERR401 waste-full fault."""
    if isinstance(exc, WasteContainerFull):
        return True
    text = str(exc).lower()
    return "err401" in text or "waste" in text


def _reader_waste_tripped(vacuum: VacuumModule) -> bool:
    """Return True if the module reader already recorded ERR401."""
    err = vacuum._reader.error or ""
    return "401" in err.lower() or "waste" in err.lower()


def _empty_passed(result: WasteHoldResult, simulated: bool) -> bool:
    """Empty bottle must equalize, pull vacuum, and not trip."""
    return result.equalized and (not result.tripped) and (simulated or result.pulled)


def _wet_passed(result: WasteHoldResult, simulated: bool) -> bool:
    """Wet plate must sit on target long enough for a false trip, and not trip."""
    if not result.equalized or result.tripped:
        return False
    if simulated:
        return True
    return result.on_target_s >= WET_ON_TARGET_MIN_S


def _update_on_target(
    elapsed: float,
    current: float,
    target: int,
    streak_start: Optional[float],
    best_s: float,
) -> Tuple[Optional[float], float]:
    """Track the longest continuous stretch inside the detector arming band."""
    if abs(current - target) < WET_NEAR_TARGET_MBAR:
        if streak_start is None:
            streak_start = elapsed
        best_s = max(best_s, elapsed - streak_start)
    else:
        streak_start = None
    return streak_start, best_s


def _full_passed(result: WasteHoldResult, simulated: bool) -> bool:
    """Full bottle must equalize and trip inside the time window."""
    if not result.equalized or not result.tripped or result.trip_t_s is None:
        return False
    if result.trip_t_s > TRIP_TIME_LIMIT_S:
        return False
    if simulated:
        return True
    return result.trip_t_s > TRIP_TIME_MIN_S


async def _ignore_waste_error(awaitable: Awaitable[Any]) -> None:
    """Await a driver call and swallow leftover ERR401."""
    try:
        await awaitable
    except Exception as exc:
        if not _is_waste_full_error(exc):
            raise


async def _clear_waste_error(vacuum: VacuumModule) -> None:
    """Drop a leftover ERR401 so the next hold starts clean."""
    vacuum._reader.error = None
    try:
        vacuum._driver.reset_serial_buffers()
    except Exception:
        pass
    try:
        await vacuum._reader.update_vacuum_state()
    except Exception as exc:
        if not _is_waste_full_error(exc):
            raise
    vacuum._reader.error = None


async def _stop_and_vent(vacuum: VacuumModule) -> None:
    """Stop the pump and open the vent, ignoring leftover ERR401."""
    await _ignore_waste_error(vacuum.set_vacuum_state(False))
    await _ignore_waste_error(vacuum.set_vent_state(VentState.OPENED))


async def _recover_after_hold(vacuum: VacuumModule) -> None:
    """Stop, vent, and clear ERR401 after a hold or trip."""
    await _stop_and_vent(vacuum)
    await _clear_waste_error(vacuum)


async def _wait_to_pressurize(vacuum: VacuumModule) -> bool:
    """Wait until the chamber has equalized to atmosphere."""
    if vacuum.is_simulated:
        return True
    for _ in range(EQUALIZE_WAIT_S):
        try:
            await vacuum._reader.update_vacuum_state()
        except Exception as exc:
            if _is_waste_full_error(exc):
                await _clear_waste_error(vacuum)
                continue
            raise
        state = vacuum.vacuum_state
        if math.isclose(
            state.pressure_abs_b, state.pressure_atm, abs_tol=EQUALIZE_TOLERANCE_MBAR
        ):
            print(
                f"pressurized: abs_b={state.pressure_abs_b:.1f} "
                f"atm={state.pressure_atm:.1f}"
            )
            return True
        await asyncio.sleep(1)
    ui.print_error("pressurize wait timed out")
    return False


async def test_waste_config_roundtrip(
    vacuum: VacuumModule, report: CSVReport, section: str
) -> None:
    """Enable and disable waste detection and check the readback."""
    ui.print_header("Waste config round-trip")
    original = await vacuum._driver.get_waste_configs()
    try:
        await vacuum._driver.set_waste_configs(enable_waste_full_detection=True)
        on_cfg = await vacuum._driver.get_waste_configs()
        await vacuum._driver.set_waste_configs(enable_waste_full_detection=False)
        off_cfg = await vacuum._driver.get_waste_configs()
        passed = bool(on_cfg.waste_detection_enabled) and (
            not off_cfg.waste_detection_enabled
        )
        print(
            f"waste-full: readback on={on_cfg.waste_detection_enabled} "
            f"off={off_cfg.waste_detection_enabled} PASS={passed}"
        )
    finally:
        await vacuum._driver.set_waste_configs(
            enable_waste_full_detection=original.waste_detection_enabled
        )
    report(section, "waste-config-roundtrip", [CSVResult.from_bool(passed)])
    restored = await vacuum._driver.get_waste_configs()
    assert restored == original
    print(
        f"waste tunings G={restored.g_sealed_max} T={restored.stable_hold_ms} "
        f"U={restored.stable_hold_deep_ms} N={restored.min_waste_depth_mbar}"
    )
    report(
        section,
        "waste-config-tunings",
        [
            round(restored.g_sealed_max, 3),
            round(restored.stable_hold_ms, 1),
            round(restored.stable_hold_deep_ms, 1),
            round(restored.min_waste_depth_mbar, 1),
        ],
    )


async def _run_waste_hold(
    vacuum: VacuumModule, target_mbar: int, expect_trip: bool
) -> WasteHoldResult:
    """Hold ``target_mbar`` with waste on until duration or ERR401."""
    await _recover_after_hold(vacuum)
    equalized = await _wait_to_pressurize(vacuum)
    if not equalized:
        return WasteHoldResult(False, None, 0.0, False, False, 0.0)

    await vacuum.set_vent_state(VentState.CLOSED)
    await vacuum._driver.set_waste_configs(enable_waste_full_detection=True)

    duration_s = 1 if vacuum.is_simulated else HOLD_DURATION_S
    sample_period = 0.0 if vacuum.is_simulated else SAMPLE_PERIOD_S
    t0 = time.monotonic()
    try:
        await vacuum.set_vacuum_state(
            True,
            target_mbar,
            duration_s=duration_s,
            timeout_s=TIMEOUT_S,
        )
    except Exception as exc:
        if _is_waste_full_error(exc):
            return WasteHoldResult(True, 0.0, time.monotonic() - t0, False, True, 0.0)
        raise
    if vacuum.is_simulated and expect_trip:
        vacuum.inject_async_gcode_response("ERR401")

    tripped = False
    trip_t_s: Optional[float] = None
    pulled = False
    elapsed = 0.0
    on_target_s = 0.0
    streak_start: Optional[float] = None
    while elapsed < duration_s:
        elapsed = time.monotonic() - t0
        try:
            # Re-enable is outside the poller, so a latched ERR401 often
            # arrives as this command's response rather than the state read.
            await vacuum._driver.set_waste_configs(enable_waste_full_detection=True)
            await vacuum._reader.update_vacuum_state()
            current = vacuum.vacuum_state.current_gauge_pressure
            enabled = int(vacuum.vacuum_state.vacuum_enabled)
        except Exception as exc:
            if not _is_waste_full_error(exc):
                raise
            tripped = True
            trip_t_s = elapsed
            print(f"t={elapsed:6.2f}s ERR401")
            break

        if current <= EMPTY_MAX_PRESSURE_MBAR:
            pulled = True
        streak_start, on_target_s = _update_on_target(
            elapsed, current, target_mbar, streak_start, on_target_s
        )
        reader_trip = _reader_waste_tripped(vacuum)
        stopped_early = enabled == 0 and elapsed < (duration_s - 1.5)
        print(
            f"t={elapsed:6.2f}s  C={current:8.1f}  E={enabled}"
            + ("  ERR401" if reader_trip else "")
        )
        if reader_trip or stopped_early:
            tripped = True
            trip_t_s = elapsed
            break
        if sample_period > 0:
            await asyncio.sleep(sample_period)
        else:
            break

    elapsed = time.monotonic() - t0
    return WasteHoldResult(tripped, trip_t_s, elapsed, pulled, True, on_target_s)


def _report_hold(
    report: CSVReport,
    section: str,
    tag: str,
    result: WasteHoldResult,
    passed: bool,
) -> None:
    """Store one hold result in the CSV."""
    trip_out = result.trip_t_s if result.trip_t_s is not None else -1.0
    report(
        section,
        tag,
        [CSVResult.from_bool(passed), round(trip_out, 2), round(result.elapsed_s, 2)],
    )


async def test_waste_empty(
    vacuum: VacuumModule, report: CSVReport, section: str
) -> None:
    """Empty bottle must not trip while the pump holds vacuum."""
    if not vacuum.is_simulated:
        ui.get_user_ready("Fit a filter plate with liquid, fit an EMPTY waste carboy")
    for target in TARGET_PRESSURES:
        ui.print_header(f"Waste empty (no trip) {target} mbar")
        result = await _run_waste_hold(vacuum, target, expect_trip=False)
        passed = _empty_passed(result, vacuum.is_simulated)
        trip_out = result.trip_t_s if result.trip_t_s is not None else -1.0
        print(
            f"empty {target} equalized={result.equalized} tripped={result.tripped} "
            f"trip_t={trip_out:.2f}s pulled={result.pulled} "
            f"elapsed={result.elapsed_s:.2f}s PASS={passed}"
        )
        _report_hold(report, section, _empty_tag(target), result, passed)
        await _recover_after_hold(vacuum)


async def test_waste_full(
    vacuum: VacuumModule, report: CSVReport, section: str
) -> None:
    """Full bottle must trip with ERR401 within the time cap."""
    if not vacuum.is_simulated:
        ui.get_user_ready("Fit a FULL waste carboy")
    for target in TARGET_PRESSURES:
        ui.print_header(f"Waste full (expect trip) {target} mbar")
        result = await _run_waste_hold(vacuum, target, expect_trip=True)
        passed = _full_passed(result, vacuum.is_simulated)
        trip_out = result.trip_t_s if result.trip_t_s is not None else -1.0
        print(
            f"full {target} equalized={result.equalized} tripped={result.tripped} "
            f"trip_t={trip_out:.2f}s elapsed={result.elapsed_s:.2f}s PASS={passed}"
        )
        _report_hold(report, section, _full_tag(target), result, passed)
        await _recover_after_hold(vacuum)


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Waste detection")
    try:
        await test_waste_config_roundtrip(vacuum, report, section)
        await test_waste_empty(vacuum, report, section)
        await test_waste_full(vacuum, report, section)
    finally:
        await _ignore_waste_error(
            vacuum._driver.set_waste_configs(enable_waste_full_detection=False)
        )
        await _recover_after_hold(vacuum)
