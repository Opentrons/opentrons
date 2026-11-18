"""Test waste-full detection."""

import math
import asyncio
import time
from typing import Any, Awaitable, List, NamedTuple, Optional, Tuple

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
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
# waste_detector.hpp counts sealed time only while commanded RPM is at least this.
BRAKE_RPM = 1.0
# Columns on each trip line, one per sample period. Early trips pad with None.
WASTE_SAMPLE_COUNT = int(HOLD_DURATION_S / SAMPLE_PERIOD_S)


class WasteSample(NamedTuple):
    """One waste-hold poll."""

    t_s: float
    gauge: float
    abs_a: float
    abs_b: float
    target_rpm: Optional[float]
    current_rpm: Optional[float]


class WasteDiag(NamedTuple):
    """Readings that separate a braked deadhead from a leak."""

    on_target_s: float
    brake_s: float
    mean_abs_ab: Optional[float]
    brake_slope_mbar_s: Optional[float]


class WasteHoldResult(NamedTuple):
    """Outcome of one waste hold."""

    tripped: bool
    trip_t_s: Optional[float]
    elapsed_s: float
    pulled: bool
    equalized: bool
    on_target_s: float
    samples: List[WasteSample]
    diag: WasteDiag
    atm: Optional[float]


def _empty_tag(target: int) -> str:
    """CSV tag for an empty-bottle hold."""
    return f"waste-empty-no-trip-{target}"


def _full_tag(target: int) -> str:
    """CSV tag for a full-bottle hold."""
    return f"waste-full-trip-{target}"


def _empty_diag() -> WasteDiag:
    """Summary used when a hold records no samples."""
    return WasteDiag(0.0, 0.0, None, None)


def _gauge_slope(times: List[float], gauges: List[float]) -> Optional[float]:
    """Return d(gauge)/dt. Positive means the chamber is losing vacuum."""
    count = len(times)
    if count < 2:
        return None
    mean_t = sum(times) / count
    mean_g = sum(gauges) / count
    var_t = sum((t - mean_t) ** 2 for t in times)
    if var_t <= 0.0:
        return None
    cov = sum((t - mean_t) * (g - mean_g) for t, g in zip(times, gauges))
    return cov / var_t


def _diag_from_samples(samples: List[WasteSample], target: float) -> WasteDiag:
    """Summarize a hold from its samples.

    on_target_s is time inside the detector's ±20 mbar band. brake_s is the
    part of that time with commanded RPM under BRAKE_RPM. mean_abs_ab is
    |A−B| inside the band. brake_slope_mbar_s is the gauge slope for every
    sample whose commanded RPM is under BRAKE_RPM.
    """
    if not samples:
        return _empty_diag()
    on_target_s = 0.0
    brake_s = 0.0
    abs_ab: List[float] = []
    brake_t: List[float] = []
    brake_g: List[float] = []
    for index, sample in enumerate(samples):
        if index + 1 < len(samples):
            dt = max(0.0, samples[index + 1].t_s - sample.t_s)
        else:
            dt = SAMPLE_PERIOD_S
        in_band = abs(sample.gauge - target) < WET_NEAR_TARGET_MBAR
        braked = (
            sample.target_rpm is not None
            and math.isfinite(sample.target_rpm)
            and sample.target_rpm < BRAKE_RPM
        )
        if in_band:
            on_target_s += dt
            if math.isfinite(sample.abs_a) and math.isfinite(sample.abs_b):
                abs_ab.append(abs(sample.abs_a - sample.abs_b))
            if braked:
                brake_s += dt
        if braked:
            brake_t.append(sample.t_s)
            brake_g.append(sample.gauge)
    mean_abs_ab = sum(abs_ab) / len(abs_ab) if abs_ab else None
    return WasteDiag(
        on_target_s, brake_s, mean_abs_ab, _gauge_slope(brake_t, brake_g)
    )


def _sample_columns() -> List[Any]:
    """One column per sample, repeated for each recorded series."""
    return [float] * WASTE_SAMPLE_COUNT


