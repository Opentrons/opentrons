import json

import pytest
from unittest.mock import patch

from opentrons.system.log_control import MAX_RECORDS, DEFAULT_RECORDS


def test_get_serial_log_with_defaults(api_client):
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode('utf-8')
    expected = res_bytes.decode('utf-8')

    async def mock_get_records_dumb(identifier, records, format_type):
        return res_bytes

    with patch("opentrons.system.log_control.get_records_dumb") as m:
        m.side_effect = mock_get_records_dumb
        response = api_client.get("/logs/serial.log")
        body = response.text
        assert response.status_code == 200
        assert body == expected
        m.assert_called_once_with(
            "opentrons-api-serial", DEFAULT_RECORDS, "short"
        )


@pytest.mark.parametrize(
    "format_param, records_param, mode_param",
    [
        ("json", MAX_RECORDS - 1, "json"),
        ("text", MAX_RECORDS - 1, "short"),
        ("json", 1, "json"),
        ("text", 1, "short")
    ]
)
def test_get_serial_log_with_params(
    api_client, format_param, records_param, mode_param
):
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode('utf-8')
    if format_param == 'json':
        expected = json.loads(res_bytes)
    else:
        expected = logs

    async def mock_get_records_dumb(identifier, records, mode):
        return res_bytes

    with patch("opentrons.system.log_control.get_records_dumb") as m:
        m.side_effect = mock_get_records_dumb
        response = api_client.get(
            f"/logs/serial.log?format={format_param}&records={records_param}"
        )
        if format_param == 'json':
            body = response.json()
        else:
            body = response.text
        assert body == expected
        assert response.status_code == 200

        m.assert_called_once_with(
            "opentrons-api-serial", records_param, mode_param
        )


@pytest.mark.parametrize(
    "format_param, records_param",
    [
        ("json", 0),
        ("text", MAX_RECORDS + 1),
        ("invalid", MAX_RECORDS - 1)
    ]
)
def test_get_serial_log_with_invalid_params(
    api_client, format_param, records_param
):
    logs = '{"serial": "serial logs"}'
    res_bytes = logs.encode('utf-8')

    async def mock_get_records_dumb(identifier, records, format_type):
        return res_bytes

    with patch("opentrons.system.log_control.get_records_dumb") as m:
        m.side_effect = mock_get_records_dumb
        response = api_client.get(
            f"/logs/serial.log?format={format_param}&records={records_param}"
        )
        assert response.status_code == 422
        m.assert_not_called()


def test_get_api_log_with_defaults(api_client):
    logs = '{"api": "application programing interface logs"}'
    res_bytes = logs.encode('utf-8')
    expected = res_bytes.decode('utf-8')

    async def mock_get_records_dumb(identifier, records, format_type):
        return res_bytes

    with patch("opentrons.system.log_control.get_records_dumb") as m:
        m.side_effect = mock_get_records_dumb
        response = api_client.get("/logs/api.log")
        body = response.text
        assert response.status_code == 200
        assert body == expected
        m.assert_called_once_with("opentrons-api", DEFAULT_RECORDS, "short")


@pytest.mark.parametrize(
    "format_param, records_param, mode_param",
    [
        ("json", MAX_RECORDS - 1, "json"),
        ("text", MAX_RECORDS - 1, "short"),
        ("json", 1, "json"),
        ("text", 1, "short")
    ]
)
def test_get_api_log_with_params(
    api_client, format_param, records_param, mode_param
):
    logs = '{"api": "application programing interface logs"}'
    res_bytes = logs.encode('utf-8')
    if format_param == 'json':
        expected = json.loads(res_bytes)
    else:
        expected = logs


    async def mock_get_records_dumb(identifier, records, format_type):
        return res_bytes

    with patch("opentrons.system.log_control.get_records_dumb") as m:
        m.side_effect = mock_get_records_dumb
        response = api_client.get(
            f"/logs/api.log?format={format_param}&records={records_param}"
        )
        if format_param == 'json':
            body = response.json()
        else:
            body = response.text
        assert response.status_code == 200
        assert body == expected
        m.assert_called_once_with("opentrons-api", records_param, mode_param)


@pytest.mark.parametrize(
    "format_param, records_param",
    [
        ("json", 0),
        ("text", MAX_RECORDS + 1),
        ("invalid", MAX_RECORDS - 1)
    ]
)
def test_get_api_log_with_invalid_params(
    api_client, format_param, records_param
):
    logs = '{"api": "application programing interface logs"}'
    res_bytes = logs.encode('utf-8')

    async def mock_get_records_dumb(identifier, records, format_type):
        return res_bytes

    with patch("opentrons.system.log_control.get_records_dumb") as m:
        m.side_effect = mock_get_records_dumb
        response = api_client.get(
            f"/logs/api.log?format={format_param}&records={records_param}"
        )
        assert response.status_code == 422
        m.assert_not_called()
