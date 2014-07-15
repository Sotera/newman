#!/usr/bin/env python
# -*- coding: utf-8 -*-
import argparse, sys
from functools import partial

sys.path.append("./demail")

from newman.db.mysql import execute_query, execute_nonquery
from newman.db.newman_db import newman_connector
from newman.utils.file import spit


stmt_rollup_entities = (
    " insert into entity_rollup (rollup_id, `type`, val, total_entities, total_emails) "
    " select concat('entity_rollup_', uuid()), entity_type, value, count(subject), -1 " 
    " from entity group by entity_type, value "
)

stmt_update_rollup_counts = (
    " update entity_rollup u JOIN "
    "    (select id, count(email) as c "
    "     from (select distinct r.rollup_id as id, e.email_id as email "
    "           from entity_rollup r join entity e "
    "           on r.type = e.entity_type and e.value = r.val"
    "       ) t "
    "     group by id "
    "  ) as t2 "
    " on u.rollup_id = t2.id "
    " set u.total_emails = t2.c "   
)

stmt_populate_xref = (
   " insert into xref_rollup_entity (rollup_id, entity_id) "
   " select distinct r.rollup_id, e.subject "
   " from entity_rollup r join entity e "
   " on r.type = e.entity_type and r.val = e.value "
)

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Roll up enities')
    args= parser.parse_args()

    with newman_connector() as write_cnx:
        print "rollup entities" 
        with execute_query(write_cnx.conn(), stmt_rollup_entities) as qry:
            pass
        write_cnx.commit()
        
        print "entity update email totals"
        with execute_query(write_cnx.conn(), stmt_update_rollup_counts) as qry:
            pass
        write_cnx.commit()        
        
        print "populate xref rollup to entity"
        with execute_query(write_cnx.conn(), stmt_populate_xref) as qry:
            pass
        write_cnx.commit()        

        
        
