import asyncio
from typing import Dict, Set, Optional, AsyncIterator, Tuple
from itertools import chain

import pytest

from decoy import Decoy

from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    USBTarget,
    ToolType,
    FirmwareTarget,
    PipetteName,
)
from opentrons_hardware.hardware_control import network, tools, types
from opentrons_hardware.firmware_update import FirmwareUpdate
from opentrons_hardware.drivers import can_bus, binary_usb

from opentrons.hardware_control.backends.subsystem_manager import SubsystemManager
from opentrons.hardware_control.types import SubSystem, SubSystemState


def default_subidentifier_for(target: FirmwareTarget) -> int:
    if target in (NodeId.pipette_left, NodeId.pipette_left_bootloader):
        return PipetteName.p1000_single.value
    if target in (NodeId.pipette_right, NodeId.pipette_right_bootloader):
        return PipetteName.p50_multi.value
    return 0


def default_sha() -> str:
    return "abcdef1"


def default_fw_version() -> int:
    return 1


def default_revision() -> types.PCBARevision:
    return types.PCBARevision("A1")


def device_info_for(
    target: FirmwareTarget,
    subidentifier: Optional[int] = None,
    version: Optional[int] = None,
) -> network.DeviceInfoCache:
    checked_subidentifier = (
        subidentifier
        if subidentifier is not None
        else default_subidentifier_for(target)
    )
    return network.DeviceInfoCache(
        target=target.application_for(),
        version=version if version is not None else default_fw_version(),
        shortsha=default_sha(),
        flags=None,
        revision=default_revision(),
        subidentifier=checked_subidentifier,
        ok=((not NodeId.is_bootloader(target)) if isinstance(target, NodeId) else True),
    )


def default_network_info_for(
    targets: Set[FirmwareTarget],
) -> Dict[FirmwareTarget, network.DeviceInfoCache]:
    return {target.application_for(): device_info_for(target) for target in targets}


@pytest.fixture
def can_messenger(decoy: Decoy) -> can_bus.CanMessenger:
    """Build a decoyed can messenger."""
    return decoy.mock(cls=can_bus.CanMessenger)


@pytest.fixture
def usb_messenger(decoy: Decoy) -> binary_usb.BinaryMessenger:
    """Build a decoyed USB messenger."""
    return decoy.mock(cls=binary_usb.BinaryMessenger)


@pytest.fixture
def tool_detector(decoy: Decoy) -> tools.detector.ToolDetector:
    return decoy.mock(cls=tools.detector.ToolDetector)


@pytest.fixture
def network_info(decoy: Decoy) -> network.NetworkInfo:
    return decoy.mock(cls=network.NetworkInfo)


@pytest.fixture
def update_bag(decoy: Decoy) -> FirmwareUpdate:
    return decoy.mock(cls=FirmwareUpdate)


@pytest.fixture
def detection_queue(
    tool_detector: tools.detector.ToolDetector, decoy: Decoy
) -> "asyncio.Queue[tools.types.ToolDetectionResult]":
    queue: "asyncio.Queue[tools.types.ToolDetectionResult]" = asyncio.Queue()

    async def _read() -> AsyncIterator[tools.types.ToolDetectionResult]:
        while True:
            yield await queue.get()

    decoy.when(tool_detector.detect()).then_return(_read())
    return queue


