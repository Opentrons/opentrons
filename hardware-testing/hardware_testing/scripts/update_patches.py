#!/usr/bin/env python3
"""Script for updating the gravimetric patches."""
import argparse
import subprocess
from typing import List


def _run_cmd(cmd_str_list: List[str]) -> str:
    print(f"running: {' '.join(cmd_str_list)}")
    result = subprocess.run(cmd_str_list, check=True, stdout=subprocess.PIPE)
    print(result.stdout.decode("utf-8"))
    return result.stdout.decode("utf-8")


def _get_current_branch() -> str:
    return _run_cmd("git rev-parse --abbrev-ref HEAD".split())


def _get_current_hash() -> str:
    return _run_cmd("git rev-parse --short HEAD".split())


def _update_patches(upstream: str) -> None:
    branch = _get_current_branch()
    cur_hash = _get_current_hash()
    _run_cmd(f"git checkout {upstream}".split())
    _run_cmd("make -C hardware-testing apply-patches-gravimetric".split())
    _run_cmd("git add -A".split())
    _run_cmd(
        ["git", "commit", "-m", "temp commit, will reverted (can be rebased away)"]
    )
    auto_hash = _get_current_hash()
    _run_cmd(f"git checkout {branch}".split())
    _run_cmd(f"git cherry-pick --strategy=recursive -X theirs {auto_hash}".split())
    cp_hash = _get_current_hash()
    _run_cmd(
        f"make -C hardware-testing update-patches-gravimetric upstream={cur_hash}".split()
    )
    _run_cmd(
        "git add hardware-testing/hardware_testing/gravimetric/overrides/*".split()
    )
    _run_cmd(
        [
            "git",
            "commit",
            "-m",
            "chore(hardware-testing): update gravimetric patch files",
        ]
    )
    _run_cmd("git checkout -f".split())
    _run_cmd(f"git revert {cp_hash} --no-edit".split())
    revert_hash = _get_current_hash()
    print("Patches applyed, if you'd like to clean up the git history you can run:")
    print(f"git rebase -i {upstream}")
    print(f"and delete the lines with the shortsha \n{cp_hash}and \n{revert_hash}")


def _main() -> None:
    parser = argparse.ArgumentParser(
        prog="update patches",
        description="updates the patches for hardware testing",
    )
    parser.add_argument(
        "--upstream",
        type=str,
        default="origin/edge",
        help="upstream branch if not edge",
    )
    args = parser.parse_args()
    return _update_patches(args.upstream)


if __name__ == "__main__":
    _main()
