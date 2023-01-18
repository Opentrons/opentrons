"""Update Firmware of OT3."""
import argparse
import asyncio
from dataclasses import dataclass
from pathlib import Path
from subprocess import run
from typing import Optional, List, Tuple

from hardware_testing.opentrons_api import helpers_ot3


CMD = "python3 -m opentrons_hardware.scripts.update_fw --file {path} --target {target} --less-logs"


@dataclass
class HexPathAndTarget:
    """HEX absolute path, and OT3 target."""

    name: str
    path: Optional[str]
    target: str


@dataclass
class SkipUpdateTarget:
    """Targets you want to skip."""

    gantry: bool
    left: bool
    right: bool
    gripper: bool


FW_GANTRY_X = HexPathAndTarget(name="gantry-x-rev1.hex", path=None, target="gantry-x")
FW_GANTRY_Y = HexPathAndTarget(name="gantry-y-rev1.hex", path=None, target="gantry-y")
FW_HEAD = HexPathAndTarget(name="head-rev1.hex", path=None, target="head")
FW_PIP_SINGLE = HexPathAndTarget(
    name="pipettes-single-rev1.hex", path=None, target="pipette-{mount}"
)
FW_PIP_MULTI = HexPathAndTarget(
    name="pipettes-multi-rev1.hex", path=None, target="pipette-{mount}"
)
FW_PIP_96 = HexPathAndTarget(
    name="pipettes-96-rev1.hex", path=None, target="pipette-{mount}"
)
FW_GRIPPER = HexPathAndTarget(name="gripper-rev1.hex", path=None, target="gripper")
ALL_FW = [
    FW_GANTRY_X,
    FW_GANTRY_Y,
    FW_HEAD,
    FW_PIP_SINGLE,
    FW_PIP_MULTI,
    FW_PIP_96,
    FW_GRIPPER,
]


def _gather_hex_files_from_directory(directory: Path) -> None:
    assert directory.exists(), f'No directory name "{directory}"'
    assert directory.is_dir(), f'Location "{directory}" is not a folder'
    found_paths = list(directory.iterdir())
    assert len(found_paths), f'No files found in "{directory}"'
    for p in found_paths:
        for fw in ALL_FW:
            if p.name == fw.name:
                fw.path = str(p.resolve())


async def _gather_attached_instruments(
    is_simulating: bool,
) -> Tuple[List[str], List[str], bool, bool]:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.3",
        pipette_right="p1000_multi_v3.1",
    )
    attached_pips = api.hardware_pipettes

    def _get_mount_of_pipette(pip_type: str) -> List[str]:
        return [
            m.name.lower() for m, p in attached_pips.items() if p and pip_type in p.name
        ]

    single_pip_mounts = _get_mount_of_pipette("single")
    multi_pip_mounts = _get_mount_of_pipette("multi")
    has_96_pipette = bool(len(_get_mount_of_pipette("96")))
    has_gripper = bool(api.attached_gripper)
    return single_pip_mounts, multi_pip_mounts, has_96_pipette, has_gripper


def _run_update_fw_command(path: str, target: str, is_simulating: bool) -> None:
    cmd = CMD.format(path=path, target=target)
    if is_simulating:
        print("---COMMAND_START---")
        print(cmd)
        print("---COMMAND_END---")
    else:
        run(cmd.split(" "))


async def _main(directory: Path, is_simulating: bool, skip: SkipUpdateTarget) -> None:
    _gather_hex_files_from_directory(directory)
    singles, multis, has_96, has_gripper = await _gather_attached_instruments(
        is_simulating
    )

    # flash the gantry
    if not skip.gantry:
        for fw in [FW_GANTRY_X, FW_GANTRY_Y, FW_HEAD]:
            if fw.path:
                _run_update_fw_command(
                    path=fw.path, target=fw.target, is_simulating=is_simulating
                )
    # flash single/multi channel pipettes
    _pip_fw_and_target = {FW_PIP_SINGLE: singles, FW_PIP_MULTI: multis}
    for fw, mnt_list in _pip_fw_and_target.items():
        if not fw.path:
            continue
        for mount in mnt_list:
            if (mount == "left" and skip.left) or (mount == "right" and skip.right):
                continue
            _run_update_fw_command(
                path=fw.path,
                target=fw.target.format(mount=mount),
                is_simulating=is_simulating,
            )
    # flash 96-channel pipette
    if has_96 and FW_PIP_96.path and not skip.left:
        _run_update_fw_command(
            path=FW_PIP_96.path,
            target=FW_PIP_96.target.format(mount="left"),
            is_simulating=is_simulating,
        )
    # flash the gripper
    if has_gripper and FW_GRIPPER.path and not skip.gripper:
        _run_update_fw_command(
            path=FW_GRIPPER.path,
            target=FW_GRIPPER.target,
            is_simulating=is_simulating,
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", type=str, required=True)
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--skip-gantry", action="store_true")
    parser.add_argument("--skip-left", action="store_true")
    parser.add_argument("--skip-right", action="store_true")
    parser.add_argument("--skip-gripper", action="store_true")
    args = parser.parse_args()
    folder_path = Path(args.folder)
    _skip = SkipUpdateTarget(
        gantry=args.skip_gantry,
        left=args.skip_left,
        right=args.skip_right,
        gripper=args.skip_gripper,
    )
    asyncio.run(_main(folder_path, args.simulate, _skip))
