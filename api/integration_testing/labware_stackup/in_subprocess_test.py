"""Import to a subprocess to run the stackup test."""

from typing import Any, cast

from opentrons import protocol_api, simulate
from .stackup_spec import StackupSpec


def run_test_subprocess(  # noqa: C901
    spec: StackupSpec,
) -> tuple[float, float, float]:
    """Run the stackup test in a subprocess."""
    context = simulate.get_protocol_api(
        protocol_api.MAX_SUPPORTED_VERSION, robot_type=spec.robot_type
    )

    top_so_far: Any = None
    module_load_name = spec.module_load_name
    adapter_load_info = spec.adapter_load_info
    labware_load_info = spec.labware_load_info

    if module_load_name:
        if module_load_name == "thermocyclerModuleV2":
            module = context.load_module(module_load_name)
        else:
            module = context.load_module(module_load_name, "D3")
            if module_load_name == "absorbanceReaderV1":
                cast(protocol_api.AbsorbanceReaderContext, module).open_lid()
        top_so_far = module

    if adapter_load_info is not None:
        adapter_load_name, adapter_version = adapter_load_info
        if top_so_far is None:
            adapter = context.load_adapter(
                adapter_load_name, "D3", version=adapter_version
            )
        else:
            if module_load_name == "absorbanceReaderV1":
                adapter = context.load_labware(
                    adapter_load_name, "A3", version=adapter_version
                )
                context.move_labware(adapter, module, use_gripper=True)
            else:
                adapter = top_so_far.load_adapter(
                    adapter_load_name, version=adapter_version
                )
        top_so_far = adapter

    labware_load_name, labware_version = labware_load_info
    if top_so_far is None:
        labware = context.load_labware(labware_load_name, "D3", version=labware_version)
    else:
        if module_load_name == "absorbanceReaderV1":
            labware = context.load_labware(
                labware_load_name, "A3", version=labware_version
            )
            if adapter_load_info is not None:
                context.move_labware(labware, adapter, use_gripper=True)
            else:
                context.move_labware(labware, module, use_gripper=True)
        else:
            labware = top_so_far.load_labware(
                labware_load_name, version=labware_version
            )
    top_so_far = labware

    x, y, z = top_so_far.wells_by_name()["A1"].top().point
    return (x, y, z)
