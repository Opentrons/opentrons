#!/usr/bin/env bash
# Full Opentrons app E2E demo: robot health → optional upgrade/downgrade → full test suite (headed).
#
# Usage (real Flex/OT-3 on the network):
#   cd e2e-testing
#   make configure-robot          # writes .env with ROBOT_IP, ROBOT_NAME, PROTOCOL_NAME
#   ./demo_full_app.sh
#
# Usage (no hardware — local dev app + robot-server):
#   ./demo_full_app.sh --fake-robot
#
# Optional upgrade/downgrade (requires network or USB + local zip files):
#   export UPGRADE_VERSION=9.0.0-alpha.12
#   export DOWNGRADE_VERSION=8.8.1
#   ./demo_full_app.sh
#
# Skip software updates and run tests only:
#   SKIP_UPDATES=1 ./demo_full_app.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPDATE_ROBOT="${REPO_ROOT}/.cursor/skills/Regression_test_tooling/scripts/update_robot.py"
CHECK_HEALTH="${REPO_ROOT}/.cursor/skills/Regression_test_tooling/scripts/check_health.py"

FAKE_ROBOT=0
for arg in "$@"; do
  case "$arg" in
    --fake-robot) FAKE_ROBOT=1 ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
  esac
done

cd "${SCRIPT_DIR}"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a && source .env && set +a
fi

ROBOT_IP="${ROBOT_IP:-}"
UPGRADE_VERSION="${UPGRADE_VERSION:-}"
DOWNGRADE_VERSION="${DOWNGRADE_VERSION:-}"
SKIP_UPDATES="${SKIP_UPDATES:-0}"

echo "============================================================"
echo " Opentrons app E2E — full demo"
echo "============================================================"

if [[ "${FAKE_ROBOT}" -eq 1 ]]; then
  echo "Profile: fake-robot (make -C app dev + local robot-server)"
else
  echo "Profile: real hardware (USB preferred, else ROBOT_IP from .env)"
  make check-robot
fi

if [[ "${SKIP_UPDATES}" != "1" && -n "${UPGRADE_VERSION}" && -n "${DOWNGRADE_VERSION}" ]]; then
  if [[ ! -f "${UPDATE_ROBOT}" ]]; then
    echo "Update script not found: ${UPDATE_ROBOT}" >&2
    exit 1
  fi
  if [[ -z "${ROBOT_IP}" ]]; then
    echo "Set ROBOT_IP in .env (make configure-robot) for upgrade/downgrade." >&2
    exit 1
  fi

  echo ""
  echo "--- Step 1/3: Upgrade to ${UPGRADE_VERSION} ---"
  python3 "${UPDATE_ROBOT}" "${ROBOT_IP}" --version "${UPGRADE_VERSION}" --yes

  echo ""
  echo "--- Step 2/3: Downgrade to ${DOWNGRADE_VERSION} ---"
  python3 "${UPDATE_ROBOT}" "${ROBOT_IP}" --version "${DOWNGRADE_VERSION}" --yes

  if [[ -f "${CHECK_HEALTH}" ]]; then
    echo ""
    echo "--- Post-update health ---"
    python3 "${CHECK_HEALTH}" "${ROBOT_IP}"
  fi
elif [[ "${SKIP_UPDATES}" != "1" ]]; then
  echo ""
  echo "Skipping upgrade/downgrade (set UPGRADE_VERSION and DOWNGRADE_VERSION to enable)."
  echo "Example:"
  echo "  UPGRADE_VERSION=9.0.0-alpha.12 DOWNGRADE_VERSION=8.8.1 ./demo_full_app.sh"
fi

echo ""
echo "--- Full app test suite (headed) ---"
echo "Order: device_cards → nav (labware, protocols, app settings)"
echo ""

if [[ "${FAKE_ROBOT}" -eq 1 ]]; then
  HEADED=1 uv run python main_script.py fake-robot tests/app/
else
  make test-app-headed
fi

echo ""
echo "Done. Open test-results/report.html for the HTML report."
