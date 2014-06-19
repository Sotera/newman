# -*- coding: utf-8 -*-
from db.mysql import mysql_connector
from db.connection import connection_info

def newman_connector():
    return mysql_connector(**connection_info())
