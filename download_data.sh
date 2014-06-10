#!/usr/bin/env bash

set -e 

#wget https://www.dropbox.com/s/7eq6or39ttbes3l/sw_emails.zip -P tmp/

if [ -d data/walker ]; then
    rm -rf data/walker
fi

mkdir -p data/walker

unzip tmp/sw_emails.zip -d data/walker/
