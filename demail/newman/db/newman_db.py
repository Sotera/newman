# -*- coding: utf-8 -*-
from newman.db.mysql import mysql_connector
from newman.db.connection import connection_info

def newman_connector():
    return mysql_connector(**connection_info())
