"""Increase minimum duration on the livestream video tool."""
from .make_push import get_robot_ips
import subprocess


def edit_livestream_length(ip: str, time: str) -> None:
    """SSH into robot and increase livestream time."""
    key = "hls_playlist_length"
    remote_command = (
        f'mount -o remount,rw / && '
        f'sed -i "s/{key} *[0-9][0-9]*s;/{key} {time}s;/g" /etc/nginx/nginx.conf && '
        f'systemctl daemon-reload && '
        f'systemctl restart nginx'
    )
    ssh_command = ["ssh", f"root@{ip}", remote_command]
    try:
        subprocess.run(ssh_command, check=True)
        print(f"Successfully updated livestream length on {ip}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to update {ip}: {e}")


if __name__ == "__main__":
    robot_to_push = get_robot_ips()
    livestream_time = input(
        "Enter desired livestream length in seconds (e.g., 30): "
    ).strip()
    for robot_ip in robot_to_push:
        edit_livestream_length(robot_ip, livestream_time)
