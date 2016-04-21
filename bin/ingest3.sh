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

source ./bin/mbox_all.sh $EMAIL_ADDRESS


