#!/usr/bin/env bash

set -e 

if [[ $# -lt 1 ]]; then
    printf "missing configuration path\n"
    exit 1
fi

source $1

RUN_DIR=$(pwd)
TMP_DIR=tmp/elasticsearch_ingest

printf "tika extract \n"
printf "working dir $RUN_DIR\n"

if [ -d $TMP_DIR ]; then
    rm -rf $TMP_DIR
fi

mkdir $TMP_DIR

#tail -n +2 $RUN_DIR/demail/emails/$EMAIL_TARGET/output.csv | ./attachments/tika.py $EMAIL_TARGET $TMP_DIR -
tail -n +2 $RUN_DIR/demail/emails/$EMAIL_TARGET/output.csv | java -cp .:ingest/attachments/clj/lib/* clojure.main ingest/attachments/clj/tika.clj $EMAIL_TARGET $TMP_DIR -

#delete index
curl -XDELETE 'http://localhost:9200/newman'

# create index
curl -s -XPOST 'http://localhost:9200/newman' -d '{  "settings": { "index": { "mapping.allow_type_wrapper": true  }  }  }'

curl -s -XPUT 'http://localhost:9200/newman/emails/_mapping' -d '
{
            "emails": {
                "properties": {
                    "attach": {
                        "type": "string"
                    },
                    "attachments": {
                        "properties": {
                            "contents": {
                                "type": "string"
                            },
                            "email_id": {
                                "type": "string"
                            },
                            "file_path": {
                                "type": "string"
                            },
                            "id": {
                                "type": "string"
                            }
                        }
                    },
                    "bcc": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "body": {
                        "type": "string"
                    },
                    "cc": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "dir": {
                        "type": "string"
                    },
                    "from": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "to": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "id": {
                        "type": "string"
                    },
                    "phone-numbers": {
                        "type": "string",
                        "index": "not_analyzed"
                    },
                    "subject": {
                        "type": "string"
                    }
                }
            }
}'

printf "\n"

# ingest
for f in $TMP_DIR/*; do 
    curl -s -XPOST localhost:9200/newman/emails/_bulk --data-binary @$f
done;

printf "\n"
