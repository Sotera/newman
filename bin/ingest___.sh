#!/usr/bin/env bash

# TODO
# cleanup linking and other files
# Type should be pst|mbox

set -e

CURRECT_DIR=$(pwd)

EMAIL_ADDRESS=$1
PARENT_DIR=$2
PATH=$3
TYPE=$4

EXTRACTOR_HOME=/srv/software/pst-extraction-master/

cd $EXTRACTOR_HOME

echo "Extractor home set to $EXTRACTOR_HOME"
echo "email_address=$EMAIL_ADDRESS parent_dir=$PARENT_DIR path=$PATH"


INGEST_LINK_DIR=${EXTRACTOR_HOME}/pst-extract/$TYPE

if [[ -L "$INGEST_LINK_DIR" ]]; then
    /bin/rm -rf "$INGEST_LINK_DIR"
else
    echo "<$INGEST_LINK_DIR> is not a link and will not be deleted.  Please check this directory and remove it yourself prior to execution of ingest."
    exit 1
fi

echo "$PARENT_DIR/$TYPE ${INGEST_LINK_DIR}"

/bin/ln -s $PARENT_DIR/$TYPE ${INGEST_LINK_DIR}


./bin/mbox_all.sh $EMAIL_ADDRESS
#if [[ "$TYPE" -eq "pst" ]]; then
#    ./bin/pst_all.sh $EMAIL_ADDRESS
#else
# ./bin/mbox_all.sh $EMAIL_ADDRESS
#fi