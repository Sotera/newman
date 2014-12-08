#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/ingest.sh

set -e 


if [[ $# -lt 1 ]]; then
    printf "missing configuration path\n"
    exit 1
fi

source $1

printf  "ingesting - $EMAIL_TARGET \n"

RUN_DIR=$(pwd)
LOUVAIN_DIR=/srv/software/distributed-louvain-modularity/
printf "working dir $RUN_DIR\n"
printf "louvain dir $LOUVAIN_DIR\n"

printf "ingest data\n"
./src/ingest.py demail/emails/$EMAIL_TARGET/output.csv

if [ -e  tmp/entity_facts_ingest.tsv ]; then
    rm -rf tmp/entity_facts_ingest.tsv
fi

if [ -e  tmp/entity_ingest.tsv ]; then
    rm -rf tmp/entity_ingest.tsv
fi

printf "entity extraction\n"
./mitie/mitie_entity_ingest_file.py

printf "entity bulk ingest entity\n"
./mitie/mitie_bulk_ingest.py tmp/entity_ingest.tsv entity

printf "entity rollup\n"
./mitie/mitie_entity_rollup.py

if [ -e  tmp/email_markup.tsv ]; then
    rm -rf tmp/email_markup.tsv
fi

printf "entity email markups\n"
./mitie/mitie_markup_email.py

printf "entity bulk ingest markup\n"
./mitie/mitie_bulk_ingest.py tmp/email_markup.tsv email_html

printf "enrich email comms\n"
./src/enrich_email_comms.py

printf "community assignment\n"

./src/community_assign.py 

printf "enrich email ranking\n"

if [ -e tmp/rankings ]; then
    rm -rf tmp/rankings
fi

if [ -e tmp/exploded.csv ]; then
    rm -rf tmp/exploded.csv
fi

./src/rank_ingest_results.py
./src/email_detector2.py $EMAIL_TARGET > tmp/rankings
./src/rank_results.py

./src/post_process.py


printf "topic clustering\n"

./topic/run_topic_clustering.sh $1

printf "attachments extract\n"

./attachments/run_attach_extract.sh $1

printf "active search ingest\n"

./activesearch/ingest.sh $1


