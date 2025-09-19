"""Upload files to robot jupyter notebook."""
import argparse
import json
import os
from hardware_testing.scripts.ABRAsairScript import connect_ssh  # type: ignore[import]

if __name__ == "__main__":
    """Upload file to robot jupyter notebook."""
    parser = argparse.ArgumentParser(description="Pulls run logs from ABR robots.")
    parser.add_argument(
        "file_to_upload",
        metavar="FILE_TO_UPLOAD",
        type=str,
        nargs=1,
        help="Path to file of interest.",
    )
    args = parser.parse_args()
    file_to_upload = args.file_to_upload[0]
    robot_ips = [input("Enter IP of robot (type 'all' to run on all robots): ")]
    if robot_ips[0].lower() == "all":
        ip_file = input("Path of IPs.json: ")
        with open(ip_file) as file:
            file_dict = json.load(file)
            robot_dict = file_dict.get("ip_address_list")
            robot_ips = list(robot_dict.keys())
    upload_path = "/var/lib/jupyter/notebooks/"
    for robot in robot_ips:
        # Get just the file name from the local file path
        remote_filename = os.path.basename(file_to_upload)
        # Combine remote path and file name
        full_remote_path = os.path.join(upload_path, remote_filename)
        try:
            ssh = connect_ssh(robot)
            # Use SFTP to upload the file
            sftp = ssh.open_sftp()
            sftp.put(file_to_upload, full_remote_path)
            sftp.close()
            print(f"✅ Successfully uploaded to {robot}")
        except Exception as e:
            print(f"❌ SSH Error with {robot}: {e}")
            continue
