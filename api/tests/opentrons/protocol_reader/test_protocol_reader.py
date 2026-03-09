"""Tests for the ProtocolReader interface."""
from __future__ import annotations

import pytest
from decoy import Decoy, matchers
from pathlib import Path
from typing import Optional

from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.parse import PythonParseMode

from opentrons.protocol_reader import (
    ProtocolReader,
    ProtocolSource,
    ProtocolSourceFile,
    ProtocolFileRole,
    PythonProtocolConfig,
    FileHasher,
)
from opentrons.protocol_reader.file_reader_writer import (
    FileReaderWriter,
    BufferedFile,
)
from opentrons.protocol_reader.role_analyzer import (
    RoleAnalyzer,
    RoleAnalysis,
)
from opentrons.protocol_reader.file_identifier import (
    FileIdentifier,
    IdentifiedPythonMain,
    IdentifiedLabwareDefinition,
    IdentifiedData,
)
from opentrons.protocol_reader.file_format_validator import FileFormatValidator


@pytest.fixture
def file_reader_writer(decoy: Decoy) -> FileReaderWriter:
    """Get a mocked out FileReaderWriter."""
    return decoy.mock(cls=FileReaderWriter)


@pytest.fixture
def file_identifier(decoy: Decoy) -> FileIdentifier:
    """Get a mocked out FileIdentifier."""
    return decoy.mock(cls=FileIdentifier)


@pytest.fixture
def role_analyzer(decoy: Decoy) -> RoleAnalyzer:
    """Get a mocked out RoleAnalyzer."""
    return decoy.mock(cls=RoleAnalyzer)


@pytest.fixture
def file_format_validator(decoy: Decoy) -> FileFormatValidator:
    """Get a mocked out FileFormatValidator."""
    return decoy.mock(cls=FileFormatValidator)


@pytest.fixture
def file_hasher(decoy: Decoy) -> FileHasher:
    """Get a mocked out FileHasher."""
    return decoy.mock(cls=FileHasher)


@pytest.fixture
def subject(
    file_reader_writer: FileReaderWriter,
    role_analyzer: RoleAnalyzer,
    file_identifier: FileIdentifier,
    file_format_validator: FileFormatValidator,
    file_hasher: FileHasher,
) -> ProtocolReader:
    """Create a ProtocolReader test subject."""
    return ProtocolReader(
        file_reader_writer=file_reader_writer,
        role_analyzer=role_analyzer,
        file_identifier=file_identifier,
        file_format_validator=file_format_validator,
        file_hasher=file_hasher,
    )


async def test_save(
    decoy: Decoy,
    tmp_path: Path,
    file_reader_writer: FileReaderWriter,
    file_identifier: FileIdentifier,
    role_analyzer: RoleAnalyzer,
    file_format_validator: FileFormatValidator,
    subject: ProtocolReader,
) -> None:
    """It should compute a single file protocol source."""
    buffered_main_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        path=None,
    )
    buffered_labware_file = BufferedFile(
        name="labware.json",
        contents=b"wow",
        path=None,
    )
    buffered_data_file = BufferedFile(
        name="data.txt",
        contents=b"beep boop",
        path=None,
    )

    main_file = IdentifiedPythonMain(
        original_file=buffered_main_file,
        api_level=APIVersion(123, 456),
        robot_type="OT-2 Standard",
        metadata={"hey": "there"},
    )
    labware_file = IdentifiedLabwareDefinition(
        original_file=buffered_labware_file,
        unvalidated_json={},
    )
    data_file = IdentifiedData(original_file=buffered_data_file)

    role_analysis = RoleAnalysis(
        main_file=main_file, labware_files=[labware_file], data_files=[data_file]
    )

    decoy.when(
        await file_identifier.identify(
            [buffered_main_file, buffered_labware_file, buffered_data_file],
            python_parse_mode=PythonParseMode.NORMAL,
        )
    ).then_return([main_file, labware_file, data_file])
    decoy.when(role_analyzer.analyze([main_file, labware_file, data_file])).then_return(
        role_analysis
    )

    result = await subject.save(
        files=[buffered_main_file, buffered_labware_file, buffered_data_file],
        directory=tmp_path,
        content_hash="abc123",
    )

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
            ProtocolSourceFile(
                path=tmp_path / "data.txt",
                role=ProtocolFileRole.DATA,
            ),
        ],
        metadata={"hey": "there"},
        robot_type="OT-2 Standard",
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
        content_hash="abc123",
    )

    decoy.verify(
        await file_format_validator.validate([main_file, labware_file, data_file]),
        await file_reader_writer.write(
            directory=tmp_path,
            files=[buffered_main_file, buffered_labware_file, buffered_data_file],
        ),
    )


