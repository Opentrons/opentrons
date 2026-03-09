from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field
from typing_extensions import Literal

from .shared_models import (
    DesignerApplication,
    Liquid,
    Metadata,
    Robot,
)
from opentrons_shared_data.command import known_schema_ids
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


class Command(BaseModel):
    commandType: str
    params: Dict[str, Any]
    key: Optional[str] = None


class CommandAnnotation(BaseModel):
    commandKeys: List[str]
    annotationType: str
    model_config = ConfigDict(extra="allow")


CommandSchemaId = Enum(  # type: ignore[misc]
    "CommandSchemaId",
    ((schema_id, schema_id) for schema_id in known_schema_ids()),
    type=str,
)


class ProtocolSchemaV8(BaseModel):
    otSharedSchema: Literal["#/protocol/schemas/8"] = Field(
        ...,
        alias="$otSharedSchema",
        description="The path to a valid Opentrons shared schema relative to "
        "the shared-data directory, without its extension.",
    )
    schemaVersion: Literal[8]
    metadata: Metadata
    robot: Robot
    liquidSchemaId: Literal["opentronsLiquidSchemaV1"]
    liquids: Dict[str, Liquid]
    labwareDefinitionSchemaId: Literal["opentronsLabwareSchemaV2"]
    labwareDefinitions: Dict[str, LabwareDefinition]
    commandSchemaId: CommandSchemaId
    commands: List[Command]
    commandAnnotationSchemaId: Union[
        Literal["opentronsCommandAnnotationSchemaV1"],
        Literal["opentronsCommandAnnotationSchemaV2"],
    ]
    commandAnnotations: List[CommandAnnotation]
    designerApplication: Optional[DesignerApplication] = None
    model_config = ConfigDict(populate_by_name=True)
