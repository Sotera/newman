#!/usr/bin/env bash

USAGE="./bin/es_snapshot_list.sh <REPO>\n"

if [[ $# -ne 1 ]]; then
    printf "Illegal number of parameters\n"
    printf ${USAGE}
fi

REPO=$1

curl -XGET "localhost:9200/_snapshot/_all"

