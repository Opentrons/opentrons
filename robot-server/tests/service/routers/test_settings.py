import pytest
from unittest.mock import patch


# TDOD(isk: 3/20/20): test validation errors after refactor
# return {message: string}
@pytest.mark.parametrize(
    "log_level, syslog_level, expected_message",
    [
        (
            "error",
            "err",
            {"message": "Upstreaming log level changed to error"}
        ), (
            "ERROR",
            "err",
            {"message": "Upstreaming log level changed to error"}
        ), (
            "warning",
            "warning",
            {"message": "Upstreaming log level changed to warning"}
        ), (
            "WARNING",
            "warning",
            {"message": "Upstreaming log level changed to warning"}
        ), (
            "info",
            "info",
            {"message": "Upstreaming log level changed to info"}
        ), (
            "INFO",
            "info",
            {"message": "Upstreaming log level changed to info"}
        ), (
            "debug",
            "debug",
            {"message": "Upstreaming log level changed to debug"}
        ), (
            "DEBUG",
            "debug",
            {"message": "Upstreaming log level changed to debug"}
        ), (
            None,
            "emerg",
            {"message": "Upstreaming logs disabled"}
        ), (
            None,
            "emerg",
            {"message": "Upstreaming logs disabled"}
        )
    ]
)
def test_post_log_level_upstream(
    api_client,
    log_level,
    syslog_level,
    expected_message
):
    async def mock_set_syslog_level(syslog_level):
        return (0, "stdout", "stderr")

    with patch("opentrons.system.log_control.set_syslog_level") as m:
        m.side_effect = mock_set_syslog_level
        response = api_client.post(
            "/settings/log_level/upstream", json={"log_level": log_level}
        )
        body = response.json()
        assert response.status_code == 200
        assert body == expected_message
        m.assert_called_once_with(syslog_level)


def test_post_log_level_upstream_fails_reload(api_client):
    log_level = "debug"

    async def mock_set_syslog_level(syslog_level):
        return (1, "stdout", "stderr")

    with patch("opentrons.system.log_control.set_syslog_level") as m:
        m.side_effect = mock_set_syslog_level
        response = api_client.post(
            "/settings/log_level/upstream", json={"log_level": log_level}
        )
        body = response.json()
        assert response.status_code == 500
        assert body == {"message": "Could not reload config: stdout stderr"}
        m.assert_called_once_with(log_level)
