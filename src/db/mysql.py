# -*- coding: utf-8 -*-
from __future__ import absolute_import

import sys
import mysql.connector    

class mysql_connector(object):

    def __init__(self, user='', password='', host='', database=''):
        self.user = user;
        self.password = password;
        self.host = host;
        self.db = database;
        self._conn = None;

    def conn(self):
        return self._conn

    def commit(self):
        self._conn.commit()

    def __enter__(self):
        self._conn = mysql.connector.connect(
            user=self.user,
            password=self.password,
            host=self.host,
            database=self.db)
        return self

    def __exit__(self, type, value, traceback):
        try:
            self._conn.close()
        except:
            e = sys.exc_info()[0]
            print e

class execute_query(object):
    
    def __init__(self, conn, statement, *prepared_args):
        self.conn = conn
        self.stmt = statement
        self.prepared_args = prepared_args
        self._cursor = None

    def cursor(self):
        return self._cursor

    def __enter__(self):
        self._cursor = self.conn.cursor()
        self._cursor.execute(self.stmt, self.prepared_args)
        return self

    def __exit__(self, type, value, traceback):
        try:
            self._cursor.close()
        except:
            e = sys.exc_info()[0]
            print e

class execute_nonquery(object):
    
    def __init__(self, conn, statement, *prepared_args, **kwargs):
        self.conn = conn
        self.autocommit = kwargs.get('autocommit', True)
        self.stmt = statement
        self.prepared_args = prepared_args
        self._cursor = None

    def cursor(self):
        return self._cursor

    def __enter__(self):
        self._cursor = self.conn.cursor()
        self._cursor.execute(self.stmt, self.prepared_args)
        if self.autocommit:
            self.conn.commit()
        return self

    def __exit__(self, type, value, traceback):
        try:
            self._cursor.close()
        except:
            e = sys.exc_info()[0]
            print e

class mysql_execute(object):
    
    def __init__(self, user='', password='', host='', database='', statement='', prepared_args=()):
        self.user = user;
        self.password = password;
        self.host = host;
        self.db = database;
        self.stmt = statement
        self.prepared_args = prepared_args
        self._conn = None
        self._cursor = None
    
    def cursor(self):
        return self._cursor

    def __enter__(self):
        self._conn = mysql.connector.connect(
            user=self.user,
            password=self.password,
            host=self.host,
            database=self.db)

        self._cursor = self._conn.cursor()
        self._cursor.execute(self.stmt, self.prepared_args)
        return self

    def __exit__(self, type, value, traceback):
        try:
            self._cursor.close()
            self._conn.close()
        except:
            e = sys.exc_info()[0]
            print e
