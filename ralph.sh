#!/bin/bash
# Ralph-style autonomous development loop for March Madness Picker
# Usage: ./ralph.sh [max_iterations]
# Default: runs until all tasks done. Pass a number to limit iterations.

set -e
cd "$(dirname "$0")" || exit 1

MAX=${1:-0}
COUNT=0
LOG_DIR="/tmp/ralph-logs"
mkdir -p "$LOG_DIR"

echo "🏀 Ralph is starting (max iterations: ${MAX:-unlimited})"
echo "   Logs: $LOG_DIR"
echo ""

while true; do
  COUNT=$((COUNT + 1))
  TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
  LOG_FILE="$LOG_DIR/ralph-${COUNT}-${TIMESTAMP}.log"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 Iteration $COUNT — $(date '+%H:%M:%S')"

  # Check if any tasks remain
  REMAINING=$(grep -c '^\- \[ \]' PLAN.md 2>/dev/null || echo "0")
  echo "   $REMAINING tasks remaining"

  if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All tasks complete!"
    break
  fi

  # Show next task
  NEXT=$(grep -m1 '^\- \[ \]' PLAN.md | sed 's/^- \[ \] //')
  echo "   Next: $NEXT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Run kiro with the marchmadness agent
  # --no-interactive: don't wait for user input
  # --trust-all-tools: allow file writes, shell commands, etc without confirmation
  # Input: the contents of PROMPT.md as the first message
  kiro-cli chat \
    --agent marchmadness \
    --no-interactive \
    --trust-all-tools \
    "$(cat PROMPT.md)" \
    2>&1 | tee "$LOG_FILE"

  echo ""
  echo "   ✓ Iteration $COUNT complete (log: $LOG_FILE)"

  # Check if max iterations reached
  if [ "$MAX" -gt 0 ] && [ "$COUNT" -ge "$MAX" ]; then
    echo "🛑 Max iterations ($MAX) reached"
    break
  fi

  # Brief pause between loops to let deploy finish
  echo "   ⏳ Waiting 10s before next iteration..."
  sleep 10
done

echo ""
echo "🏀 Ralph finished after $COUNT iterations"
