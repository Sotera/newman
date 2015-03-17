#!/usr/bin/env bash

set -e 

#topic clustering
printf  "run topic clustering\n"
RUN_DIR=$(pwd)
TOPIC_DIR=/srv/software/topic-clustering/topic
NUM_TOPIC=20

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

printf  "Topic Clustering Subjects\n"
python run_all.py -num_topics ${NUM_TOPIC} -r subject_ingester ${RUN_DIR}/tmp/topic_input.tsv ${RUN_DIR}/tmp/topic/subject

printf  "Topic Clustering Body\n"
python run_all.py -num_topics ${NUM_TOPIC} -r body_ingester ${RUN_DIR}/tmp/topic_input.tsv ${RUN_DIR}/tmp/topic/body

cd ${RUN_DIR}

# Topic Clustering ElasticSearch updates

if [ -d tmp/elasticsearch_ingest/topics/ ]; then
    rm -rf tmp/elasticsearch_ingest/topics/
fi

mkdir -p tmp/elasticsearch_ingest/topics/subject tmp/elasticsearch_ingest/topics/body

./ingest/topic/ingest2_topics_scores.py subject tmp/elasticsearch_ingest/topics/subject tmp/topic/subject/topic_input.tsv.${NUM_TOPIC}.summary.txt tmp/topic/subject/topic_input.tsv.${NUM_TOPIC}.d2z.txt

./ingest/topic/ingest2_topics_scores.py body tmp/elasticsearch_ingest/topics/body tmp/topic/body/topic_input.tsv.${NUM_TOPIC}.summary.txt tmp/topic/body/topic_input.tsv.${NUM_TOPIC}.d2z.txt



# ingest
for f in $TMP_DIR/subject/*; do 
    curl -s -XPOST localhost:9200/newman2/emails/_bulk --data-binary @$f
done;
