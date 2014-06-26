#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/{script}.sh

set -e

mysql -u root -proot newman -e "delete from facts where tx > 2;"
