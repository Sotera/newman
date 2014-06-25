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

if [ -e  $LOUVAIN_DIR/louvain.csv ]; then
    rm -f $LOUVAIN_DIR/louvain.csv
fi

# for louvain_to_gephi
mv tmp/louvain.csv $LOUVAIN_DIR/louvain.csv

## kick off louvain
cd $LOUVAIN_DIR
python louvain.py /tmp/newman/input /tmp/newman/output

if [ -d output ]; then
    rm -rf output
fi

hadoop fs -copyToLocal /tmp/newman/output .

if [ -d louvain_to_gephi ]; then
    rm -rf louvain_to_gephi
fi

python louvain_to_gephi.py

if [ -d $RUN_DIR/tmp/louvain_to_gephi ]; then
    rm -rf $RUN_DIR/tmp/louvain_to_gephi
fi

mv louvain_to_gephi $RUN_DIR/tmp/

cd -

###

printf "ingest louvain results\n"
./src/louvain_ingest_results.py 

