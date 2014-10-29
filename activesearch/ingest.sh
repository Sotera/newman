#!/usr/bin/env bash

set -e 

if [[ $# -lt 1 ]]; then
    printf "missing configuration path\n"
    exit 1
fi

source $1

RUN_DIR=$(pwd)
source $RUN_DIR/conf/activesearch.conf 

AS_DIR=/srv/software/ActiveSearch/

printf "working dir $RUN_DIR\n"
printf "active search dir $AS_DIR\n"
printf "ingesting - $EMAIL_TARGET \n"

cd $AS_DIR 

perl Database/import_database.pl -file=$RUN_DIR/demail/emails/$EMAIL_TARGET/output.csv -database=$AS_DATABASE -database_username=$AS_DATABASE_USERNAME -database_password=$AS_DATABASE_PASSWORD
