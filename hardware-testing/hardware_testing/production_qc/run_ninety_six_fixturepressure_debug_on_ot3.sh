#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SESSION_NAME="${OT3_FIXTURE_DEBUG_SESSION_NAME:-n96_fixturepressure_debug}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_PATH="${OT3_FIXTURE_DEBUG_LOG_PATH:-/tmp/${SESSION_NAME}_${TIMESTAMP}.log}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required on OT3 but was not found."
  exit 1
fi

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "tmux session '${SESSION_NAME}' already exists."
  echo "Attach with: tmux attach -t ${SESSION_NAME}"
  echo "Or stop it with: tmux kill-session -t ${SESSION_NAME}"
  exit 1
fi

CMD=(
  python3
  -m
  hardware_testing.production_qc.ninety_six_fixturepressure_debug
  "$@"
)

printf -v CMD_STR "%q " "${CMD[@]}"
printf -v WORKDIR_STR "%q" "${WORKDIR}"
printf -v LOG_PATH_STR "%q" "${LOG_PATH}"

TMUX_CMD="cd ${WORKDIR_STR} && ${CMD_STR} 2>&1 | tee ${LOG_PATH_STR}"

tmux new-session -d -s "${SESSION_NAME}" "${TMUX_CMD}"

echo "Started OT3 fixture pressure debug test in tmux session: ${SESSION_NAME}"
echo "Working directory: ${WORKDIR}"
echo "Log file: ${LOG_PATH}"
echo "Attach: tmux attach -t ${SESSION_NAME}"
echo "Stop:   tmux kill-session -t ${SESSION_NAME}"
