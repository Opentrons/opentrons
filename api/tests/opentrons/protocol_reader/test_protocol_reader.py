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
    InputFile,
)

from opentrons.protocol_reader.input_reader import InputReader, BufferedFile
from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
    RoleAnalyzedFile,
)
from opentrons.protocol_reader.config_analyzer import ConfigAnalyzer, ConfigAnalysis
from opentrons.protocol_reader.file_writer import FileWriter


@pytest.fixture
def input_reader(decoy: Decoy) -> InputReader:
    """Get a mocked out InputReader."""
    return decoy.mock(cls=InputReader)


@pytest.fixture
def role_analyzer(decoy: Decoy) -> RoleAnalyzer:
    """Get a mocked out RoleAnalyzer."""
    return decoy.mock(cls=RoleAnalyzer)


@pytest.fixture
def config_analyzer(decoy: Decoy) -> ConfigAnalyzer:
    """Get a mocked out ConfigAnalyzer."""
    return decoy.mock(cls=ConfigAnalyzer)


@pytest.fixture
def file_writer(decoy: Decoy) -> FileWriter:
    """Get a mocked out FileWriter."""
    return decoy.mock(cls=FileWriter)


@pytest.fixture
def subject(
    tmp_path: Path,
    input_reader: InputReader,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    file_writer: FileWriter,
) -> ProtocolReader:
    """Create a ProtocolReader test subject."""
    return ProtocolReader(
        directory=tmp_path,
        input_reader=input_reader,
        role_analyzer=role_analyzer,
        config_analyzer=config_analyzer,
        file_writer=file_writer,
    )


async def test_read_file(
    decoy: Decoy,
    tmp_path: Path,
    input_reader: InputReader,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    file_writer: FileWriter,
    subject: ProtocolReader,
) -> None:
    """It should read a single file protocol source."""
    input_file = InputFile(
        filename="protocol.py",
        file=io.BytesIO(b"# hello world"),
    )
    buffered_file = BufferedFile(name="protocol.py", contents="# hello world")
    analyzed_file = RoleAnalyzedFile(
        role=ProtocolFileRole.MAIN,
        name="protocol.py",
        contents="# hello world",
    )
    analyzed_roles = RoleAnalysis(main_file=analyzed_file, other_files=[])
    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(await input_reader.read([input_file])).then_return([buffered_file])
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
        await file_writer.write(
            directory=tmp_path / "protocol-name",
            files=[analyzed_file],
        )
    )


async def test_read_files(
    decoy: Decoy,
    tmp_path: Path,
    input_reader: InputReader,
    role_analyzer: RoleAnalyzer,
    config_analyzer: ConfigAnalyzer,
    file_writer: FileWriter,
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
    main_buffered_file = BufferedFile(name="protocol.py", contents="# hello world")
    data_buffered_file = BufferedFile(name="data.csv", contents=",,,")

    main_analyzed_file = RoleAnalyzedFile(
        role=ProtocolFileRole.MAIN,
        name="protocol.py",
        contents="# hello world",
    )
    data_analyzed_file = RoleAnalyzedFile(
        role=ProtocolFileRole.DATA,
        name="data.csv",
        contents=",,,",
    )

    analyzed_roles = RoleAnalysis(
        main_file=main_analyzed_file,
        other_files=[data_analyzed_file],
    )

    analyzed_config = ConfigAnalysis(
        metadata={"hey": "there"},
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
    )

    decoy.when(await input_reader.read([main_input_file, data_input_file])).then_return(
        [main_buffered_file, data_buffered_file]
    )
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
        await file_writer.write(
            directory=tmp_path / "protocol-name",
            files=[main_analyzed_file, data_analyzed_file],
        )
    )
