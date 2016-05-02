#!/usr/bin/env bash
docker run -d --name="tile-cache" -p 5984:5984 newman/couchdb-offline-tiles
