#!/usr/bin/env python 
# -*- coding: utf-8 -*-

import datetime
from datetime import datetime
from datetime import timedelta
import pdb
import math
import sys

fin = open('exploded.csv', 'r')
fin.readline()

hash_date = {}
date_list = {}

hash_score = {}
hash_sorted = {}
hash_first_hour = {}
#[receiver]=count

max_value = 0

SourceEmail = sys.argv[1]

#in the first hours for every day, track the first emails outbound from source email address
for line in fin:
    (c, dt, src, target, numattach) = line.strip().split('\t')
    if src != SourceEmail:
        continue

    dtconv = datetime.strptime(dt, '%Y-%m-%dT%H:%M:%S')
    if dtconv.date() not in date_list:
        date_list[dtconv.date()] = 0

    #Count the number of emails out that day
    date_list[dtconv.date()]=date_list[dtconv.date()] +1

    #Next, track who the FIRST email went to
    if dtconv.date() not in hash_date:
        hash_date[dtconv.date()] = {}
    if dtconv.time() not in hash_date[dtconv.date()]:
        hash_date[dtconv.date()][dtconv.time()] = {}
    hash_date[dtconv.date()][dtconv.time()][target] = 1

fin.close()

for dt in date_list:
    #Make sure there was a base level of activity
    if date_list[dt] > 5:
        kylist = hash_date[dt].keys()
        kylist.sort()
        for tm in kylist:
            #Who was first
            for target in hash_date[dt][tm]:
                if target not in hash_score:
                    hash_score[target]=0
                hash_score[target]+=1
                if hash_score[target] > max_value:
                    max_value = hash_score[target]
            break

for dt in date_list:
    #Make sure there was a base level of activity (2 emails that day)
    if date_list[dt] > 5:
        kylist = hash_date[dt].keys()
        kylist.sort()
        firstemailtime = ''
        partialscore = 1
        for tm in kylist:
            #first email time
            if firstemailtime == '':
                firstemailtime = tm

            tdelta = datetime(dt.year, dt.month, dt.day, tm.hour, tm.minute, tm.second) - datetime(dt.year, dt.month, dt.day, firstemailtime.hour, firstemailtime.minute, firstemailtime.second)
            if tdelta.total_seconds() > 7200:
                #past the first hour - so we skip the rest that day
                break
            for target in hash_date[dt][tm]:
                if target not in hash_first_hour:
                    hash_first_hour[target] = 0
                hash_first_hour[target] += partialscore
            partialscore = partialscore/(float)(2.0)
                        


        
for entry in hash_score:
    if hash_score[entry] < 4:
        continue
    
    
    score = str(float(math.floor(float(hash_score[entry]/float(hash_first_hour[entry]))*100)/100.0))
    if score not in hash_sorted:
        hash_sorted[score] = []
    hash_sorted[score].append(entry)
    

kys = hash_sorted.keys()
kys.sort(reverse=True)
for ky in kys:
    print(str(ky) + ':' + ','.join(hash_sorted[ky]))
