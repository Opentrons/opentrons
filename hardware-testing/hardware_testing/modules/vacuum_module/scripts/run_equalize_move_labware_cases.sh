#!/usr/bin/env bash
# Analyze every RTP case of vacuum_module_equalize_move_labware_test.py.
#
# Uses `opentrons analyze` (not simulate) because the protocol has runtime
# parameters. Analysis exercises PE residual-vacuum / pump_engaged checks.
#
# Usage (from monorepo root, or any cwd):
#   ./hardware-testing/hardware_testing/modules/vacuum_module/scripts/run_equalize_move_labware_cases.sh
#   ./.../run_equalize_move_labware_cases.sh --case pressure_hold_no_equalize
#   ./.../run_equalize_move_labware_cases.sh --verbose
#   ./.../run_equalize_move_labware_cases.sh --json-dir /tmp/vm_cases
#
# Prerequisites:
#   make -C api setup   # creates api/.venv with opentrons.cli

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# monorepo root: hardware-testing/hardware_testing/modules/vacuum_module/scripts -> 5 levels up
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"

PROTOCOL="${VM_ROOT}/protocols/vacuum_module_equalize_move_labware_test.py"
PYTHON="${REPO_ROOT}/api/.venv/bin/python"

PASS_CASES=(
  cold_start_move
  pressure_hold_equalize
  open_vent_equalize
  power_hold_equalize
  profile_equalize
)

FAIL_CASES=(
  pressure_hold_no_equalize
  open_vent_no_equalize
  pump_engaged
  stop_without_vent
  power_hold_no_equalize
  profile_no_equalize
)

VERBOSE=0
JSON_DIR=""
ONLY_CASE=""
USE_GRIPPER=true

usage() {
  cat <<'EOF'
Analyze vacuum_module_equalize_move_labware_test.py for each RTP test_case.

Options:
  --case NAME       Run only this test_case value
  --verbose, -v     Print human-readable analysis JSON on failure (or always for single case)
  --json-dir DIR    Write per-case analysis JSON to DIR/<case>.json
  --no-gripper      Pass use_gripper=false in RTP
  -h, --help        Show this help

Examples:
  ./run_equalize_move_labware_cases.sh
  ./run_equalize_move_labware_cases.sh --case pump_engaged --verbose
  ./run_equalize_move_labware_cases.sh --json-dir /tmp/vm_rtp_cases
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --case)
      ONLY_CASE="${2:?--case requires a name}"
      shift 2
      ;;
    --verbose | -v)
      VERBOSE=1
      shift
      ;;
    --json-dir)
      JSON_DIR="${2:?--json-dir requires a path}"
      shift 2
      ;;
    --no-gripper)
      USE_GRIPPER=false
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -x "${PYTHON}" ]]; then
  echo "error: missing ${PYTHON}" >&2
  echo "Run: make -C api setup" >&2
  exit 1
fi

if [[ ! -f "${PROTOCOL}" ]]; then
  echo "error: protocol not found: ${PROTOCOL}" >&2
  exit 1
fi

if [[ -n "${JSON_DIR}" ]]; then
  mkdir -p "${JSON_DIR}"
fi

analyze_case() {
  local case="$1"
  local expect="$2" # pass | fail
  local out_file="/dev/null"
  local -a args

  if [[ -n "${JSON_DIR}" ]]; then
    out_file="${JSON_DIR}/${case}.json"
  fi

  args=(
    -m opentrons.cli analyze
    "${PROTOCOL}"
    --check
    --json-output="${out_file}"
    --rtp-values="{\"test_case\":\"${case}\",\"use_gripper\":${USE_GRIPPER}}"
  )

  set +e
  local output
  output="$("${PYTHON}" "${args[@]}" 2>&1)"
  local rc=$?
  set -e

  if [[ "${expect}" == "pass" ]]; then
    if [[ ${rc} -eq 0 ]]; then
      echo "  OK (pass as expected)"
      return 0
    fi
    echo "  UNEXPECTED FAIL (exit ${rc})"
    if [[ ${VERBOSE} -eq 1 ]] || [[ -n "${ONLY_CASE}" ]]; then
      echo "${output}"
    fi
    return 1
  fi

  # expect fail
  if [[ ${rc} -ne 0 ]]; then
    echo "  OK (fail as expected, exit ${rc})"
    if [[ ${VERBOSE} -eq 1 ]]; then
      echo "${output}" | head -n 40
    fi
    return 0
  fi

  echo "  UNEXPECTED PASS (analysis succeeded)"
  if [[ ${VERBOSE} -eq 1 ]] || [[ -n "${ONLY_CASE}" ]]; then
    echo "${output}"
  fi
  return 1
}

pass_ok=0
pass_bad=0
fail_ok=0
fail_bad=0

run_pass() {
  local case="$1"
  echo "=== PASS expected: ${case} ==="
  if analyze_case "${case}" pass; then
    pass_ok=$((pass_ok + 1))
  else
    pass_bad=$((pass_bad + 1))
  fi
}

run_fail() {
  local case="$1"
  echo "=== FAIL expected: ${case} ==="
  if analyze_case "${case}" fail; then
    fail_ok=$((fail_ok + 1))
  else
    fail_bad=$((fail_bad + 1))
  fi
}

echo "Protocol: ${PROTOCOL}"
echo "Python:   ${PYTHON}"
echo "RTP:      use_gripper=${USE_GRIPPER}"
if [[ -n "${JSON_DIR}" ]]; then
  echo "JSON dir: ${JSON_DIR}"
fi
echo

if [[ -n "${ONLY_CASE}" ]]; then
  found=0
  for case in "${PASS_CASES[@]}"; do
    if [[ "${case}" == "${ONLY_CASE}" ]]; then
      run_pass "${case}"
      found=1
      break
    fi
  done
  if [[ ${found} -eq 0 ]]; then
    for case in "${FAIL_CASES[@]}"; do
      if [[ "${case}" == "${ONLY_CASE}" ]]; then
        run_fail "${case}"
        found=1
        break
      fi
    done
  fi
  if [[ ${found} -eq 0 ]]; then
    echo "error: unknown test_case '${ONLY_CASE}'" >&2
    echo "PASS: ${PASS_CASES[*]}" >&2
    echo "FAIL: ${FAIL_CASES[*]}" >&2
    exit 2
  fi
else
  for case in "${PASS_CASES[@]}"; do
    run_pass "${case}"
  done
  echo
  for case in "${FAIL_CASES[@]}"; do
    run_fail "${case}"
  done
fi

echo
echo "Summary"
echo "  PASS cases: ${pass_ok} ok, ${pass_bad} unexpected failures"
echo "  FAIL cases: ${fail_ok} ok, ${fail_bad} unexpected passes"

if [[ $((pass_bad + fail_bad)) -gt 0 ]]; then
  exit 1
fi
exit 0
