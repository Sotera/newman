#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/ingest.sh

set -e 

if [[ $# -lt 2 ]]; then
    printf "missing arguments\n"
    exit 1
fi

RUN_DIR=$(pwd)
TMP_DIR=tmp/elasticsearch_ingest

printf "working dir $RUN_DIR\n"

if [ -d tmp/elasticsearch_ingest ]; then
    rm -rf tmp/elasticsearch_ingest
fi

mkdir -p tmp/elasticsearch_ingest/index

printf  "building elastic search ingest files\n"

if [[ $'\x01ok' = $(printf "\x02\n" | nc localhost 9999) ]]; then
    echo "Tika Server Running"
else
    ./bin/start-tika-socket-server.sh
    sleep 3
    if [[ $'\x01ok' != $(printf "\x02\n" | nc localhost 9999) ]]; then
        echo "Tika Server Failed to Start"
        exit 1
    else
        echo "Tika Server Started"        
    fi
fi

#./ingest/src/ingest2.py tmp/elasticsearch_ingest/ demail/emails/jeb@jeb.org demail/emails/jeb@jeb.org/output.csv
./ingest/src/ingest2.py tmp/elasticsearch_ingest/index $1 $2

#delete index
curl -XDELETE 'http://localhost:9200/newman2'

# create index
curl -s -XPOST 'http://localhost:9200/newman2' -d '{  "settings": { "index": { "mapping.allow_type_wrapper": true  }  }  }'

# ingest
for f in $TMP_DIR/index/*; do 
    curl -s -XPOST localhost:9200/newman2/emails/_bulk --data-binary @$f
done;



# Topic Clustering

./ingest/topic/run_topic_clustering.sh
