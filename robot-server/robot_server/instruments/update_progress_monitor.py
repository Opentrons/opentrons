"""Class to monitor firmware update status."""
from datetime import datetime
from typing import Dict

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import UpdateState
from opentrons.protocol_engine.errors import HardwareNotSupportedError
from opentrons.protocol_engine.resources import ensure_ot3_hardware
from robot_server.instruments.instrument_models import (
    MountType,
    UpdateProgressData,
    MountTypesStr,
)


class InstrumentNotFound(RuntimeError):
    """Error raised when there is no instrument attached on the specified mount."""


class UpdateIdNotFound(KeyError):
    """Error raised when a specified Update ID is not found."""


class UpdateProgressMonitor:
    """Factory and in-memory storage for the firmware update process."""

    def __init__(self, hardware_api: HardwareControlAPI) -> None:
        self._hardware = hardware_api
        self._status_by_id: Dict[str, UpdateProgressData] = {}

    def create(
        self,
        update_id: str,
        created_at: datetime,
        mount: MountTypesStr,
    ) -> UpdateProgressData:
        """Update the status for the given id."""
        try:
            ot3_hardware = ensure_ot3_hardware(hardware_api=self._hardware)
        except HardwareNotSupportedError as e:
            raise e

        update_status = ot3_hardware.get_firmware_update_progress()[
            MountType.to_ot3_mount(mount)
        ]

        self._status_by_id[update_id] = UpdateProgressData(
            id=update_id,
            createdAt=created_at,
            mount=mount,
            updateStatus=update_status.status,
            updateProgress=update_status.progress,
        )
        return self._status_by_id[update_id]

    def get_progress_status(self, update_id: str) -> UpdateProgressData:
        """Get the firmware update progress status for the given update resource ID."""
        try:
            ot3_hardware = ensure_ot3_hardware(hardware_api=self._hardware)
        except HardwareNotSupportedError as e:
            raise e

        try:
            saved_status = self._status_by_id[update_id]
        except KeyError as e:
            raise UpdateIdNotFound from e

        mount = saved_status.mount
        mount_update_status = ot3_hardware.get_firmware_update_progress().get(
            MountType.to_ot3_mount(mount)
        )

        if not mount_update_status:
            # In the case where an instrument was updated and reset, hardwareControlAPI
            # cannot provide a status of the finished update anymore. So we try to
            # interpret it by checking if there's an update available for that mount now.
            instrument_dict = ot3_hardware.get_all_attached_instr().get(
                MountType.to_ot3_mount(mount)
            )
            if instrument_dict is None:
                raise InstrumentNotFound(f"No instrument attached on mount {mount}")

            if instrument_dict["fw_update_required"]:
                # TODO: add some 'something went wrong during update process' error type
                raise RuntimeError

            # This way of interpreting whether an update finished successfully based
            # solely on details of an instrument attached to the specified mount
            # is flawed. If someone changed the instrument on the mount after an update
            # was posted, and then tried to fetch the update status associated with
            # the previous update process's update_id, then this method will update
            # its fields using the wrong instrument's data.
            # TODO (spp, 2023-03-03): To make this foolproof, also check for
            #  the specific instrument attached.

            self._status_by_id[update_id].updateStatus = UpdateState.done
            self._status_by_id[update_id].updateProgress = 100
        else:
            self._status_by_id[update_id].updateStatus = mount_update_status.status
            self._status_by_id[update_id].updateProgress = mount_update_status.progress

        return self._status_by_id[update_id]
