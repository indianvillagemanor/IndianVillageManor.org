#!/bin/bash

# Script to kill any process on port 3000 and start dev server with logging
# Usage: ./scripts/kill3000_and_start_dev.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STDOUT_LOG="$LOG_DIR/dev_stdout_$TIMESTAMP.log"
STDERR_LOG="$LOG_DIR/dev_stderr_$TIMESTAMP.log"
COMBINED_LOG="$LOG_DIR/dev_combined_$TIMESTAMP.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo "========================================="
echo "IVM Dev Server Startup Script"
echo "========================================="
echo "Timestamp: $(date)"
echo ""

# Kill anything listening on port 3000
echo "Checking for processes on port 3000..."
PIDS=$(ss -tlnp 2>/dev/null | grep ':3000 ' | grep -oP 'pid=\K[0-9]+' | sort -u)
if [ -n "$PIDS" ]; then
    echo "Found process(es) on port 3000: $PIDS"
    echo "Killing..."
    echo "$PIDS" | xargs kill -9
    echo "Killed process(es) on port 3000"
    sleep 1
else
    echo "No processes found on port 3000"
fi

echo ""
echo "Starting dev server..."
echo "Logs will be written to:"
echo "  Combined: $COMBINED_LOG"
echo "  Stdout:   $STDOUT_LOG"
echo "  Stderr:   $STDERR_LOG"
echo ""
echo "Latest logs symlinked to:"
echo "  logs/dev_latest.log (combined)"
echo "  logs/dev_stdout_latest.log"
echo "  logs/dev_stderr_latest.log"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# Start npm run dev in background with output redirected
# Both stdout and stderr go to combined log
# Stdout goes to stdout log
# Stderr goes to stderr log
npm run dev > >(tee "$STDOUT_LOG" >> "$COMBINED_LOG") 2> >(tee "$STDERR_LOG" >> "$COMBINED_LOG" >&2) &

# Save the PID
DEV_PID=$!
echo "$DEV_PID" > "$LOG_DIR/dev.pid"

echo "Dev server started with PID: $DEV_PID"
echo "PID saved to: $LOG_DIR/dev.pid"

# Create symlinks to latest logs
ln -sf "dev_combined_$TIMESTAMP.log" "$LOG_DIR/dev_latest.log"
ln -sf "dev_stdout_$TIMESTAMP.log" "$LOG_DIR/dev_stdout_latest.log"
ln -sf "dev_stderr_$TIMESTAMP.log" "$LOG_DIR/dev_stderr_latest.log"

echo ""
echo "========================================="
echo "Dev server is starting in the background"
echo "========================================="
echo ""
echo "Use these commands:"
echo "  tail -f $LOG_DIR/dev_latest.log     # Follow combined logs"
echo "  tail -f $LOG_DIR/dev_stdout_latest.log  # Follow stdout only"
echo "  tail -f $LOG_DIR/dev_stderr_latest.log  # Follow stderr only"
echo "  kill \$(cat $LOG_DIR/dev.pid)           # Stop dev server"
echo ""
