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
data directory.  Saved D2 coordinates are loaded automatically; without saved
coordinates the nominal position is used.  Use ``--calibrate-only`` to jog and
save the position, or ``--calibrate`` to calibrate and then run the test.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import io
import json
import logging
import math
import os
import re
import sys
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from time import gmtime, perf_counter
from typing import Any, Dict, Iterable, Optional, Tuple

from hardware_testing import data
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point
from opentrons.hardware_control.types import TipStateType
from opentrons.protocol_engine.resources.pipette_data_provider import (
    get_latest_tip_overlap_before_version,
    validate_and_default_tip_overlap_version,
)
from opentrons_shared_data.labware import load_definition as load_labware


TEST_NAME = "96ch-tip-pickup-lifetime"
MOUNT = OT3Mount.LEFT
TIP_RACK_SLOT = 2  # Flex deck slot D2.
TIP_RACK_ADAPTER = "opentrons_flex_96_tiprack_adapter"
TIP_RACK_ADAPTER_HEIGHT_MM = 11.0
APPROACH_HEIGHT_MM = 10.0
SAFE_TRAVEL_HEIGHT_MM = 30.0
# Minimum total Z retract after pickup, including the API's built-in retract.
# Tip-presence sensing subsequently moves and homes the tip motor again.
PICKUP_RETRACT_MM = 25.0

# These are the 96-channel pipette definitions used by the existing hardware
# testing scripts on this branch.  The installed instrument is still checked
# at runtime so a wrong pipette cannot start a mechanical test.
PIPETTE_MODELS = {
    200: "p200_96_v3.0",
    1000: "p1000_96_v3.4",
}


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
        "--calibrate-only",
        action="store_true",
        help="jog and save the D2 pickup position, then exit without cycling",
    )
    parser.add_argument(
        "--calibration-file",
        type=Path,
        help="override the automatically loaded per-pipette D2 calibration JSON file",
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
    calibration_file: Path
    calibrate_only: bool = False


@dataclass(frozen=True)
class TipSettings:
    """Geometry and retract settings from the installed pipette and tip rack."""

    full_length: float
    effective_length: float
    return_height: float
    extra_retract: float


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
    """Move vertically at the rack, retaining an arch for XY travel."""
    current = await api.gantry_position(mount)
    if math.isclose(current.x, position.x, rel_tol=0, abs_tol=1e-6) and math.isclose(
        current.y, position.y, rel_tol=0, abs_tol=1e-6
    ):
        await api.move_to(mount, current._replace(z=position.z))
        return
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
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            raise ValueError(f"calibration position has invalid {axis!r}")
        values.append(float(value))
    return Point(x=values[0], y=values[1], z=values[2])


async def _calibrate_position(
    api: Any,
    nominal: Point,
    calibration_file: Path,
    logger: logging.Logger,
    pipette_volume: int,
) -> Point:
    """Let the operator jog to the D2 A1 point and save the result."""
    if api.is_simulator:
        raise ValueError("manual calibration is not available with --simulate")
    if await _read_tip_presence(api) != "ABSENT":
        raise RuntimeError("manual calibration requires a pipette without tips")
    await _move_to_position(api, nominal + Point(z=APPROACH_HEIGHT_MM))
    logger.info(
        "Starting manual D2 calibration. Jog the bare A1 nozzle to the top of "
        "the A1 tip and finish the jog operation. The pickup API applies the "
        "engagement movement; do not jog down into the tip."
    )
    await helpers_ot3.jog_mount_ot3(api, MOUNT)
    actual = await api.gantry_position(MOUNT)
    calibration_file.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "slot": "D2",
        "tip_rack_adapter": TIP_RACK_ADAPTER,
        "pipette_volume_ul": pipette_volume,
        "updated_at_utc": datetime.now(timezone.utc).isoformat(),
        "position": _position_as_dict(actual),
    }
    # Replace only after a complete write, preserving the old calibration if
    # the write is interrupted or fails.
    temporary_path: Optional[Path] = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=calibration_file.parent, delete=False
        ) as temporary:
            temporary_path = Path(temporary.name)
            json.dump(payload, temporary, indent=2, allow_nan=False)
            temporary.write("\n")
            temporary.flush()
            os.fsync(temporary.fileno())
        temporary_path.replace(calibration_file)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
    logger.info("Saved D2 calibration to %s", calibration_file)
    return actual


