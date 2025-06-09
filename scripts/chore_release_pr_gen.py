import argparse
import os
from typing import List

DEFAULT_BRANCH = "edge"

def parse_branch_list(branch_list_str: str) -> List[str]:
    return [b.strip() for b in branch_list_str.split(",") if b.strip()]

def get_downstream_branches(branch_list: List[str], target_branch: str) -> List[str]:
    try:
        idx = branch_list.index(target_branch)
    except ValueError:
        return []
    downstream = branch_list[idx + 1 :]
    if target_branch in branch_list:
        if DEFAULT_BRANCH in downstream:
            downstream = [b for b in downstream if b != DEFAULT_BRANCH]
        downstream.append(DEFAULT_BRANCH)
    return downstream

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch-list", type=str, required=False)
    parser.add_argument("--target-branch", type=str, required=False)
    parser.add_argument("--output-file", type=str)
    args = parser.parse_args()

    branch_list_str = args.branch_list or os.environ.get("CHORE_RELEASE_BRANCHES", "")
    target_branch = args.target_branch or os.environ.get("PR_TARGET_BRANCH", "")

    branch_list = parse_branch_list(branch_list_str)
    downstream = get_downstream_branches(branch_list, target_branch)
    downstream_str = ",".join(downstream)

    if args.output_file:
        with open(args.output_file, "a") as f:
            f.write(f"downstream_branches={downstream_str}\n")
    else:
        print(f"::set-output name=downstream_branches::{downstream_str}")

if __name__ == "__main__":
    main()