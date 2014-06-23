#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/ingest.sh

set -e 

RUN_DIR=$(pwd)
LOUVAIN_DIR=/srv/software/distributed-louvain-modularity/
printf "working dir $RUN_DIR\n"
printf "louvain dir $LOUVAIN_DIR\n"

printf "ingest data\n"
./src/ingest_walker.py data/walker/output.csv

printf "entity extraction\n"
./src/enrich_email_entities.py

printf "entity rollup\n"
./src/enrich_rollup_entities.py

printf "enrich email comms\n"
./src/enrich_email_comms.py

if [ -e tmp/louvain.csv ]; then
    rm -f tmp/louvain.csv
fi

printf "create louvian input file\n"
./src/louvain_format.py -o tmp/ -f louvain.csv

### louvain 
##TODO fix how louvain is run 

#rebuild hdfs for newman
if hadoop fs -test -d /tmp/newman; then
    hadoop fs -rm -r /tmp/newman
fi

hadoop fs -mkdir -p /tmp/newman/input
hadoop fs -mkdir -p /tmp/newman/output

hadoop fs -put tmp/louvain.csv /tmp/newman/input/

## kick off louvain
cd $LOUVAIN_DIR
python louvain.py /tmp/newman/input /tmp/newman/output

python louvain_to_gephi.py

mv louvain_to_gephi $RUN_DIR/tmp/

cd -

###

printf "ingest louvain results\n"
./src/louvain_ingest_results.py 

