"""System to automatically upload testing result csvs to gdrive."""
import argparse
import hashlib
import json
import os
import re
import shlex
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time

from contextlib import contextmanager
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from tempfile import TemporaryDirectory
from uuid import uuid4
from typing import Optional, Callable, Dict, Any, Iterator, List, Tuple, Union
import requests

UploadRecordId = Union[str, int]
UploadProgressCallback = Optional[Callable[[str], None]]

DEFAULT_SERVER_HOST = "192.168.6.55"
DEFAULT_SERVER_PORT = 8090
DEFAULT_BASE_URL = f"http://{DEFAULT_SERVER_HOST}:{DEFAULT_SERVER_PORT}"

API_ENDPOINT_PULL = "/api/pull-folder"
API_ENDPOINT_UPLOAD = "/api/upload-data"
API_ENDPOINT_UPLOAD_MANUAL = "/api/upload-data/manual"
API_ENDPOINT_UPLOAD_RECORDS = "/api/upload-records"
API_ENDPOINT_UPLOAD_RECORD_START = f"{API_ENDPOINT_UPLOAD_RECORDS}/start"
API_ENDPOINT_HEALTH = "/api/health"
BASE_URL = None
DEFAULT_TIMEOUT = 120
DEFAULT_UPLOAD_WAIT_TIMEOUT = 900
ACTIVE_UPLOAD_STATUSES = {"queued", "running", "retrying"}

DEFAULT_PULL_METHOD = "scp"
FAILURE_LOG_SERVER = "192.168.6.55"
FAILURE_LOG_USER = "root"
FAILURE_LOG_PASSWORD = "root"
FAILURE_LOG_REMOTE_DIR = "/opt/pipette_assembly_qc_log"
FAILURE_ARTIFACT_SUBDIRECTORY_SUPPORTED = True


def get_local_ip() -> str:
    """Get the robots ip."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_gateway() -> Optional[str]:
    """Get network gateway."""
    local_ip = get_local_ip()
    parts = local_ip.split(".")
    if len(parts) != 4:
        return None
    return f"{parts[0]}.{parts[1]}.{parts[2]}.1"


def _check_ip(ip: str, port: int = 8090) -> Optional[str]:
    try:
        url = f"http://{ip}:{port}{API_ENDPOINT_HEALTH}"
        response = requests.get(url, timeout=DEFAULT_TIMEOUT)
        if response.status_code == 200:
            return f"http://{ip}:{port}"
    except Exception:
        pass
    return None


def scan_network_for_server() -> Optional[str]:
    """Find the local server."""
    gateway = get_gateway()
    if not gateway:
        print("Failed to get gateway, cannot scan network")
        return None

    base_ip = ".".join(gateway.split(".")[:-1])
    print(f"Scanning network {base_ip}.0/24 for server...")

    found_url = None
    lock = threading.Lock()
    scanned_count = 0
    total_ips = 256

    def scan_ip(ip_suffix: int) -> Optional[str]:
        """Scan for the server."""
        nonlocal found_url, scanned_count
        ip = f"{base_ip}.{ip_suffix}"
        url = _check_ip(ip)
        with lock:
            scanned_count += 1
            if scanned_count % 50 == 0:
                print(f"Scanned {scanned_count}/{total_ips} IPs...")
        if url:
            found_url = url
            return url
        return None

    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(scan_ip, i) for i in range(256)]
        for future in as_completed(futures):
            if future.result():
                executor.shutdown(wait=False)
                break

    return found_url


def get_base_url() -> str:
    """Get the base url, if we don't have it already find it."""
    global BASE_URL

    if BASE_URL:
        return BASE_URL

    print(f"Trying default URL: {DEFAULT_BASE_URL}")
    try:
        response = requests.get(
            f"{DEFAULT_BASE_URL}{API_ENDPOINT_HEALTH}", timeout=DEFAULT_TIMEOUT
        )
        if response.status_code == 200:
            BASE_URL = DEFAULT_BASE_URL
            print(f"Server found at default URL: {BASE_URL}")
            return BASE_URL
    except Exception as exc:
        print(f"Default URL not accessible: {exc}")

    print("Scanning network for server...")
    found_url = scan_network_for_server()
    if found_url:
        BASE_URL = found_url
        print(f"Server found at: {BASE_URL}")
        return BASE_URL

    print("Warning: Could not find server, using default URL")
    BASE_URL = DEFAULT_BASE_URL
    return BASE_URL


def delete_folder(folder_path: str) -> None:
    """Delete a folder."""
    try:
        if folder_path and os.path.exists(folder_path):
            shutil.rmtree(folder_path)
            print(f"Deleted folder: {folder_path}")
    except Exception as exc:
        print(f"Failed to delete files: {exc}")


def check_health() -> Dict[str, Any]:
    """Get server health."""
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_HEALTH}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as exc:
        error = _upload_request_error(exc)
        _upload_progress(f"Health check failed: {error}", None)
        return {"status": False, "error": error}


