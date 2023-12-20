"""Format the csv report for a liquid-sense run."""

"""
CSV Test Report:
 - Serial numbers:
   - Robot
   - Pipette
   - Scale
   - Environment sensor
 - Config [excluding `labware_offsets`]:
   - protocol name
   - pipette_volume
   - pipette_mount
   - tip_volume
   - trials
   - slot_scale
   - slot tiprack
   - plunger direction
   - preheat
   - liquid
   - labware type
   - speed
   - start height offset
"""

def build_serial_number_section() -> CSVSection:
    return CSVSection(
                title="SERIAL-NUMBERS",
                lines=[
                    CSVLine("robot", [str]),
                    CSVLine("git_description", [str]),
                    CSVLine("pipette", [str]),
                    CSVLine("scale", [str]),
                    CSVLine("environment", [str]),
                ],
            )

def build_config_section() -> CSVSection:
    return CSVSection(
                title="CONFIG",
                lines=[
                    CSVLine("protocol_name", [str]),
                    CSVLine("pipette_volume", [str]),
                    CSVLine("pipette_mount", [str]),
                    CSVLine("tip_volume", [str]),
                    CSVLine("trials", [str]),
                    CSVLine("slot_scale", [str]),
                    CSVLine("slot_tiprack", [str]),
                    CSVLine("plunger_direction", [str]),
                    CSVLine("preheat", [str]),
                    CSVLine("liquid", [str]),
                    CSVLine("labware_type", [str]),
                    CSVLine("speed", [str]),
                    CSVLine("plunger_direction", [str]),
                    CSVLine("start_height_offset", [str]),
                ],
            )

def build_trials_section(trials: int) -> CSVSection:
    return CSVSection(
                title="TRIALS",
                lines=[
                    CSVLine(
                        f"trial-{t + 1}-{m}-{round(v, 2)}-ul-channel_{c + 1}", [float]
                    )
                    for v in volumes
                    for c in range(pip_channels_tested)
                    for t in range(trials)
                    for m in ["aspirate", "dispense", "liquid_height"]
                ],
            ),

def store_serial_numbers(
    report: CSVReport,
    robot: str,
    pipette: str,
    scale: str,
    environment: str,
    git_description: str,
) -> None:
    """Report serial numbers."""
    report("SERIAL-NUMBERS", "robot", [robot])
    report("SERIAL-NUMBERS", "git_description", [git_description])
    report("SERIAL-NUMBERS", "pipette", [pipette])
    report("SERIAL-NUMBERS", "scale", [scale])
    report("SERIAL-NUMBERS", "environment", [environment])

def build_ls_report() -> CSVReport:
    """Placeholder generate a CSV Report."""
    return CSVReport(
        test_name="test name",
        sections=[],
        run_id="run_id",
        start_time=0.0,
    )
