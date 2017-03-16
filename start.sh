#!/usr/bin/env bash
echo "Starting supervisord -- Error is expected if newman supervisor is running."
./flask/bin/supervisord -c conf/supervisord.conf

echo "Starting newman"
./flask/bin/supervisorctl -c conf/supervisord.conf start newman

echo "Starting newman-tile-server"
./bin/couchdb_stop.sh
./bin/couchdb_start.sh

