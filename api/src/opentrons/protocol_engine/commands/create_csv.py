"""Command models to create a csv file for writing."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel, Field
from typing_extensions import Any, Literal, Type

from opentrons_shared_data.data_files import MimeType

from ..errors import (
    FileNameInvalidError,
)
from ..errors.error_occurrence import ErrorOccurrence
from ..resources import FileProvider
from ..resources.file_provider import (
    SPECIAL_CHARACTERS,
    UserDefinedCSVCmdFileNameMetadata,
)
from ..state import update_types
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView


CreateCSVCommandType = Literal["createCSV"]


def _remove_default(s: dict[str, Any]) -> None:
    s.pop("default", None)


class CreateCSVParams(BaseModel):
    """Input parameters to create csv."""

    fileName: str = Field(..., description="File name to use when creating a csv.")
    columns: int = Field(
        ..., description="How many columns are going to be used in this csv."
    )


class CreateCSVResult(BaseModel):
    """Result data creating a csv."""

    fileId: str = Field(..., description="File ID for the created csv file.")
    columns: int = Field(..., description="Number of columns in the csv.")


class CreateCSVImpl(AbstractCommandImpl[CreateCSVParams, SuccessData[CreateCSVResult]]):
    """Execution implementation of create csv."""

    def __init__(
        self,
        state_view: StateView,
        file_provider: FileProvider,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._file_provider = file_provider

    async def execute(self, params: CreateCSVParams) -> SuccessData[CreateCSVResult]:
        """Initiate an csv creation."""
        if set(SPECIAL_CHARACTERS).intersection(set(params.fileName)):
            raise FileNameInvalidError(
                message=f"Create CSV filename cannot contain character(s): {SPECIAL_CHARACTERS.intersection(set(params.fileName))}"
            )
        state_update = update_types.StateUpdate()

        this_cmd_id = self._state_view.commands.get_running_command_id()
        prev_cmd = self._state_view.commands.get_most_recently_finalized_command()
        prev_cmd_id = prev_cmd.command.id if prev_cmd is not None else None

        file_info = await self._file_provider.write_file(
            data=bytes(),
            mime_type=MimeType.TEXT_CSV,
            command_metadata=UserDefinedCSVCmdFileNameMetadata(
                filename=params.fileName or "",
                command_id=this_cmd_id or "",
                prev_command_id=prev_cmd_id or "",
                file_id=None,
            ),
        )
        file_id = file_info.id
        state_update.files_added = update_types.FilesAddedUpdate(file_ids=[file_id])
        state_update.update_csv(file_info, params.columns)

        return SuccessData(
            public=CreateCSVResult(fileId=file_id, columns=params.columns),
            state_update=state_update,
        )


class CreateCSV(BaseCommand[CreateCSVParams, CreateCSVResult, ErrorOccurrence]):
    """A command to create a generic csv file."""

    commandType: CreateCSVCommandType = "createCSV"
    params: CreateCSVParams
    result: Optional[CreateCSVResult] = None

    _ImplementationCls: Type[CreateCSVImpl] = CreateCSVImpl


class CreateCSVCreate(BaseCommandCreate[CreateCSVParams]):
    """A request to create a generic csv file."""

    commandType: CreateCSVCommandType = "createCSV"
    params: CreateCSVParams

    _CommandCls: Type[CreateCSV] = CreateCSV
