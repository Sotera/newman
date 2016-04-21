#!/usr/bin/env bash


USAGE="./bin/es_register_repo.sh <REPO>\n"

if [[ $# -ne 1 ]]; then
    printf "Illegal number of parameters\n"
    printf ${USAGE}
fi

REPO_NAME=$1

curl -XPOST "localhost:9200/_snapshot/${REPO_NAME}" -d '{
    "type": "fs",
    "settings": {
      "compress": "true",
      "location": "/var/backups/elasticsearch/"
    }
}'



