"""Tests for runs download router."""

import io
import json
import zipfile
from collections.abc import AsyncIterable
from datetime import datetime, timezone
from pathlib import Path

import pytest
from decoy import Decoy

from opentrons.protocol_engine import CommandSlice
from opentrons.protocol_engine import commands as pe_commands
from opentrons.protocol_engine import types as pe_types
from opentrons.types import DeckSlotName
from opentrons_shared_data.data_files import (
    CmdDataFileInfo,
    DataFileInfo,
    DataFileInfoWithCommands,
    MimeType,
)

from robot_server.data_files.data_files_store import (
    DataFilesByRunInfo,
    DataFilesStore,
    DataFileWithCommandsInfoSlice,
)
from robot_server.errors.error_responses import ApiError
from robot_server.protocols.protocol_store import ProtocolNotFoundError, ProtocolStore
from robot_server.runs.router.file_download_router import download_run_files
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import Run, RunNotFoundError
from robot_server.runs.run_store import RunStore


def _make_home_command() -> pe_commands.Command:
    return pe_commands.Home(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=datetime(2024, 6, 20, 10, 30, 15, tzinfo=timezone.utc),
        startedAt=datetime(2024, 6, 20, 10, 30, 16, tzinfo=timezone.utc),
        completedAt=datetime(2024, 6, 20, 10, 30, 17, tzinfo=timezone.utc),
        params=pe_commands.HomeParams(),
        result=pe_commands.HomeResult(),
    )


def _stub_empty_output_files(decoy: Decoy, data_files_store: DataFilesStore) -> None:
    decoy.when(data_files_store.get_data_files_by_run_id("run-id")).then_return(
        DataFilesByRunInfo(input_files=[], output_files=[])
    )


async def _collect_zip_bytes(body_iterator: AsyncIterable[bytes | str]) -> bytes:
    chunks: list[bytes] = []
    async for chunk in body_iterator:
        assert isinstance(chunk, bytes)
        chunks.append(chunk)
    return b"".join(chunks)


def _stub_run_record_for_download(
    decoy: Decoy,
    run_data_manager: RunDataManager,
    *,
    run_id: str = "run-id",
    labware_offsets: list[pe_types.LabwareOffset] | None = None,
    run_time_parameters: list[pe_types.RunTimeParameter] | None = None,
) -> Run:
    mock_run_record = decoy.mock(cls=Run)
    decoy.when(mock_run_record.model_dump(mode="json", by_alias=True)).then_return(
        {"id": run_id, "protocolId": "protocol-id"}
    )
    decoy.when(mock_run_record.labwareOffsets).then_return(labware_offsets or [])
    decoy.when(mock_run_record.runTimeParameters).then_return(run_time_parameters or [])
    decoy.when(run_data_manager.get(run_id)).then_return(mock_run_record)

    command = _make_home_command()
    empty_slice = CommandSlice(commands=[], cursor=0, total_length=1)
    full_slice = CommandSlice(commands=[command], cursor=0, total_length=1)
    decoy.when(
        run_data_manager.get_commands_slice(
            run_id=run_id,
            cursor=0,
            length=0,
            include_fixit_commands=True,
        )
    ).then_return(empty_slice)
    decoy.when(
        run_data_manager.get_commands_slice(
            run_id=run_id,
            cursor=0,
            length=1,
            include_fixit_commands=True,
        )
    ).then_return(full_slice)
    return mock_run_record


