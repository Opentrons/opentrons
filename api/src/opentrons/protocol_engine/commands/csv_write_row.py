"""Command models to add a row to an extant csv."""

from __future__ import annotations

import csv
from io import StringIO
from typing import TYPE_CHECKING, List, Optional

from pydantic import BaseModel, Field
from typing_extensions import Literal, Type

from opentrons_shared_data.data_files import MimeType

from ..errors.error_occurrence import ErrorOccurrence
from ..resources import FileProvider
from ..resources.file_provider import (
    UserDefinedCSVCmdFileNameMetadata,
)
from ..state import update_types
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView


CSVWriteRowCommandType = Literal["csvWriteRow"]


class CSVWriteRowParams(BaseModel):
    """Input parameters for appending data to a csv."""

    fileId: str = Field(..., description="File ID of the csv to write to.")
    rowData: List[str] = Field(..., description="Information to write to the row.")


class CSVWriteRowResult(BaseModel):
    """Result data from appending data to a csv."""

    pass


class CSVWriteRowImpl(
    AbstractCommandImpl[CSVWriteRowParams, SuccessData[CSVWriteRowResult]]
):
    """Execution implementation adding a row to a csv."""

    def __init__(
        self,
        state_view: StateView,
        file_provider: FileProvider,
        **unused_dependencies: object,
    ) -> None:
        self._state_view = state_view
        self._file_provider = file_provider

    async def execute(
        self, params: CSVWriteRowParams
    ) -> SuccessData[CSVWriteRowResult]:
        """Initiate a data append."""
        state_update = update_types.StateUpdate()
        csv_data = self._state_view.files.get_csv_file_info(params.fileId)
        output = StringIO()
        writer = csv.writer(output, delimiter=",")
        writer.writerow(params.rowData)
        csv_bytes = output.getvalue().encode("utf-8")

        this_cmd_id = self._state_view.commands.get_running_command_id()
        prev_cmd = self._state_view.commands.get_most_recently_finalized_command()
        prev_cmd_id = prev_cmd.command.id if prev_cmd is not None else None

        file_info = await self._file_provider.write_file(
            data=csv_bytes,
            mime_type=MimeType.TEXT_CSV,
            command_metadata=UserDefinedCSVCmdFileNameMetadata(
                filename=csv_data.name,
                command_id=this_cmd_id or "",
                prev_command_id=prev_cmd_id or "",
                file_id=params.fileId,
            ),
        )
        state_update.update_csv(file_info, len(params.rowData))

        return SuccessData(
            public=CSVWriteRowResult(),
            state_update=state_update,
        )


class CSVWriteRow(BaseCommand[CSVWriteRowParams, CSVWriteRowResult, ErrorOccurrence]):
    """A command to write to a generic csv file."""

    commandType: CSVWriteRowCommandType = "csvWriteRow"
    params: CSVWriteRowParams
    result: Optional[CSVWriteRowResult] = None

    _ImplementationCls: Type[CSVWriteRowImpl] = CSVWriteRowImpl


class CSVWriteRowCreate(BaseCommandCreate[CSVWriteRowParams]):
    """A request to write to a generic csv file."""

    commandType: CSVWriteRowCommandType = "csvWriteRow"
    params: CSVWriteRowParams

    _CommandCls: Type[CSVWriteRow] = CSVWriteRow
