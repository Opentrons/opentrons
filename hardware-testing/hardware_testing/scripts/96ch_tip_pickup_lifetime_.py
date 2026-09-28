"""Run a 96-channel tip pickup lifetime test through the hardware API.

This is an on-robot hardware script, not a Protocol API protocol.  It reuses
the tips in the A1 position of a 96-tip rack on the Flex 96-channel tip rack
adapter in slot D2.  Each cycle is one complete pickup and return operation.

Examples (run from the ``hardware-testing`` environment)::

    python -m hardware_testing.scripts.96ch_tip_pickup_lifetime \
        --pipette 1000 --cycles 15000
    python -m hardware_testing.scripts.96ch_tip_pickup_lifetime \
        --pipette 200 --cycles 100 --simulate

The CSV and text log are written below ``hardware_testing.data``'s testing
data directory.  Use ``--calibrate`` once if the nominal D2 position needs a
manual adjustment, then pass the generated file with ``--calibration-file``.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import io
import json
import logging
import math
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from time import gmtime, perf_counter
from typing import Any, Awaitable, Callable, Dict, Iterable, Optional, Tuple

from hardware_testing import data
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point
from opentrons.hardware_control.types import TipStateType
from opentrons_shared_data.errors.exceptions import MoveConditionNotMetError


TEST_NAME = "96ch-tip-pickup-lifetime"
MOUNT = OT3Mount.LEFT
TIP_RACK_SLOT = 2  # Flex deck slot D2.
TIP_RACK_ADAPTER_HEIGHT_MM = 11.0
APPROACH_HEIGHT_MM = 10.0
SAFE_TRAVEL_HEIGHT_MM = 30.0
# The high-throughput tip-presence check homes the tip motor after pickup.
# Keep the nozzle/ejector clear of the adapter posts before that reset.
PICKUP_RETRACT_MM = 25.0
MOVE_ERROR_RECOVERY_ATTEMPTS = 3

# These are the 96-channel pipette definitions used by the existing hardware
# testing scripts on this branch.  The installed instrument is still checked
# at runtime so a wrong pipette cannot start a mechanical test.
PIPETTE_MODELS = {
    200: "p200_96_v3.0",
    1000: "p1000_96_v3.4",
}

# Full tip lengths are used for the return-height calculation.  The hardware
# pickup API expects the effective length (tip length minus nozzle overlap),
# which is provided by helpers_ot3.get_default_tip_length().
TIP_LENGTHS_MM = {200: 58.35, 1000: 95.6}
DEFAULT_RETURN_TIP_HEIGHT = 0.83


def _positive_int(value: str) -> int:
    """Parse a strictly positive integer command-line argument."""
    try:
        parsed = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("must be an integer") from error
    if parsed < 1:
        raise argparse.ArgumentTypeError("must be greater than zero")
    return parsed


def _safe_tag(value: str) -> str:
    """Make a command-line tag safe to use in a file name."""
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip())
    return cleaned.strip("-_.")


def build_parser() -> argparse.ArgumentParser:
    """Build the command-line parser."""
    parser = argparse.ArgumentParser(
        description="96-channel tip pickup/return lifetime test (hardware API)"
    )
    parser.add_argument(
        "--cycles",
        type=_positive_int,
        default=15000,
        help="number of pickup and return cycles (default: 15000)",
    )
    parser.add_argument(
        "--pipette",
        type=int,
        choices=sorted(PIPETTE_MODELS),
        default=1000,
        help="96-channel pipette volume in uL (default: 1000)",
    )
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="run against the OT-3 hardware simulator",
    )
    parser.add_argument(
        "--tag",
        default="",
        help="optional tag included in the CSV and log file names",
    )
    parser.add_argument(
        "--no-tip-presence-check",
        action="store_true",
        help="skip the pickup/return tip sensor checks",
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="skip tip sensor checks for maximum aging-test throughput",
    )
    parser.add_argument(
        "--calibrate",
        action="store_true",
        help="jog to the D2 A1 pickup position and save it before testing",
    )
    parser.add_argument(
        "--calibration-file",
        type=Path,
        help="load/save a D2 pickup position JSON file",
    )
    return parser


@dataclass(frozen=True)
class AgingConfig:
    """Validated settings for one test run."""

    cycles: int
    pipette_volume: int
    simulate: bool
    tag: str
    check_tip_presence: bool
    calibrate: bool
    calibration_file: Optional[Path]


@dataclass(frozen=True)
class RunArtifacts:
    """Paths and identifiers for the durable run output."""

    run_id: str
    csv_name: str
    log_name: str
    csv_path: Path
    log_path: Path


def _csv_line(values: Iterable[Any]) -> str:
    """Serialize one CSV row with proper quoting."""
    output = io.StringIO()
    csv.writer(output, lineterminator="\n").writerow(list(values))
    return output.getvalue()


def _create_run_artifacts(config: AgingConfig) -> RunArtifacts:
    """Create the CSV and log files before connecting to hardware."""
    run_id = data.create_run_id()
    tag = _safe_tag(config.tag) or f"p{config.pipette_volume}_96"
    csv_name = data.create_file_name(TEST_NAME, run_id, tag)
    log_name = data.create_file_name(TEST_NAME, run_id, tag, extension="log")
    header = [
        "timestamp_utc",
        "elapsed_seconds",
        "cycle",
        "requested_cycles",
        "pipette_volume_ul",
        "pipette_model",
        "pipette_serial",
        "rack_slot",
        "tip_position",
        "pickup_presence",
        "return_presence",
        "result",
        "error",
    ]
    csv_path = data.dump_data_to_file(
        test_name=TEST_NAME,
        run_id=run_id,
        file_name=csv_name,
        data=_csv_line(header),
    )
    log_path = data.dump_data_to_file(
        test_name=TEST_NAME,
        run_id=run_id,
        file_name=log_name,
        data="",
    )
    return RunArtifacts(run_id, csv_name, log_name, csv_path, log_path)


def _configure_logger(
    artifacts: RunArtifacts,
) -> Tuple[logging.Logger, Tuple[logging.Handler, ...]]:
    """Create a logger that writes both the terminal and the run log."""
    logger = logging.getLogger(f"{TEST_NAME}.{artifacts.run_id}")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    for handler in list(logger.handlers):
        logger.removeHandler(handler)
        handler.close()

    formatter = logging.Formatter(
        fmt="%(asctime)sZ %(levelname)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    formatter.converter = gmtime
    file_handler = logging.FileHandler(artifacts.log_path, encoding="utf-8")
    stream_handler = logging.StreamHandler(sys.stdout)
    file_handler.setFormatter(formatter)
    stream_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)
    return logger, (file_handler, stream_handler)


def _close_logger(
    logger: logging.Logger, handlers: Tuple[logging.Handler, ...]
) -> None:
    """Flush and close all handlers created for a run."""
    for handler in handlers:
        handler.flush()
        logger.removeHandler(handler)
        handler.close()


def _append_csv_row(artifacts: RunArtifacts, values: Iterable[Any]) -> None:
    """Append and flush one durable test result row."""
    data.append_data_to_file(
        test_name=TEST_NAME,
        run_id=artifacts.run_id,
        file_name=artifacts.csv_name,
        data=_csv_line(values),
    )


def _get_channels(pipette: Any, attached: Dict[str, Any]) -> Optional[int]:
    """Read a channel count from a hardware pipette or its compatibility dict."""
    channels = getattr(pipette, "channels", None)
    if channels is None:
        channels = attached.get("channels")
    if channels is None:
        return None
    return int(getattr(channels, "value", channels))


def _validate_attached_pipette(
    api: Any, requested_volume: int, mount: OT3Mount = MOUNT
) -> Tuple[Dict[str, Any], str, str]:
    """Ensure the requested 96-channel pipette is actually attached."""
    attached = api.get_attached_instrument(mount)
    if not attached:
        raise RuntimeError(f"No pipette recognized on {mount.name} mount")

    pipette = api.hardware_pipettes[mount.to_mount()]
    channels = _get_channels(pipette, attached)
    if channels != 96:
        raise RuntimeError(
            f"Expected a 96-channel pipette, but attached instrument has "
            f"{channels!r} channels"
        )

    model = str(attached.get("model") or attached.get("name") or "")
    expected_prefix = f"p{requested_volume}_96"
    if not model.lower().startswith(expected_prefix):
        raise RuntimeError(
            f"Requested T{requested_volume}, but attached model is {model!r}"
        )

    serial = str(attached.get("pipette_id") or "unknown")
    return attached, model, serial


def _nominal_tiprack_position(pipette_volume: int) -> Point:
    """Return the D2 A1 position, including the 96-channel rack adapter."""
    rack_name = f"opentrons_flex_96_tiprack_{pipette_volume}ul"
    return helpers_ot3.get_theoretical_a1_position(TIP_RACK_SLOT, rack_name) + Point(
        z=TIP_RACK_ADAPTER_HEIGHT_MM
    )


async def _move_to_position(api: Any, position: Point, mount: OT3Mount = MOUNT) -> None:
    """Move to a position through a safe arch."""
    current = await api.gantry_position(mount)
    safe_height = max(current.z, position.z) + SAFE_TRAVEL_HEIGHT_MM
    await helpers_ot3.move_to_arched_ot3(api, mount, position, safe_height=safe_height)


def _position_as_dict(position: Point) -> Dict[str, float]:
    """Convert a deck point to JSON-compatible values."""
    return {"x": float(position.x), "y": float(position.y), "z": float(position.z)}


def _position_from_dict(raw: Any) -> Point:
    """Validate and convert a JSON calibration point."""
    if not isinstance(raw, dict):
        raise ValueError("calibration position must be an object")
    values = []
    for axis in ("x", "y", "z"):
        value = raw.get(axis)
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError(f"calibration position has invalid {axis!r}")
        values.append(float(value))
    return Point(x=values[0], y=values[1], z=values[2])


async def _calibrate_position(
    api: Any,
    nominal: Point,
    calibration_file: Path,
    logger: logging.Logger,
) -> Point:
    """Let the operator jog to the D2 A1 point and save the result."""
    await _move_to_position(api, nominal + Point(z=APPROACH_HEIGHT_MM))
    logger.info(
        "Starting manual D2 calibration. Jog the 96-channel nozzle to the A1 "
        "pickup position and finish the jog operation."
    )
    await helpers_ot3.jog_mount_ot3(api, MOUNT)
    actual = await api.gantry_position(MOUNT)
    calibration_file.parent.mkdir(parents=True, exist_ok=True)
    calibration_file.write_text(
        json.dumps(
            {
                "slot": "D2",
                "tip_rack_adapter": "opentrons_flex_96_tiprack_adapter",
                "position": _position_as_dict(actual),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    logger.info("Saved D2 calibration to %s", calibration_file)
    return actual


def _load_calibrated_position(calibration_file: Path) -> Point:
    """Load and validate a previously saved D2 calibration file."""
    with calibration_file.open(encoding="utf-8") as source:
        payload = json.load(source)
    if payload.get("slot") != "D2":
        raise ValueError(f"calibration file {calibration_file} is not for D2")
    return _position_from_dict(payload.get("position"))


async def _read_tip_presence(api: Any) -> str:
    """Read a hardware tip state as a stable CSV value."""
    state = await api.get_tip_presence_status(MOUNT)
    if state == TipStateType.PRESENT or getattr(state, "name", None) == "PRESENT":
        return "PRESENT"
    if state == TipStateType.ABSENT or getattr(state, "name", None) == "ABSENT":
        return "ABSENT"
    return str(state)


async def _pick_up_tip(api: Any, pickup_position: Point, tip_length: float) -> None:
    """Pick up all 96 tips at the current D2 A1 position."""
    await _move_to_position(api, pickup_position)
    # The next operation is either tip-presence sensing or tip return. Both
    # paths position the plunger as needed, so this extra preparation move is
    # redundant for a dry pickup/return aging cycle.
    await api.pick_up_tip_96_fixture(MOUNT, tip_length=tip_length, prep_after=False)
    # The 96-channel action does not apply the normal ending Z retract.  Lift
    # well clear of the adapter before tip-presence sensing homes the ejector.
    await api.move_rel(MOUNT, Point(z=PICKUP_RETRACT_MM))


async def _return_tip(
    api: Any,
    rack_position: Point,
    attached: Dict[str, Any],
    pipette_volume: int,
) -> None:
    """Return the attached tips to the same A1 position in the rack."""
    return_height = attached.get("return_tip_height", DEFAULT_RETURN_TIP_HEIGHT)
    try:
        return_height = float(return_height)
    except (TypeError, ValueError) as error:
        raise RuntimeError(f"invalid return_tip_height: {return_height!r}") from error
    if not math.isfinite(return_height) or return_height <= 0:
        raise RuntimeError(f"invalid return_tip_height: {return_height!r}")

    # Protocol API return_tip() uses well.top(z=-return_height * tip_length).
    # Reproduce that geometry here while staying entirely in the hardware API.
    return_position = rack_position + Point(
        z=-return_height * TIP_LENGTHS_MM[pipette_volume]
    )
    await _move_to_position(api, return_position)
    await api.drop_tip(MOUNT)


async def _retry_move_condition_action(
    label: str,
    action: Callable[[], Awaitable[Any]],
    logger: logging.Logger,
) -> Any:
    """Retry one recovery action when a conditional move misses its endpoint."""
    last_error: Optional[MoveConditionNotMetError] = None
    for attempt in range(1, MOVE_ERROR_RECOVERY_ATTEMPTS + 1):
        try:
            return await action()
        except MoveConditionNotMetError as error:
            last_error = error
            logger.warning(
                "Recovery %s attempt %d/%d failed: %s",
                label,
                attempt,
                MOVE_ERROR_RECOVERY_ATTEMPTS,
                error,
            )
    assert last_error is not None
    raise last_error


def _software_has_tip(api: Any) -> bool:
    """Return the hardware API's current software tip state."""
    pipette = api.hardware_pipettes[MOUNT.to_mount()]
    return bool(pipette and pipette.has_tip)


