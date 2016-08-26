#!/usr/bin/env bash

set -e

CURRECT_DIR=$(pwd)

INGEST_ID=$1
PARENT_DIR=$2
INGEST_ITEM=$3
TYPE=$4
CASE_ID=$5
ALTERNATE_ID=$6
LABEL=$7
FORCE_LANGUAGE=$8

#newman etl extract
EXTRACTOR_HOME=/srv/software/pst-extraction-master/

echo "Extractor home set to $EXTRACTOR_HOME"
echo "email_address=$INGEST_ID parent_dir=$PARENT_DIR path=${CASE_ID}/${LABEL} type=$TYPE"

cd $EXTRACTOR_HOME
rm -rf $EXTRACTOR_HOME/pst-extract/*

INGEST_DIR=${EXTRACTOR_HOME}/pst-extract/$TYPE

mkdir $INGEST_DIR

cp -r $PARENT_DIR/${CASE_ID}/$TYPE/${LABEL} $INGEST_DIR/

if [ "$TYPE" == "pst" ]; then
    echo "ingest pst"
    ./bin/pst_all.sh $INGEST_ID $CASE_ID $ALTERNATE_ID $LABEL $FORCE_LANGUAGE
elif [ "$TYPE" == "mbox" ]; then
    echo "ingest mbox"
    ./bin/mbox_all.sh $INGEST_ID $CASE_ID $ALTERNATE_ID $LABEL $FORCE_LANGUAGE
elif [ "$TYPE" == "emls" ]; then
    echo "ingest emls"
    ./bin/eml_all.sh $INGEST_ID $CASE_ID $ALTERNATE_ID $LABEL $FORCE_LANGUAGE
else
    echo "UNKNOWN type encountered ${TYPE} -- Nothing to do"
fi

