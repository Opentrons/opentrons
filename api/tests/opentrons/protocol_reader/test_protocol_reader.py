"""Tests for the ProtocolReader interface."""
import pytest
import io
from dataclasses import dataclass
from decoy import Decoy, matchers
from pathlib import Path
from typing import IO, Optional

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.models import LabwareDefinition

from opentrons.protocol_reader import (
    ProtocolReader,
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    PythonProtocolConfig,
    ProtocolFilesInvalidError,
)

from opentrons.protocol_reader.input_file import AbstractInputFile
from opentrons.protocol_reader.file_reader_writer import (
    FileReaderWriter,
    FileReadError,
    BufferedFile,
)
from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
    MainFile,
    LabwareFile,
    RoleAnalysisError,
)
from opentrons.protocol_reader.config_analyzer import (
    ConfigAnalyzer,
    ConfigAnalysis,
    ConfigAnalysisError,
)

from opentrons_shared_data.protocol.models import protocol_schema_v6


@dataclass(frozen=True)
class InputFile(AbstractInputFile):
    """Concrete input file data model."""

    filename: str
    file: IO[bytes]


@pytest.fixture
def file_reader_writer(decoy: Decoy) -> FileReaderWriter:
    """Get a mocked out FileReaderWriter."""
    return decoy.mock(cls=FileReaderWriter)


@pytest.fixture
def role_analyzer(decoy: Decoy) -> RoleAnalyzer:
    """Get a mocked out RoleAnalyzer."""
    return decoy.mock(cls=RoleAnalyzer)


@pytest.fixture
def config_analyzer(decoy: Decoy) -> ConfigAnalyzer:
    """Get a mocked out ConfigAnalyzer."""
    return decoy.mock(cls=ConfigAnalyzer)


@pytest.fixture
def subject(
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
) -> ProtocolReader:
    """Create a ProtocolReader test subject."""
    return ProtocolReader(
        file_reader_writer=file_reader_writer,
        role_analyzer=role_analyzer,
        config_analyzer=config_analyzer,
    )


async def test_read_files(
    decoy: Decoy,
    tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    subject: ProtocolReader,
) -> None:
    """It should read a single file protocol source."""
    input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )
    buffered_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        data=None,
        path=None,
    )
    main_file = MainFile(
        name="protocol.py",
        contents=b"# hello world",
        path=None,
    )
    labware_data = LabwareDefinition.construct()  # type: ignore[call-arg]
    labware_file = LabwareFile(
        name="labware.json", contents=b"", data=labware_data, path=None
    )
    analyzed_roles = RoleAnalysis(
        main_file=main_file,
        labware_files=[labware_file],
        labware_definitions=[labware_data],
    )
    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)
    decoy.when(config_analyzer.analyze(main_file)).then_return(analyzed_config)

    result = await subject.read_and_save(files=[input_file], directory=tmp_path)

    assert result == ProtocolSource(
        directory=tmp_path,
        main_file=tmp_path / "protocol.py",
        files=[
            ProtocolSourceFile(
                path=tmp_path / "protocol.py",
                role=ProtocolFileRole.MAIN,
            ),
            ProtocolSourceFile(
                path=tmp_path / "labware.json",
                role=ProtocolFileRole.LABWARE,
            ),
        ],
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
        labware_definitions=[labware_data],
    )

    decoy.verify(
        await file_reader_writer.write(
            directory=tmp_path,
            files=[main_file, labware_file],
        )
    )


async def test_read_error(
    decoy: Decoy,
    tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    subject: ProtocolReader,
) -> None:
    """It should catch read/parse errors."""
    input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )

    decoy.when(await file_reader_writer.read([input_file])).then_raise(
        FileReadError("oh no")
    )

    with pytest.raises(ProtocolFilesInvalidError, match="oh no"):
        await subject.read_and_save(directory=tmp_path, files=[input_file])


