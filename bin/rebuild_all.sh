#!/usr/bin/env bash

## paths relative to root of project
## ie: ./bin/rebuild_all.sh

set -e

printf "drop / create database\n"
mysql -u root -proot < db_scripts/database/recreate_db.sql

printf "create all tables\n"
mysql newman -u root -proot < db_scripts/tables/tables.sql

printf "creating routines\n"
mysql newman -u root -proot < db_scripts/routines/functions.sql
#mysql newman -u root -proot < db_scripts/routines/procedures.sql

printf "creating indices\n"
mysql newman -u root -proot < db_scripts/indices/index.sql

printf "adding schema\n"
mysql newman -u root -proot < db_scripts/setup/schema.sql