def _load_calibrated_position(
    calibration_file: Path, pipette_volume: int
) -> Optional[Point]:
    """Load saved coordinates, returning None when no coordinates were saved."""
    try:
        with calibration_file.open(encoding="utf-8") as source:
            payload = json.load(source)
    except FileNotFoundError:
        return None
    if not isinstance(payload, dict):
        raise ValueError("calibration file must contain an object")
    if payload.get("position") is None:
        return None
    if payload.get("slot") != "D2":
        raise ValueError(f"calibration file {calibration_file} is not for D2")
    if payload.get("tip_rack_adapter", TIP_RACK_ADAPTER) != TIP_RACK_ADAPTER:
        raise ValueError("calibration file is for a different tip rack adapter")
    if payload.get("pipette_volume_ul", pipette_volume) != pipette_volume:
        raise ValueError("calibration file is for a different pipette volume")
    return _position_from_dict(payload.get("position"))


def _resolve_rack_position(config: AgingConfig, logger: logging.Logger) -> Point:
    """Prefer the calibration file to the system's nominal rack position."""
    position = _load_calibrated_position(config.calibration_file, config.pipette_volume)
    if position is not None:
        logger.info("Loaded D2 calibration from %s", config.calibration_file)
        return position
    logger.info(
        "No saved coordinates in %s; using the nominal D2 position",
        config.calibration_file,
    )
    return _nominal_tiprack_position(config.pipette_volume)


async def _read_tip_presence(api: Any) -> str:
    """Read a hardware tip state as a stable CSV value."""
    state = await api.get_tip_presence_status(MOUNT)
    if state == TipStateType.PRESENT or getattr(state, "name", None) == "PRESENT":
        return "PRESENT"
    if state == TipStateType.ABSENT or getattr(state, "name", None) == "ABSENT":
        return "ABSENT"
    return str(state)


def _get_tip_settings(
    api: Any, attached: Dict[str, Any], pipette_volume: int
) -> TipSettings:
    """Use the same versioned tip overlap data as Protocol Engine."""
    rack_name = f"opentrons_flex_96_tiprack_{pipette_volume}ul"
    definition = load_labware(loadname=rack_name, version=1)
    full_length = float(definition["parameters"]["tipLength"])
    pipette = api.hardware_pipettes[MOUNT.to_mount()]
    overlaps = get_latest_tip_overlap_before_version(
        pipette.tip_overlap, validate_and_default_tip_overlap_version(None)
    )
    uri = f"opentrons/{rack_name}/1"
    overlap = float(overlaps[uri] if uri in overlaps else overlaps["default"])
    if not math.isfinite(overlap) or not 0 <= overlap < full_length:
        raise ValueError(f"invalid tip overlap: {overlap!r}")
    return_height = float(attached["return_tip_height"])
    if not math.isfinite(return_height) or not 0 < return_height <= 1:
        raise ValueError(f"invalid return_tip_height: {return_height!r}")
    builtin_retract = float(pipette.config.end_tip_action_retract_distance_mm)
    if not math.isfinite(builtin_retract) or builtin_retract < 0:
        raise ValueError(f"invalid pickup retract: {builtin_retract!r}")
    return TipSettings(
        full_length=full_length,
        effective_length=full_length - overlap,
        return_height=return_height,
        extra_retract=max(0.0, PICKUP_RETRACT_MM - builtin_retract),
    )


async def _pick_up_tip(api: Any, pickup_position: Point, settings: TipSettings) -> None:
    """Pick up all 96 tips at the current D2 A1 position."""
    await _move_to_position(api, pickup_position)
    # Dry cycling needs no preparation for aspiration. The pickup and drop
    # APIs still position the plunger as required for their mechanical actions.
    await api.pick_up_tip(MOUNT, tip_length=settings.effective_length, prep_after=False)
    # The standard API already retracts by the pipette's configured distance.
    # Top it up to the existing 25 mm total before checking tip presence.
    if settings.extra_retract:
        await api.move_rel(MOUNT, Point(z=settings.extra_retract))


