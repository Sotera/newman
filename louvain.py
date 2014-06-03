edges = open('edges.csv','r')
es = {}
for edge in edges:
	source, target, weight = edge.split('\t')
	source = source.strip()
	target = target.strip()
	weight = weight.strip()
	
	if source == 'Source':
		continue
	if es.get(source+','+target) == None and es.get(target+','+source) == None:
		es[source+','+target] = int(weight.strip())
	elif es.get(source+','+target) == None:
		es[target+','+source] = es[target+','+source] + int(weight.strip())
	elif es.get(target+','+source) == None:
		es[source+','+target] = es[source+','+target] + int(weight.strip())
	else:
		print "shouldn't get here"
		pass		
edges.close()
bi = open('bidir_edges.csv','w')
for key in es.keys():
	source,target = key.split(',')
	weight = es[key]
	bi.write('\t'.join((source,target,str(weight))) + '\n')
	bi.write('\t'.join((target,source,str(weight))) + '\n')
bi.close()	
bi = open('bidir_edges.csv','r')
nodes = {}
for line in bi:
	source,target,edgeweight = line.strip().split('\t')
	if nodes.get(source) == None:
		nodes[source] = ''
	nodes[source] = nodes[source] + (target + ':' + edgeweight.strip() + ',')

bi.close()
louvain = open('louvain.csv','w')
for node in nodes.keys():
	louvain.write('\t'.join((node,'0',nodes[node][0:len(nodes[node])-1])) + '\n')
louvain.close()