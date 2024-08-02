"""Load pipette command request, result, and implementation models."""
from __future__ import annotations

from opentrons_shared_data.pipette.pipette_load_name_conversions import (
    convert_to_pipette_name_type,
)
from opentrons_shared_data.pipette.types import PipetteGenerationType
from opentrons_shared_data.robot import user_facing_robot_type
from opentrons_shared_data.robot.types import RobotTypeEnum
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons.types import MountType

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from .configuring_common import PipetteConfigUpdateResultMixin
from ..errors import InvalidSpecificationForRobotTypeError, InvalidLoadPipetteSpecsError

if TYPE_CHECKING:
    from ..execution import EquipmentHandler
    from ..state import StateView


LoadPipetteCommandType = Literal["loadPipette"]


class LoadPipettePrivateResult(PipetteConfigUpdateResultMixin):
    """The not-to-be-exposed results of a load pipette call."""

    ...


class LoadPipetteParams(BaseModel):
    """Payload needed to load a pipette on to a mount."""

    pipetteName: PipetteNameType = Field(
        ...,
        description="The load name of the pipette to be required.",
    )
    mount: MountType = Field(
        ...,
        description="The mount the pipette should be present on.",
    )
    pipetteId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this pipette. If None, an ID "
        "will be generated.",
    )
    tipOverlapNotAfterVersion: Optional[str] = Field(
        None,
        description="A version of tip overlap data to not exceed. The highest-versioned "
        "tip overlap data that does not exceed this version will be used. Versions are "
        "expressed as vN where N is an integer, counting up from v0. If None, the current "
        "highest version will be used.",
    )
    liquidPresenceDetection: Optional[bool] = Field(
        None,
        description="Enable liquid presence detection for this pipette. Defaults to False.",
    )


class LoadPipetteResult(BaseModel):
    """Result data for executing a LoadPipette."""

    pipetteId: str = Field(
        ...,
        description="An ID to reference this pipette in subsequent commands.",
    )


class LoadPipetteImplementation(
    AbstractCommandImpl[
        LoadPipetteParams, SuccessData[LoadPipetteResult, LoadPipettePrivateResult]
    ]
):
    """Load pipette command implementation."""

    def __init__(
        self, equipment: EquipmentHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._equipment = equipment
        self._state_view = state_view

    async def execute(
        self, params: LoadPipetteParams
    ) -> SuccessData[LoadPipetteResult, LoadPipettePrivateResult]:
        """Check that requested pipette is attached and assign its identifier."""
        pipette_generation = convert_to_pipette_name_type(
            params.pipetteName.value
        ).pipette_generation
        robot_type = RobotTypeEnum.robot_literal_to_enum(
            self._state_view.config.robot_type
        )
        if (
            (
                robot_type == RobotTypeEnum.FLEX
                and pipette_generation != PipetteGenerationType.FLEX
            )
        ) or (
            (
                robot_type == RobotTypeEnum.OT2
                and pipette_generation
                not in [PipetteGenerationType.GEN1, PipetteGenerationType.GEN2]
            )
        ):
            raise InvalidSpecificationForRobotTypeError(
                f"Cannot load a {pipette_generation.value.capitalize()} pipette on "
                f"{user_facing_robot_type(robot_type=self._state_view.config.robot_type, include_article=True)}."
            )

        if params.mount == MountType.EXTENSION:
            raise InvalidLoadPipetteSpecsError(
                "Cannot load a pipette on the EXTENSION mount. Use mount LEFT or RIGHT."
            )

        loaded_pipette = await self._equipment.load_pipette(
            pipette_name=params.pipetteName,
            mount=params.mount,
            pipette_id=params.pipetteId,
            tip_overlap_version=params.tipOverlapNotAfterVersion,
        )

        return SuccessData(
            public=LoadPipetteResult(pipetteId=loaded_pipette.pipette_id),
            private=LoadPipettePrivateResult(
                pipette_id=loaded_pipette.pipette_id,
                serial_number=loaded_pipette.serial_number,
                config=loaded_pipette.static_config,
            ),
        )


class LoadPipette(BaseCommand[LoadPipetteParams, LoadPipetteResult, ErrorOccurrence]):
    """Load pipette command model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    params: LoadPipetteParams
    result: Optional[LoadPipetteResult]

    _ImplementationCls: Type[LoadPipetteImplementation] = LoadPipetteImplementation


class LoadPipetteCreate(BaseCommandCreate[LoadPipetteParams]):
    """Load pipette command creation request model."""

    commandType: LoadPipetteCommandType = "loadPipette"
    params: LoadPipetteParams

    _CommandCls: Type[LoadPipette] = LoadPipette
