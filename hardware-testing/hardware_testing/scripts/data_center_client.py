import argparse
import json
import os
import shutil
import socket
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

DEFAULT_SERVER_HOST = "192.168.6.55"
DEFAULT_SERVER_PORT = 8090
DEFAULT_BASE_URL = f"http://{DEFAULT_SERVER_HOST}:{DEFAULT_SERVER_PORT}"

API_ENDPOINT_PULL = "/api/pull-folder"
API_ENDPOINT_UPLOAD = "/api/upload-data"
API_ENDPOINT_UPLOAD_MANUAL = "/api/upload-data/manual"
API_ENDPOINT_HEALTH = "/api/health"
BASE_URL = None
DEFAULT_TIMEOUT = 120

DEFAULT_PULL_METHOD = "scp"


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_gateway():
    local_ip = get_local_ip()
    parts = local_ip.split(".")
    if len(parts) != 4:
        return None
    return f"{parts[0]}.{parts[1]}.{parts[2]}.1"


def _check_ip(ip, port=8090):
    try:
        url = f"http://{ip}:{port}{API_ENDPOINT_HEALTH}"
        response = requests.get(url, timeout=DEFAULT_TIMEOUT)
        if response.status_code == 200:
            return f"http://{ip}:{port}"
    except Exception:
        pass
    return None


def scan_network_for_server():
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

    def scan_ip(ip_suffix):
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


def get_base_url():
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


def delete_folder(folder_path):
    try:
        if folder_path and os.path.exists(folder_path):
            shutil.rmtree(folder_path)
            print(f"Deleted folder: {folder_path}")
    except Exception as exc:
        print(f"Failed to delete files: {exc}")


def check_health():
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_HEALTH}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as exc:
        print(f"Health check failed: {exc}")
        return {"status": False, "error": str(exc)}


def pull_folder(csv_file_path, folder_name, pull_method=DEFAULT_PULL_METHOD):
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_PULL}"
        data = {
            "folder_name": folder_name,
            "pull_method": pull_method,
        }
        files = {
            "csv_file": open(csv_file_path, "rb"),
        }
        response = requests.post(url, data=data, files=files, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        files["csv_file"].close()
        return response.json()
    except requests.exceptions.RequestException as exc:
        print(f"Error pulling folder: {exc}")
        return {"error": str(exc)}
    except Exception as exc:
        print(f"Error: {exc}")
        return {"error": str(exc)}


def collect_source_files(csv_file_path):
    source_dir = os.path.dirname(os.path.abspath(csv_file_path))
    csv_name = os.path.basename(csv_file_path)
    source_files = []
    for file_name in sorted(os.listdir(source_dir)):
        file_path = os.path.join(source_dir, file_name)
        if not os.path.isfile(file_path) or file_name == csv_name:
            continue
        source_files.append(file_path)
    return source_files


def upload_data(csv_file_path, zip_file_path):
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_UPLOAD}"
        payload = {
            "csv_file_path": csv_file_path if csv_file_path else "",
            "zip_file_path": zip_file_path if zip_file_path else "",
        }
        response = requests.post(url, json=payload, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as exc:
        print(f"Error uploading data: {exc}")
        return {"error": str(exc)}
    except Exception as exc:
        print(f"Error: {exc}")
        return {"error": str(exc)}


def upload_manual_data(
    csv_file_path,
    include_source_zip=False,
    all_files=False,
):
    base_url = get_base_url()
    opened_files = []
    try:
        url = f"{base_url}{API_ENDPOINT_UPLOAD_MANUAL}"
        data = {
            "include_source_zip": str(include_source_zip).lower(),
            "all_files": str(all_files).lower(),
        }
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
        return response.json()
    except requests.exceptions.RequestException as exc:
        print(f"Error uploading manual data: {exc}")
        return {"error": str(exc)}
    except Exception as exc:
        print(f"Error: {exc}")
        return {"error": str(exc)}
    finally:
        for handle in opened_files:
            handle.close()


def upload_data_to_google_drive(
    csv_file_path,
    remove_remote_folder=False,
    pull_method=DEFAULT_PULL_METHOD,
    include_source_zip=False,
    all_files=False,
    **kwargs,
):
    if "delete_folder" in kwargs:
        remove_remote_folder = kwargs.pop("delete_folder")
    if kwargs:
        unexpected = ", ".join(sorted(kwargs))
        raise TypeError(f"Unexpected keyword argument(s): {unexpected}")

    print("================UPLOAD START=====================")
    print("Step 0: Checking health status...")
    folder_name = os.path.dirname(csv_file_path)
    print(f"folder_name: {folder_name}")
    health_result = check_health()
    if not health_result.get("status", False):
        print(f"Data Center Health check failed: {health_result}")
        return False

    services = health_result.get("services", {})
    slack_status = services.get("slack", {}).get("status", "unknown")
    google_drive_status = services.get("google_drive", {}).get("status", "unknown")
    print(
        f"Health check passed - Slack: {slack_status}, Google Drive: {google_drive_status}"
    )

    if all_files or include_source_zip:
        print("Step 1: Uploading data via manual upload API...")
        upload_response = upload_manual_data(
            csv_file_path=csv_file_path,
            include_source_zip=include_source_zip or all_files,
            all_files=all_files,
        )
        result = upload_response.get("success")
        if result and remove_remote_folder:
            delete_folder(folder_name)
        if result:
            print(f"Data uploaded successfully, Result is {result}")
        else:
            print(f"Fail: Result is {upload_response}")
        print("================UPLOAD END=====================")
        return result

    print("Step 1: Downloading folder from robot...")
    download_response = pull_folder(
        csv_file_path=csv_file_path,
        folder_name=folder_name,
        pull_method=pull_method,
    )
    download_success = download_response.get("success", False)
    if not download_success:
        print(f"Error: {download_response}")
        return False

    zip_path = download_response.get("zip_path")
    csv_file = download_response.get("file_name")
    if not csv_file or not zip_path:
        print("Download response missing folder_name or file_name")
        return False

    print("Step 2: Uploading data to Google Drive...")
    upload_response = upload_data(
        csv_file_path=csv_file,
        zip_file_path=zip_path,
    )
    result = upload_response.get("success")
    if result and remove_remote_folder:
        delete_folder(folder_name)
    if result:
        print(f"Data uploaded successfully, Result is {result}")
    else:
        print(f"Fail: Result is {upload_response}")
    print("================UPLOAD END=====================")
    return result


def parse_args(argv=None):
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
    return parser.parse_args(argv)


def configure_client(base_url=None, timeout=DEFAULT_TIMEOUT):
    global BASE_URL, DEFAULT_TIMEOUT

    DEFAULT_TIMEOUT = timeout
    if base_url:
        BASE_URL = base_url.rstrip("/")


def print_response(response):
    print(json.dumps(response, ensure_ascii=False, indent=2))


def main(argv=None):
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
            return 1

    include_source_zip = args.include_source_zip or args.all_files
    print("================UPLOAD START=====================")
    print(f"CSV: {args.csv}")
    print(f"include_source_zip: {include_source_zip}")
    print(f"all_files: {args.all_files}")
    upload_response = upload_manual_data(
        csv_file_path=args.csv,
        include_source_zip=include_source_zip,
        all_files=args.all_files,
    )
    print_response(upload_response)
    print("================UPLOAD END=====================")
    return 0 if upload_response.get("success") else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
