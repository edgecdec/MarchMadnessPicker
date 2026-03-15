# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Bracket connector lines don't properly connect rounds**: The lines between matchup boxes across rounds are misaligned and don't visually connect the feeder games to the next round. Either fix the connector line CSS so they properly bridge between rounds, or remove them entirely if they can't be fixed cleanly. A bracket without connectors looks better than one with broken connectors.

- **Add autosave for bracket picks**: Auto-save picks to the server after each pick change (debounce by ~2 seconds so rapid clicks don't spam the API). Show a subtle status indicator next to the Save button: "✓ Saved" after successful autosave, "Saving..." during save, "⚠ Unsaved" if autosave fails. Keep the manual Save button as a fallback but make it clear that picks are already being auto-saved. This prevents users from losing picks if they forget to click Save or navigate away.
