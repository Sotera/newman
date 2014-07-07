# -*- coding: utf-8 -*-

from newman.db.mysql import execute_nonquery, execute_query
from newman.db.connection import connection_info

def query_obj(statement='', args=()):
    return dict(connection_info(), **{'statement': statement, 'prepared_args': args})

class Tx(object):

    def __init__(self, mysql_connection):
        self.conn = mysql_connection

    def next(self):
        with execute_nonquery(self.conn, 'insert into tx () values ()') as qry:
            tx = qry.cursor().getlastrowid()
            return tx

    def current(self):
        with execute_query(self.conn, 'select max(tx) from tx') as qry:
            return next(iter(qry.cursor().fetchone()))

class Fact(object):
    
    def __init__(self, mysql_connection, autocommit=True):
        self.conn = mysql_connection
        self.autocommit = autocommit

    def addFact(self, subject, schema, predicate, object, tx):
        stmt = "insert into facts (subject, schema_name, predicate, obj, tx) values (%s, %s, %s, %s, %s)"
        with execute_nonquery(self.conn, stmt, subject.lower(), schema.lower(), predicate.lower(), object, tx, **{ 'autocommit': self.autocommit }) as insert: 
            pass

class Text(object):
    
    def __init__(self, mysql_connection, autocommit=True):
        self.conn = mysql_connection
        self.autocommit = autocommit

    def addText(self, subject, object, tx):
        stmt = ("insert into large_text (subject, obj, tx) values (%s, %s, %s)")

        with execute_nonquery(self.conn, stmt, subject.lower(), object, tx, **{ 'autocommit': self.autocommit }) as insert: 
            pass


class EmailRow(object):
    def __init__(self, mysql_connection):
        self.conn = mysql_connection

    def addEmail(self, id, threadid, dir, category, datetime, from_addr, tos, ccs, bccs, subject, body, tosize, ccsize, bccsize, attachsize, attach, bodysize, location, line_num):

        stmt = ("insert into email " 
                "(id, threadid, dir, category, datetime, from_addr, tos, "
                "ccs, bccs, subject, body, tosize, ccsize, bccsize, attachsize, "
                "attach, bodysize, location, line_num) " 
                "values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,"
                " %s, %s, %s, %s, %s, %s, %s, %s, %s)")
        
        with execute_nonquery(self.conn, stmt, id, threadid, dir, category, datetime, 
                              from_addr, tos, ccs, bccs, subject, body, tosize, ccsize, 
                              bccsize, attachsize, attach, bodysize, location, line_num) as insert:
            pass

