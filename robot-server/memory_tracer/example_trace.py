'''
We have a server running at http://127.0.0.1:31951 
We have this memray shit 

'''

import subprocess
import sys
import os
import signal
import time

# Configuration
PORT = 31951
OUTPUT_BIN = "server_profile.bin"
OUTPUT_HTML = "server_profile.html"

def get_worker_pid(port):
    """Finds the PIDs listening on the port and returns the highest one (the worker)."""
    try:
        # 'lsof -t' returns just the raw PID numbers
        result = subprocess.check_output(["lsof", "-t", f"-i:{port}"], text=True)
        pids = [int(pid) for pid in result.strip().split("\n") if pid]
        
        if not pids:
            return None
        
        # Uvicorn spawns the worker process after the watcher, meaning it has the higher PID
        return max(pids)
    except subprocess.CalledProcessError:
        return None

def main():
    print(f"🔍 Searching for Uvicorn server on port {PORT}...")
    pid = get_worker_pid(PORT)
    
    if not pid:
        print(f"❌ Error: No process found on port {PORT}. Is your server running?")
        sys.exit(1)
        
    print(f"🔥 Target worker PID identified: {pid}")
    print(f"🚀 Attaching Memray... Go interact with your app now!")
    print(f"🛑 Press CTRL+C inside this terminal when you are finished to stop profiling.")
    
    # Run 'memray attach' using uv to ensure it uses your project's environment
    attach_cmd = ["uv", "run", "memray", "attach", str(pid), "-o", OUTPUT_BIN]
    
    try:
        # Start memray as a background process
        process = subprocess.Popen(attach_cmd)
        
        # Keep this wrapper script alive while memray runs
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping memory capture...")
        # Send SIGINT (Ctrl+C) to the memray subprocess so it saves cleanly
        process.send_signal(signal.SIGINT)
        process.wait()
        print(f"💾 Raw profile data saved to: {OUTPUT_BIN}")
        
    print("📊 Generating interactive flame graph...")
    # --force overwrites the HTML file if it already exists from a previous run
    flamegraph_cmd = ["uv", "run", "memray", "flamegraph", "--force", "-o", OUTPUT_HTML, OUTPUT_BIN]
    
    try:
        subprocess.run(flamegraph_cmd, check=True)
        print(f"✨ Success! Flame graph generated: {OUTPUT_HTML}")
        
        # Automatically open the HTML file in your default browser (macOS)
        if sys.platform == "darwin":
            print("🌐 Opening flame graph in your browser...")
            subprocess.run(["open", OUTPUT_HTML])
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate flame graph: {e}")

if __name__ == "__main__":
    main()