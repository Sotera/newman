import os
import shutil
import exifread
from subprocess import Popen, PIPE

pdf_success = 0
def pdftotext(loc):
	global pdf_success
	text = ''
	print loc
	process = Popen("pdf2txt.py " + loc, shell=True, stdout=PIPE)
	(output, err) = process.communicate()
	exit_code = process.wait()
	if exit_code == 0:
		text = str(output).replace('\n','<BR>').replace('\t',' ').replace('\r\n','<BR>').rstrip()
		pdf_success += 1
	return text.replace('\r','').replace('\n','')

def parseDate(taglist):
	lats = str(taglist['GPS GPSLatitude'])
	degrees,minutes,seconds = lats.replace('[','').replace(']','').split(',')
	latitude = float(degrees)
	latitude += (float(minutes) / 60.0)
	parts = seconds.split('/')
	latitude += ((float(parts[0]) / float(parts[1]) / 3600.0  ))
	
	degrees,minutes,seconds = str(taglist['GPS GPSLongitude']).replace('[','').replace(']','').split(',')
	longitude = float(degrees)
	longitude += (float(minutes) / 60.0)
	parts = seconds.split('/')
	longitude += ((float(parts[0]) / float(parts[1]) / 3600.0  ))

	datetime = ''
	if taglist.get('GPS GPSDate') != None:
		datetime = str(taglist['GPS GPSDate']).replace(':','-') + 'T'
		hour,min,sec = str(taglist['GPS GPSTimeStamp']).replace('[','').replace(']','').split(',')
		datetime += ':'.join((hour.strip(),min.strip(),sec.strip()))
	
	return str(latitude),str(longitude),str(datetime)
	

input = open('output_w_geo.csv','r')
output = open('attachment_analysis.csv','w')
ultimate = open('ultimate.csv','w')
#print 'num\tdir\tdatetime\tfrom\tto\tcc\tattachment\tsuffix\tcountry_code\tlatitude\tlongitude\timg_datetime\tsubject\tbody\tmail_latitude\tmail_longitude'
output.write('num\tdir\tdatetime\tfrom\tto\tcc\tbcc\tattachment\tsuffix\tcountry_code\tpdf_text')
ultimate.write('num\tdir\tdatetime\tfrom\tto\tcc\tbcc\tcountry_code\tlatitude\tlongitude\tsubject\tbody\tnum_attach\tnum_to\tnum_cc\temail_size\tpdf_text\n')
input.readline()

tags = {}

for line in input:
	num, dir, utc_date, imp, fromemail, xip, toemail, ccemail, bccemail, attach, messid, inreplyto, subj, html, latitude, longitude, country_code, match_type \
	= line.split('\t')
	if num == 'num':
		continue
	num_attach = 0
	pdf_text = ''
	all_pdf_text = ''
	directory = dir
	num_to = len(toemail.split(','))
	num_cc = 0
	if ccemail != '':
		num_cc = len(ccemail.split(','))
	email_size = len(html.replace('<BR>',' '))
	email_html = '<b>From: ' + fromemail + '</b><br>'
	email_html += '<b>To: ' + toemail + '</b><br>'
	email_html += '<b>Cc: ' + ccemail + '</b><br>'
	email_html += '<b>Bcc: ' + bccemail + '</b><br>'
	email_html += '<b>Date: ' + utc_date + '</b><br>'
	email_html += '<b>Subject: ' + subj + '</b><br><br>'
	email_html += html
	if os.path.exists('./emails/' + fromemail) == False:
		os.makedirs('./emails/' + fromemail)
	if attach != '':
		
		if os.path.exists('./attachments/' + fromemail) == False:
			os.makedirs('./attachments/' + fromemail)
		num_attach = len(attach.split(';'))
		for a in attach.split(';'):
			if a.strip() != '':
				email_html += '<br><b>Attachment: </b><a href=\"../../' + directory + '/' + a.strip() + '\">' + a.strip() + '</a>'
				ext = a.strip().split('.')[len(a.strip().split('.')) -1]
				
				if ext.lower() == 'pdf':
						pdf_text = pdftotext(directory + '/' + a.strip())
						all_pdf_text += ' ' + pdf_text.replace('<BR>',' ')
				output.write('\t'.join((str(num),directory,utc_date,fromemail,toemail,ccemail,bccemail,a.strip(), \
				a.strip().split('.')[len(a.strip().split('.')) -1],country_code,pdf_text)) + '\n')
				try:
					shutil.copyfile(directory + '/' + a.strip(),'./attachments/' + fromemail + '/' + utc_date.replace(':','_') + '_' + a.strip())
					if ext.lower() in ['jpeg','jpg','tif','tiff']:
						#print directory + '/' + a.strip()
						f = open(directory + '/' + a.strip())
						try:
							taglist = exifread.process_file(f)
							for tag in taglist.keys():
								if tag == 'GPS GPSLatitude':
									lat,lon,datetime = parseDate(taglist)
									print '\t'.join((str(num),directory,utc_date,fromemail,toemail,ccemail,bccemail,a.strip(), \
									a.strip().split('.')[len(a.strip().split('.')) -1],country_code,lat,lon,datetime,subj, html, latitude, longitude))
								if tags.get(tag) == None:
									tags[tag] = 1
								else:
									tags[tag] += 1
						except IndexError:
							continue
						f.close()
				except IOError:
					pass
	email_file = open('./emails/' + fromemail + '/' + num + '.html', 'w')
	email_file.write(email_html)
	email_file.close()
	ultimate.write('\t'.join((str(num),directory,utc_date,fromemail,toemail,ccemail,bccemail, \
	country_code,latitude,longitude,subj,html.replace('<BR>',' '), str(num_attach), str(num_to), str(num_cc), str(email_size),all_pdf_text)) + '\n')

print str(pdf_success)
#for key in tags.keys():
#	print '\t'.join((key, str(tags[key])))