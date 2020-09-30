import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, PropertyMock
import pytest
from opentrons.api import Session
from opentrons.hardware_control import ThreadedAsyncLock

from robot_server.service.protocol.protocol import UploadedProtocol, \
    UploadedProtocolMeta, FileMeta
from robot_server.service.session.session_types.protocol.execution. \
    protocol_runner import ProtocolRunnerContext, ProtocolRunner


@pytest.fixture
def mock_os_chdir():
    with patch.object(os, "chdir") as p:
        yield p


@pytest.fixture
def uploaded_protocol_meta():
    mock_temp_dir = MagicMock()
    type(mock_temp_dir).name = PropertyMock(return_value="some_path")
    return UploadedProtocolMeta(identifier="None",
                                protocol_file=FileMeta(
                                    path=Path("/some_path/abc.py"),
                                    content_hash=""
                                ),
                                directory=mock_temp_dir
                                )


@pytest.fixture
def mock_protocol(uploaded_protocol_meta):
    m = MagicMock(spec=UploadedProtocol)
    type(m).meta = PropertyMock(return_value=uploaded_protocol_meta)
    m.get_contents.return_value = "my contents"
    return m


@pytest.fixture
def mock_context():
    with patch('robot_server.service.session.session_types.protocol'
               '.execution.protocol_runner.ProtocolRunnerContext') as p:
        yield p


@pytest.fixture
def protocol_runner(mock_protocol, loop, hardware):
    return ProtocolRunner(protocol=mock_protocol,
                          loop=loop,
                          hardware=hardware,
                          motion_lock=ThreadedAsyncLock())


def test_load(protocol_runner, mock_context,
              uploaded_protocol_meta, mock_protocol):
    with patch.object(Session, "build_and_prep") as mock:
        protocol_runner.load()
        mock_context.assert_called_once()
        mock.assert_called_once_with(
            name=uploaded_protocol_meta.protocol_file.path.name,
            contents=mock_protocol.get_contents(),
            hardware=protocol_runner._hardware,
            loop=protocol_runner._loop,
            broker=protocol_runner._broker,
            motion_lock=protocol_runner._motion_lock,
            extra_labware={})


@pytest.mark.parametrize(argnames="func",
                         argvalues=[ProtocolRunner.run,
                                    ProtocolRunner.simulate,
                                    ProtocolRunner.cancel,
                                    ProtocolRunner.pause,
                                    ProtocolRunner.resume])
def test_no_session_will_not_raise(func, protocol_runner, mock_context):
    func(protocol_runner)
    mock_context.assert_not_called()


@pytest.mark.parametrize(argnames="func,target",
                         argvalues=[[ProtocolRunner.run, "run"],
                                    [ProtocolRunner.simulate, "refresh"],
                                    [ProtocolRunner.cancel, "stop"],
                                    [ProtocolRunner.pause, "pause"],
                                    [ProtocolRunner.resume, "resume"]])
def test_session_calls(func, target, protocol_runner, mock_context):
    protocol_runner._session = MagicMock()
    func(protocol_runner)
    getattr(protocol_runner._session, target).assert_called_once()


def test_listeners(protocol_runner):
    results1 = []
    results2 = []
    protocol_runner.add_listener(results1.append)
    protocol_runner.add_listener(results2.append)
    protocol_runner._on_message(1)
    protocol_runner._on_message(2)
    assert results1 == [1, 2] == results2

    protocol_runner.remove_listener(results2.append)
    protocol_runner._on_message(3)
    assert results1 == [1, 2, 3]
    assert results2 == [1, 2]


def test_protocol_runner_context(mock_protocol, uploaded_protocol_meta,
                                 mock_os_chdir):
    with ProtocolRunnerContext(mock_protocol) as context:
        # We are changing directory to the temp directory
        mock_os_chdir.assert_called_with(
            uploaded_protocol_meta.directory.name
        )
        # Adding it to sys.path
        assert uploaded_protocol_meta.directory.name in sys.path

    # Done with context manager. Let's make sure we clean up
    assert uploaded_protocol_meta.directory.name not in sys.path
    assert sys.path == context._path
    mock_os_chdir.assert_called_with(context._cwd)
