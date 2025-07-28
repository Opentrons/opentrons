"""Classes for controlling GoPros."""
import requests
from typing import Dict, List, Union
import platform
import subprocess

def connect_to_wifi_mac() -> None:
    """Scan and connect to a Wi-Fi network on macOS using wdutil."""
    print("🔍 Scanning for available Wi-Fi networks...\n")
    
    try:
        scan_result = subprocess.run(
            ["wdutil", "scan"],
            capture_output=True,
            text=True,
            check=True,
        )
        print(scan_result.stdout)
    except FileNotFoundError:
        print("❌ 'wdutil' not found. Make sure you’re on macOS Ventura or later.")
        return
    except subprocess.CalledProcessError as e:
        print(f"❌ Error scanning Wi-Fi networks: {e.stderr.strip()}")
        return

    ssid = input("\nEnter the SSID (Wi-Fi name) you wish to connect to: ")
    password = input("Enter the Wi-Fi password (leave blank if none): ")

    try:
        connect_result = subprocess.run(
            ["networksetup", "-setairportnetwork", "en0", ssid, password],
            capture_output=True,
            text=True,
            check=True,
        )
        print(f"✅ Connected to '{ssid}'")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to connect to '{ssid}': {e.stderr.strip()}")

class GoProCamera:
    """Commands for GoPro Control."""

    def __init__(self, ip_address: str) -> None:
        """Connect to GoPro."""
        self.ip = ip_address
        self.control_url = f"http://{self.ip}/gp/gpControl"
        self.status_url = f"{self.control_url}/status"
        self.media_url = f"http://{self.ip}:8080/gp/gpMediaList"

    def start_recording(self) -> Dict[str, Union[str | bool]]:
        """Start Recording."""
        return self._send_command("command", {"p": "1", "v": "1"})

    def stop_recording(self) -> Dict[str, Union[str | bool]]:
        """Stop Recording."""
        return self._send_command("command", {"p": "1", "v": "0"})

    def get_status(self) -> Dict[str, Union[str | bool]]:
        """Get status of gopro."""
        try:
            r = requests.get(self.status_url, timeout=3)
            return r.json() if r.ok else {"error": r.text}
        except Exception as e:
            return {"error": str(e)}

    def get_files(self) -> None:
        """Get all files."""
        files_url = f"http://{self.ip}/gopro/media/list"
        try:
            response = requests.get(files_url, timeout=5)
            response.raise_for_status()
            media_data = response.json()
            total_files = 0
            try:
                total_files = len(media_data["media"][0])
            except IndexError:
                total_files = 0
            print(f"total files {total_files}")

        except Exception as e:
            print(f"Error: {e}")

    def delete_files(self) -> None:
        """Delete Files."""
        delete_url = f"http://{self.ip}/gp/gpControl/command/storage/delete/all"
        self.get_files()
        try:
            response = requests.get(delete_url, timeout=5)
            if response.status_code == 200:
                print("All files deleted from GoPro.")
        except Exception as e:
            print(f"Failed to delete files. Status code: {e}")
        self.get_files()

    def _send_command(
        self, endpoint: str, params: Dict[str, Union[str | bool]]
    ) -> Dict[str, Union[str | bool]]:
        """Send command."""
        url = f"{self.control_url}/{endpoint}"
        try:
            r = requests.get(url, params=params, timeout=3)
            r.raise_for_status()
            return {"success": True}
        except requests.RequestException as e:
            return {"error": str(e)}


class GoProManager:
    """Control all GoPros."""

    def __init__(self, ip_list: List[str]) -> None:
        """Connect to all cameras."""
        self.cameras = [GoProCamera(ip) for ip in ip_list]

    def start_all(self) -> Dict[str, Dict[str, Union[str, bool]]]:
        """Start all cameras."""
        return {cam.ip: cam.start_recording() for cam in self.cameras}

    def stop_all(self) -> Dict[str, Dict[str, Union[str, bool]]]:
        """Stop all cameras."""
        return {cam.ip: cam.stop_recording() for cam in self.cameras}

    def get_all_statuses(self) -> Dict[str, Dict[str, Union[str, bool]]]:
        """Get all camera statuses."""
        return {cam.ip: cam.get_status() for cam in self.cameras}


if __name__ == "__main__":
    """Test out Go Pro Connection."""
    connect_to_wifi_mac()
    gopro_ip = "10.5.5.9:8080"
    camera = GoProCamera(gopro_ip)
    camera.delete_files()