#! /usr/bin/env bash


set -e 


DIR="tmp/pst/${1}"
PST=$2

if [[ ! -d tmp/pst/ ]]; then
    mkdir tmp/pst/
fi

if [[ -d "${DIR}" ]]; then
    rm -rf "${DIR}"
fi

mkdir "${DIR}"

readpst -e -o "${DIR}/" -b -D $2

find "${DIR}" -type f > "${DIR}/emails.txt"


