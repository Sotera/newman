# -*- coding: utf-8 -*-
from newman.settings import CONFIG

def connection_info():
    return {
        'user': CONFIG.get('user'), 
        'password': CONFIG.get('password'), 
        'host': CONFIG.get('host'), 
        'database': CONFIG.get('database')
    }
