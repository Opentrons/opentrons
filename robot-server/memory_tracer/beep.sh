#!/bin/bash

# --- CONFIGURATION ---
CRITICAL_MEM_KB=25200   # Set to 50MB or 100MB (102400) depending on preference
CRITICAL_TEMP=75        # Max SoC temperature in Celsius
PORT="31951"

OUTPUT_BIN="memray_result.bin"
OUTPUT_CSV="robot_server_memory.csv"

# 1. CHECK ENVIRONMENT
if ! command -v uv &> /dev/null || ! uv run memray --version &> /dev/null; then
    echo "❌ Error: 'uv' or 'memray' not available." >&2
    exit 1
fi

rm -f "$OUTPUT_BIN" "$OUTPUT_CSV"

echo "timestamp,rss_kb,vmsize_kb,threads,fd_count,soc_temp_c" > "$OUTPUT_CSV"
echo "✅ Environment check passed. Starting profiler and CSV tracker..." >&2

# 2. RUN MEMRAY IN BACKGROUND
uv run memray run --follow-fork -o "$OUTPUT_BIN" -m uvicorn "robot_server.app:app" --host "0.0.0.0" --port "$PORT" --ws wsproto &
PROFILE_PID=$!

# Enable nullglob so empty file descriptor directories don't break the array count
shopt -s nullglob

# 3. MONITOR LOOP (Zero forks inside this loop)
while kill -0 $PROFILE_PID 2>/dev/null; do
    
    # A. Parse /proc/meminfo entirely in Bash memory
    AVAILABLE_MEM=0
    while read -r label value _; do
        if [[ "$label" == "MemAvailable:" ]]; then
            AVAILABLE_MEM=$value
            break
        fi
    done < /proc/meminfo
    
    # B. Read SoC temperature using built-in file redirect
    if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
        read -r RAW_TEMP < /sys/class/thermal/thermal_zone0/temp
        CPU_TEMP_INT=$((RAW_TEMP / 1000))
    else
        CPU_TEMP_INT=0
    fi

    # C. Parse /proc/$PID/status in a single pass (Replaces 3 individual awks)
    RSS=0; VMS=0; THREADS=0
    if [ -d "/proc/$PROFILE_PID" ]; then
        while read -r label value _; do
            case "$label" in
                VmRSS:)   RSS=$value ;;
                VmSize:)  VMS=$value ;;
                Threads:) THREADS=$value ;;
            esac
        done < "/proc/$PROFILE_PID/status"

        # D. Count file descriptors using Bash array expansion (Replaces ls | wc -l)
        fds=( /proc/$PROFILE_PID/fd/* )
        FDS=${#fds[@]}
        
        TS=$(date -Iseconds) # Note: 'date' is a lightweight fork, but standard for precise TS
        echo "$TS,$RSS,$VMS,$THREADS,$FDS,$CPU_TEMP_INT" >> "$OUTPUT_CSV"
    fi

    # Print live ticker
    echo "⏳ System Avail Mem: $((AVAILABLE_MEM / 1024))MB | CPU: ${CPU_TEMP_INT}°C | Server FDs: ${FDS:-0}" >&2

    # Threshold Triggers
    if [ "$AVAILABLE_MEM" -lt "$CRITICAL_MEM_KB" ]; then
        echo "⚠️ CRITICAL: Low memory trigger!" >&2
        break
    fi

    if [ "$CPU_TEMP_INT" -gt "$CRITICAL_TEMP" ]; then
        echo "⚠️ CRITICAL: High temperature trigger!" >&2
        break
    fi

    sleep 1
done

# Disable nullglob to return shell to standard state
shopt -u nullglob

# 4. GRACEFUL SHUTDOWN
if kill -0 $PROFILE_PID 2>/dev/null; then
    echo "🛑 Threshold reached. Flushing Memray buffers..." >&2
    kill -INT $PROFILE_PID
    wait $PROFILE_PID
fi

if [ -f "$OUTPUT_BIN" ]; then
    echo "🎯 Profiling complete. Data files ready." >&2
    exit 0
else
    echo "❌ Error: Binary profile file was not generated." >&2
    exit 1
fi