async def test_download_run_files_with_images_protocol_run_log_and_offsets(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_run_data_manager: RunDataManager,
    mock_protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should zip images, protocol file, run log, and labware offsets."""
    data_files_store = decoy.mock(cls=DataFilesStore)

    image1_path = tmp_path / "image1.jpeg"
    image2_path = tmp_path / "image2.jpeg"
    image1_path.write_bytes(b"fake image data 1")
    image2_path.write_bytes(b"fake image data 2")

    protocol_path = tmp_path / "my_protocol.py"
    protocol_path.write_text("metadata = {'protocolName': 'Test'}\n")
    csv_path = tmp_path / "plate_read450nm.csv"
    csv_path.write_text("wl,a1\n450,0.12\n")
    rtp_csv_path = tmp_path / "samples.csv"
    rtp_csv_path.write_text("sample,well\nA,A1\n")

    file_info_1 = DataFileInfoWithCommands.model_construct(
        id="file-id-1",
        name="image1.jpeg",
        file_hash="hash1",
        created_at=datetime(year=2024, month=6, day=20),
        mime_type=MimeType.IMAGE_JPEG,
        path=str(image1_path),
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-1",
            prev_command_id="prev-1",
        ),
    )
    file_info_2 = DataFileInfoWithCommands.model_construct(
        id="file-id-2",
        name="image2.jpeg",
        file_hash="hash2",
        created_at=datetime(year=2024, month=6, day=21),
        mime_type=MimeType.IMAGE_JPEG,
        path=str(image2_path),
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-2",
            prev_command_id="prev-2",
        ),
    )

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(
        DataFileWithCommandsInfoSlice(
            file_info=[file_info_1, file_info_2], total_length=2
        )
    )
    decoy.when(data_files_store.get_data_files_by_run_id("run-id")).then_return(
        DataFilesByRunInfo(
            input_files=[],
            output_files=[
                DataFileInfo(
                    id="csv-file-id",
                    name="plate_read450nm.csv",
                    file_hash="csv-hash",
                    created_at=datetime(2024, 6, 20),
                    mime_type=MimeType.TEXT_CSV,
                    path=str(csv_path),
                    generated=True,
                    stored=True,
                ),
            ],
        )
    )

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return("protocol-id")
    decoy.when(mock_run.created_at).then_return(
        datetime(2024, 6, 20, 10, 30, 15, 354000, tzinfo=timezone.utc)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)

    mock_protocol = decoy.mock(name="protocol")
    mock_source = decoy.mock(name="source")
    mock_files = [decoy.mock(name="file")]
    mock_path = decoy.mock(name="path")
    decoy.when(mock_path.name).then_return("my_protocol.py")
    decoy.when(mock_files[0].path).then_return(mock_path)
    decoy.when(mock_source.files).then_return(mock_files)
    decoy.when(mock_source.metadata).then_return({"protocolName": "pcrprep-standard"})
    decoy.when(mock_source.main_file).then_return(protocol_path)
    decoy.when(mock_protocol.source).then_return(mock_source)
    decoy.when(mock_protocol_store.get("protocol-id")).then_return(mock_protocol)

    labware_offset = pe_types.LabwareOffset(
        id="labware-offset-id",
        createdAt=datetime(2024, 6, 20, 10, 30, 15, tzinfo=timezone.utc),
        definitionUri="opentrons/biorad_96_wellplate_200ul_pcr/1",
        location=pe_types.LegacyLabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=pe_types.LabwareOffsetVector(x=1.11, y=2.22, z=3.33),
    )
    rtp_param = pe_types.CSVParameter(
        variableName="csv_data",
        displayName="CSV Data",
        file=pe_types.FileInfo(id="rtp-file-id", name="samples.csv"),
    )
    decoy.when(data_files_store.get("rtp-file-id")).then_return(
        DataFileInfo(
            id="rtp-file-id",
            name="samples.csv",
            file_hash="rtp-hash",
            created_at=datetime(2024, 6, 20),
            mime_type=MimeType.TEXT_CSV,
            path=str(rtp_csv_path),
            generated=False,
            stored=True,
        )
    )
    _stub_run_record_for_download(
        decoy,
        mock_run_data_manager,
        labware_offsets=[labware_offset],
        run_time_parameters=[rtp_param],
    )

    result = await download_run_files(
        runId="run-id",
        run_store=mock_run_store,
        run_data_manager=mock_run_data_manager,
        data_files_store=data_files_store,
        protocol_store=mock_protocol_store,
    )

    assert result.media_type == "application/zip"
    assert "attachment" in result.headers["Content-Disposition"]
    assert ".zip" in result.headers["Content-Disposition"]

    zip_bytes = await _collect_zip_bytes(result.body_iterator)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = set(zf.namelist())
        assert "images/image1.jpeg" in names
        assert "images/image2.jpeg" in names
        assert "my_protocol.py" in names
        assert "samples.csv" in names
        assert "pcrprep-standard_2024-06-20T10_30_15.354Z.json" in names
        assert "my_protocol_2024-06-20T10_30_15.354Z_offsetdata.json" in names
        assert (
            "my_protocol_2024-06-20T10_30_15.354Z_output/"
            "csv-file-id_plate_read450nm.csv"
        ) in names
        assert zf.read("images/image1.jpeg") == b"fake image data 1"
        assert zf.read("my_protocol.py") == protocol_path.read_bytes()
        assert zf.read("samples.csv") == rtp_csv_path.read_bytes()
        assert (
            zf.read(
                "my_protocol_2024-06-20T10_30_15.354Z_output/"
                "csv-file-id_plate_read450nm.csv"
            )
            == csv_path.read_bytes()
        )

        run_log = json.loads(zf.read("pcrprep-standard_2024-06-20T10_30_15.354Z.json"))
        assert run_log["data"]["id"] == "run-id"
        assert run_log["commands"]["meta"]["totalLength"] == 1
        assert len(run_log["commands"]["data"]) == 1

        offsets = json.loads(
            zf.read("my_protocol_2024-06-20T10_30_15.354Z_offsetdata.json")
        )
        assert len(offsets) == 1
        assert offsets[0]["definitionUri"] == (
            "opentrons/biorad_96_wellplate_200ul_pcr/1"
        )
        assert offsets[0]["vector"] == {"x": 1.11, "y": 2.22, "z": 3.33}


async def test_download_run_files_protocol_json_keeps_extension(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_run_data_manager: RunDataManager,
    mock_protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should keep the .json extension for JSON protocol files."""
    data_files_store = decoy.mock(cls=DataFilesStore)

    protocol_path = tmp_path / "my_protocol.json"
    protocol_path.write_text('{"metadata": {"protocolName": "JSON Proto"}}')

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[], total_length=0))
    _stub_empty_output_files(decoy, data_files_store)

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return("protocol-id")
    decoy.when(mock_run.created_at).then_return(
        datetime(2024, 6, 20, 10, 30, 15, tzinfo=timezone.utc)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)

    mock_protocol = decoy.mock(name="protocol")
    mock_source = decoy.mock(name="source")
    mock_files = [decoy.mock(name="file")]
    mock_path = decoy.mock(name="path")
    decoy.when(mock_path.name).then_return("my_protocol.json")
    decoy.when(mock_files[0].path).then_return(mock_path)
    decoy.when(mock_source.files).then_return(mock_files)
    decoy.when(mock_source.metadata).then_return({"protocolName": "JSON Proto"})
    decoy.when(mock_source.main_file).then_return(protocol_path)
    decoy.when(mock_protocol.source).then_return(mock_source)
    decoy.when(mock_protocol_store.get("protocol-id")).then_return(mock_protocol)

    # Skip run log so this test stays focused on protocol naming.
    decoy.when(mock_run_data_manager.get("run-id")).then_raise(RuntimeError("skip"))

    result = await download_run_files(
        runId="run-id",
        run_store=mock_run_store,
        run_data_manager=mock_run_data_manager,
        data_files_store=data_files_store,
        protocol_store=mock_protocol_store,
    )

    zip_bytes = await _collect_zip_bytes(result.body_iterator)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        assert "my_protocol.json" in zf.namelist()


