"""Tests for the ProtocolReader interface."""
import pytest
import io
from decoy import Decoy
from pathlib import Path

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

from opentrons.protocol_reader.input_file import InputFile
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
    tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
) -> ProtocolReader:
    """Create a ProtocolReader test subject."""
    return ProtocolReader(
        directory=tmp_path,
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
    )
    main_file = MainFile(name="protocol.py", contents=b"# hello world")
    labware_data = LabwareDefinition.construct()  # type: ignore[call-arg]
    labware_file = LabwareFile(name="labware.json", contents=b"", data=labware_data)
    analyzed_roles = RoleAnalysis(main_file=main_file, labware_files=[labware_file])
    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)
    decoy.when(config_analyzer.analyze(main_file)).then_return(analyzed_config)

    result = await subject.read(name="protocol-name", files=[input_file])

    assert result == ProtocolSource(
        directory=tmp_path / "protocol-name",
        main_file=tmp_path / "protocol-name" / "protocol.py",
        files=[
            ProtocolSourceFile(name="protocol.py", role=ProtocolFileRole.MAIN),
            ProtocolSourceFile(name="labware.json", role=ProtocolFileRole.LABWARE),
        ],
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
        labware=[labware_data],
    )

    decoy.verify(
        await file_reader_writer.write(
            directory=tmp_path / "protocol-name",
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
        await subject.read(name="protocol-name", files=[input_file])


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
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_raise(
        RoleAnalysisError("oh no")
    )

    with pytest.raises(ProtocolFilesInvalidError, match="oh no"):
        await subject.read(name="protocol-name", files=[input_file])


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
    )
    main_file = MainFile(
        name="protocol.py",
        contents=b"# hello world",
    )
    analyzed_roles = RoleAnalysis(main_file=main_file)

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)
    decoy.when(config_analyzer.analyze(main_file)).then_raise(
        ConfigAnalysisError("oh no")
    )

    with pytest.raises(ProtocolFilesInvalidError, match="oh no"):
        await subject.read(name="protocol-name", files=[input_file])
