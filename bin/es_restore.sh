#!/usr/bin/env bash

USAGE="./bin/es_restore.sh <REPO> <SNAPSHOT>\n"

if [[ $# -ne 2 ]]; then
    printf "Illegal number of parameters\n"
    printf ${USAGE}
fi

REPO=$1
SNAPSHOT=$2

curl -XPOST "localhost:9200/_snapshot/${REPO}/${SNAPSHOT}/_restore" -d '{
    "ignore_unavailable": "true",
    "include_global_state": false
}'
