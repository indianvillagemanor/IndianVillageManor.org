#!/bin/bash

# Script to stop the dev server
# Usage: ./scripts/stop_dev.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/dev.pid"

echo "========================================="
echo "Stopping IVM Dev Server"
echo "========================================="

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")

    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Killing process $PID..."
        kill "$PID"

        # Wait a bit and check if it's still running
        sleep 2
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Process still running, force killing..."
            kill -9 "$PID"
        fi

        echo "Dev server stopped"
        rm "$PID_FILE"
    else
        echo "Process $PID not found (already stopped or crashed)"
        rm "$PID_FILE"
    fi
else
    echo "No PID file found at $PID_FILE"
    echo "Checking for any process on port 3000..."

    PIDS=$(ss -tlnp 2>/dev/null | grep ':3000 ' | grep -oP 'pid=\K[0-9]+' | sort -u)
    if [ -n "$PIDS" ]; then
        echo "Found process(es) on port 3000: $PIDS"
        echo "Killing..."
        echo "$PIDS" | xargs kill -9
        echo "Killed process(es) on port 3000"
    else
        echo "No process found on port 3000"
    fi
fi

echo "========================================="
