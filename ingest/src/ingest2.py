#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse, re, uuid, sys, os
import json
import yaml
import logging
import logging.config


#modify import for different parsers
sys.path.append("./ingest/parsers")
from default_parser import row_parser
from tools import email_body_split
from mitie_extractor import Extractor

sys.path.append("./ingest/tika-socket-server/client")
from tika_client import TikaClient

sys.path.append("./demail")
from newman.utils.file import slurpA, spit, RollingPartsFile
from newman.utils.functions import counter, rest, nth, head

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Newman Ingest')
    parser.add_argument("output_dir", help="directory to store output files")
    parser.add_argument("--no_header", action="store_true", help="input has no header row")
    parser.add_argument("input_file", nargs='?', type=argparse.FileType('r'), default=sys.stdin, help="Input File")

    args= parser.parse_args()
    c = counter(0)
    lines = args.input_file.read().splitlines() if args.no_header else rest(args.input_file.read().splitlines())
    with RollingPartsFile(args.output_dir, 'es', 'json') as f, \
         Extractor('/srv/software/MITIE/MITIE-models/english/ner_model.dat') as mitie:
        
        tikaclient = TikaClient('localhost', 9999)
        for line in lines:
            count = c.next()
            try:
                row_object = row_parser(line)
                if not 'id' in row_object:
                    continue

                raw_body=row_object['raw_email_body']
                body_split = email_body_split(raw_body)
                row_object['is_thread'] = head(body_split)
                row_object['email_body'] = nth(body_split, 1, '')
                row_object['email_thread'] = nth(body_split, 2, '')                   

                #MITIE 
                row_object['mitie'] = {}
                mitie_entities= mitie.extract_entities(row_object['email_body'])
                row_object['mitie']['entities'] = mitie_entities
                row_object['email_body_markup'] = mitie.markup(row_object['email_body'], mitie_entities)
                #Attachments
                row_object['tika']= {}
                row_object['tika']['attach_text']= []
                for attach in row_object['attach']:
                    fp = os.path.abspath("./demail/emails/jeb@jeb.org/{}/{}".format(row_object['dir'], attach))
                    rtn = tikaclient.extract_text(fp)
                    if head(rtn):
                        row_object['tika']['attach_text'].append({ 
                            'file_path' : fp, 
                            'file_name' : attach,
                            'text' : nth(rtn, 1)})

                idx = json.dumps({ "index": { "_id" : row_object['id'] }})
                doc= json.dumps(row_object)
                file_finished, finished_path = f.write("{}\n{}\n".format(idx,doc))
                if file_finished:
                    print "finished {}, path: {}".format(count, finished_path)
            except Exception as e:
                #logger.error("ERROR line #{}, line : {}, exception
                #{}".format(count+1, line, str(e)))               
                print "ERROR line #{}, line : {}, exception {}".format(count+1, line, str(e))
                continue
                    
        
        
