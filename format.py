import re

input = open('output.csv','r')
out = open('better.csv','w')
exploded = open('exploded.csv','w')

edges = open('edges.csv','w')
nodes = open('nodes.csv','w')

mail_nodes = open('mail_nodes.csv','w')
mail_edges = open('mail_edges.csv','w')

edgelist = {}
nodelist = {}

maillist = {}
mailedgelist = {}

indirect_mail_list = {}

nodesourcemap = {}

out.write('id\tthreadid\tdir\tcategory\tdatetime\tfrom\tto\tcc\tbcc\tsubject\tbody\ttosize\tccsize\tattachsize\tattach\tbodysize\tlocation\n')
for line in input:
	num,dir,category,utc_date,importance,fromemail,ip,toemail,ccemail,bccemail,attach,messageid,inreplyto,references,subject,body = line.split('\t')
	body = body.strip()
	network = ''

	if num == 'num' or utc_date == '' or utc_date == None:
		continue
	
	threadid = mid = num
	if messageid.strip() != '':
		mid = messageid.strip()
		threadid = messageid.strip()
	
		
	
	if maillist.get(mid) == None:
		maillist[mid] = 1
	else:
		# should never get here
		maillist[mid] = maillist[mid] + 1
		
	if references != '':
		for ref in references.split():
			ref = ref.strip()
			if ref != '':
				if mailedgelist.get(mid + ',' + ref) == None:
					mailedgelist[mid + ',' + ref] = 1
				else:
					# should never get here
					mailedgelist[mid + ',' + ref] = mailedgelist[mid + ',' + ref] + 1
				indirect_mail_list[mid] = True
				indirect_mail_list[ref] = True
	if references != '' and references.split()[0] != '':
		threadid = references.split()[0]
	accounts = re.findall(r'[\w\.-]+@[\w\.-]+', dir)
	if len(accounts) > 0:
		network = accounts[0]
		
	tosize = len(toemail.split(','))
	ccsize = len(ccemail.split(',')) - 1
	bccsize = len(bccemail.split(',')) - 1
	attachsize = len(attach.split(';')) - 1
	
	out.write('\t'.join((str(num), threadid, dir, category, utc_date, fromemail, toemail, ccemail, bccemail, subject, body, str(tosize), str(ccsize), str(attachsize), \
	attach, str(len(body)), network)) + '\n')
	
	if fromemail != '':
		if nodelist.get(fromemail) == None:
			nodelist[fromemail] = 1
			nodesourcemap[fromemail] = network
		else:
			nodelist[fromemail] = nodelist[fromemail] + 1
			found = False
			for dirsd in nodesourcemap[fromemail].split(':'):
				if dirsd == network:
					found = True
			if found == False:
				nodesourcemap[fromemail] = nodesourcemap[fromemail] + ':' + network
				
		
	tos = toemail.strip().split(',')
	for to in tos:
		if to != None and to != '':
			exploded.write('\t'.join((str(num), utc_date, fromemail, to, str(attachsize) )) + '\n')
			if edgelist.get(fromemail+','+to) == None:
				edgelist[fromemail+','+to] = 1
			else:
				edgelist[fromemail+','+to] = edgelist[fromemail+','+to] + 1
				
			if nodelist.get(to) == None:
				nodelist[to] = 1
				nodesourcemap[to] = network
			else:
				nodelist[to] = nodelist[to] + 1
				found = False
				for dirsd in nodesourcemap[to].split(':'):
					if dirsd == network:
						found = True
				if found == False:
					nodesourcemap[to] = nodesourcemap[to] + ':' + network
				
	ccs = ccemail.strip().split(',')
	for cc in ccs:
		if cc != None and cc != '':
			exploded.write('\t'.join((str(num), utc_date, fromemail, cc, str(attachsize) )) + '\n')
			if edgelist.get(fromemail+','+cc) == None:
				edgelist[fromemail+','+cc] = 1
			else:
				edgelist[fromemail+','+cc] = edgelist[fromemail+','+cc] + 1
				
			if nodelist.get(cc) == None:
				nodelist[cc] = 1
				nodesourcemap[cc] = network
			else:
				nodelist[cc] = nodelist[cc] + 1
				found = False
				for dirsd in nodesourcemap[cc].split(':'):
					if dirsd == network:
						found = True
				if found == False:
					nodesourcemap[cc] = nodesourcemap[cc] + ':' + network
	
	bccs = bccemail.strip().split(',')
	for bcc in bccs:
		if bcc != None and bcc != '':
			exploded.write('\t'.join((str(num), utc_date, fromemail, bcc, str(attachsize) )) + '\n')
			if edgelist.get(fromemail+','+bcc) == None:
				edgelist[fromemail+','+bcc] = 1
			else:
				edgelist[fromemail+','+bcc] = edgelist[fromemail+','+bcc] + 1
				
			if nodelist.get(bcc) == None:
				nodelist[bcc] = 1
				nodesourcemap[bcc] = network
			else:
				nodelist[bcc] = nodelist[bcc] + 1
				found = False
				for dirsd in nodesourcemap[bcc].split(':'):
					if dirsd == network:
						found = True
				if found == False:
					nodesourcemap[bcc] = nodesourcemap[bcc] + ':' + network
				
nodes.write('Id\tWeight\tDirs\n')
edges.write('Source\tTarget\tWeight\n')

for node in nodelist.keys():
	val = nodesourcemap.get(node)
	accounts = []
	for v in val.split(':'):
		accounts.append(v.strip())
	accounts.sort()
	ast = ''
	for a in accounts:
		ast = ast + a + ':'
	ast = ast[0:len(ast)-1]
	nodes.write(node + '\t' + str(nodelist[node]) + '\t' + str(ast) + '\n')

for edge in edgelist.keys():
	edges.write(edge.split(',')[0] + '\t' + edge.split(',')[1] + '\t' + str(edgelist[edge]) + '\n')

	
for edge in mailedgelist.keys():
	#print edge
	source,target = edge.strip().split(',')
	mail_edges.write(source + '\t' + target + '\t' + str(mailedgelist[edge]) + '\n')
	if maillist.get(source) == None:
		maillist[source] = -1
	elif maillist[source] < 0:
		maillist[source] = maillist[source] - 1
	if maillist.get(target) == None:
		maillist[target] = -1
	elif maillist[target] < 0:
		maillist[target] = maillist[target] - 1
		
for node in maillist.keys():
	mail_nodes.write(node + '\t' + str(maillist[node]) + '\n')