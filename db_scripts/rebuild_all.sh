#!/usr/bin/env bash

set -e

printf "drop / create database\n"
mysql -u root -proot < database/recreate_db.sql

printf "create all tables\n"
mysql newman -u root -proot < tables/tables.sql

printf "creating functions\n"
mysql newman -u root -proot < routines/functions.sql

printf "creating indices\n"
mysql newman -u root -proot < indices/index.sql

printf "adding schema\n"
mysql newman -u root -proot < setup/schema.sql
