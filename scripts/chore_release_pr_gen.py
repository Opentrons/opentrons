"""
This script generates a list of downstream branches for a given branch list and target branch.
Run locally with:
python chore_release_pr_gen.py --branch-list "branch1, branch2, branch3" --target-branch "branch2"
outputs:
downstream_branches=branch3
should_create_prs=true
"""

import argparse
import os
import sys
from typing import List
import unittest

is_ci = os.environ.get("CI") == "true"


def parse_branch_list(branch_list_str: str) -> List[str]:
    """Splits a comma-separated branch list into a clean Python list."""
    return [b.strip() for b in branch_list_str.split(",") if b.strip()]


def get_downstream_branches(
    branch_list: List[str],
    target_branch: str,
) -> List[str]:
    """
    Returns all branches after target_branch in branch_list
    (the order in the input matters!).
    If target_branch is the last branch, returns [].
    """
    if not branch_list:
        raise ValueError(
            "Branch list cannot be empty! Please check repository variable."
        )
    if not target_branch:
        raise ValueError("Target branch cannot be empty!")

    try:
        index = branch_list.index(target_branch)
    except ValueError:
        # Not in the branch list, return empty list
        return []
    # Slicing the last element
    # As will be the case for us in most PRs, is safe.
    # There is no error, the result is []
    return branch_list[index + 1 :]


def write_output(downstream_str: str, should_create_prs: str, output_file: str):
    summary_file = os.environ.get("GITHUB_STEP_SUMMARY")

    output_lines = [
        f"downstream_branches={downstream_str}",
        f"should_create_prs={should_create_prs}",
    ]

    if output_file == "-":
        output_stream = sys.stdout
    else:
        output_stream = open(output_file, "w")

    lines = [
        "| Input                              | Value                         |",
        "|------------------------------------|-------------------------------|",
        f"| vars.CHORE_RELEASE_BRANCHES        | {os.environ.get('CHORE_RELEASE_BRANCHES', '')} |",
        f"| github.event.pull_request.base.ref | {os.environ.get('PR_TARGET_BRANCH', '')} |",
        f"| downstream_branches                | {downstream_str}          |",
        f"| should_create_prs                  | {should_create_prs}            |",
        f"| github.event_name                  | {os.environ.get('GITHUB_EVENT_NAME', '')}      |",
        f"| github.actor                       | {os.environ.get('GITHUB_ACTOR', '')}           |",
        "",
    ]
    if not downstream_str:
        lines.append("### No downstream PRs to open.")
    else:
        lines.append("### Downstream PRs should be opened for:")
        lines.append(f"`{downstream_str}`")

    with output_stream as f:
        for line in output_lines:
            f.write(line + "\n")
        if summary_file and is_ci:
            with open(summary_file, "a") as f:
                for line in lines:
                    f.write(line + "\n")
        else:
            for line in lines:
                print(line)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--branch-list",
        type=str,
        required=False,
        help="Comma-separated branch list in stream order",
    )
    parser.add_argument(
        "--target-branch", type=str, required=False, help="Branch this PR is targeting"
    )
    parser.add_argument(
        "--output-file",
        type=str,
        default="-",
        help="Write outputs to this file for GitHub Actions. Use '-' for stdout.",
    )
    args = parser.parse_args()

    branch_list_str = args.branch_list or os.environ.get("CHORE_RELEASE_BRANCHES", "")
    target_branch = args.target_branch or os.environ.get("PR_TARGET_BRANCH", "")

    branch_list = parse_branch_list(branch_list_str)
    downstream = get_downstream_branches(branch_list, target_branch)
    downstream_str = ",".join(downstream)
    should_create_prs = "true" if downstream else "false"

    write_output(downstream_str, should_create_prs, args.output_file)


# ============================================================
# Unit tests for the get_downstream_branches function
# python chore_release_pr_gen.py test
# ============================================================

hotfix = "chore_release-8.4.1"
isolation = "chore_release-8.5.0"
pd = "chore_release-pd-8.5.0"
default = "edge"
other = "main"

branches = [hotfix, isolation, pd, default]


class TestGetDownstreamBranches(unittest.TestCase):

    def test_middle_branch(self):
        self.assertEqual(get_downstream_branches(branches, isolation), [pd, default])

    def test_first_branch(self):
        self.assertEqual(
            get_downstream_branches(branches, hotfix), [isolation, pd, default]
        )

    def test_last_branch(self):
        self.assertEqual(get_downstream_branches(branches, default), [])

    def test_not_in_list(self):
        self.assertEqual(get_downstream_branches(branches, other), [])

    def test_empty_branch_list(self):
        with self.assertRaises(ValueError):
            get_downstream_branches([], hotfix)

    def test_empty_target_branch(self):
        with self.assertRaises(ValueError):
            get_downstream_branches(branches, "")

    def test_single_element(self):
        self.assertEqual(get_downstream_branches([default], default), [])


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        unittest.main(argv=[sys.argv[0]])
    else:
        main()
