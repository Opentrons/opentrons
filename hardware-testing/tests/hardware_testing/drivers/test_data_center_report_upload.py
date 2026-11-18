"""Formal QC uploads preserve reports and wait for confirmed server completion."""

import hashlib
import json
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, call

import pytest
import requests

from hardware_testing.drivers import data_center_client as client


@pytest.fixture(autouse=True)
def no_network(monkeypatch: pytest.MonkeyPatch) -> None:
    """All HTTP must be explicitly mocked; never contact a production server."""
    monkeypatch.setattr(client, "get_base_url", lambda: "http://data-center.test")
    monkeypatch.setattr(
        requests.sessions.Session,
        "request",
        MagicMock(side_effect=AssertionError("Unexpected real HTTP request")),
    )
    monkeypatch.setattr(client.time, "sleep", MagicMock())


@pytest.fixture
def report(tmp_path: Path) -> Path:
    path = tmp_path / "ninety-six-assembly-qc-ot3_P100096_20261110.csv"
    path.write_text(
        "META_DATA,test_name,ninety-six-assembly-qc-ot3\n"
        "META_DATA,test_device_id,P100096-TEST\n"
        "DROPLETS,droplets-96-tips,FAIL,30\n",
        encoding="utf-8",
    )
    return path


def response(body: Any) -> MagicMock:
    result = MagicMock()
    result.json.return_value = body
    return result