async def _return_tip(
    api: Any,
    rack_position: Point,
    settings: TipSettings,
) -> None:
    """Return the attached tips to the same A1 position in the rack."""
    # Protocol API return_tip() uses well.top(z=-return_height * tip_length).
    # With tips attached the hardware API's critical point is the tip end.
    return_position = rack_position + Point(
        z=-settings.return_height * settings.full_length
    )
    await _move_to_position(api, return_position)
    await api.drop_tip(MOUNT)


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
) -> None:
    """Execute and persist all requested pickup/return cycles."""
    started_at = perf_counter()
    settings = _get_tip_settings(api, attached, config.pipette_volume)
    logger.info(
        "Tip geometry: full_length=%.3f effective_length=%.3f "
        "return_height=%.3f extra_retract=%.3f",
        settings.full_length,
        settings.effective_length,
        settings.return_height,
        settings.extra_retract,
    )
    for cycle in range(1, config.cycles + 1):
        pickup_presence = "SKIPPED" if not config.check_tip_presence else "NOT_RUN"
        return_presence = "SKIPPED" if not config.check_tip_presence else "NOT_RUN"
        result = "FAIL"
        error = ""
        stage = "initial tip check"
        logger.info("Cycle %d/%d: picking up 96 tips", cycle, config.cycles)
        try:
            # Every successful return verifies ABSENT, which also verifies the
            # starting state for the next cycle. Avoid repeating that Q action.
            if config.check_tip_presence and cycle == 1:
                initial_presence = await _read_tip_presence(api)
                if initial_presence != "ABSENT":
                    raise RuntimeError(
                        f"pipette must start without tips, sensor reports {initial_presence}"
                    )

            stage = "pickup/retract"
            await _pick_up_tip(api, rack_position, settings)
            if config.check_tip_presence:
                stage = "pickup tip check"
                pickup_presence = await _read_tip_presence(api)
                if pickup_presence != "PRESENT":
                    raise RuntimeError(
                        f"pickup tip sensor check failed: {pickup_presence}"
                    )

            stage = "return/drop"
            await _return_tip(api, rack_position, settings)
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
        except Exception as error_value:
            error = f"{stage}: {type(error_value).__name__}: {error_value}"
            logger.exception("Cycle %d/%d: FAIL", cycle, config.cycles)
            # A partial pickup or failed move can leave both the physical tip
            # state and position uncertain. Do not eject tips at that position.
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


async def _main(config: AgingConfig) -> RunArtifacts:
    """Run the test, home on success, and close the hardware connection."""
    artifacts = _create_run_artifacts(config)
    logger, handlers = _configure_logger(artifacts)
    api: Any = None
    try:
        rack_position = _resolve_rack_position(config, logger)
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
        if config.calibrate:
            rack_position = await _calibrate_position(
                api,
                rack_position,
                config.calibration_file,
                logger,
                config.pipette_volume,
            )

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
        if not config.calibrate_only:
            await _run_cycles(
                api,
                config,
                artifacts,
                logger,
                attached,
                model,
                serial,
                rack_position,
            )
            logger.info("Completed %d pickup/return cycles", config.cycles)
        # Home only after a completed operation. On failure the position and
        # tip state may be unknown, so leave mechanical recovery to the operator.
        await api.home()
        logger.info("Robot homed")
        await api.clean_up()
        api = None
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
                "CALIBRATED" if config.calibrate_only else "PASS",
                "",
            ],
        )
        return artifacts
    except asyncio.CancelledError:
        logger.warning(
            "Test cancelled; automatic homing skipped, inspect before recovery"
        )
        raise
    except Exception:
        logger.exception("96-channel tip pickup lifetime test failed")
        logger.warning("Automatic recovery skipped; inspect the pipette and rack")
        raise
    finally:
        if api is not None:
            try:
                await api.clean_up()
            except Exception:
                logger.exception("Unable to close hardware connection during cleanup")
        _close_logger(logger, handlers)


def _config_from_args(args: argparse.Namespace) -> AgingConfig:
    """Build the runtime configuration from parsed arguments."""
    calibrate = args.calibrate or args.calibrate_only
    if calibrate and args.simulate:
        raise ValueError("manual calibration is not available with --simulate")
    calibration_file = args.calibration_file
    if calibration_file is None:
        calibration_file = (
            data.get_testing_data_directory()
            / TEST_NAME
            / "calibration"
            / f"p{args.pipette}_96_D2.json"
        )
    return AgingConfig(
        cycles=args.cycles,
        pipette_volume=args.pipette,
        simulate=args.simulate,
        tag=args.tag,
        check_tip_presence=not (args.no_tip_presence_check or args.fast),
        calibrate=calibrate,
        calibration_file=calibration_file.expanduser(),
        calibrate_only=args.calibrate_only,
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
