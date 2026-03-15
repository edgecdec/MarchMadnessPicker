#!/bin/bash

APP_DIR="/var/www/MarchMadness"
LOG_FILE="/var/log/webhook_deploy_marchmadness.log"
LOCK_FILE="/tmp/marchmadness_deploy.lock"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Prevent concurrent deploys
if [ -f "$LOCK_FILE" ]; then
    log "Deploy already in progress, skipping."
    exit 0
fi
trap "rm -f $LOCK_FILE" EXIT
touch "$LOCK_FILE"

log "Webhook triggered! Starting deployment..."

cd "$APP_DIR" || { log "Failed to cd to $APP_DIR"; exit 1; }

# Fetch and Reset
log "Fetching changes..."
git fetch origin main >> "$LOG_FILE" 2>&1
git reset --hard origin/main >> "$LOG_FILE" 2>&1

# Install & Build (app stays running on old .next during build)
log "Installing dependencies..."
npm ci >> "$LOG_FILE" 2>&1

log "Building..."
npm run build >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
    log "DEPLOY FAILED: build failed — NOT restarting pm2"
    exit 1
fi

# Only restart after successful build
log "Restarting App..."
pm2 restart marchmadness >> "$LOG_FILE" 2>&1

log "Deployment Complete."
