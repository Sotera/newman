#!/usr/bin/env bash

# TODO
# cleanup linking and other files
# Type should be pst|mbox

set -e

CURRECT_DIR=$(pwd)

INGEST_ID=$1
PARENT_DIR=$2
INGEST_ITEM=$3
TYPE=$4
CASE_ID=$5
ALTERNATE_ID=$6
LABEL=$7

#newman etl extract
EXTRACTOR_HOME=/srv/software/pst-extraction-master/

echo "Extractor home set to $EXTRACTOR_HOME"
echo "email_address=$INGEST_ID parent_dir=$PARENT_DIR path=$INGEST_ITEM type=$TYPE"

cd $EXTRACTOR_HOME
rm -rf $EXTRACTOR_HOME/pst-extract/*

INGEST_DIR=${EXTRACTOR_HOME}/pst-extract/$TYPE

mkdir $INGEST_DIR

cp $PARENT_DIR/$INGEST_ITEM $INGEST_DIR

if [ "$TYPE" == "pst" ]; then
    echo "ingest pst"
    ./bin/pst_all.sh $INGEST_ID $CASE_ID $ALTERNATE_ID $LABEL
else
    echo "ingest mbox"
    ./bin/mbox_all.sh $INGEST_ID $CASE_ID $ALTERNATE_ID $LABEL
fi