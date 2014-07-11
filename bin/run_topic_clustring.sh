#!/usr/bin/env bash

python /srv/software/topic-clustering/topic/run_all.py -num_topics 20 -r email_ingester data/walker/output.csv tmp/
