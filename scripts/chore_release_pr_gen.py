import argparse
import os
from typing import List

DEFAULT_BRANCH = "edge"

def parse_branch_list(branch_list_str: str) -> List[str]:
    """Splits a comma-separated branch list into a clean Python list."""
    return [b.strip() for b in branch_list_str.split(",") if b.strip()]

def get_downstream_branches(branch_list: List[str], target_branch: str, default_branch: str = DEFAULT_BRANCH) -> List[str]:
    """
    Returns all branches after target_branch in branch_list (the order in the input matters!).
    If target_branch is present and not the default branch:
      - downstream = [all after target, except default branch]
      - then default branch is appended (if target isn't default already)
    If not present or target is default branch: returns []
    """
    try:
        idx = branch_list.index(target_branch)
    except ValueError:
        return []
    downstream = branch_list[idx + 1 :]
    # Remove default_branch if present downstream
    # This is a clean way to:
    # - set the default branch at the end
    # - handle someone including the default branch in the branch_list
    # - set downstream to [] if target_branch is the default, as it is in most cases
    downstream = [b for b in downstream if b != default_branch]
    # Append default_branch if target_branch is not already the default
    if target_branch != default_branch:
        downstream.append(default_branch)
    return downstream

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch-list", type=str, required=False, help="Comma-separated branch list in stream order")
    parser.add_argument("--target-branch", type=str, required=False, help="Branch this PR is targeting")
    parser.add_argument("--output-file", type=str, help="Write outputs to this file for GitHub Actions")
    parser.add_argument("--default-branch", type=str, required=False, default=DEFAULT_BRANCH, help="The default branch name")
    args = parser.parse_args()

    branch_list_str = args.branch_list or os.environ.get("CHORE_RELEASE_BRANCHES", "")
    target_branch = args.target_branch or os.environ.get("PR_TARGET_BRANCH", "")
    default_branch = args.default_branch or os.environ.get("DEFAULT_BRANCH", DEFAULT_BRANCH)

    branch_list = parse_branch_list(branch_list_str)
    downstream = get_downstream_branches(branch_list, target_branch, default_branch)
    downstream_str = ",".join(downstream)
    should_create_prs = "true" if downstream else "false"

    # Output for GitHub Actions
    output_lines = [
        f"downstream_branches={downstream_str}",
        f"should_create_prs={should_create_prs}",
    ]

    if args.output_file:
        with open(args.output_file, "a") as f:
            for line in output_lines:
                f.write(line + "\n")
    else:
        # For local/manual runs
        for line in output_lines:
            print(f"::set-output name={line}")

if __name__ == "__main__":
    main()