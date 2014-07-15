#!/usr/bin/env bash

set -e 

RUN_DIR=$(pwd)
TOPIC_DIR=/srv/software/topic-clustering/topic

printf "working dir $RUN_DIR\n"
printf "topic-clustering dir $TOPIC_DIR\n"

if [ -e $TOPIC_DIR/Ingest/email_ingester.py ]; then
    rm -f $TOPIC_DIR/Ingest/email_ingester.py
fi

cp topic/email_ingester.py $TOPIC_DIR/Ingest/

cd $TOPIC_DIR

if [ -d tmp-newman/ ]; then
    rm -rf tmp-newman/
fi

mkdir tmp-newman

#needs to match the number of topics
NUM_TOPIC=20

python run_all.py -num_topics $NUM_TOPIC -r email_ingester $RUN_DIR/data/walker/output.csv tmp/

cd $RUN_DIR

if [ -e tmp/topic_cluster.scores ]; then
    rm -rf tmp/topic_cluster.scores
fi

paste <(cat $TOPIC_DIR/tmp/output.csv.$NUM_TOPIC.counts.txt | awk '{ print $1 }') <(sed 's/^[ ]*//' $TOPIC_DIR/tmp/output.csv.$NUM_TOPIC.d2z.txt) > tmp/topic_cluster.scores

if [ -e tmp/topic_cluster.idx ]; then
    rm -rf tmp/topic_cluster.idx
fi

tail -$NUM_TOPIC $TOPIC_DIR/tmp/output.csv.$NUM_TOPIC.summary.txt | cut -c 33- > tmp/topic_cluster.idx
#tail -$NUM_TOPIC $TOPIC_DIR/tmp/output.csv.$NUM_TOPIC.summary.txt | cut -c 33- | nl -n ln -v 0 > tmp/topic_cluster.idx

./topic/ingest_topics_scores.py tmp/topic_cluster.idx tmp/topic_cluster.scores


