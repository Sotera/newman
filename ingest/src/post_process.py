#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, sys

sys.path.append("./demail")
from newman.db.mysql import execute_nonquery
from newman.db.newman_db import newman_connector

stmt_email_addr_insert = (
    " insert into email_addr (email_addr, community, community_id, group_id, total_received, total_sent, rank) "
    " select subject, "
    "        group_concat(case predicate when 'community' then obj end) as comm, "
    "        group_concat(case predicate when 'community_id' then obj end) as comm_id, "
    "        group_concat(case predicate when 'group_id' then obj end) as group_id, "
    "         sum(coalesce(case predicate when 'total_received' then obj end, 0)) as total_rcv, "
    "         sum(coalesce(case predicate when 'total_sent' then obj end, 0)) as total_sent, "
    "         group_concat(case predicate when 'rank' then obj end) as rank "
    "   from facts where schema_name = 'email_addr' "
    "   and predicate in ('community','community_id', 'group_id', 'total_received', 'total_sent', 'rank') "
    "   group by subject"
)

stmt_xref_emailaddr_email = (
    " insert into xref_emailaddr_email (email_addr, email_id) "
    " select distinct obj, subject "
    " from facts "
    " where schema_name = 'email' "
    " and predicate in ('to', 'from','cc','bcc') "
)

stmt_xref_entity_email = (
    " insert into xref_entity_email (rollup_id, email_id) "
    " select distinct r.rollup_id, e.email_id " 
    " from entity_rollup r join xref_rollup_entity x " 
    " on r.rollup_id = x.rollup_id join entity e " 
    " on x.entity_id = e.subject "
)

stmt_xref_email_community = (
    " insert into xref_email_community (email_id, community_id) "
    " select distinct e.id, a.community_id "
    " from email e join xref_emailaddr_email x on e.id = x.email_id " 
    " join email_addr a on x.email_addr = a.email_addr "
)

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Post Process')
    args= parser.parse_args()

    with newman_connector() as write_cnx:
        print "populate email_addr"
        with execute_nonquery(write_cnx.conn(), stmt_email_addr_insert) as qry:
            pass
        write_cnx.commit()

        print "populate xref_emailaddr_email"
        with execute_nonquery(write_cnx.conn(), stmt_xref_emailaddr_email) as qry:
            pass
        write_cnx.commit()

        print "populate xref_entity_email"
        with execute_nonquery(write_cnx.conn(), stmt_xref_entity_email) as qry:
            pass
        write_cnx.commit()
        
        print "populate xref_email_community"
        with execute_nonquery(write_cnx.conn(), stmt_xref_email_community) as qry:
            pass
        write_cnx.commit()

