#!/usr/bin/env bash

set -x
docker rm --force -v  tile-cache
docker run -d --name="tile-cache" -p 5984:5984 newman/couchdb-offline-tiles

tangelo restart
