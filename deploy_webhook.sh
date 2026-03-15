#!/bin/bash

# Deploy script for March Madness Picker
# Matches SuperConnections/Jeopardy pattern with added safety

APP_DIR="/var/www/MarchMadness"
LOG_FILE="/var/log/webhook_deploy_marchmadness.log"
LOCK_FILE="/tmp/marchmadness-deploy.lock"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Prevent concurrent deploys
exec 200>"$LOCK_FILE"
flock -n 200 || { log "Deploy already in progress, skipping"; exit 0; }

log "Webhook triggered! Starting deployment..."

cd "$APP_DIR" || { log "Failed to cd to $APP_DIR"; exit 1; }

# Save current package.json hash to detect dependency changes
OLD_PKG_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1)

# Stop app before wiping .next
log "Stopping App..."
pm2 stop marchmadness >> "$LOG_FILE" 2>&1

# Fetch and Reset
log "Fetching changes..."
git fetch origin main >> "$LOG_FILE" 2>&1
git reset --hard origin/main >> "$LOG_FILE" 2>&1

# Only reinstall node_modules if package.json changed
NEW_PKG_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1)
if [ "$OLD_PKG_HASH" != "$NEW_PKG_HASH" ] || [ ! -d "node_modules" ]; then
    log "package.json changed — reinstalling dependencies..."
    rm -rf node_modules
    npm install --production=false >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
        log "npm install failed, trying without lockfile..."
        rm -rf node_modules package-lock.json
        npm install --production=false >> "$LOG_FILE" 2>&1
        if [ $? -ne 0 ]; then
            log "DEPLOY FAILED: npm install failed"
            pm2 restart marchmadness >> "$LOG_FILE" 2>&1
            exit 1
        fi
    fi
else
    log "package.json unchanged — skipping npm install"
fi

# Build
log "Building..."
rm -rf .next
npm run build >> "$LOG_FILE" 2>&1
if [ $? -ne 0 ]; then
    log "DEPLOY FAILED: build failed"
    # Try to restart with whatever .next exists
    pm2 restart marchmadness >> "$LOG_FILE" 2>&1
    exit 1
fi

# Verify build produced chunks
CHUNK_COUNT=$(ls .next/static/chunks/*.js 2>/dev/null | wc -l)
if [ "$CHUNK_COUNT" -lt 5 ]; then
    log "DEPLOY FAILED: build produced only $CHUNK_COUNT chunks"
    pm2 restart marchmadness >> "$LOG_FILE" 2>&1
    exit 1
fi

log "Build OK — $CHUNK_COUNT chunks produced"

# Restart
log "Starting App..."
NODE_ENV=production pm2 restart marchmadness --update-env >> "$LOG_FILE" 2>&1

log "Deployment Complete."
