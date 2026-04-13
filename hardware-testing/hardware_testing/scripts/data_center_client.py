import requests
import os
import shutil
import socket
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

API_ENDPOINT_PULL = "/api/pull-folder"
API_ENDPOINT_UPLOAD = "/api/upload-data"
API_ENDPOINT_HEALTH = "/api/health"
DEFAULT_BASE_URL = "http://192.168.6.34:8090"
BASE_URL = None
DEFAULT_TIMEOUT = 120

DEFAULT_PULL_METHOD = "scp"

def get_local_ip():
    """获取本机IP地址
    
    Returns:
        str: 本机IP地址
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_gateway():
    """获取网关IP地址
    
    Returns:
        str: 网关IP地址，如果获取失败返回None
    """
    local_ip = get_local_ip()
    parts = local_ip.split('.')
    if len(parts) != 4:
        return None
    return f"{parts[0]}.{parts[1]}.{parts[2]}.1"

def _check_ip(ip, port=8090):
    """检查指定IP:端口是否有HTTP服务响应
    
    Args:
        ip (str): IP地址
        port (int): 端口号
        
    Returns:
        str: 如果找到服务返回完整URL，否则返回None
    """
    try:
        url = f"http://{ip}:{port}{API_ENDPOINT_HEALTH}"
        response = requests.get(url, timeout=DEFAULT_TIMEOUT)
        if response.status_code == 200:
            return f"http://{ip}:{port}"
    except Exception:
        pass
    return None

def scan_network_for_server():
    """扫描本地网络寻找服务器
    
    根据本机IP和网关，扫描同网段0~255的IP地址，
    查找返回HTTP 200响应的服务器
    
    Returns:
        str: 找到的服务器URL，如果未找到返回None
    """
    gateway = get_gateway()
    if not gateway:
        print("Failed to get gateway, cannot scan network")
        return None
    
    base_ip = ".".join(gateway.split('.')[:-1])
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
    """获取BASE_URL，自动检测服务器地址
    
    优先使用默认URL，如果连接失败则扫描网络查找服务器
    
    Returns:
        str: 服务器BASE_URL
    """
    global BASE_URL
    
    if BASE_URL:
        return BASE_URL
    
    print(f"Trying default URL: {DEFAULT_BASE_URL}")
    try:
        response = requests.get(f"{DEFAULT_BASE_URL}{API_ENDPOINT_HEALTH}", timeout=DEFAULT_TIMEOUT)
        if response.status_code == 200:
            BASE_URL = DEFAULT_BASE_URL
            print(f"Server found at default URL: {BASE_URL}")
            return BASE_URL
    except Exception as e:
        print(f"Default URL not accessible: {e}")
    
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
    """删除文件夹`

    Args:
        folder_path (str): 要删除的文件夹路径
    """
    try:
        if folder_path and os.path.exists(folder_path):
            shutil.rmtree(folder_path)
            print(f"Deleted folder: {folder_path}")
    except Exception as e:
        print(f"Failed to delete files: {str(e)}")

def check_health():
    """检查服务器健康状态（Slack和Google Drive连通性）

    Returns:
        dict: 健康检查结果
    """
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_HEALTH}"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Health check failed: {e}")
        return {"status": False, "error": str(e)}

def pull_folder(csv_file_path, folder_name, pull_method=DEFAULT_PULL_METHOD):
    """从服务器拉取文件夹

    Args:
        csv_file_path (str): CSV文件的本地路径, 用于上传到服务器
        folder_name (str): 要拉取的文件夹名称
        pull_method (str): 拉取方式 (sftp 或 scp)，默认 sftp

    Returns:
        dict: 包含 folder_path 等信息的响应
    """
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_PULL}"

        data = {
            "folder_name": folder_name,
            "pull_method": pull_method
        }

        files = {
            "csv_file": open(csv_file_path, 'rb')
        }

        response = requests.post(url, data=data, files=files, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()

        files["csv_file"].close()

        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error pulling folder: {e}")
        return {"error": str(e)}
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

def upload_data(csv_file_path, zip_file_path):
    """上传数据到Google Drive

    Args:
        csv_file_path (str): CSV文件的服务器路径
        zip_file_path (str): ZIP文件的服务器路径
    Returns:
        dict: 响应结果
    """
    base_url = get_base_url()
    try:
        url = f"{base_url}{API_ENDPOINT_UPLOAD}"

        payload = {
            "csv_file_path": csv_file_path if csv_file_path else "",
            "zip_file_path": zip_file_path if zip_file_path else ""
        }

        response = requests.post(url, json=payload, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error uploading data: {e}")
        return {"error": str(e)}
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

def upload_data_to_google_drive(csv_file_path, delete_folder=False, pull_method=DEFAULT_PULL_METHOD):
    """从机器人下载数据并上传到Google Drive

    完整流程：
    1. 从机器人拉取文件夹
    2. 将下载的文件夹压缩成zip
    3. 上传数据到Google Drive
    4. 删除robot上的文件夹, 如果delete_folder为True

    Args:
        csv_file_path (str): CSV文件的本地路径, 用于上传到服务器
        folder_name (str): 从机器人拉取的文件夹名称
        delete_folder (bool): 是否删除的文件夹，默认 False
        pull_method (str): 拉取方式 (sftp 或 scp)，默认 sftp

    Returns:
        dict: 包含 download 和 upload 结果的响应
    """
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
    print(f"Health check passed - Slack: {slack_status}, Google Drive: {google_drive_status}")

    print(f"Step 1: Downloading folder from robot...")
    download_response = pull_folder(
        csv_file_path=csv_file_path,
        folder_name=folder_name,
        pull_method=pull_method
    )
    download_success = download_response.get("success", False)
    if not download_success:
        print(f"Error: {download_response}")
        return False
    _ = download_response.get("folder_name")
    zip_path = download_response.get("zip_path")
    csv_file = download_response.get("file_name")
    if not csv_file or not zip_path:
        print("Download response missing folder_name or file_name")
        return False

    print(f"Step 2: Uploading data to Google Drive...")
    upload_response = upload_data(
        csv_file_path=csv_file,
        zip_file_path=zip_path
    )
    result = upload_response.get("success")
    if result and delete_folder:
        delete_folder(folder_name)
    if result:
        print(f"Data uploaded successfully, Result is {result}")
    else:
        print(f"Fail: Result is {result}")
    print("================UPLOAD END=====================")
    return result


if __name__ == "__main__":
    csv_path = "/data/testing_data/pipette-current-speed-qc-ot3/run-26-04-01-13-27-04/pipette-current-speed-qc-ot3_run-26-04-01-13-27-04_CSVReport-P50MV3520260312A01.csv"
    result = upload_data_to_google_drive(
        csv_file_path=csv_path
    )
