import argparse
import re
import subprocess
import sys

# ANSI Terminal Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

# --- CONFIGURATION ---
# check: The command to verify state (should return non-zero on failure)
# fix:   The command to automatically resolve issues (optional)
STATIC_TASKS = {
    "Format": {
        "check": "uv run ruff format --check .",
        "fix": "make format",
    },
    "Lint": {
        "check": "uv run ruff check .",
        "fix": "make lint",
    },
    "Typecheck": {
        "check": "uv run mypy automation tests conftest.py",
        "fix": None,  # Mypy requires manual code changes
    },
}


def parse_failures(name, stdout, stderr):
    """Extracts specific lint error codes or type errors."""
    full_text = stdout + stderr
    failures = []
    if name == "Lint":
        # Matches ruff error codes
        matches = re.findall(r": ([A-Z][0-9]+ .*)", full_text)
        failures = matches[:3]  # Show top 3
    elif name == "Typecheck":
        # Matches mypy error output
        matches = re.findall(r"error:.*", full_text)
        failures = matches[:3]
    return list(dict.fromkeys(failures))  # Unique items


def run_task(name, config):
    """Runs a shell command and captures output/status."""
    result = subprocess.run(config["check"], shell=True, capture_output=True, text=True)
    success = result.returncode == 0
    fails = [] if success else parse_failures(name, result.stdout, result.stderr)

    return {
        "name": name,
        "success": success,
        "fails": fails,
        "fix_cmd": config.get("fix"),
    }


def main():
    parser = argparse.ArgumentParser(description="Opentrons Local Static Analysis Runner")
    parser.parse_args()

    static_results = []

    # --- PHASE 1: STATIC ANALYSIS ---
    print(f"\n{BOLD}🛡️  PHASE 1: Static Analysis{RESET}")
    for name, config in STATIC_TASKS.items():
        res = run_task(name, config)
        static_results.append(res)
        status = f"{GREEN}✔{RESET}" if res["success"] else f"{RED}✘{RESET}"
        print(f"  {status} {name}")

    # --- FINAL DASHBOARD ---
    print(f"\n{BOLD}📊 LOCAL CI SUMMARY{RESET}")
    print("─" * 65)

    all_passed = True
    for res in static_results:
        if res["success"]:
            icon, status_text = f"{GREEN}✔{RESET}", f"{GREEN}PASSED{RESET}"
        else:
            icon, status_text = f"{RED}✘{RESET}", f"{RED}FAILED{RESET}"
            all_passed = False

        print(f"{icon} {res['name'].ljust(12)} {status_text}")

        if not res["success"]:
            for f in res["fails"]:
                print(f"    {YELLOW}└─ {f}{RESET}")

    print("─" * 65)

    # --- AUTO-FIX / HEALING SECTION ---
    failed_with_fixes = [r for r in static_results if not r["success"] and r["fix_cmd"]]

    if failed_with_fixes:
        print(f"\n{BOLD}{CYAN}🔧 AUTO-HEALING: Running fixes for Static Analysis...{RESET}")
        for res in failed_with_fixes:
            print(f"  🚀 Running {BOLD}{res['fix_cmd']}{RESET}...")
            # Run the fix (e.g., make format)
            subprocess.run(res["fix_cmd"], shell=True)
        print(f"\n{GREEN}✅ Auto-fixes complete. Please re-run to verify clean state.{RESET}")

    elif not all_passed:
        print(f"\n{YELLOW}⚠️  Issues found but no auto-fixes available. Please fix manually.{RESET}")

    else:
        print(f"\n{GREEN}✨ Everything looks good! Ready to commit.{RESET}")

    # Final Exit
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
