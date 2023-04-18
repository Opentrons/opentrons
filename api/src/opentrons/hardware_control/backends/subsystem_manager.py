"""
Coordinate subsystem detection and updates.
"""
import asyncio
from contextlib import contextmanager, ExitStack
from dataclasses import dataclass
import logging
from typing import TypeVar, Optional, Set, Dict, Iterator, Callable, Type, AsyncIterator

from opentrons_hardware.hardware_control import network, tools
from opentrons_hardware.drivers import can_bus, binary_usb
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    USBTarget,
    FirmwareTarget,
    ToolType,
)

from ..types import OT3SubSystem, OT3SubSystemState, UpdateStatus, UpdateState
from .ot3utils import subsystem_to_target, target_to_subsystem


log = logging.getLogger(__name__)

_Cls = TypeVar("_Cls", bound="SubsystemManager")


@dataclass
class FirmwareUpdateRequirements:
    target_version: int
    update_needed: bool
    filepath: str


class SubsystemManager:
    """Control tracking and updating attached subsystems to the machine.

    Call start() before trying to run the system (or build with build()).

    This object has an always-up-to-date cache of attached subsystems driven by
    asynchronous notifications from hardware and explicitly updatable with refresh().
    """

    _can_messenger: can_bus.CanMessenger
    _usb_messenger: Optional[binary_usb.BinaryMessenger]
    _tool_detector: tools.detector.ToolDetector
    _network_info: network.NetworkInfo
    _tool_detection_task: Optional[asyncio.Task[None]]
    _expected_core_targets: Set[FirmwareTarget]
    _present_tools: tools.types.ToolSummary
    _refreshed: asyncio.Event
    _updates_required: Dict[FirmwareTarget, FirmwareUpdateRequirements]
    _updates_ongoing: Dict[OT3SubSystem, UpdateStatus]

    @classmethod
    async def build(
        cls: Type[_Cls],
        can_messenger: can_bus.CanMessenger,
        usb_messenger: Optional[binary_usb.BinaryMessenger],
    ) -> _Cls:
        inst = cls(can_messenger, usb_messenger)
        await inst.start()
        return inst

    def __init__(
        self,
        can_messenger: can_bus.CanMessenger,
        usb_messenger: Optional[binary_usb.BinaryMessenger],
    ) -> None:
        self._can_messenger = can_messenger
        self._usb_messenger = usb_messenger
        self._tool_detector = tools.detector.ToolDetector(self._can_messenger)
        self._network_info = network.NetworkInfo(
            self._can_messenger, self._usb_messenger
        )
        self._tool_detection_task = None
        self._expected_core_targets: Set[FirmwareTarget] = {
            NodeId.gantry_x,
            NodeId.gantry_y,
            NodeId.head,
        }
        self._refreshed = asyncio.Event()
        self._updates_required = {}
        if self._usb_messenger:
            self._expected_core_targets.add(USBTarget.rear_panel)

    @property
    def device_info(self) -> Dict[OT3SubSystem, network.DeviceInfoCache]:
        return {
            target_to_subsystem(target): info
            for target, info in self._network_info.device_info.items()
        }

    @property
    def targets(self) -> Set[FirmwareTarget]:
        return self._network_info.targets

    @property
    def tools(self) -> tools.types.ToolSummary:
        return self._present_tools

    @property
    def subsystems(self) -> Dict[OT3SubSystem, OT3SubSystemState]:
        return {
            subsystem: OT3SubSystemState(
                ok=info.ok,
                current_fw_version=info.version,
                next_fw_version=self._updates_required[
                    subsystem_to_target(subsystem)
                ].target_version,
                fw_update_needed=self._updates_required[
                    subsystem_to_target(subsystem)
                ].update_required,
                current_fw_sha=info.shortsha,
                pcba_revision=str(info.revision),
                update_state=self._updates_ongoing.get(subsystem),
            )
            for target, info in self.device_info.items()
        }

    @property
    def update_required(self) -> bool:
        return bool(self._updates_required)

    async def start(self) -> None:
        await self._probe_network_and_cache_fw_updates(self._expected_core_targets)
        self._tool_detection_task = await asyncio.create_task(
            self._tool_detection_task_main()
        )
        await self.refresh()

    async def refresh(self) -> None:
        """Explicitly refresh the state of the system.

        This will not return until the information is up to date.
        """
        self._refreshed.clear()
        await self._tool_detector.detect()
        await self._refreshed.wait()

    def is_new(self) -> bool:
        """Returns True if there is data unread since the last call to is_new."""
        return self._refreshed.is_set()

    def get_update_progress(self) -> Dict[OT3SubSystem, UpdateStatus]:
        """Returns a set of UpdateStatus of the updates."""
        return {k: v for k, v in self._updates_ongoing.items()}

    async def update_firmware(
        self,
        subsystems: Optional[Set[OT3SubSystem]] = None,
        force: bool = False,
    ) -> AsyncIterator[Set[UpdateStatus]]:
        """Updates the firmware on the OT3."""
        # Check that there arent updates already running for given nodes
        current_subsystems = self.subsystems

        subsystems = subsystems or set(current_subsystems)
        subsystems_updating = set(self._updates_ongoing)
        subsystems_to_update = subsystems - subsystems_updating
        if not subsystems_to_update:
            log.info("No viable subsystem to update.")
            return

        # Check if devices need an update, only checks nodes if given
        firmware_updates = self._get_required_fw_updates(
            {subsystem_to_target(subsystem) for subsystem in subsystems}, force=force
        )

        if not firmware_updates:
            log.info("No firmware updates required for specified subsystems.")
            return

        log.info("Firmware updates are available.")
        updating_subsystems = {
            target_to_subsystem(target) for target in firmware_updates
        }
        update_details = {
            target: update_info[1] for target, update_info in firmware_updates.items()
        }

        with ExitStack() as update_tracker_stack:
            status_callbacks = {
                subsystem: self._update_ongoing_for(subsystem)
                for subsystem in updating_subsystems
            }

            updater = firmware_update.RunUpdate(
                can_messenger=self._messenger,
                usb_messenger=self._usb_messenger,
                update_details=update_details,
                retry_count=3,
                timeout_seconds=20,
                erase=True,
            )

            # start the updates and yield progress to caller
            async for target, status_element in updater.run_updates():
                subsystem = target_to_subsystem(target)
                upstream_status = UpdateStatus(
                    subsystem=subsystem,
                    state=status_element[0],
                    progress=int(status_element[1]),
                )
                status_callbacks[subsystem](upstream_status)
                yield upstream_status

        # refresh the device_info cache and reset internal states
        await self.refresh()

    def _get_required_fw_updates(
        self, targets: Set[FirmwareTarget], force: bool
    ) -> Dict[FirmwareTarget, FirmwareUpdateRequirements]:
        to_check = (targets or self.targets).interset(self.targets)
        updates_required: Dict[FirmwareTarget, FirmwareUpdateRequirements] = {}
        bad_targets = {target for target in to_check if not self.device_info[target].ok}
        good_targets = to_check - bad_targets
        good_updates = check_firmware_updates(self.device_info, good_targets)
        bad_updates = check_firmware_updates(self.device_info, bad_targets, True)

        for target in to_check:
            if target in good_targets:
                updates_required[target] = FirmwareUpdateRequirements(
                    good_updates[target][0], good_updates[target][1], force
                )
            elif target in bad_targets:
                updates_required[target] = FirmwareUpdateRequirements(
                    bad_updates[target][0], bad_updates[target][1], True
                )
        return updates_required

    def _update_fw_update_requirements(self) -> None:
        """Update the local cache of extra information required for subsystem state."""
        # this runs in a separate task from where it will be queried, so we'll build a replacement
        # for the _updates_required dict locally and then swap it over async-atomically

        self._updates_required = _get_required_fw_updates({}, False)

    async def _probe_network_and_cache_fw_updates(
        self, targets: Set[FirmwareTarget]
    ) -> None:
        await self._network_info.probe(targets)
        self._update_fw_update_requirements()

    @contextmanager
    def _update_ongoing_for(
        self, subsystem: OT3SubSystem
    ) -> Callable[Dict[UpdateStatus], None]:
        target = subsystem_to_target(subsystem)
        if target in self._updates_ongoing:
            raise RuntimeError(f"Update already ongoing for {subsystem}")

        def update_state(status: UpdateStatus) -> None:
            self._updates_ongoing[target] = status

        self._updates_ongoing[target] = UpdateState(
            subsystem=subsystem, state=UpdateState.queued, progress=0
        )
        try:
            yield update_state
        except Exception:
            log.exception(f"Update failed for subsystem {subsystem}")
            raise
        finally:
            self._updates_ongoing.pop(target)

    async def _tool_detection_task_main(self) -> None:
        """Main function of an asyncio task that responds to async notifications that tool states have changed."""
        async for update in self._tool_detector:
            # We got a notification from the head that something changed. Let's check whether the currently
            # attached tools are okay by getting their device info
            tool_nodes: Set[NodeId] = set()
            if update.left:
                tool_nodes.add(NodeId.pipette_left)
            if update.right:
                tool_nodes.add(NodeId.pipette_right)
            if update.gripper:
                tool_nodes.add(NodeId.gripper)
            try:
                await self._probe_network_and_cache_fw_updates(
                    self._expected_core_targets.union(tool_nodes)
                )
            except TimeoutError:
                log.exception("Problem in internal network probe")
                continue
            # Once we know which are okay, we can ask only those for their subsystems
            to_resolve = tools.types.ToolSummary(
                left=update.left
                if self._network_info.device_info[NodeId.pipette_left].ok
                else None,
                right=update.right
                if self._network_info.device_info[NodeId.pipette_right].ok
                else None,
                gripper=update.gripper
                if self._network_info.device_info[NodeId.gripper].ok
                else None,
            )
            self._present_tools = await self._tool_detector.resolve(to_resolve)
            self._refreshed.set()
