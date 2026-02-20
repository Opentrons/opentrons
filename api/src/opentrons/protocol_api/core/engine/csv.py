from __future__ import annotations

from typing import TYPE_CHECKING, List

from ..csv import AbstractCSV
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient

if TYPE_CHECKING:
    from .protocol import ProtocolCore


class CSVCore(AbstractCSV):
    def __init__(
        self,
        file_id: str,
        columns: int,
        engine_client: EngineClient,
        protocol_core: ProtocolCore,
    ):
        self._file_id = file_id
        self._columns = columns
        self._protocol_core = protocol_core
        self._engine_client = engine_client

    def write_row(self, row: List[str]) -> None:
        """Add a new row to the csv file."""
        if len(row) > self._columns:
            raise RuntimeError("Too many data columns.")
        if len(row) < self._columns:
            # extend row to match columns
            row.extend([""] * (self._columns - len(row)))
        self._engine_client.execute_command(
            cmd.CSVWriteRowParams(
                fileId=self._file_id,
                rowData=row,
            ),
            command_annotations=self._protocol_core.annotation_ids,
        )