class ToolDetectionController:
    def __init__(
        self,
        tool_detector: tools.detector.ToolDetector,
        detection_queue: "asyncio.Queue[tools.types.ToolDetectionResult]",
        decoy: Decoy,
    ) -> None:
        self._tool_detector = tool_detector
        self._decoy = decoy
        self._detection_queue = detection_queue

    def _detection_for(
        self, targets: Set[FirmwareTarget]
    ) -> tools.types.ToolDetectionResult:
        left_tool = ToolType.nothing_attached
        right_tool = ToolType.nothing_attached
        gripper_tool = ToolType.nothing_attached
        if NodeId.pipette_left in targets or NodeId.pipette_left_bootloader in targets:
            left_tool = ToolType.pipette
        if NodeId.pipette_right in targets or NodeId.pipette_left_bootloader in targets:
            right_tool = ToolType.pipette
        if NodeId.gripper in targets or NodeId.gripper_bootloader in targets:
            gripper_tool = ToolType.gripper
        return tools.types.ToolDetectionResult(
            left=left_tool, right=right_tool, gripper=gripper_tool
        )

    async def add_detection_on_next_check(
        self, targets: Set[FirmwareTarget]
    ) -> tools.types.ToolDetectionResult:
        results = self._detection_for(targets)

        async def _adder() -> None:
            await self._detection_queue.put(results)

        self._decoy.when(await self._tool_detector.check_once()).then_do(_adder)
        return results

    async def add_detection_immediate(
        self,
        targets: Set[FirmwareTarget],
    ) -> tools.types.ToolDetectionResult:
        result = self._detection_for(targets)
        await self._detection_queue.put(result)
        return result

    def _pipette_info_from_network(
        self, device: Optional[network.DeviceInfoCache], default_name: PipetteName
    ) -> Optional[tools.types.PipetteInformation]:
        if not device:
            return None
        if not device.ok:
            return None
        pipette_name = (
            PipetteName(device.subidentifier)
            if device.subidentifier != 0
            else default_name
        )
        return tools.types.PipetteInformation(
            pipette_name,
            pipette_name.value,
            pipette_name.name,
            f"dummyserial{pipette_name.name}",
        )

    def _auto_tool_summary(
        self, devices: Dict[FirmwareTarget, network.DeviceInfoCache]
    ) -> tools.types.ToolSummary:
        return tools.types.ToolSummary(
            left=self._pipette_info_from_network(
                devices.get(NodeId.pipette_left), PipetteName.p1000_single
            ),
            right=self._pipette_info_from_network(
                devices.get(NodeId.pipette_right), PipetteName.p50_multi
            ),
            gripper=tools.types.GripperInformation(model="1", serial="12131231")
            if (NodeId.gripper in devices and devices[NodeId.gripper].ok)
            else None,
        )

    async def add_resolution(
        self,
        on: tools.types.ToolDetectionResult,
        devices: Dict[FirmwareTarget, network.DeviceInfoCache],
        specific: Optional[tools.types.ToolSummary] = None,
    ) -> tools.types.ToolSummary:
        summary = specific or self._auto_tool_summary(devices)

        arg = tools.types.ToolDetectionResult(
            left=on.left
            if (NodeId.pipette_left in devices and devices[NodeId.pipette_left].ok)
            else ToolType.nothing_attached,
            right=on.right
            if (NodeId.pipette_right in devices and devices[NodeId.pipette_right].ok)
            else ToolType.nothing_attached,
            gripper=on.gripper
            if (NodeId.gripper in devices and devices[NodeId.gripper].ok)
            else ToolType.nothing_attached,
        )

        self._decoy.when(await self._tool_detector.resolve(arg)).then_return(summary)
        return summary


@pytest.fixture
def tool_detection_controller(
    tool_detector: tools.detector.ToolDetector,
    detection_queue: "asyncio.Queue[tools.types.ToolDetectionResult]",
    decoy: Decoy,
) -> ToolDetectionController:
    return ToolDetectionController(tool_detector, detection_queue, decoy)


@pytest.fixture
async def subject(
    can_messenger: can_bus.CanMessenger,
    usb_messenger: binary_usb.BinaryMessenger,
    tool_detector: tools.detector.ToolDetector,
    network_info: network.NetworkInfo,
    update_bag: FirmwareUpdate,
) -> AsyncIterator[SubsystemManager]:
    """
    Build a test subject using decoyed messengers.

    Note: this method does not use await build() so that test callers can prep the messenger
    decoys before it sends a ping. Tests _must_ call await start() before any other method calls.
    """
    manager = SubsystemManager(
        can_messenger, usb_messenger, tool_detector, network_info, update_bag
    )
    try:
        yield manager
    finally:
        if manager._tool_detection_task:
            manager._tool_detection_task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await manager._tool_detection_task


