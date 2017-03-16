#!/usr/bin/env bash
./flask/bin/supervisorctl -c conf/supervisord.conf stop newman

echo "Stopping newman-tile-server"
./bin/couchdb_stop.sh

