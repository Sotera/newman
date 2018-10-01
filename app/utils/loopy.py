from __future__ import print_function
import requests
import json
import math

class AminoElasticsearch:
    '''
    pronounced 'Loo Py', not loopy:
    A Python module that makes REST API calls to Loopback apps.
    '''
    def __init__(self, elasticsearch_config = None):
        # normalize url
        query_url = 'http://amino3.vbox.keyw/amino-api/Elasticsearches/es/'
        self.query_url = query_url.strip().rstrip('/') + '/'

    @staticmethod
    def merge_two_dicts(x, y):
        """Given two dicts, merge them into a new dict as a shallow copy."""
        z = x.copy()
        z.update(y)
        return z

    def search(self, **kwargs):
        return self.verb(kwargs, '_search')

    def count(self, **kwargs):
        return self.verb(kwargs, '_count')

    def verb(self, kwargs, verb='_search', method='POST'):
        index = ''
        merged_body = {}
        query_string = ''
        doc_type = ''

        if kwargs is not None:
            for key, value in kwargs.iteritems():
                if key is 'index':
                    index = value + '/'
                if key is 'id':
                    verb = value
                if key is 'body':
                    merged_body = AminoElasticsearch.merge_two_dicts(value, merged_body)
                if key is '_source_include':
                    source_dict = {
                        '_source': {
                            'includes': value
                        }
                    }
                    merged_body = AminoElasticsearch.merge_two_dicts(source_dict, merged_body)
                if key is 'from_':
                    merged_body['from'] = value
                if key is 'request_cache':
                    query_string += '&request_cache=' + value
                if key is 'size':
                    merged_body[key] = value
                if key is 'doc_type':
                    doc_type = value + '/'
        url = self.query_url + index + doc_type + verb + '?access_token=' + AminoElasticsearch.get_token() + query_string
        if len(merged_body) == 0:
            merged_body = None
        return AminoElasticsearch._send_request(url, merged_body, method)

    def stats(self, **kwargs):
        index = ''
        verb = '_stats'
        if kwargs is not None:
            for key, value in kwargs.iteritems():
                if key is 'index' and value is not '_all':
                    index = value + '/'
        method = 'GET'
        url = self.query_url + index + verb + '?access_token=' + AminoElasticsearch.get_token()

        return AminoElasticsearch._send_request(url, None, method)

    def get_document(self, **kwargs):
        if kwargs is not None and 'id' in kwargs and 'doc_type' in kwargs and 'index' in kwargs:
            return self.verb(kwargs, method='GET')
        raise Exception('kwargs insufficient, get requires index, doc_type and id')

    def exists(self, **kwargs):
        if kwargs is not None and 'id' in kwargs and 'doc_type' in kwargs and 'index' in kwargs:
            return self.verb(kwargs, method='GET') is not None
        raise Exception('kwargs insufficient, exists requires index, doc_type and id')

    @staticmethod
    def get_token():
        payload = {'username': 'elasticsearch', 'password': 'password'}
        token = requests.post('http://amino3.vbox.keyw/amino-api/AminoUsers/login', payload).json()['id']

        return token

    @staticmethod
    def post(url, json, method='POST'):
        '''
        (static) Send JSON data using specified http method (not just a POST).
        '''
        return AminoElasticsearch._send_request(url, json, method)

    @staticmethod
    def get(url):
        '''
        (static) GET json data.
        '''
        return AminoElasticsearch._send_request(url, json=None, method='GET')

    @staticmethod
    def _send_request(url, json, method='POST'):
        result = requests.request(method, url, json=json)
        if result.status_code == 200:
            return result.json()
        else:
            print(result.content)
            raise Exception('{} to {} failed: {}'.format(
                method.upper(),
                url,
                result.content))