@pytest.mark.parametrize(
    "targets,ok",
    [
        (set(), False),  # with no targets, we're not ok
        (
            {NodeId.head, NodeId.gantry_x, NodeId.gantry_y},
            False,
        ),  # with all can targets but no usb we're not ok
        (
            {NodeId.head, NodeId.gantry_x, NodeId.gantry_y, USBTarget.rear_panel},
            True,
        ),  # with all targets we're ok
        (
            {
                NodeId.head,
                NodeId.gantry_x,
                NodeId.gantry_y_bootloader,
                USBTarget.rear_panel,
            },
            False,
        ),  # with a core can node in bootloader we're not ok
        (
            {
                NodeId.head,
                NodeId.gantry_x,
                NodeId.gantry_y,
                USBTarget.rear_panel,
                NodeId.pipette_right,
            },
            True,
        ),  # with all plus a pipette we're ok
        (
            {
                NodeId.head_bootloader,
                NodeId.gantry_x,
                NodeId.gantry_y,
                USBTarget.rear_panel,
                NodeId.pipette_right,
            },
            False,
        ),  # with a non-ok core and an ok pipette we're not ok
        (
            {
                NodeId.head,
                NodeId.gantry_x,
                NodeId.gantry_y,
                USBTarget.rear_panel,
                NodeId.gripper_bootloader,
            },
            False,
        ),  # with an ok core but not ok tool we're not ok
    ],
)
async def test_ok(
    targets: Set[FirmwareTarget],
    ok: bool,
    subject: SubsystemManager,
    network_info: network.NetworkInfo,
    tool_detection_controller: ToolDetectionController,
    update_bag: FirmwareUpdate,
    decoy: Decoy,
) -> None:
    """It should complain if required subsystems are not present."""
    target_applications = {t.application_for() for t in targets}
    decoy.when(network_info.targets).then_return(target_applications)
    network_info_value = default_network_info_for(targets)
    decoy.when(network_info.device_info).then_return(network_info_value)
    tool_struct = await tool_detection_controller.add_detection_on_next_check(targets)
    await tool_detection_controller.add_resolution(tool_struct, network_info_value)

    good_targets = {
        target.application_for()
        for target in targets
        if not (isinstance(target, NodeId) and NodeId.is_bootloader(target))
    }
    bad_targets = target_applications - good_targets
    decoy.when(
        update_bag.update_checker(network_info_value, good_targets, False)
    ).then_return({})
    decoy.when(
        update_bag.update_checker(
            network_info_value,
            bad_targets,
            True,
        )
    ).then_return({target: (1, "/some/path") for target in bad_targets})
    await subject.start()
    assert subject.ok == ok


async def test_device_info(
    subject: SubsystemManager, network_info: network.NetworkInfo, decoy: Decoy
) -> None:
    """It should accurately reflect the device info data from the network."""
    info_value = default_network_info_for(
        {
            NodeId.gantry_x,
            NodeId.gantry_y_bootloader,
            NodeId.head,
            NodeId.pipette_right,
            USBTarget.rear_panel,
        }
    )
    decoy.when(network_info.device_info).then_return(info_value)
    assert subject.device_info == {
        SubSystem.gantry_x: info_value[NodeId.gantry_x],
        SubSystem.gantry_y: info_value[NodeId.gantry_y],
        SubSystem.head: info_value[NodeId.head],
        SubSystem.pipette_right: info_value[NodeId.pipette_right],
        SubSystem.rear_panel: info_value[USBTarget.rear_panel],
    }


async def test_targets(
    subject: SubsystemManager, network_info: network.NetworkInfo, decoy: Decoy
) -> None:
    """It should tell you what targets are connected if you really need to know."""
    targets: Set[FirmwareTarget] = {
        NodeId.gantry_x,
        NodeId.gantry_y_bootloader,
        USBTarget.rear_panel,
        NodeId.gripper,
    }
    decoy.when(network_info.targets).then_return(targets)
    assert subject.targets == targets


@pytest.mark.parametrize(
    "target_info",
    [
        {},
        {
            NodeId.pipette_left: device_info_for(NodeId.pipette_left, version=0),
            NodeId.pipette_right: device_info_for(NodeId.pipette_right),
        },
        {NodeId.gripper: device_info_for(NodeId.gripper)},
        {
            NodeId.gripper: device_info_for(NodeId.gripper, version=0),
            NodeId.pipette_left: device_info_for(
                NodeId.pipette_left, subidentifier=PipetteName.p1000_96.value
            ),
        },
    ],
)
async def test_ok_tools_get_mapped(
    target_info: Dict[FirmwareTarget, network.DeviceInfoCache],
    subject: SubsystemManager,
    network_info: network.NetworkInfo,
    tool_detection_controller: ToolDetectionController,
    update_bag: FirmwareUpdate,
    decoy: Decoy,
) -> None:
    """When tools are detected no matter their update needs, if they're ok we make them present."""
    core_targets: Set[FirmwareTarget] = {
        NodeId.gantry_x,
        NodeId.gantry_y,
        NodeId.head,
        USBTarget.rear_panel,
    }
    all_targets = set(iter(target_info.keys())).union(core_targets)
    decoy.when(network_info.targets).then_return(all_targets)
    core_network_info = default_network_info_for(core_targets)
    all_network_info = dict(chain(core_network_info.items(), target_info.items()))
    decoy.when(network_info.device_info).then_return(all_network_info)

    tool_struct = await tool_detection_controller.add_detection_on_next_check(
        set(iter(target_info.keys()))
    )
    summary = await tool_detection_controller.add_resolution(tool_struct, target_info)

    decoy.when(
        update_bag.update_checker(all_network_info, all_targets, False)
    ).then_return(
        {
            target: (1, "/some/path")
            for target in target_info.keys()
            if target.is_bootloader()
        }
    )
    decoy.when(
        update_bag.update_checker(
            all_network_info,
            set(),
            True,
        )
    ).then_return({})
    await subject.start()
    assert subject.tools == summary


