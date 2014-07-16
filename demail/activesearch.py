from newman.db.newman_db import newman_connector
from newman.db.mysql import execute_query, execute_nonquery
from newman.utils.functions import nth, head

import tangelo
import cherrypy
import json
import urllib
import urllib2


daemon_url= "http://localhost:1337/ActiveSearchDaemon/rest"

stmt_email_to_line_num = (
    "select line_num from email where id = %s "
)

stmt_line_num_to_email = (
    "select id from email where line_num = %s "
)

def request(url):
    try:
        opener = urllib2.build_opener()
        #opener.addheaders = [('User-agent', UserAgent)]
        response = opener.open(url, timeout=120)
        sz = response.read()
        return sz
    except (ValueError, urllib2.HTTPError, urllib2.URLError) as e:
        cherrypy.log(str(e))
        return None

def findLineNum(emailid):
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_email_to_line_num, emailid) as qry:
            return head(qry.cursor().fetchone())

def findEmailId(line_num):
    with newman_connector() as read_cnx:
        with execute_query(read_cnx.conn(), stmt_line_num_to_email, line_num) as qry:
            return head(qry.cursor().fetchone())

#GET activesearch/like
def emailLike(*args):
    url= "{0}/emailinteresting".format(daemon_url)
    return findEmailId(request(url))

#GET activesearch/dislike
def emailDislike(*args):
    url= "{0}/emailboring".format(daemon_url)
    return findEmailId(request(url))

#GET activesearch/seed/<id>
def seedSearch(*args):
    email_id= urllib.unquote(nth(args, 0))
    if not email_id:
        return tangelo.HTTPStatusCode(400, "missing argument email_id")        
    line_num= findLineNum(email_id) 
    seed_url= "{0}/firstemail/{1}".format(daemon_url,line_num)
    request(seed_url)
    next_url= "{0}/getNextEmail".format(daemon_url)
    start_point=  request(next_url)
    if not start_point:
        return tangelo.HTTPStatusCode(400, "failed to set starting email")                
    return findEmailId(start_point)

actions = {
    "seed" : seedSearch,
    "like" : emailLike,
    "dislike" : emailDislike
}

def unknown(*args):
    return tangelo.HTTPStatusCode(400, "invalid service call")

@tangelo.restful
def get(action, *args, **kwargs):
    return actions.get(action, unknown)(*args)
