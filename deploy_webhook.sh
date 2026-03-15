#!/bin/bash

# Configuration — matches SuperConnections/Jeopardy pattern exactly
APP_DIR="/var/www/MarchMadness"
LOG_FILE="/var/log/webhook_deploy_marchmadness.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Webhook triggered! Starting deployment..."

# Ensure we are in the right directory
cd "$APP_DIR" || { log "Failed to cd to $APP_DIR"; exit 1; }

# Stop the app FIRST so it doesn't serve from a half-wiped .next
log "Stopping App..."
pm2 stop marchmadness >> "$LOG_FILE" 2>&1

# Fetch and Reset
log "Fetching changes..."
git fetch origin main >> "$LOG_FILE" 2>&1
git reset --hard origin/main >> "$LOG_FILE" 2>&1

# Install & Build
log "Installing dependencies..."
npm ci >> "$LOG_FILE" 2>&1

log "Wiping Next.js cache..."
rm -rf .next >> "$LOG_FILE" 2>&1

log "Building..."
npm run build >> "$LOG_FILE" 2>&1

# Restart
log "Starting App..."
pm2 restart marchmadness >> "$LOG_FILE" 2>&1

log "Deployment Complete."
