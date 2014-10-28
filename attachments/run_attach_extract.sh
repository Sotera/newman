#!/usr/bin/env bash

set -e 

if [[ $# -lt 1 ]]; then
    printf "missing configuration path\n"
    exit 1
fi

source $1

RUN_DIR=$(pwd)
TMP_DIR=tmp/elasticsearch_ingest

printf "tika extract \n"
printf "working dir $RUN_DIR\n"

tail -n +2 $RUN_DIR/demail/emails/$EMAIL_TARGET/output.csv | ./attachments/tika.py $EMAIL_TARGET $TMP_DIR -

#delete index
curl -XDELETE 'http://localhost:9200/newman'

# create index
curl -s -XPOST 'http://localhost:9200/newman' -d '{  "settings": { "index": { "mapping.allow_type_wrapper": true  }  }  }'

printf "\n"

# ingest
for f in $TMP_DIR/*; do 
    curl -s -XPOST localhost:9200/newman/emails/_bulk --data-binary @$f
done;

printf "\n"
