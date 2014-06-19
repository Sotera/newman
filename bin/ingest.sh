#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/ingest.sh

set -e 

printf "ingest data\n"
./src/ingest_walker.py data/walker/output.csv

printf "entity extraction\n"
./src/enrich_email_entities.py

printf "entity rollup\n"
./src/enrich_rollup_entities.py

printf "enrich email comms\n"
./src/enrich_email_comms.py

printf "create louvian input file\n"
./src/louvain_format.py -o tmp/ -f louvain.csv

#do the louvain 
## put lovain file in hdfs
## kick off louvain
## pull data from hdfs (louvain to gephi?)
## ingest louvain data

