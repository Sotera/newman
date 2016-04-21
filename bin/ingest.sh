#!/usr/bin/env bash

# TODO
# cleanup linking and other files
# Type should be pst|mbox

set -e

CURRECT_DIR=$(pwd)

EMAIL_ADDRESS=$1
PARENT_DIR=$2
INGEST_ITEM=$3
TYPE=$4

#newman etl extract
EXTRACTOR_HOME=/srv/software/newman-etl-extract/
echo "Extractor home set to $EXTRACTOR_HOME"
echo "email_address=$EMAIL_ADDRESS parent_dir=$PARENT_DIR path=$INGEST_ITEM type=$TYPE"

cd $EXTRACTOR_HOME
rm -rf $EXTRACTOR_HOME/pst-extract/*

INGEST_DIR=${EXTRACTOR_HOME}/pst-extract/$TYPE

mkdir $INGEST_DIR

cp $PARENT_DIR/$INGEST_ITEM $INGEST_DIR

if [ "$TYPE" == "pst" ]; then
    echo "ingest pst"
    ./bin/pst_all.sh $EMAIL_ADDRESS
else
    echo "ingest mbox"
    ./bin/mbox_all.sh $EMAIL_ADDRESS
fi