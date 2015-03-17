#!/usr/bin/env bash

java -cp .:ingest/tika-socket-server/lib/* clojure.main ingest/tika-socket-server/server/main.clj 2>&1 > tmp/tika-socket-server.log &
