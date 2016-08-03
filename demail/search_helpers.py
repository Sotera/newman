__author__ = 'root'

import json

class MSearcHelper(object):
    msearch = []
    def __init__(self, msearch=[]):
        self.msearch = msearch

    # query body should have {"query":..., "size":n}
    def append(self, index, type, query_body):
        self.msearch.append({'index':index, 'type': type})
        self.msearch.append(query_body)

    def build(self):
        request = ''
        for req in self.msearch:
            request += '{} \n'.format(json.dumps(req))
        return request