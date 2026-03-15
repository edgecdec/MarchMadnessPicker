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
  kiro-cli chat \
    --agent marchmadness \
    --no-interactive \
    --trust-all-tools \
    "$(cat PROMPT.md)" \
    2>&1 | tee "$LOG_FILE"

  echo ""
  echo "   ✓ Iteration $COUNT complete (log: $LOG_FILE)"

  # Wait for deploy
  echo "   ⏳ Waiting 30s for deploy..."
  sleep 30

  # Run smoke tests with Nova Act
  echo "   🧪 Running smoke tests..."
  if python3 tests/smoke_test.py 2>&1 | tee "$LOG_DIR/test-${COUNT}-${TIMESTAMP}.log"; then
    echo "   ✅ All tests passed"
  else
    echo "   🐛 Tests found issues — feeding back to agent"
    BUGS=$(cat tests/results.json)
    kiro-cli chat \
      --agent marchmadness \
      --no-interactive \
      --trust-all-tools \
      "The smoke tests found failures after your last change. Here are the results: ${BUGS}. Also check tests/bugs.md for details. Fix the issues, build, commit, push, and verify the site works." \
      2>&1 | tee -a "$LOG_FILE"
  fi

  # Check if max iterations reached
  if [ "$MAX" -gt 0 ] && [ "$COUNT" -ge "$MAX" ]; then
    echo "🛑 Max iterations ($MAX) reached"
    break
  fi

  sleep 5
done

echo ""
echo "🏀 Ralph finished after $COUNT iterations"