async def test_role_error(
    decoy: Decoy,
    tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    subject: ProtocolReader,
) -> None:
    """It should catch role analysis errors."""
    input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )
    buffered_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        data=None,
        path=None,
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_raise(
        RoleAnalysisError("oh no")
    )

    with pytest.raises(ProtocolFilesInvalidError, match="oh no"):
        await subject.read_and_save(directory=tmp_path, files=[input_file])


async def test_config_error(
    decoy: Decoy,
    tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    subject: ProtocolReader,
) -> None:
    """It should catch config analysis errors."""
    input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )
    buffered_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        data=None,
        path=None,
    )
    main_file = MainFile(
        name="protocol.py",
        contents=b"# hello world",
        path=None,
    )
    analyzed_roles = RoleAnalysis(
        main_file=main_file,
        labware_files=[],
        labware_definitions=[],
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)
    decoy.when(config_analyzer.analyze(main_file)).then_raise(
        ConfigAnalysisError("oh no")
    )

    with pytest.raises(ProtocolFilesInvalidError, match="oh no"):
        await subject.read_and_save(directory=tmp_path, files=[input_file])


@pytest.mark.parametrize("directory", [None, Path("/some/dir")])
async def test_read_files_no_copy(
    decoy: Decoy,
    directory: Optional[Path],
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    subject: ProtocolReader,
) -> None:
    """It should read a single file protocol source without copying elsewhere."""
    input_file = Path("/dev/null/protocol.py")

    buffered_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        data=None,
        path=Path("/dev/null/protocol.py"),
    )
    main_file = MainFile(
        name="protocol.py",
        contents=b"# hello world",
        path=Path("/dev/null/protocol.py"),
    )

    analyzed_roles = RoleAnalysis(
        main_file=main_file, labware_files=[], labware_definitions=[]
    )
    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)
    decoy.when(config_analyzer.analyze(main_file)).then_return(analyzed_config)

    result = await subject.read_saved(files=[input_file], directory=directory)

    assert result == ProtocolSource(
        directory=directory,
        main_file=Path("/dev/null/protocol.py"),
        files=[
            ProtocolSourceFile(
                path=Path("/dev/null/protocol.py"),
                role=ProtocolFileRole.MAIN,
            ),
        ],
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
        labware_definitions=[],
    )

    decoy.verify(
        await file_reader_writer.write(
            directory=matchers.Anything(),
            files=matchers.Anything(),
        ),
        times=0,
    )


async def test_json_protocol_error(decoy: Decoy, tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    subject: ProtocolReader,
) -> None:
    """It should catch config analysis errors."""
    labware = {
        "labware-id-1": protocol_schema_v6.Labware(definitionId="definition-1"),
        "labware-id-2": protocol_schema_v6.Labware(definitionId="definition-2"),
    }
    pipettes = {"pipetteId": protocol_schema_v6.Pipette(name="pipette-1")}
    commands = [
        protocol_schema_v6.Command(
            commandType="loadLabware",
            params=protocol_schema_v6.Params(labwareId="labware-id-3"),
        ),
        protocol_schema_v6.Command(
            commandType="loadPipette",
            params=protocol_schema_v6.Params(pipetteId="pipetteId"),
        ),
    ]
    protocol = protocol_schema_v6.ProtocolSchemaV6.construct(  # type: ignore[call-arg]
        labware=labware, commands=commands, pipettes=pipettes
    )
    input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )
    buffered_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        data=None,
        path=None,
    )
    main_file = MainFile(
        name="protocol.py",
        contents=b"# hello world",
        path=None,
        data=protocol
    )
    analyzed_roles = RoleAnalysis(
        main_file=main_file,
        labware_files=[],
        labware_definitions=[],
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)

    with pytest.raises(ProtocolFilesInvalidError, match="missing loadLabware id in referencing parent data model."):
        await subject.read_and_save(directory=tmp_path, files=[input_file])
