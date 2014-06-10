#!/usr/bin/env python 
# -*- coding: utf-8 -*-

output = open('better.csv','r')
ranksfile = open('rankings','r')
louvain = open('louvain_to_gephi/community_itr_1.nodes','r')

nodes = open('node_vals.csv','w')

comms = {}
ranks = {}
nums = {}

for line in louvain:
  node, comm = line.strip().split('\t')
  comms[node] = comm
louvain.close()  

for line in ranksfile:
  score,emails = line.strip().split(':')
  for email in emails.strip().split(','):
    if email.strip() != '':
	 ranks[email.strip()] = score

for line in output:
  id,threadid,dir,category,datetime,frome,to,cc,bcc,subject,body,tosize,ccsize,attachsize,attach,bodysize,location = line.split('\t')
  if id == 'id':
    continue
  location = location.strip()
  for f in frome.strip().split(','):
    if f != '':
      if nums.get(f) == None:
        nums[f] = 0
      nums[f] = nums[f] + 1
  for f in cc.strip().split(','):
    if f != '':
      if nums.get(f) == None:
        nums[f] = 0
      nums[f] = nums[f] + 1
  for f in bcc.strip().split(','):
    if f != '':
      if nums.get(f) == None:
        nums[f] = 0
      nums[f] = nums[f] + 1
  for f in to.strip().split(','):
    if f != '':
      if nums.get(f) == None:
        nums[f] = 0
      nums[f] = nums[f] + 1

for node in nums.keys():
  nodes.write('\t'.join((node,str(nums[node]),comms.get(node,''),ranks.get(node,str(0)))) + '\n')
