#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, os, argparse, subprocess, json

from functools import partial

sys.path.append("./demail")

from newman.utils.file import slurpA, spit, RollingPartsFile
from newman.utils.functions import counter, rest, nth, head, lower


def create_summary_dict(input_index):
    summary_items= [line.split('\t') for line in slurpA(args.input_index)[1:]]
    summary_items= [map(lambda s: s.strip(), line) for line in summary_items]
    summary_dict = [dict(zip(["idx", "topic_score", "doc_purity", "percent_docs", "summary"], 
                             [nth(i,0), nth(i, 1), nth(i, 2), nth(i,3), i[4:]])) 
                    for i in summary_items]
    return summary_dict

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create ES files for bulk update')
    parser.add_argument("output_dir", help="output directory")
    parser.add_argument("input_index", help="Input index file")
    parser.add_argument("input_scores", help="Input scores file")
    args= parser.parse_args()

    #summary
    ## index   topic_score     doc_purity      percent_docs summary0 1
    ## 2 ...

    summary_dict = create_summary_dict(args.input_index)
    c = counter(0)

    with RollingPartsFile(args.output_dir, 'topic_update', 'json') as f:
        for line in slurpA(args.input_scores):
            count = c.next()
            try:
                items = [s.strip() for s in line.split('\t')]
                update_obj = { 'topics' : [] }
                _id = head(items)
                for n, item in enumerate(items[2:]):
                    update_obj['topics'].append(
                        { 'summary_id' : "summary{}".format(n),
                          'summary' : nth(summary_dict, n),
                          'score' : "{}".format(item) })

                idx = json.dumps({ "update": { "_id" : _id }})
                doc= json.dumps({ "doc" : update_obj })
                file_finished, finished_path = f.write("{}\n{}\n".format(idx,doc))
                if file_finished:
                    print "finished {}, path: {}".format(count, finished_path)
            except Exception as e:
                print "ERROR line #{}, line : {}, exception {}".format(count+1, line, str(e))
                continue



    

    
