#!/usr/bin/env bash
echo "Starting supervisord -- If a Newman supervisor is already running, expect error messages..."
./flask/bin/supervisord -c conf/supervisord.conf

echo "Starting Newman"
./flask/bin/supervisorctl -c conf/supervisord.conf start newman

echo "Starting Newman-tile-server"
./bin/couchdb_start.sh

