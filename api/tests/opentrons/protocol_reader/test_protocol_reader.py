"""Tests for the ProtocolReader interface."""
import pytest
import io
from decoy import Decoy
from pathlib import Path

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_reader import (
    ProtocolReader,
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    PythonProtocolConfig,
)

from opentrons.protocol_reader.input_file import InputFile, BufferedFile
from opentrons.protocol_reader.file_reader_writer import FileReaderWriter
from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
    RoleAnalyzedFile,
)
from opentrons.protocol_reader.config_analyzer import ConfigAnalyzer, ConfigAnalysis


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


async def test_read_file(
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
    analyzed_file = RoleAnalyzedFile(
        role=ProtocolFileRole.MAIN,
        name="protocol.py",
        contents=b"# hello world",
        data=None,
    )
    analyzed_roles = RoleAnalysis(main_file=analyzed_file, other_files=[])
    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(await file_reader_writer.read([input_file])).then_return([buffered_file])
    decoy.when(role_analyzer.analyze([buffered_file])).then_return(analyzed_roles)
    decoy.when(config_analyzer.analyze(analyzed_file)).then_return(analyzed_config)

    result = await subject.read(name="protocol-name", files=[input_file])

    assert result == ProtocolSource(
        directory=tmp_path / "protocol-name",
        main_file=tmp_path / "protocol-name" / "protocol.py",
        files=[ProtocolSourceFile(name="protocol.py", role=ProtocolFileRole.MAIN)],
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.verify(
        await file_reader_writer.write(
            directory=tmp_path / "protocol-name",
            files=[analyzed_file],
        )
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
    main_input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )
    data_input_file = InputFile(
        filename="data.csv",
        file=io.BytesIO(b",,,"),
    )
    main_buffered_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        data=None,
    )
    data_buffered_file = BufferedFile(name="data.csv", contents=b",,,", data=None)

    main_analyzed_file = RoleAnalyzedFile(
        role=ProtocolFileRole.MAIN,
        name="protocol.py",
        contents=b"# hello world",
        data=None,
    )
    data_analyzed_file = RoleAnalyzedFile(
        role=ProtocolFileRole.DATA,
        name="data.csv",
        contents=b",,,",
        data=None,
    )

    analyzed_roles = RoleAnalysis(
        main_file=main_analyzed_file,
        other_files=[data_analyzed_file],
    )

    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(
        await file_reader_writer.read([main_input_file, data_input_file])
    ).then_return([main_buffered_file, data_buffered_file])
    decoy.when(
        role_analyzer.analyze([main_buffered_file, data_buffered_file])
    ).then_return(analyzed_roles)

    decoy.when(config_analyzer.analyze(main_analyzed_file)).then_return(analyzed_config)

    result = await subject.read(
        name="protocol-name", files=[main_input_file, data_input_file]
    )

    assert result == ProtocolSource(
        directory=tmp_path / "protocol-name",
        main_file=tmp_path / "protocol-name" / "protocol.py",
        files=[
            ProtocolSourceFile(name="protocol.py", role=ProtocolFileRole.MAIN),
            ProtocolSourceFile(name="data.csv", role=ProtocolFileRole.DATA),
        ],
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.verify(
        await file_reader_writer.write(
            directory=tmp_path / "protocol-name",
            files=[main_analyzed_file, data_analyzed_file],
        )
    )
