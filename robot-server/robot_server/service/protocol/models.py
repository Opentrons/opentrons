import typing
from datetime import datetime

from opentrons_shared_data.pipette.dev_types import PipetteName
from opentrons_shared_data.module.dev_types import ModuleModel, ModuleType
from pydantic import BaseModel, Field

from opentrons.hardware_control.dev_types import ONE_CHANNEL, EIGHT_CHANNELS
from robot_server.service.json_api import (
    ResponseModel, ResponseDataModel, MultiResponseModel)

from robot_server.service.legacy.models.control import Mount


class LoadedPipette(BaseModel):
    """Model of a pipette required by protocol."""
    mount: Mount = \
        Field(..., description="The mount to which this pipette is attached.")
    requestedAs: str = \
        Field(..., description="The user supplied name.")
    pipetteName: PipetteName = \
        Field(..., description="The pipette name.")
    channels: typing.Union[ONE_CHANNEL, EIGHT_CHANNELS]


class LoadedLabware(BaseModel):
    """Model of labware loaded by protocol."""
    label: str = \
        Field(..., description="The display name of the labware.")
    uri: str = \
        Field(..., description="The uri (namespace/loadname/version).")
    slot: int = \
        Field(..., description="The slot in which this labware is located.")


class LoadedModule(BaseModel):
    """Model of module loaded by protocol."""
    type: ModuleType = \
        Field(..., description="The name of the module.")
    model: ModuleModel = \
        Field(..., description="The module model.")
    slot: int = \
        Field(..., description="The slot in which this module is located.")


class Meta(BaseModel):
    """Metadata extracted from the protocol."""
    name: typing.Optional[str]
    author: typing.Optional[str]
    apiLevel: typing.Optional[str]


class RequiredEquipment(BaseModel):
    """Results of analysis of protocol."""
    pipettes: typing.List[LoadedPipette]
    labware: typing.List[LoadedLabware]
    modules: typing.List[LoadedModule]


class FileAttributes(BaseModel):
    basename: str


class ProtocolResponseAttributes(ResponseDataModel):
    protocolFile: FileAttributes
    supportFiles: typing.List[FileAttributes]
    lastModifiedAt: datetime
    createdAt: datetime
    requiredEquipment: RequiredEquipment
    metadata: Meta


ProtocolResponse = ResponseModel[ProtocolResponseAttributes]

MultiProtocolResponse = MultiResponseModel[ProtocolResponseAttributes]