def request_error_detail(exc: Exception) -> str:
    """Extract the useful server error from an HTTP exception."""
    response = getattr(exc, "response", None)
    if response is not None:
        try:
            payload = response.json()
            detail = (
                payload.get("detail", payload) if isinstance(payload, dict) else payload
            )
            if isinstance(detail, dict):
                message = detail.get("message") or detail.get("error")
                nested_error = detail.get("error") if detail.get("message") else None
                if message and nested_error and nested_error != message:
                    return f"{message}: {nested_error}"
                if message:
                    return str(message)
            if detail:
                return str(detail)
        except (ValueError, TypeError):
            pass
    return str(exc)


def request_failure_classification(exc: Exception) -> Tuple[str, str]:
    """Classify a request failure for the upload record."""
    response = getattr(exc, "response", None)
    status_code = getattr(response, "status_code", None)
    if status_code is not None and 400 <= status_code < 500:
        return "request_validation", f"http_{status_code}"
    if status_code is not None and status_code >= 500:
        return "request_processing", f"http_{status_code}"
    return "request_transport", "client_request_failed"


def _upload_progress(message: str, callback: UploadProgressCallback) -> None:
    """Expose bounded diagnostics without leaking credentials or failing an upload."""
    message = re.sub(r"(?i)(https?://)[^\s/@]+:[^\s/@]+@", r"\1[redacted]@", message)
    message = re.sub(r"(?i)\b(?:Bearer|Basic)\s+[^\s,;}\"']+", "[redacted]", message)
    message = re.sub(
        r"(?i)([\"']?(?:password|passwd|token|access_token|refresh_token|"
        r"api_key|authorization)[\"']?\s*[:=]\s*)"
        r"(?:\"[^\"]*\"|'[^']*'|[^\s,;}]+)",
        r"\1[redacted]",
        message,
    )
    message = message[:4000]
    print(message)
    if callback is not None:
        try:
            callback(message)
        except Exception:
            # A protocol comment failure must not discard the upload outcome.
            print("Upload progress callback failed; continuing upload")


def _upload_request_error(exc: Exception) -> str:
    """Include the HTTP status and useful response body in progress diagnostics."""
    response = getattr(exc, "response", None)
    status_code = getattr(response, "status_code", None)
    detail = request_error_detail(exc)
    if response is not None and detail == str(exc):
        detail = getattr(response, "text", "") or detail
    return f"HTTP {status_code}: {detail}" if status_code is not None else str(detail)


def get_file_integrity(
    file_path: Optional[Union[Path, str]]
) -> Tuple[Optional[int], Optional[str]]:
    """Read the size and SHA-256 of a local file if it exists."""
    if not file_path or not os.path.isfile(file_path):
        return None, None
    digest = hashlib.sha256()
    size = 0
    with open(file_path, "rb") as handle:
        while chunk := handle.read(1024 * 1024):
            size += len(chunk)
            digest.update(chunk)
    return size, digest.hexdigest()


class UploadRecordUnsupportedError(RuntimeError):
    """The server explicitly does not expose the upload-record start endpoint."""


def start_upload_record(
    csv_file_path: Union[Path, str],
    zip_file_path: Optional[Union[Path, str]] = None,
    source: str = "client",
    idempotency_key: Optional[str] = None,
    *,
    progress_callback: UploadProgressCallback = None,
    raise_if_unsupported: bool = False,
) -> Optional[UploadRecordId]:
    """Create the durable upload record before sending a large request body."""
    try:
        base_url = get_base_url()
        csv_size, csv_sha256 = get_file_integrity(csv_file_path)
    except Exception as exc:
        _upload_progress(
            f"stage=record_start failed before request: {_upload_request_error(exc)}",
            progress_callback,
        )
        return None
    payload = {
        "csv_file_name": os.path.basename(csv_file_path or ""),
        "zip_file_name": os.path.basename(zip_file_path) if zip_file_path else None,
        "source": source,
        "idempotency_key": idempotency_key or uuid4().hex,
        "csv_size": csv_size,
        "csv_sha256": csv_sha256,
    }
    for attempt in range(1, 4):
        try:
            response = requests.post(
                f"{base_url}{API_ENDPOINT_UPLOAD_RECORD_START}",
                json=payload,
                timeout=min(DEFAULT_TIMEOUT, 30),
            )
            response.raise_for_status()
            body = response.json()
            record_id = body.get("record_id") if isinstance(body, dict) else None
            if not isinstance(record_id, (str, int)) or not record_id:
                raise RuntimeError(f"Upload record response missing record_id: {body}")
            return record_id
        except Exception as exc:
            _upload_progress(
                f"stage=record_start attempt={attempt}/3 failed: "
                f"{_upload_request_error(exc)}",
                progress_callback,
            )
            error_response = getattr(exc, "response", None)
            if (
                raise_if_unsupported
                and isinstance(exc, requests.exceptions.HTTPError)
                and getattr(error_response, "status_code", None) in {404, 405}
            ):
                raise UploadRecordUnsupportedError(
                    f"{API_ENDPOINT_UPLOAD_RECORD_START}: {_upload_request_error(exc)}"
                ) from exc
            if attempt == 3:
                return None
            time.sleep(attempt)
    return None


