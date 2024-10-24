"""Load liquid class command request, result, and implementation models."""
from __future__ import annotations

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    AspirateProperties,
    SingleDispenseProperties,
    MultiDispenseProperties,
)
from pydantic import BaseModel, Field
from typing import Optional, Type, Dict, TYPE_CHECKING
from typing_extensions import Literal

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from ..types import ImmutableLiquidClass

if TYPE_CHECKING:
    from ..state.state import StateView

LoadLiquidClassCommandType = Literal["loadLiquidClass"]


class LoadLiquidClassParams(BaseModel):
    """Payload required to load a liquid into a well."""

    pipetteId: str = Field(
        ...,
        description="Unique identifier of pipette to use with liquid class.",
    )
    tiprackId: str = Field(
        ...,
        description="Unique identifier of tip rack to use with liquid class.",
    )
    aspirateProperties: AspirateProperties
    singleDispenseProperties: SingleDispenseProperties
    multiDispenseProperties: Optional[MultiDispenseProperties]
    liquidClassId: Optional[str] = Field(
        None,
        description="An optional ID to assign to this liquid class. If None, an ID "
        "will be generated.",
    )


class LoadLiquidClassResult(BaseModel):
    """Result data from the execution of a LoadLiquidClass command."""

    loadedLiquidClass: ImmutableLiquidClass = Field(
        ..., description="An immutable liquid class created from the load params."
    )


class LoadLiquidClassImplementation(
    AbstractCommandImpl[LoadLiquidClassParams, SuccessData[LoadLiquidClassResult, None]]
):
    """Load liquid command implementation."""

    def __init__(self, state_view: StateView, **kwargs: object) -> None:
        self._state_view = state_view

    async def execute(
        self, params: LoadLiquidClassParams
    ) -> SuccessData[LoadLiquidClassResult, None]:
        """Load data necessary for a liquid class."""

        liq_class_hash = "create-a-hash"
        existing_liq_class = self._state_view.liquid.get_liq_class_by_hash(
            liq_class_hash
        )
        if existing_liq_class:
            liq_class = existing_liq_class
        else:
            liq_class = ImmutableLiquidClass(
                id="get-a-uuid",
                hash="create-a-hash",
                pipetteId=params.pipetteId,
                tiprackId=params.tiprackId,
                aspirateProperties=params.aspirateProperties,
                singleDispenseProperties=params.singleDispenseProperties,
                multiDispenseProperties=params.multiDispenseProperties,
            )
        # **** TODO: save liquid class to state *****

        return SuccessData(
            public=LoadLiquidClassResult(
                loadedLiquidClass=liq_class,
            ),
            private=None,
        )


class LoadLiquidClass(
    BaseCommand[LoadLiquidClassParams, LoadLiquidClassResult, ErrorOccurrence]
):
    """Load liquid command resource model."""

    commandType: LoadLiquidClassCommandType = "loadLiquidClass"
    params: LoadLiquidClassParams
    result: Optional[LoadLiquidClassResult]

    _ImplementationCls: Type[
        LoadLiquidClassImplementation
    ] = LoadLiquidClassImplementation


class LoadLiquidClassCreate(BaseCommandCreate[LoadLiquidClassParams]):
    """Load liquid command creation request."""

    commandType: LoadLiquidClassCommandType = "loadLiquidClass"
    params: LoadLiquidClassParams

    _CommandCls: Type[LoadLiquidClass] = LoadLiquidClass
