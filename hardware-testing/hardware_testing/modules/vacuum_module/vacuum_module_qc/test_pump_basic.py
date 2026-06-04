"""Test the pump basic."""

import asyncio
from typing import List, Union
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


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(f"pump-duty-cycle-{duty}", [CSVResult, int, int]) for duty in DUTY_TEST
    ]
    return lines


async def test_pump_motor(
    vacuum: VacuumModule,
    duty_cycle: int,
    report: CSVReport,
    section: str,
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
        f"pump-duty-cycle-{duty_cycle}",
        [CSVResult.from_bool(passed), pwm, rpm],
    )


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    print("Set Pump State")
    # Turn off pump
    await vacuum.set_pump_state(False)
    try:
        for duty in DUTY_TEST:
            await test_pump_motor(vacuum, duty, report, section)
    finally:
        # Always Turn off pump
        await vacuum.set_pump_state(False)
        await vacuum.set_vent_state(VentState.CLOSED)
