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
npm ci >> "$LOG_FILE" 2>&1 || { log "npm ci failed, trying npm install..."; rm -rf node_modules; npm install >> "$LOG_FILE" 2>&1; } || fail "npm install failed"

log "Wiping Next.js cache..."
rm -rf .next node_modules/.cache >> "$LOG_FILE" 2>&1

log "Building..."
NODE_ENV=production npx next build >> "$LOG_FILE" 2>&1 || fail "build failed — NOT restarting pm2"

log "Restarting App..."
pm2 restart marchmadness >> "$LOG_FILE" 2>&1

log "Deployment Complete."
