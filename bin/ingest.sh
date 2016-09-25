#!/usr/bin/env bash

set -e

CURRECT_DIR=$(pwd)

INGEST_ID=$1
PARENT_DIR=$2
TYPE=$3
CASE_ID=$4
ALTERNATE_ID=$5
LABEL=$6
FORCE_LANGUAGE=$7

#newman etl extract dir
#EXTRACTOR_HOME=/srv/software/newman-etl/
#TODO REMOVE this!
EXTRACTOR_HOME=/srv/software/newman-etl/


echo "Extractor home set to ${EXTRACTOR_HOME}"
echo "INGEST_ID=${INGEST_ID}"
echo "parent_dir=${PARENT_DIR}"
echo "artifact path=${CASE_ID}/${LABEL}"
echo "type=${TYPE}"

cd $EXTRACTOR_HOME
sudo rm -rf $EXTRACTOR_HOME/pst-extract/*

INGEST_DIR=${EXTRACTOR_HOME}/pst-extract/$TYPE

mkdir $INGEST_DIR

echo "Copying email files from ${PARENT_DIR}/${CASE_ID}/${LABEL} ==to==>  $INGEST_DIR/"
cp -r $PARENT_DIR/${CASE_ID}/${TYPE}/${LABEL} $INGEST_DIR/


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