@pytest.mark.parametrize("directory", [None, Path("/some/dir")])
@pytest.mark.parametrize(
    "files_are_prevalidated, validator_expected_times_called", [(True, 0), (False, 1)]
)
async def test_read_saved(
    decoy: Decoy,
    directory: Optional[Path],
    files_are_prevalidated: bool,
    validator_expected_times_called: int,
    file_reader_writer: FileReaderWriter,
    file_identifier: FileIdentifier,
    role_analyzer: RoleAnalyzer,
    file_format_validator: FileFormatValidator,
    file_hasher: FileHasher,
    subject: ProtocolReader,
) -> None:
    """It should read a single file protocol source without copying elsewhere."""
    input_main_file = Path("/path/to/protocol.py")
    input_labware_file = Path("/path/to/labware.json")
    input_data_file = Path("/path/to/data.txt")

    buffered_main_file = BufferedFile(
        name="protocol.py",
        contents=b"# hello world",
        path=Path("/path/to/protocol.py"),
    )
    buffered_labware_file = BufferedFile(
        name="labware.json",
        contents=b"wow",
        path=Path("/path/to/labware.json"),
    )
    buffered_data_file = BufferedFile(
        name="data.txt",
        contents=b"beep boop",
        path=Path("/path/to/data.txt"),
    )

    main_file = IdentifiedPythonMain(
        original_file=buffered_main_file,
        api_level=APIVersion(123, 456),
        robot_type="OT-2 Standard",
        metadata={"hey": "there"},
    )
    labware_file = IdentifiedLabwareDefinition(
        original_file=buffered_labware_file,
        unvalidated_json={},
    )
    data_file = IdentifiedData(original_file=buffered_data_file)

    role_analysis = RoleAnalysis(
        main_file=main_file,
        labware_files=[labware_file],
        data_files=[data_file],
    )

    decoy.when(
        await file_reader_writer.read(
            [input_main_file, input_labware_file, input_data_file]
        )
    ).then_return([buffered_main_file, buffered_labware_file, buffered_data_file])
    decoy.when(
        await file_identifier.identify(
            [buffered_main_file, buffered_labware_file, buffered_data_file],
            python_parse_mode=PythonParseMode.NORMAL,
        )
    ).then_return([main_file, labware_file, data_file])
    decoy.when(role_analyzer.analyze([main_file, labware_file, data_file])).then_return(
        role_analysis
    )
    decoy.when(
        await file_hasher.hash(
            [buffered_main_file, buffered_labware_file, buffered_data_file]
        )
    ).then_return("abc123")

    result = await subject.read_saved(
        files=[input_main_file, input_labware_file, input_data_file],
        directory=directory,
        files_are_prevalidated=files_are_prevalidated,
    )

    assert result == ProtocolSource(
        directory=directory,
        main_file=Path("/path/to/protocol.py"),
        files=[
            ProtocolSourceFile(
                path=Path("/path/to/protocol.py"),
                role=ProtocolFileRole.MAIN,
            ),
            ProtocolSourceFile(
                path=Path("/path/to/labware.json"),
                role=ProtocolFileRole.LABWARE,
            ),
            ProtocolSourceFile(
                path=Path("/path/to/data.txt"),
                role=ProtocolFileRole.DATA,
            ),
        ],
        metadata={"hey": "there"},
        robot_type="OT-2 Standard",
        config=PythonProtocolConfig(api_version=APIVersion(123, 456)),
        content_hash="abc123",
    )

    decoy.verify(
        await file_reader_writer.write(
            directory=matchers.Anything(),
            files=matchers.Anything(),
        ),
        times=0,
    )

    decoy.verify(
        await file_format_validator.validate([main_file, labware_file, data_file]),
        times=validator_expected_times_called,
    )
