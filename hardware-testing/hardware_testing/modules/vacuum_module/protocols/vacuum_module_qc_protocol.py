"""Vacuum Module QC Protocol."""
from typing import cast
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    VacuumModuleContext,
)


metadata = {
    "protocolName": "Vacuum Module DVT QC Protocol V0.2",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Runtime parameters."""
    parameters.add_int(
        display_name="Cycles",
        variable_name="cycles",
        description="The number of cycles to perform.",
        default=1,
        minimum=1,
        maximum=1000,
    )
    parameters.add_str(
        variable_name="collar",
        display_name="Vacuum Collar",
        description="The kind of Collar (Opentrons or Millipore)",
        default="opentrons_vacuum_manifold_collar_short",
        choices=[
            {
                "display_name": "Opentrons: Short",
                "value": "opentrons_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Opentrons: Tall",
                "value": "opentrons_vacuum_manifold_collar_tall",
            },
            {
                "display_name": "Millipore: Short",
                "value": "millipore_vacuum_manifold_collar_short",
            },
            {
                "display_name": "Millipore: Tall",
                "value": "millipore_vacuum_manifold_collar_tall",
            },
        ],
    )
    parameters.add_int(
        display_name="Target Pressure (MBar)",
        variable_name="target_pressure",
        description="The target gauge pressure in mbar.",
        default=-200,
        minimum=-800,
        maximum=0,
    )
    parameters.add_int(
        display_name="Vacuum Hold Seconds",
        variable_name="hold_time",
        description="The vacuum hold time in seconds.",
        default=30,
        minimum=1,
        maximum=60 * 60 * 12,  # 12 hrs
    )
    parameters.add_bool(
        display_name="Run Ramp Profile",
        variable_name="run_ramp_profile",
        description="Ramps the vacuum starting at -200 - -800.",
        default=True,
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    # Load Modules
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )

    # Load Tipracks
    tiprack_1000 = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        "C1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tiprack_200 = ctx.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        "D1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )

    # Load Labware
    manifold_collar = vm_mod.load_adapter_to_dock(ctx.params.collar)  # type: ignore[attr-defined]
    white_filter_plate = manifold_collar.load_labware("invitroven_filter_plate")
    black_flat_plate = ctx.load_labware("invitroven_filter_plate", "D2")