async def _recover_move_condition_error(
    api: Any,
    rack_position: Point,
    attached: Dict[str, Any],
    pipette_volume: int,
    tip_length: float,
    logger: logging.Logger,
) -> str:
    """Move clear of the rack, restore motor state, and leave no tips attached."""

    async def _home_recovery_axes() -> None:
        # Always lift Z before moving the 96-channel tip motor. This keeps its
        # ejector clear of the tip-rack adapter if the failed move occurred at D2.
        await _retry_move_condition_action(
            "left Z home", lambda: api.home_z(MOUNT), logger
        )
        await _retry_move_condition_action(
            "tip motor home", api.home_gear_motors, logger
        )
        await _retry_move_condition_action(
            "plunger home", lambda: api.home_plunger(MOUNT), logger
        )

    logger.warning(
        "Starting MOVE_CONDITION_NOT_MET recovery; lifting Z before resetting "
        "pipette motors"
    )
    await _home_recovery_axes()

    for attempt in range(1, MOVE_ERROR_RECOVERY_ATTEMPTS + 1):
        presence = await _retry_move_condition_action(
            "tip-presence check", lambda: _read_tip_presence(api), logger
        )
        logger.info(
            "Recovery tip state attempt %d/%d: %s",
            attempt,
            MOVE_ERROR_RECOVERY_ATTEMPTS,
            presence,
        )
        if presence == "ABSENT":
            # A drop-tip move may physically eject the tips before its final Q
            # home fails, leaving the software state one step behind.
            if _software_has_tip(api):
                api.remove_tip(MOUNT)
            logger.info("MOVE_CONDITION_NOT_MET recovery completed: no tips attached")
            return presence
        if presence != "PRESENT":
            raise RuntimeError(
                f"cannot safely continue: recovery tip state is {presence}"
            )

        # Synchronize the critical point before moving physically attached tips.
        if not _software_has_tip(api):
            api.add_tip(MOUNT, tip_length)
        logger.warning("Recovery found tips attached; returning them to D2 A1")
        try:
            await _return_tip(api, rack_position, attached, pipette_volume)
        except MoveConditionNotMetError as error:
            logger.warning("Recovery return-tip move failed: %s", error)
            await _home_recovery_axes()
            continue

        # The return ends down at the rack. Lift before the Q-axis sensor action.
        await _retry_move_condition_action(
            "left Z home after tip return", lambda: api.home_z(MOUNT), logger
        )

    raise RuntimeError(
        "cannot safely continue: tips remain attached after recovery attempts"
    )


