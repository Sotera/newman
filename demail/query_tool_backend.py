import csv
import sys
from optparse import OptionParser
import os
import shutil
import pdb
import cPickle as pickle
import traceback
import codecs


def colorHash():
  global mailhash
  names = set([])
  for key in mailhash.keys():
    frommail = mailhash[key][4]
    if frommail != '':
      names.add(frommail)
    for to in mailhash[key][5].split(','):
      if to != '':
        names.add(to)
    for cc in mailhash[key][6].split(','):
      if cc != '':
        names.add(cc)
    for bcc in mailhash[key][7].split(','):
      if bcc != '':
        names.add(bcc)
  namelist = list(names)
  return namelist

lines =  open('/usr/local/share/tangelo/web/demail/better.csv','r')
text = lines.readlines()
lines.close()
mailhash = {}
for line in text:
  fields = line.split('\t')
  if fields[0] != 'id':
    mailhash[fields[0]] = fields[1:16]
lines.close()

namelist = colorHash()
print 'done with data load'

nodelines = open('/usr/local/share/tangelo/web/demail/node_vals.csv','r')
nodevals = {}
for line in nodelines:
  node,num,comm,rank = line.strip().split('\t')
  nodevals[node] = {'num':num,'comm':comm,'rank':rank}

nodelines.close()
print 'done with ranks load'

#### METHODS CALLED BY WEB SERVICE

def getReturnData(key, row):
  return {'num':key, \
  # 'threadid':row[0],\
  'directory':row[1],\
  # 'category':row[2], \
  'datetime':row[3],\
  'from':row[4],\
  'fromcolor':get_color_group(row[4]),\
  'to':row[5],\
  'cc':row[6],\
  'bcc':row[7],\
  'subject':row[8],\
  # 'tosize':row[10],\
  # 'ccsize':row[11],\
  # 'attachsize':row[12],\
  'attach':row[13],\
  # 'bodysize':row[14] \
  'body':row[9]
  }

def search(query_text, field='All'):
  global mailhash
  results = {}
  names = {}
  edges = {}
  matches = {}
  print "Search term was:" + query_text + '!'
  for key in mailhash.keys():
    
    nums = range(0,15)
    if field == 'email':
      nums = [4,5,6,7] 
    include = False
    for i in nums:
      try:
        if query_text.lower() in mailhash[key][i].encode('utf-8').lower():
          include = True
      except:
        pass
    
    if include:

      matches[key] = getReturnData(key,mailhash[key])

      for frome in mailhash[key][4].split(','):
        if frome != '':
          if names.get(frome) == None:
            names[frome] = 0
          names[frome] = names[frome] + 1
      for to in mailhash[key][5].split(','):
        if to != '':
          if names.get(to) == None:
            names[to] = 0
          names[to] = names[to] + 1
          if edges.get(mailhash[key][4] + ',' +to) == None:
            edges[mailhash[key][4] + ',' +to] = 0
          edges[mailhash[key][4] + ',' +to] = edges[mailhash[key][4] + ',' +to] + 1
      for cc in mailhash[key][6].split(','):
        if cc != '':
          if names.get(cc) == None:
            names[cc] = 0
          names[cc] = names[cc] + 1
          if edges.get(mailhash[key][4] + ',' +cc) == None:
            edges[mailhash[key][4] + ',' +cc] = 0
          edges[mailhash[key][4] + ',' +cc] = edges[mailhash[key][4] + ',' +cc] + 1
      for bcc in mailhash[key][7].split(','):
        if bcc != '':
          if names.get(bcc) == None:
            names[bcc] = 0
          names[bcc] = names[bcc] + 1
          if edges.get(mailhash[key][4] + ',' +bcc) == None:
            edges[mailhash[key][4] + ',' +bcc] = 0
          edges[mailhash[key][4] + ',' +bcc] = edges[mailhash[key][4] + ',' +bcc] + 1

  print len(matches.keys())
  print len(names.keys())
  matches = matches.values()
  #edges = list(edges)
  matches = sorted(matches,key=lambda x: str(x['datetime']))
  results['rows'] = matches
  
  graph = convert_to_web_json(names,edges,'')
  results['graph'] = graph
  #print results['graph']
  #print matches
  return results
  
#### METHODS TO PROCESS AND CACHE DATA


def get_comm_color(label):
  global nodevals
  global namelist
  return namelist.index(nodevals[label]['comm'])

def get_rank(label):
  global nodevals
  return nodevals[label]['rank']

def get_color_group(label):

  global namelist

  return namelist.index(label)

  
def convert_to_web_json(names,edges,outfile):
  hash_vertex_idx = {}
  namekeys = names.keys()
  edgekeys = edges.keys()
  for index in range(len(namekeys)):

    hash_vertex_idx[namekeys[index]] = index
    
  nodes = map(lambda x: {"name":x,"num":names[x],"rank":get_rank(x),"community":get_comm_color(x),"group":get_color_group(x)},namekeys)
  links = map(lambda x:  {"source":hash_vertex_idx[x.split(',')[0]],"target":hash_vertex_idx[x.split(',')[1]],"value":edges[x]},edgekeys)
  graph = {"nodes":nodes,"links":links}
  
  return graph

