"""Vacuum Module On Protocol."""
from typing import cast

from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.protocol_api import (
    ProtocolContext,
    VacuumModuleContext,
)


metadata = {
    "protocolName": "Vacuum Module ON Protocol",
    "author": "Opentrons <protocols@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.30",
}


def enable_waste_detection(vm_mod: VacuumModuleContext, enable: bool = False) -> None:
    """Hack: send M127 E0 via the driver. Not part of public PAPI."""
    adapter = vm_mod._core._sync_module_hardware
    vacuum_hw = object.__getattribute__(adapter, "_obj_to_adapt")
    driver = vacuum_hw._driver

    SynchronousAdapter.call_coroutine_sync(
        vacuum_hw._loop,
        driver.set_waste_configs,
        enable_waste_full_detection=enable,
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    # Load Modules
    vm_mod = cast(
        VacuumModuleContext,
        ctx.load_module(module_name="vacuumModuleV1", location="A3"),
    )
    # set the waste detection for vm mod
    enable_waste_detection(vm_mod, False)  # type: ignore[attr-defined])
    ctx.load_trash_bin("A1")

    # Protocol Start
    # ------------------------------------------------------
    ctx.home()

    # Close the vent and vacuum at -200 mbar for 30s, then open the vent
    # Note: The `start_set_vacuum_pressure` command is a concurrent module action
    # So you have to use another mechanism like ProtocolContext.delay or
    # ProtocolContext.wait_for_tasks if you want to WAIT for the vacuum
    # duration step to finish before continuing the protocol.
    vm_mod.close_vent()
    vm_mod.start_set_vacuum_pressure(-300)
