"""Multi-device reliability test for impact protection fixtures."""

import importlib.util
import sys
import types
from pathlib import Path

from opentrons.protocol_api import ParameterContext, ProtocolContext

metadata = {"protocolName": "Impact Protection Combo Reliability Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}

DEFAULT_CYCLES = 100
MOVE_WAIT_SECONDS = 15


def add_parameters(parameters: ParameterContext) -> None:
    """Build runtime parameters."""
    parameters.add_int(
        display_name="Cycles",
        variable_name="cycles",
        default=DEFAULT_CYCLES,
        minimum=1,
        maximum=10000,
        description="Number of combo reliability test cycles to run.",
    )
    parameters.add_bool(
        display_name="Use ASAIR Sensor",
        variable_name="use_asair_sensor",
        default=False,
        description=(
            "Also connect the ASAIR environmental sensor. Keep this off unless "
            "the sensor is connected, or the robot may wait for user input."
        ),
    )


def _drivers_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "drivers"


def _ensure_drivers_package_stub() -> None:
    """Avoid importing hardware_testing.drivers.__init__ during protocol analysis."""
    if "hardware_testing.drivers" in sys.modules:
        return

    drivers_pkg = types.ModuleType("hardware_testing.drivers")
    drivers_pkg.__path__ = [str(_drivers_dir())]  # type: ignore[attr-defined]

    def list_ports_and_select(device_name: str = "", port_substr: str = "") -> str:
        from serial.tools.list_ports import comports  # type: ignore[import]

        ports = sorted(comports(), key=lambda p: p.device)
        if port_substr:
            for port in ports:
                if port_substr in port.device:
                    return port.device
        raise RuntimeError(
            f"Interactive serial selection is unavailable for {device_name}"
        )

    drivers_pkg.list_ports_and_select = list_ports_and_select  # type: ignore[attr-defined]
    sys.modules["hardware_testing.drivers"] = drivers_pkg


def _load_driver_module(module_name: str):
    """Load a driver module directly without executing drivers/__init__.py."""
    _ensure_drivers_package_stub()
    full_name = f"hardware_testing.drivers.{module_name}"
    if full_name in sys.modules:
        return sys.modules[full_name]

    module_path = _drivers_dir() / f"{module_name}.py"
    spec = importlib.util.spec_from_file_location(full_name, module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load driver module {module_name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[full_name] = module
    spec.loader.exec_module(module)
    return module


def _log(ctx: ProtocolContext, message: str) -> None:
    print(message)
    ctx.delay(seconds=0.1, msg=message)


def _log_state(ctx: ProtocolContext, cycle: int, label: str, state) -> None:
    _log(ctx, f"cycle={cycle} {label} response={state.raw_response}")


def run(ctx: ProtocolContext) -> None:
    """Exercise ASAIR, V2 impact, and 96ch impact fixtures together."""
    simulating = ctx.is_simulating()
    cycles = int(ctx.params.cycles)  # type: ignore[attr-defined]
    use_asair_sensor = bool(ctx.params.use_asair_sensor)  # type: ignore[attr-defined]

    if simulating:
        _log(ctx, "simulating: skip combo impact protection fixture connections")
        return

    ImpactProtectionV2 = _load_driver_module("ImpactProtectionV2")
    ImpactProtection96ch = _load_driver_module("ImpactProtection_96ch")

    env_sensor = None
    env_port = None
    if use_asair_sensor:
        AsairDriver = _load_driver_module("asair_sensor")
        _log(ctx, "connecting ASAIR sensor")
        env_sensor, env_port = AsairDriver.BuildAsairSensorWithPort(simulating)
        _log(ctx, f"connected ASAIR sensor port={env_port}")
    else:
        _log(ctx, "skipping ASAIR sensor connection")

    _log(ctx, "connecting ImpactProtectionV2")
    skip_port = env_port if env_port is not None else ""
    impact_v2, impact_v2_port = ImpactProtectionV2.BuildImpactProtectionWithPort(
        simulate=simulating,
        ctx=ctx,
        skip_port=skip_port,
    )
    _log(ctx, f"connected ImpactProtectionV2 port={impact_v2_port}")

    _log(ctx, "connecting 96ch impact protection fixture")
    skip_ports = [p for p in [env_port, impact_v2_port] if p is not None] or None
    impact_96, impact_96_port = ImpactProtection96ch.BuildImpactProtection96chWithPort(
        simulate=simulating,
        ctx=ctx,
        skip_port=skip_ports,
    )
    _log(ctx, f"connected 96ch impact protection fixture port={impact_96_port}")

    try:
        for cycle in range(1, cycles + 1):
            _log(ctx, f"cycle={cycle}/{cycles} begin")

            _log_state(
                ctx,
                cycle,
                "v2_switch_left_t50",
                impact_v2.switch_mode("SET_LEFT_T50"),
            )
            _log_state(ctx, cycle, "96_set_left_p200", impact_96.set_left_p200())
            ctx.delay(
                seconds=MOVE_WAIT_SECONDS,
                msg=f"waiting for 96ch p200 position cycle={cycle}",
            )
            _log_state(ctx, cycle, "96_get_after_p200", impact_96.get_pipette())

            _log_state(
                ctx,
                cycle,
                "v2_switch_left_t1000",
                impact_v2.switch_mode("SET_LEFT_T1000"),
            )
            _log_state(ctx, cycle, "96_set_left_p1000", impact_96.set_left_p1000())
            ctx.delay(
                seconds=MOVE_WAIT_SECONDS,
                msg=f"waiting for 96ch p1000 position cycle={cycle}",
            )
            _log_state(ctx, cycle, "96_get_after_p1000", impact_96.get_pipette())

            _log_state(ctx, cycle, "v2_close_all", impact_v2.close_all_gratings())
            _log_state(ctx, cycle, "96_get_after_v2_close", impact_96.get_pipette())
            _log(ctx, f"cycle={cycle}/{cycles} complete")
        _log(ctx, "combo reliability test complete")
    finally:
        impact_96.close()
        impact_v2.close()
        if env_sensor is not None:
            env_sensor.close()
        _log(ctx, "all fixtures closed")
