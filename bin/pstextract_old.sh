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

echo "readpst -e -o ${DIR}/ -b -D $2"
readpst -e -o "${DIR}/" -b -D $2

find "${DIR}" -type f > "${DIR}/emails.txt"

if [[ -d "demail/emails/${1}" ]]; then
    rm -rf "demail/emails/${1}"
fi 

#cat "${DIR}/emails.txt" | ./pst/normalize.py "${1}" "demail/emails/${1}" -a --start 0 --limit 2000
cat "${DIR}/emails.txt" | ./pst/normalize.py "${1}" "demail/emails/${1}" -a --start 0