def _cycle_row(
    *,
    started_at: float,
    cycle: int,
    config: AgingConfig,
    model: str,
    serial: str,
    pickup_presence: str,
    return_presence: str,
    result: str,
    error: str,
) -> list[Any]:
    """Build one CSV result row."""
    return [
        datetime.now(timezone.utc).isoformat(),
        round(perf_counter() - started_at, 3),
        cycle,
        config.cycles,
        config.pipette_volume,
        model,
        serial,
        "D2",
        "A1",
        pickup_presence,
        return_presence,
        result,
        error,
    ]


async def _run_cycles(
    api: Any,
    config: AgingConfig,
    artifacts: RunArtifacts,
    logger: logging.Logger,
    attached: Dict[str, Any],
    model: str,
    serial: str,
    rack_position: Point,
) -> int:
    """Execute and persist all requested pickup/return cycles."""
    started_at = perf_counter()
    tip_length = helpers_ot3.get_default_tip_length(config.pipette_volume)
    recovered_move_errors = 0
    for cycle in range(1, config.cycles + 1):
        pickup_presence = "SKIPPED" if not config.check_tip_presence else "NOT_RUN"
        return_presence = "SKIPPED" if not config.check_tip_presence else "NOT_RUN"
        result = "FAIL"
        error = ""
        stage = "initial tip check"
        logger.info("Cycle %d/%d: picking up 96 tips", cycle, config.cycles)
        try:
            if config.check_tip_presence:
                initial_presence = await _read_tip_presence(api)
                if initial_presence != "ABSENT":
                    raise RuntimeError(
                        f"pipette must start without tips, sensor reports {initial_presence}"
                    )

            stage = "pickup/retract"
            await _pick_up_tip(api, rack_position, tip_length)
            if config.check_tip_presence:
                stage = "pickup tip check"
                pickup_presence = await _read_tip_presence(api)
                if pickup_presence != "PRESENT":
                    raise RuntimeError(
                        f"pickup tip sensor check failed: {pickup_presence}"
                    )

            stage = "return/drop"
            await _return_tip(api, rack_position, attached, config.pipette_volume)
            if config.check_tip_presence:
                stage = "return tip check"
                return_presence = await _read_tip_presence(api)
                if return_presence != "ABSENT":
                    raise RuntimeError(
                        f"return tip sensor check failed: {return_presence}"
                    )
            result = "PASS"
            logger.info("Cycle %d/%d: PASS", cycle, config.cycles)
        except asyncio.CancelledError:
            result = "ABORTED"
            error = f"Cancelled during {stage}; inspect the pipette and rack"
            logger.warning("Cycle %d/%d: %s", cycle, config.cycles, error)
            raise
        except MoveConditionNotMetError as error_value:
            error = f"{stage}: {type(error_value).__name__}: {error_value}"
            logger.exception(
                "Cycle %d/%d: MOVE_CONDITION_NOT_MET during %s; recovering",
                cycle,
                config.cycles,
                stage,
            )
            try:
                return_presence = await _recover_move_condition_error(
                    api,
                    rack_position,
                    attached,
                    config.pipette_volume,
                    tip_length,
                    logger,
                )
            except Exception as recovery_error:
                error += (
                    "; recovery failed: "
                    f"{type(recovery_error).__name__}: {recovery_error}"
                )
                logger.exception(
                    "Cycle %d/%d: recovery failed; stopping to avoid unsafe motion",
                    cycle,
                    config.cycles,
                )
                raise
            else:
                result = "FAIL_RECOVERED"
                recovered_move_errors += 1
                logger.warning(
                    "Cycle %d/%d: recovered; continuing with the next cycle",
                    cycle,
                    config.cycles,
                )
        except Exception as error_value:
            error = f"{stage}: {type(error_value).__name__}: {error_value}"
            logger.exception("Cycle %d/%d: FAIL", cycle, config.cycles)
            logger.warning(
                "Stopped during %s; inspect the pipette and rack before recovery",
                stage,
            )
            raise
        finally:
            _append_csv_row(
                artifacts,
                _cycle_row(
                    started_at=started_at,
                    cycle=cycle,
                    config=config,
                    model=model,
                    serial=serial,
                    pickup_presence=pickup_presence,
                    return_presence=return_presence,
                    result=result,
                    error=error,
                ),
            )
    return recovered_move_errors


