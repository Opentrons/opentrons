"""Classes for controlling GoPros."""
import requests
from typing import Dict, Union
from urllib.parse import urlparse
import subprocess
import time
import argparse
import os
import json
import sys
import platform


def connect_to_wifi(network_name: str, password: str) -> None:
    """Connect to a Wi-Fi network on macOS or Windows."""
    system = platform.system()

    if system == "Darwin":  # macOS
        airport_cmd = (
            "/System/Library/PrivateFrameworks/Apple80211.framework"
            "/Versions/Current/Resources/airport"
        )
        print("🔍 [macOS] Scanning for available Wi-Fi networks...\n")
        try:
            subprocess.run([airport_cmd, "-s"], check=True)
        except FileNotFoundError:
            print("❌ 'airport' tool not found.")
            return
        except subprocess.CalledProcessError as e:
            print(f"❌ Error scanning networks: {e.stderr if e.stderr else str(e)}")
            return

        try:
            subprocess.run(
                ["networksetup", "-setairportnetwork", "en0", network_name, password],
                check=True,
                capture_output=True,
                text=True,
            )
            print(f"✅ Connected to '{network_name}' on macOS")
        except subprocess.CalledProcessError as e:
            print(
                f"""❌ Failed to connect to '{network_name}':
                {e.stderr.strip() if e.stderr else str(e)}"""
            )

    elif system == "Windows":
        print(
            f"🔍 [Windows] Attempting to connect to Wi-Fi network '{network_name}'...\n"
        )
        try:
            # Create Wi-Fi profile XML
            profile_xml = f"""<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>{network_name}</name>
    <SSIDConfig>
        <SSID>
            <name>{network_name}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>manual</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>{password}</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>"""

            profile_path = os.path.join(
                os.getenv("TEMP", "/tmp"), f"{network_name}.xml"
            )

            with open(profile_path, "w") as f:
                f.write(profile_xml)

            subprocess.run(
                ["netsh", "wlan", "add", "profile", f"filename={profile_path}"],
                check=True,
                capture_output=True,
                text=True,
            )
            subprocess.run(
                ["netsh", "wlan", "connect", f"name={network_name}"],
                check=True,
                capture_output=True,
                text=True,
            )
            print(f"✅ Connected to '{network_name}' on Windows")
        except subprocess.CalledProcessError as e:
            print(
                f"""❌ Failed to connect to '{network_name}':
                {e.stderr.strip() if e.stderr else str(e)}"""
            )
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    else:
        print(f"❌ Unsupported operating system: {system}")


class GoProCamera:
    """Commands for GoPro Control."""

    def __init__(self, ip_address: str) -> None:
        """Connect to GoPro."""
        parsed = urlparse(f"http://{ip_address}")
        self.ip = parsed.hostname  # Strips port if given
        self.control_url = f"http://{self.ip}:8080/gp/gpControl"
        self.status_url = f"{self.control_url}:8080/status"
        self.media_url = f"http://{self.ip}:8080/gopro/media/list"

    def start_recording(self) -> Dict[str, Union[str, bool]]:
        """Start Recording."""
        print("📷 Started Recording")
        return self._send_command("command/shutter", {"p": "1"})

    def stop_recording(self) -> Dict[str, Union[str, bool]]:
        """Stop Recording."""
        print("🎬 Stopped Recording.")
        return self._send_command("command/shutter", {"p": "0"})

    def get_status(self) -> Dict[str, Union[str | bool]]:
        """Get status of gopro."""
        try:
            r = requests.get(self.status_url, timeout=3)
            return r.json() if r.ok else {"error": r.text}
        except Exception as e:
            return {"error": str(e)}

    def get_files(self) -> int:
        """Get all files."""
        print("📂 Getting Files.")
        self.stop_recording()
        time.sleep(5)
        total_files = 0
        try:
            response = requests.get(self.media_url, timeout=5)
            response.raise_for_status()
            media_data = response.json()
            try:
                total_files = len(media_data["media"][0])
            except IndexError:
                total_files = 0
            print(f"total files {total_files}")
        except Exception as e:
            print(f"Error: {e}")
        return total_files

    def delete_files(self) -> None:
        """Delete Files."""
        delete_url = f"http://{self.ip}/gp/gpControl/command/storage/delete/all"
        total_files = self.get_files()
        if total_files > 0:
            try:
                response = requests.get(delete_url, timeout=60)
                if response.status_code == 200:
                    print("🗑️ Deleted Files.")
            except Exception as e:
                print(f"Failed to delete files. Status code: {e}")

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


if __name__ == "__main__":
    """Test out Go Pro Connection."""
    parser = argparse.ArgumentParser(description="Read run logs on google drive.")
    parser.add_argument(
        "storage_directory",
        metavar="STORAGE_DIRECTORY",
        type=str,
        nargs=1,
        help="Path to long term storage directory for run logs.",
    )
    args = parser.parse_args()
    storage_directory = args.storage_directory[0]
    ip_json_file = os.path.join(storage_directory, "IPs.json")
    try:
        ip_file = json.load(open(ip_json_file))
        robot_dict = ip_file.get("ip_address_list")
    except FileNotFoundError:
        print(f"Add .json file with robot IPs to: {storage_directory}.")
        sys.exit()
    # Build dictionary: robot -> password (only if password exists and is not empty)
    robot_passwords = {
        values[0]: values[-1]
        for _, values in robot_dict.items()
        if len(values) >= 3 and values[-1]
    }
    gopro_ip = "10.5.5.9:8080"
    for robot, password in robot_passwords.items():
        connect_to_wifi(robot, password)
        camera = GoProCamera(gopro_ip)
        camera.stop_recording()
        camera.delete_files()
    for robot, password in robot_passwords.items():
        connect_to_wifi(robot, password)
        camera = GoProCamera(gopro_ip)
        camera.start_recording()
