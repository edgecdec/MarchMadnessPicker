#!/bin/bash
# Ralph-style autonomous development loop for March Madness Picker
# Usage: ./ralph.sh [max_iterations]

set -e
cd "$(dirname "$0")" || exit 1

# Source shell env for Nova Act API key and correct python3
source ~/.zshrc 2>/dev/null || true
export PATH="/opt/homebrew/bin:$PATH"

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

  REMAINING=$(grep -c '^\- \[ \]' PLAN.md 2>/dev/null || echo "0")
  echo "   $REMAINING tasks remaining"

  if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All tasks complete!"
    break
  fi

  NEXT=$(grep -m1 '^\- \[ \]' PLAN.md | sed 's/^- \[ \] //')
  echo "   Next: $NEXT"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Run kiro — agent builds, tests, then pushes
  kiro-cli chat \
    --agent marchmadness \
    --no-interactive \
    --trust-all-tools \
    "$(cat PROMPT.md)" \
    2>&1 | tee "$LOG_FILE"

  echo ""
  echo "   ✓ Iteration $COUNT complete (log: $LOG_FILE)"

  # Run Nova Act smoke tests every 5th iteration
  if [ $((COUNT % 5)) -eq 0 ]; then
    echo "   🧪 Running smoke tests..."
    if python3 tests/smoke_test.py 2>&1 | tee "$LOG_DIR/test-${COUNT}-${TIMESTAMP}.log"; then
      echo "   ✅ All smoke tests passed"
    else
      echo "   🐛 Smoke tests found issues — feeding back to agent"
      BUGS=$(cat tests/results.json 2>/dev/null || echo '{}')
      kiro-cli chat \
        --agent marchmadness \
        --no-interactive \
        --trust-all-tools \
        "Smoke tests found failures. Results: ${BUGS}. Check tests/bugs.md. Fix the issues, then push." \
        2>&1 | tee -a "$LOG_FILE"
    fi
  fi

  if [ "$MAX" -gt 0 ] && [ "$COUNT" -ge "$MAX" ]; then
    echo "🛑 Max iterations ($MAX) reached"
    break
  fi

  sleep 5
done

echo ""
echo "🏀 Ralph finished after $COUNT iterations"