def get_upload_record_status(
    record_id: Optional[UploadRecordId],
) -> Optional[Dict[str, Any]]:
    """Read the server status for one upload record."""
    if not record_id:
        return None
    try:
        response = requests.get(
            f"{get_base_url()}{API_ENDPOINT_UPLOAD_RECORDS}/{record_id}",
            timeout=min(DEFAULT_TIMEOUT, 30),
        )
        response.raise_for_status()
        body = response.json()
        return body if isinstance(body, dict) else None
    except (requests.exceptions.RequestException, ValueError):
        return None


def wait_for_upload_record(
    record_id: UploadRecordId,
    timeout: float = DEFAULT_UPLOAD_WAIT_TIMEOUT,
    poll_seconds: float = 2,
) -> Dict[str, Any]:
    """Wait for the durable upload record to reach success or failure."""
    deadline = time.monotonic() + max(1, timeout)
    last_status = None
    while time.monotonic() < deadline:
        status = get_upload_record_status(record_id)
        if status:
            last_status = status
            if status.get("status") == "success":
                return {**status, "success": True}
            if status.get("status") == "failed":
                return {**status, "success": False}
        time.sleep(max(0.2, poll_seconds))
    return {
        **(last_status or {}),
        "record_id": record_id,
        "success": False,
        "pending": bool(
            last_status and last_status.get("status") in ACTIVE_UPLOAD_STATUSES
        ),
        "error": "Upload is still processing after the client wait timeout",
    }


def resolve_uncertain_upload_request(
    record_id: UploadRecordId, error: Exception
) -> Dict[str, Any]:
    """Check whether a failed HTTP request already queued or completed the upload."""
    status = get_upload_record_status(record_id)
    if status and status.get("status") == "success":
        return {**status, "success": True}
    if (
        status
        and status.get("status") in ACTIVE_UPLOAD_STATUSES
        and status.get("job_enqueued")
    ):
        return {**status, "success": True, "accepted": True, "pending": True}
    if status and status.get("status") == "failed":
        return {**status, "success": False}
    failure_stage, failure_code = request_failure_classification(error)
    detail = request_error_detail(error)
    mark_upload_record_failed(
        record_id,
        detail,
        failure_stage=failure_stage,
        failure_code=failure_code,
    )
    return {
        "error": detail,
        "record_id": record_id,
        "success": False,
        "failure_stage": failure_stage,
        "failure_code": failure_code,
    }


def mark_upload_record_failed(
    record_id: Optional[UploadRecordId],
    error: Union[Exception, str],
    *,
    failure_stage: str = "request_transport",
    failure_code: str = "client_request_failed",
) -> bool:
    """Best-effort failure callback for requests that never reach the upload handler."""
    if not record_id:
        return False
    base_url = get_base_url()
    payload = {
        "failure_stage": failure_stage,
        "failure_code": failure_code,
        "message": str(error)[:4000],
        "detail": str(error)[:10000],
    }
    try:
        response = requests.post(
            f"{base_url}{API_ENDPOINT_UPLOAD_RECORDS}/{record_id}/fail",
            json=payload,
            timeout=min(DEFAULT_TIMEOUT, 30),
        )
        response.raise_for_status()
        return bool(response.json().get("success"))
    except Exception as exc:
        print(f"Failed to mark upload record {record_id} as failed: {exc}")
        return False


def pull_folder(
    csv_file_path: Union[Path, str],
    folder_name: str,
    pull_method: str = DEFAULT_PULL_METHOD,
    record_id: Optional[UploadRecordId] = None,
) -> Dict[str, Any]:
    """Pull a folder and associate any failure with its upload record."""
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_PULL}"
        data = {
            "folder_name": folder_name,
            "pull_method": pull_method,
        }
        with open(csv_file_path, "rb") as csv_handle:
            response = requests.post(
                url,
                data=data,
                files={"csv_file": csv_handle},
                timeout=DEFAULT_TIMEOUT,
            )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as exc:
        error = _upload_request_error(exc)
        _upload_progress(f"Error pulling folder: {error}", None)
        mark_upload_record_failed(
            record_id,
            error,
            failure_stage="robot_data_pull",
            failure_code="robot_data_pull_failed",
        )
        return {"error": error}
    except Exception as exc:
        print(f"Error: {exc}")
        mark_upload_record_failed(
            record_id,
            exc,
            failure_stage="robot_data_pull",
            failure_code="robot_data_pull_failed",
        )
        return {"error": str(exc)}