async def test_download_run_files_skips_missing_protocol_silently(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_run_data_manager: RunDataManager,
    mock_protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should omit a missing protocol file and still return images."""
    data_files_store = decoy.mock(cls=DataFilesStore)

    image_path = tmp_path / "image1.jpeg"
    image_path.write_bytes(b"fake image data")

    file_info = DataFileInfoWithCommands.model_construct(
        id="file-id-1",
        name="image1.jpeg",
        file_hash="hash1",
        created_at=datetime(year=2024, month=6, day=20),
        mime_type=MimeType.IMAGE_JPEG,
        path=str(image_path),
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-1",
            prev_command_id="prev-1",
        ),
    )

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[file_info], total_length=1))
    _stub_empty_output_files(decoy, data_files_store)

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return("protocol-id")
    decoy.when(mock_run.created_at).then_return(
        datetime(2024, 6, 20, 10, 30, 15, tzinfo=timezone.utc)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)
    decoy.when(mock_protocol_store.get("protocol-id")).then_raise(
        ProtocolNotFoundError("protocol-id")
    )
    decoy.when(mock_run_data_manager.get("run-id")).then_raise(RuntimeError("skip"))

    result = await download_run_files(
        runId="run-id",
        run_store=mock_run_store,
        run_data_manager=mock_run_data_manager,
        data_files_store=data_files_store,
        protocol_store=mock_protocol_store,
    )

    zip_bytes = await _collect_zip_bytes(result.body_iterator)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = zf.namelist()
        assert "images/image1.jpeg" in names
        assert not any(
            name.endswith(".py") or (name.endswith(".json") and "/" not in name)
            for name in names
            if not name.startswith("images/")
        )


async def test_download_run_files_skips_missing_run_log_and_offsets_silently(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_run_data_manager: RunDataManager,
    mock_protocol_store: ProtocolStore,
    tmp_path: Path,
) -> None:
    """It should omit failed run log/offsets and still return other files."""
    data_files_store = decoy.mock(cls=DataFilesStore)
    image_path = tmp_path / "image1.jpeg"
    image_path.write_bytes(b"fake image data")

    file_info = DataFileInfoWithCommands.model_construct(
        id="file-id-1",
        name="image1.jpeg",
        file_hash="hash1",
        created_at=datetime(year=2024, month=6, day=20),
        mime_type=MimeType.IMAGE_JPEG,
        path=str(image_path),
        generated=True,
        stored=True,
        command_info=CmdDataFileInfo(
            command_id="command-1",
            prev_command_id="prev-1",
        ),
    )
    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[file_info], total_length=1))
    _stub_empty_output_files(decoy, data_files_store)

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return(None)
    decoy.when(mock_run.created_at).then_return(
        datetime(2024, 6, 20, 10, 30, 15, tzinfo=timezone.utc)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)
    decoy.when(mock_run_data_manager.get("run-id")).then_raise(RuntimeError("boom"))

    result = await download_run_files(
        runId="run-id",
        run_store=mock_run_store,
        run_data_manager=mock_run_data_manager,
        data_files_store=data_files_store,
        protocol_store=mock_protocol_store,
    )

    zip_bytes = await _collect_zip_bytes(result.body_iterator)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        assert "images/image1.jpeg" in zf.namelist()
        assert not any(name.endswith(".json") for name in zf.namelist())


async def test_download_run_files_run_not_found(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_run_data_manager: RunDataManager,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 404 when the run does not exist."""
    data_files_store = decoy.mock(cls=DataFilesStore)
    decoy.when(mock_run_store.get("missing-run")).then_raise(
        RunNotFoundError(run_id="missing-run")
    )

    with pytest.raises(ApiError) as exc_info:
        await download_run_files(
            runId="missing-run",
            run_store=mock_run_store,
            run_data_manager=mock_run_data_manager,
            data_files_store=data_files_store,
            protocol_store=mock_protocol_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_download_run_files_no_content(
    decoy: Decoy,
    mock_run_store: RunStore,
    mock_run_data_manager: RunDataManager,
    mock_protocol_store: ProtocolStore,
) -> None:
    """It should 404 when the run exists but has nothing downloadable."""
    data_files_store = decoy.mock(cls=DataFilesStore)

    mock_run = decoy.mock(name="run_data")
    decoy.when(mock_run.run_id).then_return("run-id")
    decoy.when(mock_run.protocol_id).then_return(None)
    decoy.when(mock_run.created_at).then_return(
        datetime(2024, 6, 20, 10, 30, 15, tzinfo=timezone.utc)
    )
    decoy.when(mock_run_store.get("run-id")).then_return(mock_run)

    decoy.when(
        data_files_store.get_files_info_by_run_mime_type(
            run_id="run-id",
            mime_type=MimeType.IMAGE_JPEG,
            offset=0,
            limit=None,
        )
    ).then_return(DataFileWithCommandsInfoSlice(file_info=[], total_length=0))
    _stub_empty_output_files(decoy, data_files_store)
    decoy.when(mock_run_data_manager.get("run-id")).then_raise(RuntimeError("skip"))

    with pytest.raises(ApiError) as exc_info:
        await download_run_files(
            runId="run-id",
            run_store=mock_run_store,
            run_data_manager=mock_run_data_manager,
            data_files_store=data_files_store,
            protocol_store=mock_protocol_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "NoDownloadContent"
