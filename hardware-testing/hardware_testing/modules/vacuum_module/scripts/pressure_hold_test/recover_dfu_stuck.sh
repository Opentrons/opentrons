#!/usr/bin/env bash
# Recover vacuum module stuck in DFU after option-byte DFU entry.
#
# Why this happens:
#   Vacuum module "dfu" command programs FLASH option bytes so the MCU boots
#   system-memory DFU (nSWBOOT0=0, nBOOT0=0). After a USB DFU download, if the
#   application never starts, those option bytes stay set and every reset
#   returns to DFU — even though flash was written.
#
# Fix (requires ST-Link SWD):
#   1) Restore option bytes to normal main-flash boot (nSWBOOT0=1, nBOOT0=1)
#   2) Reflash application via OpenOCD
#   3) Reset; module should enumerate as "Vacuum FS" / ot_module_vacuummodule*
#
# Usage (from opentrons-modules repo root, ST-Link connected):
#   ./artifacts/pressure_hold_test/recover_dfu_stuck.sh
#
# Optional: REPO=/path/to/opentrons-modules ./artifacts/pressure_hold_test/recover_dfu_stuck.sh

set -euo pipefail

REPO="${REPO:-$(cd "$(dirname "$0")/../.." && pwd)}"
OPENOCD="${OPENOCD:-$REPO/stm32-tools/openocd/Darwin/bin/openocd}"
SCRIPTS="$REPO/stm32-tools/openocd/Darwin/scripts"
BOARD_CFG="$REPO/stm32-modules/common/STM32G491/stm32g4discovery.cfg"
RECOVER_CFG="$REPO/artifacts/pressure_hold_test/recover_dfu_stuck.cfg"
BUILD_DIR="$REPO/build-stm32-cross"

if [[ ! -x "$OPENOCD" ]]; then
  echo "ERROR: openocd not found at $OPENOCD"
  exit 1
fi
if [[ ! -f "$BOARD_CFG" || ! -f "$RECOVER_CFG" ]]; then
  echo "ERROR: missing board or recover cfg"
  exit 1
fi

echo "==> Step 1/3: Restore option bytes (exit system-memory DFU boot)"
# May exit non-zero after OBL_LAUNCH resets the chip; that is OK if PC later is in flash.
set +e
"$OPENOCD" -s "$SCRIPTS" -f "$BOARD_CFG" -f "$RECOVER_CFG"
set -e

echo "==> Step 2/3: Verify boot is from main flash (PC ~ 0x0800xxxx, not 0x1fffxxxx)"
OUT=$("$OPENOCD" -s "$SCRIPTS" -f "$BOARD_CFG" -c "init; reset halt; reg pc; mdw 0x40022020 1; reset run; exit" 2>&1) || true
echo "$OUT" | tail -20
if echo "$OUT" | grep -q 'pc.*0x1fff'; then
  echo "ERROR: still executing from system memory (0x1fff…). Recovery failed."
  exit 1
fi
if ! echo "$OUT" | grep -q 'pc.*0x0800'; then
  echo "WARNING: could not parse PC; continuing to reflash anyway."
fi

echo "==> Step 3/3: Reflash application + reset"
if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Configuring cmake stm32-cross preset..."
  cmake --preset stm32-cross -S "$REPO" -B "$BUILD_DIR"
fi
cmake --build "$BUILD_DIR" --target vacuum-module-flash -j"$(sysctl -n hw.ncpu 2>/dev/null || echo 4)"

echo "==> Done. Module should boot the application."
echo "    On Flex: ls /dev/ot_module_vacuummodule*  and  M115"
echo "    Expect PC in 0x0800xxxx (not 0x1fffxxxx) and USB product 'Vacuum FS'."
