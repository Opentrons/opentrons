import argparse
import concurrent.futures
import os
import re
import subprocess
import sys

# ANSI Terminal Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Phase 1 Config
STATIC_TASKS = {
    "Format": ("uv run ruff format --check .", "make format"),
    "Lint": ("uv run ruff check .", "make lint"),
    "Typecheck": ("uv run mypy automation tests conftest.py", "make typecheck"),
}

# Phase 2 Config
E2E_TASKS = {
    "Local": ("TEST_ENV=local uv run pytest -m pdE2E", "make test-pd-local"),
    "Staging": ("TEST_ENV=staging uv run pytest -m pdE2E", "make test-pd-staging"),
}


def parse_failures(name, stdout, stderr):
    full_text = stdout + stderr
    failures = []
    if name in ["Local", "Staging"]:
        matches = re.findall(r"FAILED\s+tests/\S+::(\S+)", full_text)
        failures = [m.split("[")[0] for m in matches]
    elif name == "Lint":
        matches = re.findall(r": ([A-Z][0-9]+ .*)", full_text)
        failures = matches[:2]
    return list(dict.fromkeys(failures))  # Unique items


def run_task(name, command, debug_cmd):
    """Runs a task silently and returns results."""
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    success = result.returncode == 0
    fails = [] if success else parse_failures(name, result.stdout, result.stderr)

    return {"name": name, "success": success, "fails": fails, "debug_cmd": debug_cmd}


def main():
    parser = argparse.ArgumentParser(description="Local CI Runner")
    parser.add_argument("--no-staging", action="store_true", help="Skip staging environment tests")
    args = parser.parse_args()

    final_results = []
    tasks_to_run = E2E_TASKS.copy()

    if args.no_staging:
        tasks_to_run.pop("Staging", None)

    print(f"\n{BOLD}🛡️  PHASE 1: Static Analysis{RESET}")
    for name, (cmd, debug) in STATIC_TASKS.items():
        res = run_task(name, cmd, debug)
        final_results.append(res)
        if res["success"]:
            print(f"  {GREEN}✔{RESET} {name}")
        else:
            print(f"  {RED}✘{RESET} {name}")
            break

    # Only proceed to E2E if all static checks passed
    if all(r["success"] for r in final_results):
        print(f"\n{BOLD}🔥 PHASE 2: E2E Suites (Running Parallel...){RESET}")
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks_to_run)) as executor:
            futures = {executor.submit(run_task, name, cmd, debug): name for name, (cmd, debug) in tasks_to_run.items()}
            for future in concurrent.futures.as_completed(futures):
                res = future.result()
                final_results.append(res)

                if res["success"]:
                    status = f"{GREEN}✔{RESET}"
                elif res["name"] == "Staging":
                    status = f"{YELLOW}⚠{RESET}"  # Warning icon for staging divergence
                else:
                    status = f"{RED}✘{RESET}"

                print(f"  {status} {res['name']} Finished")

    # --- FINAL DASHBOARD ---
    print(f"\n{BOLD}📊 LOCAL CI SUMMARY{RESET}")
    print("─" * 65)

    all_passed = True
    for res in final_results:
        # Determine Status Text and Color
        if res["success"]:
            icon = f"{GREEN}✔{RESET}"
            status_text = f"{GREEN}PASSED{RESET}"
        elif res["name"] == "Staging":
            icon = f"{YELLOW}⚠{RESET}"
            status_text = f"{YELLOW}DIVERGED (WARNING){RESET}"
        else:
            icon = f"{RED}✘{RESET}"
            status_text = f"{RED}FAILED{RESET}"
            all_passed = False  # Only block CI if non-staging tasks fail

        print(f"{icon} {res['name'].ljust(12)} {status_text}")

        if not res["success"]:
            for f in res["fails"]:
                print(f"   {YELLOW}└─ {f}{RESET}")
            print(f"   {CYAN}💡 To debug, run:{RESET} {BOLD}{res['debug_cmd']}{RESET}")

    print("─" * 65)

    report_path = os.path.abspath("test-results/report.html")
    if os.path.exists(report_path):
        print(f"📂 Report: file://{report_path}")

    # Exit 1 only if Static Analysis or Local E2E fails
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
