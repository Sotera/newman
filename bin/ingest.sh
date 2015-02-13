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
#LOUVAIN_DIR=/srv/software/distributed-louvain-modularity/
printf "working dir $RUN_DIR\n"
#printf "louvain dir $LOUVAIN_DIR\n"

printf "ingest data\n"
./ingest/src/ingest.py demail/emails/$EMAIL_TARGET/output.csv

if [ -e  tmp/entity_facts_ingest.tsv ]; then
    rm -rf tmp/entity_facts_ingest.tsv
fi

if [ -e  tmp/entity_ingest.tsv ]; then
    rm -rf tmp/entity_ingest.tsv
fi

printf "entity extraction\n"
./ingest/mitie/mitie_entity_ingest_file.py

printf "entity bulk ingest entity\n"
./ingest/mitie/mitie_bulk_ingest.py tmp/entity_ingest.tsv entity

printf "entity rollup\n"
./ingest/mitie/mitie_entity_rollup.py

if [ -e  tmp/email_markup.tsv ]; then
    rm -rf tmp/email_markup.tsv
fi

printf "entity email markups\n"
./ingest/mitie/mitie_markup_email.py

printf "entity bulk ingest markup\n"
./ingest/mitie/mitie_bulk_ingest.py tmp/email_markup.tsv email_html

printf "enrich email comms\n"
./ingest/src/enrich_email_comms.py

printf "community assignment\n"

./ingest/src/community_assign.py 

printf "enrich email ranking\n"

if [ -e tmp/rankings ]; then
    rm -rf tmp/rankings
fi

if [ -e tmp/exploded.csv ]; then
    rm -rf tmp/exploded.csv
fi

./ingest/src/rank_ingest_results.py
./ingest/src/rank.py $EMAIL_TARGET > tmp/rankings
./ingest/src/rank_results.py

./ingest/src/post_process.py


printf "topic clustering\n"

./ingest/topic/run_topic_clustering.sh $1

printf "attachments extract\n"

./ingest/attachments/run_attach_extract.sh $1

printf "printable views\n"

./ingest/printview/printview.py $EMAIL_TARGET ingest/printview/report.tmpl.html

printf "active search ingest\n"

./ingest/activesearch/ingest.sh $1


