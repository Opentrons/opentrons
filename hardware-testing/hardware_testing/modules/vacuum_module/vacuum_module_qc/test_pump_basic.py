"""Test the pump basic."""

import asyncio
from typing import List, Union, Dict
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module.types import VentState


# duty cycle incremental test + harsh stop/start at the end
DUTY_TEST = [0, 10, 20, 30, 40, 50, 80, 100, 0, 100, 0, 100]


def format_duty_cycles(cycles: List[int]) -> List[str]:
    """Format duty cycles for csv reporting."""
    """This is necessary because by default CSVReport will overwrite
    lines that have the same first index but are not CSVLineRepeating objects."""
    duty_test_str = []
    val_freq: Dict[int, int] = {v: 0 for v in cycles}
    for duty in DUTY_TEST:
        val_freq[duty] += 1
        repeat_str = f"-{val_freq[duty]}" if val_freq[duty] > 1 else ""
        duty_test_str.append(f"pump-duty-cycle-{duty}{repeat_str}")
    return duty_test_str


DUTY_CYCLES_FORMAT = format_duty_cycles(DUTY_TEST)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(pwm_str, [CSVResult, int, int]) for pwm_str in DUTY_CYCLES_FORMAT
    ]
    return lines


async def test_pump_motor(
    vacuum: VacuumModule,
    duty_cycle: int,
    report: CSVReport,
    section: str,
    duty_cycle_str: str,
) -> None:
    """Test setting the pump state."""
    ui.print_header(f"Pump Motor Duty Cycle={duty_cycle}")

    # Turn Off Pump
    await vacuum.set_vacuum_state(False)
    await vacuum.set_pump_state(False)
    await asyncio.sleep(2)  # wait n seconds
    # Make sure the motor is not moving
    await vacuum._reader.update_pump_state()
    pump_running = vacuum.pump_state.pump_running
    assert not pump_running, "Pump is running"

    # Set the duty cycle
    await vacuum.set_pump_state(True, duty_cycle=duty_cycle)
    await asyncio.sleep(5)  # wait n seconds

    # verify duty cycle
    await vacuum._reader.update_pump_state()
    pump_running = vacuum.pump_state.pump_running if duty_cycle > 0 else True
    pwm = vacuum.pump_state.current_pwm
    rpm = vacuum.pump_state.current_rpm
    print(f"Current PWM: {pwm} Current RPM: {rpm}")
    passed = rpm > 0 if duty_cycle > 0 else pwm == 0
    report(
        section,
        duty_cycle_str,
        [CSVResult.from_bool(passed), pwm, rpm],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Set Pump State")
    # Turn off pump
    await vacuum.set_pump_state(False)
    try:
        for duty, duty_str in zip(DUTY_TEST, DUTY_CYCLES_FORMAT):
            await test_pump_motor(vacuum, duty, report, section, duty_str)
    finally:
        # Always Turn off pump
        await vacuum.set_pump_state(False)
        await vacuum.set_vent_state(VentState.CLOSED)
