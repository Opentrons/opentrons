#!/usr/bin/env bash
# Flash vacuum-module firmware on Flex via USB DFU (dfu-util).
# Usage: flash_dfu_flex.sh <host> <ssh_key> <local_scratch.bin>
set -euo pipefail

HOST="${1:?host}"
KEY="${2:?ssh key}"
BIN="${3:?path to vacuum-module-scratch.bin}"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$HOST")
SCP=(scp -i "$KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10)

echo "Uploading $BIN to Flex..."
"${SCP[@]}" "$BIN" "root@$HOST:/tmp/vacuum-module-scratch.bin"

echo "Entering DFU..."
"${SSH[@]}" 'bash -s' <<'REMOTE'
set -e
PORT=/dev/ot_module_vacuummodule1
if [[ ! -e "$PORT" ]]; then
  # may already be in DFU
  echo "Module serial node missing; checking DFU..."
else
  python3 - <<'PY'
import serial, time
s = serial.Serial("/dev/ot_module_vacuummodule1", 115200, timeout=1)
s.reset_input_buffer()
s.write(b"dfu\n")
s.flush()
time.sleep(0.2)
try:
    print(s.read(64))
except Exception as e:
    print("read after dfu:", e)
s.close()
PY
  sleep 2
fi

echo "DFU devices:"
dfu-util -l || true

# STM32 DFU: application image at 0x08008400 (matches firmware CMakeLists)
# Vacuum module exposes multiple DFU alts; flash alt 0 application region.
for i in 1 2 3 4 5 6 7 8 9 10; do
  if dfu-util -l 2>/dev/null | grep -qi 'df11\|STM32\|Internal Flash'; then
    break
  fi
  echo "waiting for DFU device ($i)..."
  sleep 1
done

dfu-util -l
dfu-util -a 0 -s 0x08008400:leave -D /tmp/vacuum-module-scratch.bin

echo "Waiting for module re-enumeration..."
for i in $(seq 1 30); do
  if [[ -e /dev/ot_module_vacuummodule1 ]] || ls /dev/ttyACM* >/dev/null 2>&1; then
    sleep 1
    if [[ -e /dev/ot_module_vacuummodule1 ]]; then
      python3 - <<'PY'
import serial, time
s=serial.Serial("/dev/ot_module_vacuummodule1",115200,timeout=1)
s.write(b"M115\n"); s.flush(); time.sleep(0.4)
print(s.read(256).decode(errors="replace"))
s.close()
PY
      exit 0
    fi
  fi
  sleep 1
done
echo "WARNING: module did not reappear as ot_module_vacuummodule1"
ls -la /dev/ttyACM* /dev/ot_module* 2>/dev/null || true
exit 1
REMOTE

echo "DFU flash finished."
