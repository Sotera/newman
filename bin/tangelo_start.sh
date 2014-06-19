#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/tangelo_start.sh

tangelo -nc --host 0.0.0.0 --port 8337 --logdir tmp/ --root demail/ start
