#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/ingest.sh

set -e 

if [[ $# -lt 2 ]]; then
    printf "missing arguments\n"
    exit 1
fi

RUN_DIR=$(pwd)

printf "working dir $RUN_DIR\n"

if [ -d tmp/elasticsearch_ingest ]; then
    rm -rf tmp/elasticsearch_ingest
fi

mkdir -p tmp/elasticsearch_ingest/index

printf  "building elastic search ingest files\n"
#./ingest/src/ingest2.py tmp/elasticsearch_ingest/ demail/emails/jeb@jeb.org demail/emails/jeb@jeb.org/output.csv
./ingest/src/ingest2.py tmp/elasticsearch_ingest/ $1 $2

#topic clustering
TOPIC_DIR=/srv/software/topic-clustering/topic

if [ -d tmp/elasticsearch_ingest/topic ]; then
    rm -rf tmp/elasticsearch_ingest/topic
fi

mkdir -p tmp/elasticsearch_ingest/topic

if [ -d tmp/topic ]; then
    rm -rf tmp/topic
fi
mkdir -p tmp/topic/subject tmp/topic/body

if [ -e ${TOPIC_DIR}/Ingest/body_ingester.py ]; then
    rm -f ${TOPIC_DIR}/Ingest/body_ingester.py
fi

if [ -e ${TOPIC_DIR}/Ingest/subject_ingester.py ]; then
    rm -f ${TOPIC_DIR}/Ingest/subject_ingester.py
fi

cp ingest/topic/subject_ingester.py ingest/topic/body_ingester.py ${TOPIC_DIR}/Ingest/

cd ${TOPIC_DIR}

python run_all.py -num_topics 20 -r subject_ingester ${RUN_DIR}/tmp/topic_input.tsv ${RUN_DIR}/tmp/topic/subject

python run_all.py -num_topics 20 -r body_ingester ${RUN_DIR}/tmp/topic_input.tsv ${RUN_DIR}/tmp/topic/body

cd ${RUN_DIR}

# Topic Clustering ElasticSearch updates



