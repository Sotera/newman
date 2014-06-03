from datetime import datetime
from dateutil.parser import parse
import os
import shutil

def getdatetime(date):
  if date.strip() == '':
    return ''
  try:
    return datetime.strptime(date.strip(),'%A, %B %d, %Y %H:%M:%S %p')
  except ValueError:
    pass
  try:
    return datetime.strptime(date.strip(),'%A, %B %d, %Y, %H:%M %p')
  except ValueError:
    pass
  try:
    return datetime.strptime(date.strip(),'%A %B %d %Y %H:%M:%S %p')
  except ValueError:
    pass
  try:
    return datetime.strptime(date.strip(),'%A, %B %d, %Y %H %M:%S %p')
  except ValueError:
    pass
  try:
    return parse(date.strip())
  except ValueError:
    pass
	
def getTo(toemail):
  tostring = ''
  tos = toemail.split(',')
  for to in tos:
    toparts = to.split(':')
    if len(toparts) == 2:
	  tostring = tostring + toparts[1].lower().strip() + ','  
  return tostring[0:len(tostring)-1]
  
def getFrom(fromemail):
  parts = fromemail.split(':')
  if len(parts) == 2:
    return parts[1].lower().strip()
  else:
    return ''
	
output = open('output.csv','w')
output.write('num\tdir\tcategory\tdatetime\timportance\tfrom\tip\tto\tcc\tbcc\tattachments\tmessageid\tinreplyto\treferences\tsubject\tbody\n')
ip = messageid = inreplyto = references = ''


files = ['emails/emails1.tsv','emails/emails2.tsv']
dirs = ['scottwalker1','scottwalker2']

i = 0
for file in files:
  lastemail = ''	
  mails = {}
  mailbodies = {}
  category = ''
  file1 = open(file,'r')
  for line in file1:
    
    if len(line.split('\t')) == 1:
      category = line.split('\t')[0].strip()
      if lastemail != '':
        output.write(lastemail + '\t' + lastemail + '\t' + mails[lastemail] + '\t' + mailbodies[lastemail] + '\n')
        os.mkdir('A:/walker_email/data/better/' + lastemail, 0777)
        for dirr in lastemail.split('/')[1].split('__'):
          att = os.listdir('A:/walker_email/data/scottwalker' + str(i+1) + '/' + dirr + '/attachments')
          for at in att:
            shutil.copy('A:/walker_email/data/scottwalker' + str(i+1) + '/' + dirr + '/attachments/' + at, \
            'A:/walker_email/data/better/' + lastemail + '/attachments')
          shutil.copy('A:/walker_email/data/scottwalker' + str(i+1) + '/' + dirr + '/' + dirr + '.txt', \
          'A:/walker_email/data/better/' + lastemail + '/')
      lastemail = ''
      continue
      
    id, headers, fromemail, toemail, ccemail, bccemail, subject, date, attachments, importance, body = line.split('\t')
	
    dir = 'A:/walker_email/data/scottwalker' + str(i+1) + '/' + id
    gid = 'scottwalker' + str(i+1) + '/' + str(id)
    frome = getFrom(fromemail)

    if frome != '':
      if lastemail != '':
        output.write(lastemail + '\t' + lastemail + '\t' + mails[lastemail] + '\t' + mailbodies[lastemail] + '\n')
        os.mkdir('A:/walker_email/data/better/' + lastemail, 0777)
        os.mkdir('A:/walker_email/data/better/' + lastemail + '/attachments', 0777)
        for dirr in lastemail.split('/')[1].split('__'):
          att = os.listdir('A:/walker_email/data/scottwalker' + str(i+1) + '/' + dirr + '/attachments')
          for at in att:
            shutil.copy('A:/walker_email/data/scottwalker' + str(i+1) + '/' + dirr + '/attachments/' + at, \
            'A:/walker_email/data/better/' + lastemail + '/attachments')
          shutil.copy('A:/walker_email/data/scottwalker' + str(i+1) + '/' + dirr + '/' + dirr + '.txt', \
          'A:/walker_email/data/better/' + lastemail + '/')
      tome = getTo(toemail)
      cc = getTo(ccemail)
      bcc = getTo(bccemail)
      datet = getdatetime(date)

      formatteddate = ''
      if datet == '':
	    formatteddate = ''
      else:
        formatteddate = datet.isoformat()

      mails[gid] = '\t'.join((category,formatteddate,importance.strip(),frome,ip,tome,cc,bcc,attachments, messageid, inreplyto, references, subject.strip()))
      mailbodies[gid] = body.strip()

      lastemail = gid
    else:
      mails[lastemail + '__' + id] = mails[lastemail]
      mailbodies[lastemail + '__' + id] = mailbodies[lastemail] + body.strip()
      lastemail = lastemail + '__' + id
  file1.close()	
  i = i + 1
 