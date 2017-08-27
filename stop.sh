#!/usr/bin/env bash
./flask/bin/supervisorctl -c conf/supervisord.conf stop newman

echo "Stopping Newman-tile-server"
./bin/couchdb_stop.sh

