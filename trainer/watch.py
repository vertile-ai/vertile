# 使用 watchfiles 监控文件变化
import subprocess
import os
import sys
import psutil
import time
from watchfiles import watch, Change

process = None
port = 8000


def kill_processes_on_port(port):
    for proc in psutil.process_iter(["pid", "name"]):
        try:
            for conn in proc.connections(kind="inet"):
                if conn.laddr.port == port:
                    proc.terminate()
                    proc.wait()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue


def run_daphne():
    global process
    kill_processes_on_port(port)

    cmd = [
        sys.executable,
        "-m",
        "daphne",
        "-b",
        "0.0.0.0",
        "-p",
        str(port),
        "trainer.asgi:application",
    ]
    process = subprocess.Popen(cmd)


def run_process(directory, callback):
    callback()

    print(f"Watching {directory} changess")

    for changes in watch(
        directory, watch_filter=lambda path: not path.endswith((".pyc", ".git"))
    ):
        if changes:
            change_types = {change.type for change, _ in changes}
            changed_files = [path for _, path in changes]

            if any(path.endswith(".py") for path in changed_files):
                print("Restarting server...")
                callback()
                print("Server restarted...")


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "trainer.settings")
    run_process(".", run_daphne)
