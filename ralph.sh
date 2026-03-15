#!/bin/bash
# Ralph-style autonomous development loop for March Madness Picker
# Usage: ./ralph.sh [max_iterations]
# Default: runs 5 iterations. Pass 0 for infinite.

cd "$(dirname "$0")" || exit 1

MAX=${1:-5}
COUNT=0

echo "🏀 Ralph is starting (max iterations: ${MAX:-∞})"

while true; do
  COUNT=$((COUNT + 1))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 Loop iteration $COUNT ($(date))"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Check if any tasks remain
  if ! grep -q '^\- \[ \]' PLAN.md; then
    echo "✅ All tasks complete!"
    break
  fi

  # Feed the prompt to kiro
  cat PROMPT.md | kiro-cli chat --agent marchmadness --no-interactive 2>&1 | tee "/tmp/ralph-loop-${COUNT}.log"

  # Check if max iterations reached
  if [ "$MAX" -gt 0 ] && [ "$COUNT" -ge "$MAX" ]; then
    echo "🛑 Max iterations ($MAX) reached"
    break
  fi

  # Brief pause between loops
  sleep 5
done

echo "🏀 Ralph finished after $COUNT iterations"