@pytest.mark.parametrize(
    "target_info,subsystem_info,required_updates",
    [
        ({}, {}, {}),
        (
            default_network_info_for({NodeId.head_bootloader, USBTarget.rear_panel}),
            {
                SubSystem.head: SubSystemState(
                    ok=False,
                    current_fw_version=default_fw_version(),
                    next_fw_version=1,
                    fw_update_needed=True,
                    current_fw_sha=default_sha(),
                    pcba_revision=str(default_revision()),
                    update_state=None,
                ),
                SubSystem.rear_panel: SubSystemState(
                    ok=True,
                    current_fw_version=default_fw_version(),
                    next_fw_version=2,
                    fw_update_needed=True,
                    current_fw_sha=default_sha(),
                    pcba_revision=str(default_revision()),
                    update_state=None,
                ),
            },
            {
                NodeId.head: (1, "/some/path"),
                USBTarget.rear_panel: (2, "/some/other/path"),
            },
        ),
        (
            default_network_info_for({NodeId.pipette_left, NodeId.gantry_x}),
            {
                SubSystem.pipette_left: SubSystemState(
                    ok=True,
                    current_fw_version=default_fw_version(),
                    next_fw_version=default_fw_version(),
                    fw_update_needed=False,
                    current_fw_sha=default_sha(),
                    pcba_revision=str(default_revision()),
                    update_state=None,
                ),
                SubSystem.gantry_x: SubSystemState(
                    ok=True,
                    current_fw_version=default_fw_version(),
                    next_fw_version=default_fw_version(),
                    fw_update_needed=False,
                    current_fw_sha=default_sha(),
                    pcba_revision=str(default_revision()),
                    update_state=None,
                ),
            },
            {},
        ),
        (
            default_network_info_for(
                {NodeId.head_bootloader, NodeId.pipette_right_bootloader}
            ),
            {
                SubSystem.head: SubSystemState(
                    ok=False,
                    current_fw_version=default_fw_version(),
                    next_fw_version=default_fw_version(),
                    fw_update_needed=True,
                    current_fw_sha=default_sha(),
                    pcba_revision=str(default_revision()),
                    update_state=None,
                ),
                SubSystem.pipette_right: SubSystemState(
                    ok=False,
                    current_fw_version=default_fw_version(),
                    next_fw_version=default_fw_version(),
                    fw_update_needed=True,
                    current_fw_sha=default_sha(),
                    pcba_revision=str(default_revision()),
                    update_state=None,
                ),
            },
            {NodeId.head: (1, "/some/path"), NodeId.pipette_right: (1, "/some/path")},
        ),
    ],
)
async def test_subsystems(
    target_info: Dict[FirmwareTarget, network.DeviceInfoCache],
    subsystem_info: Dict[SubSystem, SubSystemState],
    required_updates: Dict[FirmwareTarget, Tuple[int, str]],
    subject: SubsystemManager,
    network_info: network.NetworkInfo,
    tool_detection_controller: ToolDetectionController,
    update_bag: FirmwareUpdate,
    decoy: Decoy,
) -> None:
    """It should return subsystems corresponding to the detected targets with their info."""
    targets = set(iter(target_info.keys()))
    target_applications = {t.application_for() for t in target_info.keys()}
    decoy.when(network_info.targets).then_return(target_applications)
    decoy.when(network_info.device_info).then_return(target_info)
    tool_struct = await tool_detection_controller.add_detection_on_next_check(targets)
    await tool_detection_controller.add_resolution(tool_struct, target_info)

    good_targets = {target for target, info in target_info.items() if info.ok}
    bad_targets = target_applications - good_targets
    decoy.when(update_bag.update_checker(target_info, good_targets, False)).then_return(
        {k: v for k, v in required_updates.items() if k in good_targets}
    )
    decoy.when(
        update_bag.update_checker(
            target_info,
            bad_targets,
            True,
        )
    ).then_return({k: v for k, v in required_updates.items() if k in bad_targets})
    await subject.start()
    assert subject.subsystems == subsystem_info
