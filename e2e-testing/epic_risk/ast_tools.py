"""Optional TS/TSX AST via local Babel + `npx tsx` (requires Node + e2e-testing deps)."""

from __future__ import annotations

import subprocess
from pathlib import Path


def run_ts_ast_to_json(raw_code: str, *, parser_script: Path, cwd: Path) -> tuple[bool, str, str]:
    """Parse TS/TSX with the repo-local Babel script."""
    if not parser_script.is_file():
        return False, "", f"Missing parser script: {parser_script.name}"
    cmd = ["npx", "--yes", "tsx", str(parser_script)]
    try:
        proc = subprocess.run(
            cmd,
            input=raw_code,
            text=True,
            capture_output=True,
            cwd=str(cwd),
            timeout=120,
        )
        ok = proc.returncode == 0 and bool(proc.stdout.strip())
        return ok, proc.stdout, proc.stderr or ""
    except FileNotFoundError:
        return (
            False,
            "",
            "npx not found. Install Node.js and run `pnpm install` in e2e-testing/ so tsx is available.",
        )
    except subprocess.TimeoutExpired:
        return False, "", "AST parse timed out (file may be very large)."
