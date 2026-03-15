#!/bin/bash

APP_DIR="/var/www/MarchMadness"
LOG_FILE="/var/log/webhook_deploy_marchmadness.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

fail() {
    log "DEPLOY FAILED: $1"
    exit 1
}

log "Webhook triggered! Starting deployment..."

cd "$APP_DIR" || fail "Failed to cd to $APP_DIR"

log "Fetching changes..."
git fetch origin main >> "$LOG_FILE" 2>&1
git reset --hard origin/main >> "$LOG_FILE" 2>&1

log "Installing dependencies..."
npm ci >> "$LOG_FILE" 2>&1 || fail "npm ci failed"

log "Wiping Next.js cache..."
rm -rf .next >> "$LOG_FILE" 2>&1

log "Building..."
npm run build >> "$LOG_FILE" 2>&1 || fail "npm run build failed — NOT restarting pm2"

log "Restarting App..."
pm2 restart marchmadness >> "$LOG_FILE" 2>&1

log "Deployment Complete."