def build_csv_lines() -> List[CSVLine]:
    """Build CSV lines."""
    # Gauge is absolute B minus the one atmospheric reading.
    # Then each series is WASTE_SAMPLE_COUNT columns:
    # absolute B, commanded RPM, measured RPM.
    hold_fields: List[Any] = [
        CSVResult,
        float,  # trip_t_s; -1 if no trip
        float,  # elapsed_s
        float,  # on_target_s
        float,  # brake_s, commanded RPM under 1 while in band
        float,  # gauge slope while commanded RPM is braked
        float,  # atmospheric, sampled once
        *_sample_columns(),
        *_sample_columns(),
        *_sample_columns(),
    ]
    lines: List[CSVLine] = [
        CSVLine(
            "waste-config-tunings",
            [
                CSVResult,
                float,  # g_sealed_max
                float,  # stable_hold_ms
                float,  # stable_hold_deep_ms
                float,  # min_waste_depth_mbar
            ],
        ),
    ]
    for tag_for in (_empty_tag, _full_tag):
        for target in TARGET_PRESSURES:
            lines.append(CSVLine(tag_for(target), list(hold_fields)))
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
    """Enable and disable waste detection, then record the restored tunings."""
    ui.print_header("Waste config")
    original = await vacuum._driver.get_waste_configs()
    passed = False
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
    restored = await vacuum._driver.get_waste_configs()
    assert restored == original
    print(
        f"waste tunings G={restored.g_sealed_max} T={restored.stable_hold_ms} "
        f"U={restored.stable_hold_deep_ms} N={restored.min_waste_depth_mbar} "
        f"PASS={passed}"
    )
    report(
        section,
        "waste-config-tunings",
        [
            CSVResult.from_bool(passed),
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
        return WasteHoldResult(
            False, None, 0.0, False, False, 0.0, [], _empty_diag(), None
        )

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
            return WasteHoldResult(
                True,
                0.0,
                time.monotonic() - t0,
                False,
                True,
                0.0,
                [],
                _empty_diag(),
                None,
            )
        raise
    if vacuum.is_simulated and expect_trip:
        vacuum.inject_async_gcode_response("ERR401")

    tripped = False
    trip_t_s: Optional[float] = None
    pulled = False
    elapsed = 0.0
    on_target_s = 0.0
    streak_start: Optional[float] = None
    samples: List[WasteSample] = []
    atm = None
    while elapsed < duration_s:
        elapsed = time.monotonic() - t0
        try:
            # Re-enable is outside the poller, so a latched ERR401 often
            # arrives as this command's response rather than the state read.
            await vacuum._driver.set_waste_configs(enable_waste_full_detection=True)
            await vacuum._reader.update_vacuum_state()
            state = vacuum.vacuum_state
            current = state.current_gauge_pressure
            enabled = int(state.vacuum_enabled)
            if atm is None:
                atm = state.pressure_atm
            target_rpm = None
            current_rpm = None
            try:
                await vacuum._reader.update_pump_state()
            except Exception as exc:
                if not _is_waste_full_error(exc):
                    raise
                samples.append(
                    WasteSample(
                        elapsed,
                        current,
                        state.pressure_abs_a,
                        state.pressure_abs_b,
                        target_rpm,
                        current_rpm,
                    )
                )
                tripped = True
                trip_t_s = elapsed
                print(f"t={elapsed:6.2f}s ERR401")
                break
            pump = vacuum.pump_state
            target_rpm = pump.target_rpm
            current_rpm = pump.current_rpm
        except Exception as exc:
            if not _is_waste_full_error(exc):
                raise
            tripped = True
            trip_t_s = elapsed
            print(f"t={elapsed:6.2f}s ERR401")
            break

        samples.append(
            WasteSample(
                elapsed,
                current,
                state.pressure_abs_a,
                state.pressure_abs_b,
                target_rpm,
                current_rpm,
            )
        )
        if current <= EMPTY_MAX_PRESSURE_MBAR:
            pulled = True
        streak_start, on_target_s = _update_on_target(
            elapsed, current, target_mbar, streak_start, on_target_s
        )
        reader_trip = _reader_waste_tripped(vacuum)
        stopped_early = enabled == 0 and elapsed < (duration_s - 1.5)
        print(
            f"t={elapsed:6.2f}s  C={current:8.1f}  E={enabled}  "
            f"RPM={target_rpm:6.0f}/{current_rpm:6.0f}  "
            f"|A-B|={abs(state.pressure_abs_a - state.pressure_abs_b):5.1f}"
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
    return WasteHoldResult(
        tripped,
        trip_t_s,
        elapsed,
        pulled,
        True,
        on_target_s,
        samples,
        _diag_from_samples(samples, float(target_mbar)),
        atm,
    )


def _fmt(value: Optional[float]) -> str:
    """Format a summary number. Missing values print as None."""
    if value is None or not math.isfinite(value):
        return "None"
    return f"{value:.2f}"


def _csv_float(value: Optional[float]) -> Optional[float]:
    """Round a finite reading. Missing readings stay None, as in the other QC lines."""
    if value is None or not math.isfinite(value):
        return None
    return round(value, 3)


def _padded_series(values: List[Optional[float]]) -> List[Optional[float]]:
    """Fit one sample series into the fixed trip-line columns."""
    padded = [_csv_float(value) for value in values[:WASTE_SAMPLE_COUNT]]
    padded.extend([None] * (WASTE_SAMPLE_COUNT - len(padded)))
    return padded


def _report_hold(
    report: CSVReport,
    section: str,
    tag: str,
    result: WasteHoldResult,
    passed: bool,
) -> None:
    """Store one hold on its trip line, summary first, then each sample series."""
    trip_out = result.trip_t_s if result.trip_t_s is not None else -1.0
    diag = result.diag
    report(
        section,
        tag,
        [
            CSVResult.from_bool(passed),
            round(trip_out, 2),
            round(result.elapsed_s, 2),
            _csv_float(diag.on_target_s),
            _csv_float(diag.brake_s),
            _csv_float(diag.brake_slope_mbar_s),
            _csv_float(result.atm),
            *_padded_series([sample.abs_b for sample in result.samples]),
            *_padded_series([sample.target_rpm for sample in result.samples]),
            *_padded_series([sample.current_rpm for sample in result.samples]),
        ],
    )
    print(
        f"diag on_target={diag.on_target_s:.1f}s brake={diag.brake_s:.1f}s "
        f"|A-B|={_fmt(diag.mean_abs_ab)} slope={_fmt(diag.brake_slope_mbar_s)} mbar/s"
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