def test_record_retries_keep_integrity_and_idempotency(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A lost start response cannot create three unrelated upload attempts."""
    post = MagicMock(
        side_effect=[
            requests.Timeout("response lost"),
            requests.ConnectionError("connection reset"),
            response({"record_id": "record-96"}),
        ]
    )
    monkeypatch.setattr(client.requests, "post", post)

    assert client.start_upload_record(report, source="manual") == "record-96"

    assert post.call_count == 3
    payloads = [entry.kwargs["json"] for entry in post.call_args_list]
    assert payloads[0] == payloads[1] == payloads[2]
    assert payloads[0]["idempotency_key"]
    assert payloads[0]["csv_file_name"] == report.name
    assert payloads[0]["csv_size"] == len(report.read_bytes())
    assert payloads[0]["csv_sha256"] == hashlib.sha256(report.read_bytes()).hexdigest()
    assert payloads[0]["source"] == "manual"
    assert post.call_args.args[0].endswith("/api/upload-records/start")
    assert post.call_args.kwargs["timeout"] <= 30


def test_unreadable_report_aborts_before_http(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        client,
        "get_file_integrity",
        MagicMock(side_effect=OSError("permission denied")),
    )
    post = MagicMock()
    monkeypatch.setattr(client.requests, "post", post)

    assert client.start_upload_record(report) is None
    post.assert_not_called()


@pytest.mark.parametrize("body", [{}, {"success": True}])
def test_record_start_requires_identifier(
    report: Path, monkeypatch: pytest.MonkeyPatch, body: dict
) -> None:
    post = MagicMock(return_value=response(body))
    monkeypatch.setattr(client.requests, "post", post)

    assert client.start_upload_record(report) is None
    assert post.call_count == 3


@pytest.mark.parametrize(
    "test_name",
    ["ninety-six-assembly-qc-ot3", "pipette-assembly-qc-ot3"],
)
def test_manual_upload_preserves_csv_and_metadata_and_closes_files(
    report: Path, monkeypatch: pytest.MonkeyPatch, test_name: str
) -> None:
    """96 and existing pipette CSVs use the same unchanged multipart transport."""
    original = report.read_bytes()
    raw = report.parent / "encoder_debug.csv"
    raw.write_text("cycle,motor,encoder\n1,2,2\n", encoding="utf-8")
    meta = {"test_name": test_name, "operator": "测试员"}
    handles = []

    def post(url: str, **kwargs: Any) -> MagicMock:
        assert url.endswith("/api/upload-data/manual")
        assert kwargs["data"]["record_id"] == "record-96"
        assert kwargs["data"]["include_source_zip"] == "true"
        assert kwargs["data"]["all_files"] == "true"
        assert json.loads(kwargs["data"]["meta"]) == meta
        files = kwargs["files"]
        assert [entry[0] for entry in files] == ["csv_file", "source_files"]
        handles.extend(entry[1][1] for entry in files)
        assert handles[0].read() == original
        assert handles[1].read() == raw.read_bytes()
        assert all(not handle.closed for handle in handles)
        return response({"success": True, "record_id": "record-96"})

    monkeypatch.setattr(client.requests, "post", post)
    start = MagicMock()
    monkeypatch.setattr(client, "start_upload_record", start)

    result = client.upload_manual_data(
        report,
        include_source_zip=True,
        all_files=True,
        meta=meta,
        record_id="record-96",
    )

    assert result["success"] is True
    assert all(handle.closed for handle in handles)
    assert report.read_bytes() == original
    start.assert_not_called()


def test_manual_timeout_closes_all_handles(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (report.parent / "encoder_debug.csv").write_text("raw", encoding="utf-8")
    handles = []
    timeout = requests.Timeout("response lost")

    def post(url: str, **kwargs: Any) -> None:
        handles.extend(entry[1][1] for entry in kwargs["files"])
        raise timeout

    monkeypatch.setattr(client.requests, "post", post)
    recover = MagicMock(return_value={"success": False, "error": "response lost"})
    monkeypatch.setattr(client, "resolve_uncertain_upload_request", recover)

    result = client.upload_manual_data(report, all_files=True, record_id="record-96")

    assert result["success"] is False
    assert len(handles) == 2
    assert all(handle.closed for handle in handles)
    assert report.exists()
    recover.assert_called_once_with("record-96", timeout)


def test_upload_data_accepts_path_and_reuses_record(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    post = MagicMock(return_value=response({"success": True}))
    monkeypatch.setattr(client.requests, "post", post)
    start = MagicMock()
    monkeypatch.setattr(client, "start_upload_record", start)

    assert client.upload_data(report, "/server/source.zip", "record-96")["success"]

    payload = post.call_args.kwargs["json"]
    assert payload["record_id"] == "record-96"
    assert payload["csv_file_path"] == str(report)
    json.dumps(payload)  # requests must be able to serialize pathlib callers.
    start.assert_not_called()


@pytest.mark.parametrize(
    "status, expected",
    [
        ({"status": "success"}, {"success": True}),
        (
            {"status": "queued", "job_enqueued": True},
            {"success": True, "accepted": True, "pending": True},
        ),
        ({"status": "failed", "error": "processing failed"}, {"success": False}),
    ],
)
def test_lost_response_uses_durable_server_state(
    monkeypatch: pytest.MonkeyPatch, status: dict, expected: dict
) -> None:
    """An already accepted request must not be marked failed after a timeout."""
    monkeypatch.setattr(
        client, "get_upload_record_status", MagicMock(return_value=status)
    )
    fail = MagicMock()
    monkeypatch.setattr(client, "mark_upload_record_failed", fail)

    result = client.resolve_uncertain_upload_request("record-96", requests.Timeout())

    assert all(result[key] == value for key, value in expected.items())
    fail.assert_not_called()


@pytest.mark.parametrize(
    "status_code, stage, code",
    [
        (400, "request_validation", "http_400"),
        (503, "request_processing", "http_503"),
        (None, "request_transport", "client_request_failed"),
    ],
)
def test_unaccepted_request_records_failure_detail(
    monkeypatch: pytest.MonkeyPatch, status_code: Any, stage: str, code: str
) -> None:
    monkeypatch.setattr(client, "get_upload_record_status", lambda record_id: None)
    fail = MagicMock()
    monkeypatch.setattr(client, "mark_upload_record_failed", fail)
    error = requests.RequestException("transport failed")
    if status_code is not None:
        error.response = response({"detail": {"message": "Upload rejected"}})
        error.response.status_code = status_code

    result = client.resolve_uncertain_upload_request("record-96", error)

    assert result["success"] is False
    assert result["record_id"] == "record-96"
    fail.assert_called_once_with(
        "record-96",
        "Upload rejected" if status_code else "transport failed",
        failure_stage=stage,
        failure_code=code,
    )


@pytest.mark.parametrize("invalid_body", [None, [], "not an object"])
def test_invalid_status_response_is_retryable(
    monkeypatch: pytest.MonkeyPatch, invalid_body: Any
) -> None:
    monkeypatch.setattr(
        client.requests, "get", MagicMock(return_value=response(invalid_body))
    )
    assert client.get_upload_record_status("record-96") is None


@pytest.mark.parametrize("failure", [ValueError("invalid JSON"), requests.Timeout()])
def test_status_read_failure_is_retryable(
    monkeypatch: pytest.MonkeyPatch, failure: Exception
) -> None:
    result = response({})
    result.json.side_effect = failure
    monkeypatch.setattr(client.requests, "get", MagicMock(return_value=result))
    assert client.get_upload_record_status("record-96") is None


@pytest.mark.parametrize("final_status", ["success", "failed"])
def test_waits_for_final_server_status(
    monkeypatch: pytest.MonkeyPatch, final_status: str
) -> None:
    status = MagicMock(
        side_effect=[
            {"status": "queued"},
            {"status": "running"},
            {"status": final_status, "record_id": "record-96"},
        ]
    )
    monkeypatch.setattr(client, "get_upload_record_status", status)
    monkeypatch.setattr(client.time, "monotonic", MagicMock(side_effect=[0, 0, 1, 2]))

    result = client.wait_for_upload_record("record-96", timeout=5)

    assert result["success"] is (final_status == "success")
    assert status.call_count == 3


def test_wait_timeout_reports_pending_not_success(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        client,
        "get_upload_record_status",
        MagicMock(return_value={"status": "running", "job_enqueued": True}),
    )
    monkeypatch.setattr(client.time, "monotonic", MagicMock(side_effect=[0, 0, 6]))

    result = client.wait_for_upload_record("record-96", timeout=5)

    assert result["success"] is False
    assert result["pending"] is True
    assert result["record_id"] == "record-96"


@pytest.fixture
def upload_flow(monkeypatch: pytest.MonkeyPatch) -> dict:
    mocks = {
        "start_upload_record": MagicMock(return_value="record-96"),
        "check_health": MagicMock(return_value={"status": True}),
        "pull_folder": MagicMock(
            return_value={
                "success": True,
                "zip_path": "/server/raw.zip",
                "file_name": "/server/report.csv",
            }
        ),
        "upload_data": MagicMock(return_value={"success": True, "accepted": True}),
        "upload_manual_data": MagicMock(
            return_value={"success": True, "accepted": True}
        ),
        "wait_for_upload_record": MagicMock(
            return_value={"success": True, "status": "success"}
        ),
        "mark_upload_record_failed": MagicMock(),
        "delete_folder": MagicMock(),
    }
    for name, mock in mocks.items():
        monkeypatch.setattr(client, name, mock)
    return mocks


@pytest.mark.parametrize(
    "mode", ["pull", "direct_upload", "include_source_zip", "all_files"]
)
@pytest.mark.parametrize("outcome", ["success", "failed", "pending"])
def test_cleanup_requires_final_success(
    report: Path, upload_flow: dict, mode: str, outcome: str
) -> None:
    """Legacy pull and direct multipart uploads retain local files until complete."""
    final = {"success": outcome == "success", "pending": outcome == "pending"}
    upload_flow["wait_for_upload_record"].return_value = final
    options = {} if mode == "pull" else {mode: True}

    result = client.upload_data_to_google_drive(report, delete_folder=True, **options)

    assert result is (outcome == "success")
    upload_flow["wait_for_upload_record"].assert_called_once_with("record-96")
    if outcome == "success":
        upload_flow["delete_folder"].assert_called_once_with(str(report.parent))
    else:
        upload_flow["delete_folder"].assert_not_called()
    if mode == "pull":
        upload_flow["upload_manual_data"].assert_not_called()
        upload_flow["pull_folder"].assert_called_once_with(
            csv_file_path=report,
            folder_name=str(report.parent),
            pull_method=client.DEFAULT_PULL_METHOD,
            record_id="record-96",
        )
        upload_flow["upload_data"].assert_called_once_with(
            csv_file_path="/server/report.csv",
            zip_file_path="/server/raw.zip",
            record_id="record-96",
        )
    else:
        upload_flow["pull_folder"].assert_not_called()
        upload_flow["upload_manual_data"].assert_called_once_with(
            csv_file_path=report,
            include_source_zip=mode != "direct_upload",
            all_files=mode == "all_files",
            record_id="record-96",
        )


@pytest.mark.parametrize("record_id", ["record-96", 96])
@pytest.mark.parametrize("direct_upload", [False, True])
def test_complete_upload_flow_preserves_server_record_identifier(
    report: Path,
    monkeypatch: pytest.MonkeyPatch,
    record_id: Any,
    direct_upload: bool,
) -> None:
    """String and integer server IDs survive creation, upload and status polling."""
    events = []

    def post(url: str, **kwargs: Any) -> MagicMock:
        if url.endswith("/api/upload-records/start"):
            events.append("start")
            return response({"record_id": record_id})
        if url.endswith("/api/pull-folder"):
            events.append("pull")
            assert kwargs["data"]["folder_name"] == str(report.parent)
            return response(
                {
                    "success": True,
                    "file_name": "/server/report.csv",
                    "zip_path": "/server/source.zip",
                }
            )
        if url.endswith("/api/upload-data/manual"):
            events.append("manual")
            assert kwargs["data"]["record_id"] == record_id
            assert kwargs["files"][0][1][1].read() == report.read_bytes()
        elif url.endswith("/api/upload-data"):
            events.append("upload")
            payload = kwargs["json"]
            assert payload["record_id"] == record_id
            # Numeric JSON identifiers must not be silently changed to strings.
            assert type(payload["record_id"]) is type(record_id)
        else:
            raise AssertionError(f"Unexpected request: {url}")
        return response({"success": True, "accepted": True, "record_id": record_id})

    def get(url: str, **kwargs: Any) -> MagicMock:
        if url.endswith("/api/health"):
            events.append("health")
            return response({"status": True})
        assert url.endswith(f"/api/upload-records/{record_id}")
        events.append("status")
        return response({"status": "success", "record_id": record_id})

    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(client.requests, "get", get)
    pull = MagicMock(wraps=client.pull_folder)
    monkeypatch.setattr(client, "pull_folder", pull)

    assert client.upload_data_to_google_drive(report, include_source_zip=direct_upload)

    if direct_upload:
        assert events == ["start", "health", "manual", "status"]
        pull.assert_not_called()
    else:
        assert events == ["start", "health", "pull", "upload", "status"]
        assert pull.call_args.kwargs["record_id"] == record_id
        assert type(pull.call_args.kwargs["record_id"]) is type(record_id)
    assert report.exists()


def test_health_failure_records_reason_and_preserves_report(
    report: Path, upload_flow: dict
) -> None:
    upload_flow["check_health"].return_value = {"status": False, "error": "unavailable"}

    assert client.upload_data_to_google_drive(report, all_files=True) is False

    upload_flow["mark_upload_record_failed"].assert_called_once_with(
        "record-96",
        "unavailable",
        failure_stage="health_check",
        failure_code="data_center_unhealthy",
    )
    upload_flow["upload_manual_data"].assert_not_called()
    upload_flow["delete_folder"].assert_not_called()
    assert report.exists()


def test_cannot_upload_without_record(report: Path, upload_flow: dict) -> None:
    upload_flow["start_upload_record"].return_value = None

    assert client.upload_data_to_google_drive(report, all_files=True) is False

    upload_flow["upload_manual_data"].assert_not_called()
    upload_flow["pull_folder"].assert_not_called()
    upload_flow["delete_folder"].assert_not_called()


def test_pull_error_closes_report_and_records_failure(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    handles = []

    def post(url: str, **kwargs: Any) -> None:
        handles.append(kwargs["files"]["csv_file"])
        raise requests.Timeout("pull timeout")

    monkeypatch.setattr(client.requests, "post", post)
    fail = MagicMock()
    monkeypatch.setattr(client, "mark_upload_record_failed", fail)

    result = client.pull_folder(report, str(report.parent), record_id="record-96")

    assert "error" in result
    assert handles[0].closed
    assert fail.call_args.kwargs == {
        "failure_stage": "robot_data_pull",
        "failure_code": "robot_data_pull_failed",
    }


def test_cli_meta_reaches_manual_upload(report: Path, upload_flow: dict) -> None:
    result = client.main(
        [
            "--csv",
            str(report),
            "--skip-health",
            "--meta-json",
            '{"test_name":"ninety-six-assembly-qc-ot3"}',
        ]
    )

    assert result == 0
    assert upload_flow["upload_manual_data"].call_args.kwargs["meta"] == {
        "test_name": "ninety-six-assembly-qc-ot3"
    }
    assert upload_flow["wait_for_upload_record"].call_args_list == [call("record-96")]


@pytest.mark.parametrize("record_id", ["record-96", 96])
def test_direct_report_only_sends_csv_and_reports_final_status(
    report: Path, monkeypatch: pytest.MonkeyPatch, record_id: Any
) -> None:
    """The App can bypass SCP without including its separately uploaded evidence."""
    (report.parent / "failure.log").write_text("failure evidence", encoding="utf-8")
    requests_seen = []
    progress = []

    def post(url: str, **kwargs: Any) -> MagicMock:
        requests_seen.append(url)
        if url.endswith("/api/upload-records/start"):
            return response({"record_id": record_id})
        assert url.endswith("/api/upload-data/manual")
        assert kwargs["data"] == {
            "include_source_zip": "false",
            "all_files": "false",
            "record_id": record_id,
        }
        assert len(kwargs["files"]) == 1
        assert kwargs["files"][0][0] == "csv_file"
        assert kwargs["files"][0][1][1].read() == report.read_bytes()
        return response({"success": True, "accepted": True})

    def get(url: str, **kwargs: Any) -> MagicMock:
        requests_seen.append(url)
        if url.endswith("/api/health"):
            return response({"status": True})
        assert url.endswith(f"/api/upload-records/{record_id}")
        return response({"status": "success"})

    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(client.requests, "get", get)

    assert client.upload_data_to_google_drive(
        report, direct_upload=True, progress_callback=progress.append
    )

    assert [url.rsplit("/api/", 1)[-1] for url in requests_seen] == [
        "upload-records/start",
        "health",
        "upload-data/manual",
        f"upload-records/{record_id}",
    ]
    assert any(f"record_id={record_id}" in item for item in progress)
    assert any("stage=upload_wait" in item for item in progress)
    assert any(
        "stage=upload_result" in item and "status=success" in item for item in progress
    )
    assert report.exists()


@pytest.mark.parametrize("json_body", [True, False])
def test_record_start_error_exposes_status_body_without_credentials(
    report: Path, monkeypatch: pytest.MonkeyPatch, json_body: bool
) -> None:
    """App comments identify rejected record requests, including non-JSON servers."""
    server_error = requests.HTTPError("422 Unprocessable Entity")
    server_error.response = response(
        {"detail": {"message": "invalid CSV", "error": "robot IP missing"}}
    )
    server_error.response.status_code = 422
    if not json_body:
        server_error.response.json.side_effect = ValueError("not JSON")
        server_error.response.text = (
            "robot IP missing password=private-value "
            "http://user:private-url@server.test token=private-token "
            "Authorization: Bearer private-auth"
        )
    monkeypatch.setattr(client.requests, "post", MagicMock(side_effect=server_error))
    progress = []

    assert not client.upload_data_to_google_drive(
        report, direct_upload=True, progress_callback=progress.append
    )

    details = "\n".join(progress)
    assert "stage=record_start" in details
    assert "HTTP 422" in details
    assert "robot IP missing" in details
    assert "private-" not in details
    assert "upload aborted" in details


def test_record_preparation_error_reaches_progress_callback(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        client, "get_base_url", MagicMock(side_effect=RuntimeError("discovery failed"))
    )
    progress = []

    assert not client.upload_data_to_google_drive(
        report, direct_upload=True, progress_callback=progress.append
    )

    assert any("failed before request: discovery failed" in item for item in progress)


@pytest.mark.parametrize("outcome", ["health", "pull", "submit", "failed", "pending"])
def test_progress_callback_records_failure_stage_and_details(
    report: Path, upload_flow: dict, outcome: str
) -> None:
    error = "server rejected robot report"
    if outcome == "health":
        upload_flow["check_health"].return_value = {"status": False, "error": error}
    elif outcome == "pull":
        upload_flow["pull_folder"].return_value = {"success": False, "error": error}
    elif outcome == "submit":
        upload_flow["upload_manual_data"].return_value = {
            "success": False,
            "error": error,
            "failure_stage": "request_validation",
            "failure_code": "http_422",
        }
    else:
        upload_flow["wait_for_upload_record"].return_value = {
            "success": outcome == "pending",
            "pending": outcome == "pending",
            "error": error,
        }
    progress = []

    assert not client.upload_data_to_google_drive(
        report, direct_upload=outcome != "pull", progress_callback=progress.append
    )

    details = "\n".join(progress)
    assert "record_id=record-96" in details
    assert error in details
    assert "status=success" not in details
    if outcome == "submit":
        assert "http_422" in details
        assert "request_validation" in details
    if outcome == "pending":
        assert "status=pending" in details
    assert report.exists()


def test_progress_callback_exception_does_not_override_success(
    report: Path, upload_flow: dict
) -> None:
    callback = MagicMock(side_effect=RuntimeError("protocol comment failed"))

    assert client.upload_data_to_google_drive(
        report, direct_upload=True, progress_callback=callback
    )

    assert callback.call_count > 1


@pytest.mark.parametrize("unsupported_status", [404, 405])
@pytest.mark.parametrize(
    "legacy_response, success",
    [
        ({"success": True}, True),
        ({"success": False, "error": "drive unavailable"}, False),
        ({"success": True, "accepted": True}, False),
        ({"success": True, "pending": True}, False),
        ({"success": True, "status": "queued"}, False),
        ({"success": True, "status": "processing"}, False),
        ({"success": True, "status": "failed"}, False),
    ],
)
def test_direct_upload_supports_legacy_server_without_record_api(
    report: Path,
    monkeypatch: pytest.MonkeyPatch,
    unsupported_status: int,
    legacy_response: dict,
    success: bool,
) -> None:
    """Only a missing record endpoint permits the synchronous CSV-only fallback."""
    (report.parent / "failure.log").write_text("failure evidence", encoding="utf-8")
    calls = []
    progress = []

    def post(url: str, **kwargs: Any) -> MagicMock:
        calls.append(url)
        if url.endswith("/api/upload-records/start"):
            error = requests.HTTPError("unsupported endpoint")
            error.response = response({"detail": "record endpoint unavailable"})
            error.response.status_code = unsupported_status
            raise error
        assert url.endswith("/api/upload-data/manual")
        assert kwargs["data"] == {"include_source_zip": "false", "all_files": "false"}
        assert [entry[0] for entry in kwargs["files"]] == ["csv_file"]
        assert kwargs["files"][0][1][1].read() == report.read_bytes()
        return response(legacy_response)

    def get(url: str, **kwargs: Any) -> MagicMock:
        assert url.endswith("/api/health")
        calls.append(url)
        return response({"status": True})

    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(client.requests, "get", get)

    result = client.upload_data_to_google_drive(
        report, direct_upload=True, progress_callback=progress.append
    )

    assert result is success
    assert [url.rsplit("/api/", 1)[-1] for url in calls] == [
        "upload-records/start",
        "health",
        "upload-data/manual",
    ]
    details = "\n".join(progress)
    assert "mode=legacy_direct" in details
    assert f"HTTP {unsupported_status}" in details
    assert "stage=upload_result" in details
    if (
        legacy_response.get("accepted")
        or legacy_response.get("pending")
        or legacy_response.get("status") in {"queued", "processing"}
    ):
        assert "status=pending" in details
        assert "status=success" not in details
    assert report.exists()


@pytest.mark.parametrize("failure", ["timeout", 400, 401, 403, 422, 500, 503])
def test_other_record_errors_never_trigger_untracked_upload(
    report: Path, monkeypatch: pytest.MonkeyPatch, failure: Any
) -> None:
    if failure == "timeout":
        error = requests.Timeout("record response lost")
    else:
        error = requests.HTTPError("record request failed")
        error.response = response({"detail": "record request rejected"})
        error.response.status_code = failure
    post = MagicMock(side_effect=error)
    manual = MagicMock()
    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(client, "upload_manual_data", manual)

    assert not client.upload_data_to_google_drive(report, direct_upload=True)

    assert post.call_count == 3
    manual.assert_not_called()


def test_legacy_upload_timeout_is_not_retried_without_record(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    record_error = requests.HTTPError("unsupported endpoint")
    record_error.response = response({"detail": "record endpoint unavailable"})
    record_error.response.status_code = 404
    post = MagicMock(
        side_effect=[record_error, requests.Timeout("manual response lost")]
    )
    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(
        client.requests, "get", MagicMock(return_value=response({"status": True}))
    )
    progress = []

    assert not client.upload_data_to_google_drive(
        report, direct_upload=True, progress_callback=progress.append
    )

    assert post.call_count == 2
    assert any("manual response lost" in item for item in progress)
    assert report.exists()


def test_default_pull_flow_does_not_fall_back_when_record_api_missing(
    report: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    error = requests.HTTPError("unsupported endpoint")
    error.response = response({"detail": "record endpoint unavailable"})
    error.response.status_code = 404
    post = MagicMock(side_effect=error)
    manual = MagicMock()
    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(client, "upload_manual_data", manual)

    assert not client.upload_data_to_google_drive(report)

    assert post.call_count == 3
    manual.assert_not_called()


@pytest.mark.parametrize("tracked", [False, True])
def test_http_202_requires_final_confirmation_even_without_pending_json(
    report: Path, monkeypatch: pytest.MonkeyPatch, tracked: bool
) -> None:
    """Bare HTTP 202 success is pending; a durable record may later confirm it."""
    calls = []
    progress = []

    def post(url: str, **kwargs: Any) -> requests.Response:
        calls.append(url.rsplit("/api/", 1)[-1])
        reply = requests.Response()
        if url.endswith("/api/upload-records/start"):
            reply.status_code = 200 if tracked else 404
            reply._content = json.dumps(
                {"record_id": "record-96"} if tracked else {"detail": "Not found"}
            ).encode()
        else:
            assert url.endswith("/api/upload-data/manual")
            reply.status_code = 202
            reply._content = b'{"success":true}'
        return reply

    def get(url: str, **kwargs: Any) -> MagicMock:
        calls.append(url.rsplit("/api/", 1)[-1])
        if url.endswith("/api/health"):
            return response({"status": True})
        assert tracked and url.endswith("/api/upload-records/record-96")
        return response({"status": "success"})

    monkeypatch.setattr(client.requests, "post", post)
    monkeypatch.setattr(client.requests, "get", get)

    assert (
        client.upload_data_to_google_drive(
            report, direct_upload=True, progress_callback=progress.append
        )
        is tracked
    )

    expected = ["upload-records/start", "health", "upload-data/manual"]
    if tracked:
        expected.append("upload-records/record-96")
    assert calls == expected
    details = "\n".join(progress)
    if not tracked:
        assert "status=pending" in details
        assert "http_status': 202" in details
        assert "status=success" not in details
    assert report.exists()
