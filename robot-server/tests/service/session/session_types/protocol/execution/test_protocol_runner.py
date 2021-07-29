import pytest
from pathlib import Path
from mock import MagicMock, patch, PropertyMock
from typing import List

from opentrons.api import Session
from opentrons.hardware_control import ThreadedAsyncLock

from robot_server.service.protocol.analyze import AnalysisResult, models
from robot_server.service.protocol.contents import Contents
from robot_server.service.protocol.protocol import (
    UploadedProtocol,
    UploadedProtocolData,
)
from robot_server.service.session.session_types.protocol.execution.protocol_runner import (  # noqa: E501
    ProtocolRunner,
)
from robot_server.util import FileMeta


@pytest.fixture
def uploaded_protocol_meta() -> UploadedProtocolData:
    mock_temp_dir = MagicMock()
    type(mock_temp_dir).name = PropertyMock(return_value="some_path")
    return UploadedProtocolData(
        identifier="None",
        contents=Contents(
            protocol_file=FileMeta(path=Path("/some_path/abc.py"), content_hash=""),
            directory=mock_temp_dir,
        ),
        analysis_result=AnalysisResult(
            meta=models.Meta(apiLevel="123"),
            required_equipment=models.RequiredEquipment(
                pipettes=[], labware=[], modules=[]
            ),
        ),
    )


@pytest.fixture
def mock_protocol(uploaded_protocol_meta):
    m = MagicMock(spec=UploadedProtocol)
    type(m).data = PropertyMock(return_value=uploaded_protocol_meta)
    m.get_contents.return_value = "my contents"
    return m


@pytest.fixture
def mock_context(mock_protocol):
    return mock_protocol.protocol_environment


@pytest.fixture
def protocol_runner(mock_protocol, loop, hardware):
    setattr(hardware, "sync", MagicMock())
    return ProtocolRunner(
        protocol=mock_protocol,
        loop=loop,
        hardware=hardware,
        motion_lock=ThreadedAsyncLock(),
    )


def test_load(protocol_runner, mock_context, uploaded_protocol_meta, mock_protocol):
    with patch.object(Session, "build_and_prep") as mock:
        protocol_runner.load()
        mock_context.assert_called_once()
        mock.assert_called_once_with(
            name=uploaded_protocol_meta.contents.protocol_file.path.name,
            contents=mock_protocol.get_contents(),
            hardware=protocol_runner._hardware.sync,
            loop=protocol_runner._loop,
            broker=protocol_runner._broker,
            motion_lock=protocol_runner._motion_lock,
            extra_labware=[],
        )


@pytest.mark.parametrize(
    argnames="func",
    argvalues=[
        ProtocolRunner.run,
        ProtocolRunner.simulate,
        ProtocolRunner.cancel,
        ProtocolRunner.pause,
        ProtocolRunner.resume,
    ],
)
def test_no_session_will_not_raise(func, protocol_runner, mock_context):
    func(protocol_runner)
    mock_context.assert_not_called()


@pytest.mark.parametrize(
    argnames="func,target",
    argvalues=[
        [ProtocolRunner.run, "run"],
        [ProtocolRunner.simulate, "refresh"],
        [ProtocolRunner.cancel, "stop"],
        [ProtocolRunner.pause, "pause"],
        [ProtocolRunner.resume, "resume"],
    ],
)
def test_session_calls(func, target, protocol_runner, mock_context):
    protocol_runner._session = MagicMock()
    func(protocol_runner)
    getattr(protocol_runner._session, target).assert_called_once()


def test_listeners(protocol_runner):
    results1: List[int] = []
    results2: List[int] = []
    protocol_runner.add_listener(results1.append)
    protocol_runner.add_listener(results2.append)
    protocol_runner._on_message(1)
    protocol_runner._on_message(2)
    assert results1 == [1, 2] == results2

    protocol_runner.remove_listener(results2.append)
    protocol_runner._on_message(3)
    assert results1 == [1, 2, 3]
    assert results2 == [1, 2]
