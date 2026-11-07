"""
MediQuery Unified Runner
Runs both FastAPI backend and React frontend together.

Usage:
  python run.py           -> Starts unified app on http://127.0.0.1:8000 (FastAPI serves React UI + API)
  python run.py --dev     -> Starts backend (8000) & Vite frontend (5173) concurrently with hot reload
"""

import sys
import subprocess
import os
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def run_unified():
    print("=" * 60)
    print("🩺 Starting MediQuery Unified Server...")
    print("=" * 60)
    
    # Ensure frontend is built
    dist_dir = FRONTEND_DIR / "dist"
    if not dist_dir.exists() or not (dist_dir / "index.html").exists():
        print("📦 Building React frontend bundle first...")
        subprocess.run("npm.cmd run build", cwd=FRONTEND_DIR, shell=True, check=True)
    
    print("\n🚀 Launching unified server at: http://127.0.0.1:8000")
    print("📖 API Documentation: http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to stop.\n")
    
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND_DIR
    )

def run_dev():
    print("=" * 60)
    print("🩺 Starting MediQuery in Development Mode (Dual Hot-Reload)...")
    print("=" * 60)
    print("Backend API: http://127.0.0.1:8000")
    print("Frontend UI: http://127.0.0.1:5173")
    print("=" * 60)

    # Start FastAPI backend
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=BACKEND_DIR
    )

    # Start Vite frontend
    frontend_proc = subprocess.Popen(
        "npm.cmd run dev -- --host 127.0.0.1 --port 5173",
        cwd=FRONTEND_DIR,
        shell=True
    )

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping MediQuery dev servers...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    if "--dev" in sys.argv:
        run_dev()
    else:
        run_unified()
