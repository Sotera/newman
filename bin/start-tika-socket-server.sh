#!/usr/bin/env bash

java -cp .:ingest/tika-socket-server/lib/* clojure.main ingest/tika-socket-server/server/main.clj
