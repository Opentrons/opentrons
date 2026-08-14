import subprocess
from pathlib import Path


RASPBERRY_PIS = {
    "ZQUEAK1": "10.14.19.246",
    "MegaMan": "10.14.19.125",
    "lldbot1": "10.14.19.243",
    "lldbot2": "10.14.19.141",
}

REMOTE_FOLDER = "/data/testing_data/vacuum-module-qc/"
OUTPUT_FOLDER = Path("./vacuum_module_data")


def copy_vacuum_module(name, ip_address):
    destination = OUTPUT_FOLDER / name
    destination.mkdir(parents=True, exist_ok=True)

    remote = f"root@{ip_address}:{REMOTE_FOLDER}"

    command = [
        "scp",
        "-r",
        remote,
        str(destination),
    ]

    print(f"\n{'=' * 60}")
    print(f"Copying data from {name}")
    print(f"IP: {ip_address}")
    print(f"Destination: {destination}")
    print(f"{'=' * 60}")

    try:
        subprocess.run(command, check=True)
        print(f"PASS: {name}")
        return True

    except subprocess.CalledProcessError as e:
        print(f"FAIL: {name} - SCP returned {e.returncode}")
        return False


def main():
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    results = {}

    for name, ip_address in RASPBERRY_PIS.items():
        results[name] = copy_vacuum_module(name, ip_address)

    print("\n\nRESULTS")
    print("=" * 60)

    for name, success in results.items():
        status = "PASS" if success else "FAIL"
        print(f"{name}: {status}")


if __name__ == "__main__":
    main()