async def _main(config: AgingConfig) -> RunArtifacts:
    """Connect to hardware, run the lifetime test, and always home on exit."""
    artifacts = _create_run_artifacts(config)
    logger, handlers = _configure_logger(artifacts)
    api: Any = None
    try:
        model_name = PIPETTE_MODELS[config.pipette_volume]
        logger.info("Run ID: %s", artifacts.run_id)
        logger.info(
            "Configuration: cycles=%d, pipette=T%d 96ch, rack=D2, tip_position=A1, "
            "adapter=opentrons_flex_96_tiprack_adapter, simulate=%s, "
            "tip_presence_check=%s",
            config.cycles,
            config.pipette_volume,
            config.simulate,
            config.check_tip_presence,
        )
        api = await helpers_ot3.build_async_ot3_hardware_api(
            is_simulating=config.simulate,
            pipette_left=model_name,
        )
        attached, model, serial = _validate_attached_pipette(api, config.pipette_volume)
        logger.info("Attached pipette: model=%s serial=%s", model, serial)

        await api.home()
        await api.home_plunger(MOUNT)
        rack_position = _nominal_tiprack_position(config.pipette_volume)
        if config.calibrate:
            if config.calibration_file is None:
                raise ValueError("--calibrate requires --calibration-file")
            rack_position = await _calibrate_position(
                api, rack_position, config.calibration_file, logger
            )
        elif config.calibration_file is not None:
            rack_position = _load_calibrated_position(config.calibration_file)
            logger.info("Loaded D2 calibration from %s", config.calibration_file)

        logger.info(
            "D2 A1 pickup reference: x=%.3f y=%.3f z=%.3f",
            rack_position.x,
            rack_position.y,
            rack_position.z,
        )
        _append_csv_row(
            artifacts,
            [
                datetime.now(timezone.utc).isoformat(),
                0,
                "METADATA",
                config.cycles,
                config.pipette_volume,
                model,
                serial,
                "D2",
                "A1",
                "",
                "",
                "START",
                "",
            ],
        )
        recovered_move_errors = await _run_cycles(
            api,
            config,
            artifacts,
            logger,
            attached,
            model,
            serial,
            rack_position,
        )
        if recovered_move_errors:
            logger.warning(
                "Completed %d attempted cycles with %d recovered "
                "MOVE_CONDITION_NOT_MET error(s)",
                config.cycles,
                recovered_move_errors,
            )
            summary_result = "COMPLETED_WITH_RECOVERED_ERRORS"
            summary_error = f"recovered_move_condition_errors={recovered_move_errors}"
        else:
            logger.info("Completed %d pickup/return cycles", config.cycles)
            summary_result = "PASS"
            summary_error = ""
        _append_csv_row(
            artifacts,
            [
                datetime.now(timezone.utc).isoformat(),
                "",
                "SUMMARY",
                config.cycles,
                config.pipette_volume,
                model,
                serial,
                "D2",
                "A1",
                "",
                "",
                summary_result,
                summary_error,
            ],
        )
        return artifacts
    except asyncio.CancelledError:
        logger.warning("Test cancelled")
        raise
    except Exception:
        logger.exception("96-channel tip pickup lifetime test failed")
        raise
    finally:
        if api is not None:
            try:
                await api.home()
                logger.info("Robot homed")
            except Exception:
                logger.exception("Unable to home robot during cleanup")
        _close_logger(logger, handlers)


def _config_from_args(args: argparse.Namespace) -> AgingConfig:
    """Build the runtime configuration from parsed arguments."""
    if args.calibrate and args.calibration_file is None:
        raise ValueError("--calibrate requires --calibration-file")
    return AgingConfig(
        cycles=args.cycles,
        pipette_volume=args.pipette,
        simulate=args.simulate,
        tag=args.tag,
        check_tip_presence=not (args.no_tip_presence_check or args.fast),
        calibrate=args.calibrate,
        calibration_file=args.calibration_file,
    )


def main(argv: Optional[list[str]] = None) -> int:
    """CLI entry point."""
    args = build_parser().parse_args(argv)
    try:
        config = _config_from_args(args)
        artifacts = asyncio.run(_main(config))
    except KeyboardInterrupt:
        print("Test cancelled by operator", file=sys.stderr)
        return 130
    except Exception as error:
        print(f"Test failed: {error}", file=sys.stderr)
        return 1
    print(f"CSV: {artifacts.csv_path}")
    print(f"Log: {artifacts.log_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
