#!/usr/bin/env bash


USAGE="./bin/es_take_snapshot.sh <REPO> <SNAPSHOT_NAME> <INDEX>\n"

if [[ $# -ne 3 ]]; then
    printf "Illegal number of parameters\n"
    printf ${USAGE}
fi

REPO_NAME=$1
SNAPSHOT_NAME=$2
INDEX=$3

curl -XPUT "localhost:9200/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}" -d "{
    \"indices\": \"${INDEX}\",
    \"ignore_unavailable\": \"true\",
    \"include_global_state\": false
}"
