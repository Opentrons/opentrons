from opentrons_shared_data.errors.exceptions import FirmwareUpdateFailedError


class UpdateError(FirmwareUpdateFailedError):
    pass


class AbsorbanceReaderDisconnectedError(RuntimeError):
    def __init__(self, serial: str):
        self.serial = serial
