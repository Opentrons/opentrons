from pathlib import Path

import pytest
from unittest.mock import MagicMock, patch

from robot_server.service.protocol import errors
from robot_server.service.protocol.manager import ProtocolManager, UploadFile
from robot_server.service.protocol.protocol import UploadedProtocolMeta, \
    UploadedProtocol


@pytest.fixture
def mock_upload_file():
    m = MagicMock(spec=UploadFile)
    m.filename = "some_file_name.py"
    return m


@pytest.fixture
def mock_uploaded_protocol(mock_upload_file):
    m = MagicMock(spec=UploadedProtocol)
    return m


@pytest.fixture
def mock_uploaded_control_constructor(mock_uploaded_protocol):
    with patch("robot_server.service.protocol.manager.UploadedProtocol") as p:
        def side_effect(protocol_id, protocol_file, support_files):
            mock_uploaded_protocol.meta = UploadedProtocolMeta(
                identifier=protocol_id,
                protocol_file=None,
                directory=None)
            return mock_uploaded_protocol

        p.side_effect = side_effect
        yield p


@pytest.fixture
def manager_with_mock_protocol(mock_uploaded_control_constructor,
                               mock_upload_file):
    manager = ProtocolManager()
    manager.create(mock_upload_file, [])
    return manager


class TestCreate:
    def test_create(self, mock_uploaded_control_constructor,
                    mock_upload_file, mock_uploaded_protocol):
        manager = ProtocolManager()
        p = manager.create(mock_upload_file, [])
        mock_uploaded_control_constructor.assert_called_once_with(
            Path(mock_upload_file.filename).stem, mock_upload_file, [])
        assert p == mock_uploaded_protocol
        assert manager._protocols[mock_uploaded_protocol.meta.identifier] == p

    def test_create_already_exists(self,
                                   mock_upload_file,
                                   manager_with_mock_protocol):
        with pytest.raises(errors.ProtocolAlreadyExistsException):
            manager_with_mock_protocol.create(mock_upload_file, [])

    def test_create_upload_limit_reached(self,
                                         mock_upload_file,
                                         manager_with_mock_protocol):
        ProtocolManager.MAX_COUNT = 1
        m = MagicMock(spec=UploadFile)
        m.filename = "123_" + mock_upload_file.filename
        with pytest.raises(errors.ProtocolUploadCountLimitReached):
            manager_with_mock_protocol.create(m, [])

    @pytest.mark.parametrize(argnames="exception", argvalues=[
        TypeError, IOError
    ])
    def test_create_raises(self,
                           exception,
                           mock_upload_file,
                           mock_uploaded_protocol):
        with patch("robot_server.service.protocol.manager.UploadedProtocol") \
                as mock_construct:
            def raiser(*args, **kwargs):
                raise exception()

            mock_construct.side_effect = raiser

            with pytest.raises(errors.ProtocolIOException):
                manager = ProtocolManager()
                manager.create(mock_upload_file, [])


class TestGet:
    def test_get(self, manager_with_mock_protocol, mock_uploaded_protocol):
        assert manager_with_mock_protocol.get(
            mock_uploaded_protocol.meta.identifier
        ) == mock_uploaded_protocol

    def test_not_found(self, manager_with_mock_protocol):
        with pytest.raises(errors.ProtocolNotFoundException):
            manager_with_mock_protocol.get("___")


class TestGetAll:
    def test_get_all(self, manager_with_mock_protocol, mock_uploaded_protocol):
        assert list(manager_with_mock_protocol.get_all()) == \
               [mock_uploaded_protocol]

    def test_get_none(self):
        manager = ProtocolManager()
        assert list(manager.get_all()) == []


class TestRemove:
    def test_remove(self, manager_with_mock_protocol, mock_uploaded_protocol):
        manager_with_mock_protocol.remove(
            mock_uploaded_protocol.meta.identifier)
        assert mock_uploaded_protocol.meta.identifier not in \
               manager_with_mock_protocol._protocols
        mock_uploaded_protocol.clean_up.assert_called_once()

    def test_remove_not_found(self, manager_with_mock_protocol):
        with pytest.raises(errors.ProtocolNotFoundException):
            manager_with_mock_protocol.remove("___")


class TestRemoveAll:
    def test_remove_all(self,
                        manager_with_mock_protocol,
                        mock_uploaded_protocol):
        manager_with_mock_protocol.remove_all()
        mock_uploaded_protocol.clean_up.assert_called_once()
        assert manager_with_mock_protocol._protocols == {}