def collect_source_files(csv_file_path: Union[Path, str]) -> List[str]:
    """Glob for files."""
    source_dir = os.path.dirname(os.path.abspath(csv_file_path))
    csv_name = os.path.basename(csv_file_path)
    source_files = []
    for file_name in sorted(os.listdir(source_dir)):
        file_path = os.path.join(source_dir, file_name)
        if not os.path.isfile(file_path) or file_name == csv_name:
            continue
        source_files.append(file_path)
    return source_files


def upload_data(
    csv_file_path: Union[Path, str],
    zip_file_path: Union[Path, str],
    record_id: Optional[UploadRecordId] = None,
) -> Dict[str, Any]:
    """Submit server-side CSV and ZIP paths for a tracked upload."""
    base_url = get_base_url()
    record_id = record_id or start_upload_record(csv_file_path, zip_file_path)
    if not record_id:
        return {"error": "Unable to create upload record", "success": False}
    try:
        url = f"{base_url}{API_ENDPOINT_UPLOAD}"
        payload = {
            "csv_file_path": str(csv_file_path) if csv_file_path else "",
            "zip_file_path": str(zip_file_path) if zip_file_path else "",
            "record_id": record_id,
        }
        response = requests.post(url, json=payload, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as exc:
        error = request_error_detail(exc)
        print(f"Error uploading data: {error}")
        return resolve_uncertain_upload_request(record_id, exc)
    except Exception as exc:
        print(f"Error: {exc}")
        mark_upload_record_failed(record_id, exc)
        return {"error": str(exc), "record_id": record_id, "success": False}


def upload_manual_data(
    csv_file_path: Union[Path, str],
    include_source_zip: bool = False,
    all_files: bool = False,
    meta: Optional[Dict[str, Any]] = None,
    record_id: Optional[UploadRecordId] = None,
    *,
    create_record: bool = True,
) -> Dict[str, Any]:
    """Upload local files with optional metadata and a durable upload record."""
    base_url = get_base_url()
    if not record_id and create_record:
        record_id = start_upload_record(csv_file_path, source="manual")
    if not record_id and create_record:
        return {"error": "Unable to create upload record", "success": False}
    opened_files = []
    try:
        url = f"{base_url}{API_ENDPOINT_UPLOAD_MANUAL}"
        data: Dict[str, Any] = {
            "include_source_zip": str(include_source_zip).lower(),
            "all_files": str(all_files).lower(),
        }
        if record_id:
            data["record_id"] = record_id
        if meta:
            data["meta"] = json.dumps(meta, ensure_ascii=False)
        files = []
        csv_handle = open(csv_file_path, "rb")
        opened_files.append(csv_handle)
        files.append(
            ("csv_file", (os.path.basename(csv_file_path), csv_handle, "text/csv"))
        )

        if all_files:
            for source_path in collect_source_files(csv_file_path):
                source_handle = open(source_path, "rb")
                opened_files.append(source_handle)
                files.append(
                    (
                        "source_files",
                        (
                            os.path.basename(source_path),
                            source_handle,
                            "application/octet-stream",
                        ),
                    )
                )

        response = requests.post(url, data=data, files=files, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        body = response.json()
        if response.status_code == 202:
            # HTTP acceptance is not completion, even if the JSON says success.
            return {**body, "accepted": True, "pending": True, "http_status": 202}
        return body
    except requests.exceptions.RequestException as exc:
        error = _upload_request_error(exc)
        _upload_progress(f"Error uploading manual data: {error}", None)
        if record_id:
            return resolve_uncertain_upload_request(record_id, exc)
        # An untracked request may have been processed; never retry its CSV here.
        return {"error": error, "success": False}
    except Exception as exc:
        print(f"Error: {exc}")
        mark_upload_record_failed(
            record_id,
            exc,
            failure_stage="prepare_request",
            failure_code="client_request_build_failed",
        )
        return {"error": str(exc), "record_id": record_id, "success": False}
    finally:
        for handle in opened_files:
            handle.close()


class FailureLogUploadError(RuntimeError):
    """An upload failure safe to include in protocol comments."""


def _run_failure_log_command(command: List[str], environment: Dict[str, str]) -> None:
    """Bound the command's lifetime, including any SSH child spawned by SCP."""
    with subprocess.Popen(
        command,
        env=environment,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        errors="replace",
        start_new_session=True,
    ) as process:
        try:
            stdout, stderr = process.communicate(timeout=DEFAULT_TIMEOUT)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            stdout, stderr = process.communicate()
            raise subprocess.TimeoutExpired(
                command, DEFAULT_TIMEOUT, output=stdout, stderr=stderr
            ) from None
        if process.returncode:
            raise subprocess.CalledProcessError(
                process.returncode, command, output=stdout, stderr=stderr
            )


@contextmanager
def _failure_log_ssh_commands() -> Iterator[
    Tuple[Dict[str, str], List[str], List[str]]
]:
    """Authenticate with the installed SSH client without requiring sshpass."""
    programs = {}
    for program in ("ssh", "scp"):
        executable = shutil.which(program)
        if executable is None:
            raise FileNotFoundError(f"Required program not found on PATH: {program}")
        programs[program] = executable
    version = subprocess.run(
        [programs["ssh"], "-V"],
        timeout=10,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        errors="replace",
        check=True,
    )
    environment = os.environ.copy()
    with TemporaryDirectory(prefix="qc-log-ssh-") as directory:
        if "dropbear" in (version.stdout + version.stderr).lower():
            # Dropbear's native password environment avoids external helpers.
            # Its -o parser ignores OpenSSH host-key and timeout options.
            environment["DROPBEAR_PASSWORD"] = FAILURE_LOG_PASSWORD
            ssh_command = [programs["ssh"], "-y", "-y"]
            wrapper = Path(directory) / "ssh-client"
            wrapper.write_text(
                "#!/bin/sh\nexec " + shlex.join(ssh_command) + ' "$@"\n',
                encoding="utf-8",
            )
            wrapper.chmod(0o700)
            scp_command = [programs["scp"], "-S", str(wrapper)]
        else:
            # Keep the password out of both command arguments and helper files.
            askpass = Path(directory) / "askpass"
            askpass.write_text(
                "#!/bin/sh\nprintf '%s\\n' \"$QC_FAILURE_LOG_PASSWORD\"\n",
                encoding="utf-8",
            )
            askpass.chmod(0o700)
            environment.update(
                {
                    "QC_FAILURE_LOG_PASSWORD": FAILURE_LOG_PASSWORD,
                    "SSH_ASKPASS": str(askpass),
                    "SSH_ASKPASS_REQUIRE": "force",
                    "DISPLAY": environment.get("DISPLAY") or ":0",
                }
            )
            ssh_options = [
                "-o",
                "StrictHostKeyChecking=no",
                "-o",
                "UserKnownHostsFile=/dev/null",
                "-o",
                "ConnectTimeout=10",
                "-o",
                "NumberOfPasswordPrompts=1",
            ]
            ssh_command = [programs["ssh"], *ssh_options]
            scp_command = [programs["scp"], "-S", programs["ssh"], *ssh_options]
        yield environment, ssh_command, scp_command


def upload_failure_log(
    log_file_path: Union[Path, str],
    *,
    raise_on_error: bool = False,
    remote_subdir: Optional[str] = None,
) -> bool:
    """Copy a failed QC log; optionally raise a sanitized error for run logs."""
    return _upload_failure_file(
        log_file_path,
        allowed_extensions=(".log",),
        artifact_name="log",
        raise_on_error=raise_on_error,
        remote_subdir=remote_subdir,
    )


def upload_failure_artifact(
    file_path: Union[Path, str],
    *,
    raise_on_error: bool = False,
    remote_subdir: Optional[str] = None,
) -> bool:
    """Copy one failed QC log, JSON record, or CSV to the failure archive."""
    return _upload_failure_file(
        file_path,
        allowed_extensions=(".log", ".json", ".csv"),
        artifact_name="artifact",
        raise_on_error=raise_on_error,
        remote_subdir=remote_subdir,
    )


def _upload_failure_file(
    file_path: Union[Path, str],
    *,
    allowed_extensions: Tuple[str, ...],
    artifact_name: str,
    raise_on_error: bool,
    remote_subdir: Optional[str] = None,
) -> bool:
    """Share authentication, command deadlines, and redaction for QC evidence."""
    stage = f"validating local {artifact_name}"
    try:
        path = Path(file_path).absolute()
        if not path.is_file():
            raise FileNotFoundError(path)
        if path.suffix.lower() not in allowed_extensions:
            extensions = ", ".join(allowed_extensions)
            raise ValueError(
                f"Failure {artifact_name} must use the {extensions} extension: {path}"
            )
        stage = "validating remote subdirectory"
        remote_dir = FAILURE_LOG_REMOTE_DIR
        if remote_subdir is not None:
            if (
                not isinstance(remote_subdir, str)
                or remote_subdir in (".", "..")
                or re.fullmatch(r"[A-Za-z0-9_.-]+", remote_subdir) is None
            ):
                raise ValueError(
                    "Remote subdirectory must be one nonempty path component "
                    "using only ASCII letters, digits, hyphens, underscores, or "
                    "periods, excluding '.' and '..'"
                )
            remote_dir = f"{remote_dir.rstrip('/')}/{remote_subdir}"
        stage = "preparing SSH authentication"
        with _failure_log_ssh_commands() as (environment, ssh_command, scp_command):
            destination = f"{FAILURE_LOG_USER}@{FAILURE_LOG_SERVER}"
            commands = [
                (
                    "creating remote directory",
                    [
                        *ssh_command,
                        destination,
                        f"mkdir -p -- {shlex.quote(remote_dir)}",
                    ],
                ),
                (
                    f"copying {artifact_name} with SCP",
                    [
                        *scp_command,
                        str(path),
                        f"{destination}:{shlex.quote(remote_dir + '/')}",
                    ],
                ),
            ]
            for stage, command in commands:
                _run_failure_log_command(command, environment)
        return True
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        if isinstance(exc, subprocess.CalledProcessError):
            detail = f"exit status {exc.returncode}"
        elif isinstance(exc, subprocess.TimeoutExpired):
            detail = f"timed out after {exc.timeout} seconds"
        else:
            detail = str(exc)
        stderr = getattr(exc, "stderr", None)
        if stderr:
            if isinstance(stderr, bytes):
                stderr = stderr.decode("utf-8", errors="replace")
            detail += f": {stderr.strip()}"
        message = f"Error uploading QC failure {artifact_name} {file_path} ({stage}): {detail}"
        if FAILURE_LOG_PASSWORD:
            message = message.replace(FAILURE_LOG_PASSWORD, "[redacted]")
        print(message)
        if raise_on_error:
            raise FailureLogUploadError(message) from None
        return False


def _legacy_upload_data(
    csv_file_path: Union[Path, str], zip_file_path: Union[Path, str]
) -> Dict[str, Any]:
    """Submit server-side paths without the durable upload-record API.

    This is the upload contract used by the older Data Center service.  Keep
    it separate from ``upload_data`` so the current record-tracked path never
    silently loses its idempotency and completion checks.
    """
    base_url = get_base_url()
    try:
        response = requests.post(
            f"{base_url}{API_ENDPOINT_UPLOAD}",
            json={
                "csv_file_path": str(csv_file_path) if csv_file_path else "",
                "zip_file_path": str(zip_file_path) if zip_file_path else "",
            },
            timeout=DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        body = response.json()
        return body if isinstance(body, dict) else {"success": False, "response": body}
    except requests.exceptions.RequestException as exc:
        return {"success": False, "error": _upload_request_error(exc)}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def _legacy_upload_data_to_google_drive(
    csv_file_path: Union[Path, str],
    remove_remote_folder: bool,
    pull_method: str,
    include_source_zip: bool,
    all_files: bool,
    progress_callback: UploadProgressCallback,
) -> bool:
    """Use the pre-upload-record flow for older Data Center deployments."""

    def progress(message: str) -> None:
        _upload_progress(message, progress_callback)

    folder_name = os.path.dirname(csv_file_path)
    progress("stage=legacy_health_check")
    health_result = check_health()
    if not health_result.get("status", False):
        progress(f"stage=legacy_health_check failed: {health_result}")
        return False

    if all_files or include_source_zip:
        progress(
            "stage=legacy_upload_submit endpoint="
            f"{API_ENDPOINT_UPLOAD_MANUAL}"
        )
        upload_response = upload_manual_data(
            csv_file_path=csv_file_path,
            include_source_zip=include_source_zip or all_files,
            all_files=all_files,
            create_record=False,
        )
    else:
        progress(f"stage=legacy_robot_data_pull method={pull_method}")
        download_response = pull_folder(
            csv_file_path=csv_file_path,
            folder_name=folder_name,
            pull_method=pull_method,
        )
        if not download_response.get("success", False):
            progress(f"stage=legacy_robot_data_pull failed: {download_response}")
            return False
        zip_path = download_response.get("zip_path")
        csv_file = download_response.get("file_name")
        if not csv_file or not zip_path:
            progress(
                "stage=legacy_robot_data_pull failed: response missing "
                "zip_path or file_name"
            )
            return False
        progress(f"stage=legacy_upload_submit endpoint={API_ENDPOINT_UPLOAD}")
        upload_response = _legacy_upload_data(csv_file, zip_path)

    result = bool(upload_response.get("success"))
    if result and remove_remote_folder:
        delete_folder(folder_name)
    progress(
        "stage=legacy_upload_result status="
        f"{'success' if result else 'failed'} response={upload_response}"
    )
    return result


def upload_data_to_google_drive_legacy(
    csv_file_path: Union[Path, str],
    remove_remote_folder: bool = False,
    pull_method: str = DEFAULT_PULL_METHOD,
    include_source_zip: bool = False,
    all_files: bool = False,
    *,
    progress_callback: UploadProgressCallback = None,
    **kwargs: Any,
) -> bool:
    """Upload through the pre-upload-record Data Center contract directly."""
    if "delete_folder" in kwargs:
        remove_remote_folder = kwargs.pop("delete_folder")
    if kwargs:
        unexpected = ", ".join(sorted(kwargs))
        raise TypeError(f"Unexpected keyword argument(s): {unexpected}")
    return _legacy_upload_data_to_google_drive(
        csv_file_path=csv_file_path,
        remove_remote_folder=remove_remote_folder,
        pull_method=pull_method,
        include_source_zip=include_source_zip,
        all_files=all_files,
        progress_callback=progress_callback,
    )


def upload_data_to_google_drive(
    csv_file_path: Union[Path, str],
    remove_remote_folder: bool = False,
    pull_method: str = DEFAULT_PULL_METHOD,
    include_source_zip: bool = False,
    all_files: bool = False,
    *,
    direct_upload: bool = False,
    progress_callback: UploadProgressCallback = None,
    **kwargs: Any,
) -> bool:
    """Upload and confirm completion; direct mode sends the CSV without robot SCP."""
    if "delete_folder" in kwargs:
        remove_remote_folder = kwargs.pop("delete_folder")
    if kwargs:
        unexpected = ", ".join(sorted(kwargs))
        raise TypeError(f"Unexpected keyword argument(s): {unexpected}")

    def progress(message: str) -> None:
        _upload_progress(message, progress_callback)

    progress("================UPLOAD START=====================")
    folder_name = os.path.dirname(csv_file_path)
    manual = direct_upload or all_files or include_source_zip
    progress(
        f"stage=record_start mode={'direct' if manual else 'pull'} "
        f"csv_file={csv_file_path}"
    )
    legacy_direct = False
    try:
        record_id = start_upload_record(
            csv_file_path,
            source="client",
            progress_callback=progress_callback,
            raise_if_unsupported=direct_upload,
        )
    except UploadRecordUnsupportedError as exc:
        legacy_direct = True
        record_id = None
        progress(
            f"stage=record_start mode=legacy_direct {exc}; "
            "server has no upload-record API; sending CSV directly without a record"
        )
    if not record_id and not legacy_direct:
        progress(
            "stage=record_start failed: Unable to create upload record; upload aborted"
        )
        return False
    progress(f"stage=health_check record_id={record_id}")
    health_result = check_health()
    if not health_result.get("status", False):
        progress(f"stage=health_check record_id={record_id} failed: {health_result}")
        mark_upload_record_failed(
            record_id,
            health_result.get("error") or "Data Center health check failed",
            failure_stage="health_check",
            failure_code="data_center_unhealthy",
        )
        return False

    services = health_result.get("services", {})
    slack_status = services.get("slack", {}).get("status", "unknown")
    google_drive_status = services.get("google_drive", {}).get("status", "unknown")
    progress(
        f"Health check passed - Slack: {slack_status}, Google Drive: {google_drive_status}"
    )

    if manual:
        progress(
            f"stage=upload_submit record_id={record_id} "
            f"endpoint={API_ENDPOINT_UPLOAD_MANUAL} "
            f"include_source_zip={include_source_zip or all_files} all_files={all_files}"
        )
        manual_options: Dict[str, Any] = (
            {"create_record": False} if legacy_direct else {}
        )
        upload_response = upload_manual_data(
            csv_file_path=csv_file_path,
            include_source_zip=include_source_zip or all_files,
            all_files=all_files,
            record_id=record_id,
            **manual_options,
        )
    else:
        progress(f"stage=robot_data_pull record_id={record_id} method={pull_method}")
        download_response = pull_folder(
            csv_file_path=csv_file_path,
            folder_name=folder_name,
            pull_method=pull_method,
            record_id=record_id,
        )
        download_success = download_response.get("success", False)
        if not download_success:
            progress(
                f"stage=robot_data_pull record_id={record_id} failed: {download_response}"
            )
            mark_upload_record_failed(
                record_id,
                download_response.get("error") or "Robot data pull failed",
                failure_stage="robot_data_pull",
                failure_code="robot_data_pull_failed",
            )
            return False

        zip_path = download_response.get("zip_path")
        csv_file = download_response.get("file_name")
        if not csv_file or not zip_path:
            progress(
                f"stage=robot_data_pull record_id={record_id} failed: "
                "Download response missing zip_path or file_name"
            )
            mark_upload_record_failed(
                record_id,
                "Download response missing zip_path or file_name",
                failure_stage="robot_data_pull",
                failure_code="robot_data_pull_response_invalid",
            )
            return False

        progress(
            f"stage=upload_submit record_id={record_id} endpoint={API_ENDPOINT_UPLOAD}"
        )
        upload_response = upload_data(
            csv_file_path=csv_file,
            zip_file_path=zip_path,
            record_id=record_id,
        )

    if legacy_direct:
        # Old servers may synchronously return success, but queued/accepted is
        # never confirmation that the report reached its final destination.
        pending = bool(
            upload_response.get("accepted")
            or upload_response.get("pending")
            or upload_response.get("queued")
            or upload_response.get("status")
            in ACTIVE_UPLOAD_STATUSES | {"accepted", "pending", "processing"}
        )
        final_response = {
            **upload_response,
            "success": upload_response.get("success") is True
            and not pending
            and upload_response.get("status") in {None, "success", "completed"},
            "pending": pending,
        }
    elif upload_response.get("success") and record_id is not None:
        progress(
            f"stage=upload_wait record_id={record_id} "
            "request accepted; waiting for confirmed server completion"
        )
        final_response = wait_for_upload_record(record_id)
    else:
        final_response = upload_response
    result = bool(final_response.get("success")) and not final_response.get(
        "pending", False
    )
    if result and remove_remote_folder:
        delete_folder(folder_name)
    if result:
        progress(f"stage=upload_result record_id={record_id} status=success")
    else:
        progress(
            f"stage=upload_result record_id={record_id} "
            f"status={'pending' if final_response.get('pending') else 'failed'} "
            f"response={final_response}"
        )
    progress("================UPLOAD END=====================")
    return result


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    """Generate args for running manually."""
    parser = argparse.ArgumentParser(description="Data Center manual upload client")
    parser.add_argument(
        "--csv",
        required=True,
        help="Local CSV file path.",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help=f"Data Center base URL. Default: auto-detect, then {DEFAULT_BASE_URL}.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"HTTP timeout seconds. Default: {DEFAULT_TIMEOUT}.",
    )
    parser.add_argument(
        "--include-source-zip",
        action="store_true",
        help="Package the CSV itself as the raw source zip.",
    )
    parser.add_argument(
        "--all-files",
        action="store_true",
        help="Package all files in the CSV directory as the raw source zip.",
    )
    parser.add_argument(
        "--pull-folder",
        action="store_true",
        help="Run the robot pull flow first, then upload via manual API.",
    )
    parser.add_argument(
        "--pull-method",
        choices=("scp", "sftp"),
        default=DEFAULT_PULL_METHOD,
        help=f"Pull method for --pull-folder. Default: {DEFAULT_PULL_METHOD}.",
    )
    parser.add_argument(
        "--delete-folder",
        action="store_true",
        help="Delete the robot folder after a successful upload.",
    )
    parser.add_argument(
        "--skip-health",
        action="store_true",
        help="Skip health check before upload.",
    )
    parser.add_argument(
        "--meta-json",
        default="",
        help='Optional JSON object for manual metadata override, e.g. \'{"test_name":"z-stage-test-qc-ot3"}\'.',
    )
    return parser.parse_args(argv)


def configure_client(
    base_url: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT
) -> None:
    """Configure the base url and timeout global."""
    global BASE_URL, DEFAULT_TIMEOUT

    DEFAULT_TIMEOUT = timeout
    if base_url:
        BASE_URL = base_url.rstrip("/")


def print_response(response: Dict[str, Any]) -> None:
    """Print server response."""
    print(json.dumps(response, ensure_ascii=False, indent=2))


def main(argv: Optional[List[str]] = None) -> int:
    """Manually start an upload and wait for its final status."""
    args = parse_args(argv)
    configure_client(base_url=args.base_url, timeout=args.timeout)

    if args.pull_folder:
        result = upload_data_to_google_drive(
            csv_file_path=args.csv,
            remove_remote_folder=args.delete_folder,
            pull_method=args.pull_method,
            include_source_zip=args.include_source_zip,
            all_files=args.all_files,
        )
        return 0 if result else 1

    if not args.skip_health:
        print("Checking health status...")
        health_result = check_health()
        if not health_result.get("status", False):
            print("Data Center health check failed:")
            print_response(health_result)
            record_id = start_upload_record(args.csv, source="client")
            mark_upload_record_failed(
                record_id,
                health_result.get("error") or "Data Center health check failed",
                failure_stage="health_check",
                failure_code="data_center_unhealthy",
            )
            return 1

    include_source_zip = args.include_source_zip or args.all_files
    try:
        meta = json.loads(args.meta_json) if args.meta_json else None
    except ValueError as exc:
        print(f"Invalid --meta-json: {exc}")
        return 1
    if meta is not None and not isinstance(meta, dict):
        print("--meta-json must be a JSON object")
        return 1
    record_id = start_upload_record(args.csv, source="client")
    if not record_id:
        print("Unable to create upload record; upload aborted")
        return 1
    print("================UPLOAD START=====================")
    print(f"CSV: {args.csv}")
    print(f"include_source_zip: {include_source_zip}")
    print(f"all_files: {args.all_files}")
    print(f"meta: {meta or {}}")
    upload_response = upload_manual_data(
        csv_file_path=args.csv,
        include_source_zip=include_source_zip,
        all_files=args.all_files,
        meta=meta,
        record_id=record_id,
    )
    final_response = (
        wait_for_upload_record(record_id)
        if upload_response.get("success")
        else upload_response
    )
    print_response(final_response)
    print("================UPLOAD END=====================")
    return 0 if final_response.get("success") else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
