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


LINES=$(wc -l < $RUN_DIR/demail/emails/$EMAIL_TARGET/output.csv)

if [[ $LINES -gt 1000 ]]; then
    LINES=1000
elif [[ $LINES -gt 20 ]]; then
    LINES=$((LINES-10))
fi

cat <(cat /etc/activesearch.cfg | sed '/search_main_dimensions/d') <(printf "search_main_dimensions=$LINES\n") > $RUN_DIR/tmp/activesearch.cfg

printf "\nupdate config\n"

curl localhost:1337/ActiveSearchDaemon/rest/readConfigFile?configfile=$RUN_DIR/tmp/activesearch.cfg

printf "\n generate eigenmap \n"

curl localhost:1337/ActiveSearchDaemon/rest/eigenmap/4

printf "\n done \n"

