from __future__ import print_function
import requests
import datetime
from flask import session

class AminoElasticsearch:
    '''
    pronounced 'Loo Py', not loopy:
    A Python module that makes REST API calls to Loopback apps.
    '''

    def __init__(self, **kwargs):
        # normalize url
        self.base_url = 'http://' + kwargs['hosts'][0]['host']
        if 'port' in kwargs['hosts'][0] and kwargs['hosts'][0]['port'] is not '':
            self.base_url = '{}{}{}'.format(self.base_url, ':',kwargs['hosts'][0]['port']).strip().rstrip('/') + '/'
        query_url = 'amino-api/Elasticsearches/es/'
        self.query_url = '{}{}'.format(self.base_url.strip().rstrip('/') + '/', query_url)

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

    def verb(self, kwargs, verb='_search', method='POST', return_result=False):
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
                if key is 'fielddata_fields':
                    query_string += '&fielddata_fields=' + value
                if key is 'fields':
                    query_string += '&fielddata_fields=' + value
                if key is 'completion_fields':
                    query_string += '&completion_fields=' + value
                if key is 'size':
                    merged_body[key] = value
                if key is 'doc_type':
                    doc_type = value + '/'
        url = '{}{}{}{}{}{}{}'.format(self.query_url, index, doc_type, verb, '?access_token=',
                                      self.get_token(), query_string)
        if len(merged_body) == 0:
            merged_body = None
        return AminoElasticsearch._send_request(url, merged_body, method, return_result)

    def stats(self, **kwargs):
        index = ''
        verb = '_stats'
        if kwargs is not None:
            for key, value in kwargs.iteritems():
                if key is 'index' and value is not '_all':
                    index = value + '/'
        method = 'GET'
        url = '{}{}{}{}{}'.format(self.query_url, index, verb, '?access_token=', self.get_token())

        return AminoElasticsearch._send_request(url, None, method)

    def get_document(self, **kwargs):
        if kwargs is not None and 'id' in kwargs and 'doc_type' in kwargs and 'index' in kwargs:
            return self.verb(kwargs, method='GET')
        raise Exception('kwargs insufficient, get requires index, doc_type and id')

    def exists(self, **kwargs):
        if kwargs is not None and 'id' in kwargs and 'doc_type' in kwargs and 'index' in kwargs:
            result = self.verb(kwargs, method='GET', return_result=True)
            return result.status_code is 200
        raise Exception('kwargs insufficient, exists requires index, doc_type and id')

    def index(self, **kwargs):
        if kwargs is not None and 'id' in kwargs and 'doc_type' in kwargs and 'index' in kwargs and 'body' in kwargs:
            result = self.verb(kwargs, method='PUT', return_result=True)
            if result.status_code == 201:
                return result.json()
            else:
                raise Exception('{} to {} failed: {}'.format(
                    "PUT",
                    "index",
                    result.content))
        raise Exception('kwargs insufficient, exists requires index, doc_type, id and body')

    # TODO:Get rid of this...we should already have the token!
    def get_token(self, force=False):
        if force or 'aminoToken' not in session:
            payload = {'username': session['aminoUser'], 'password': 'password'}
            session['aminoToken'] = requests.post('{}{}'.format(self.base_url.strip().rstrip('/') +
                                                       '/','amino-api/AminoUsers/login'), payload).json()['id']
        return session['aminoToken']


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
    def _send_request(url, json, method='POST', return_result=False):
        result = requests.request(method, url, json=json)
        if return_result:
            return result
        if result.status_code == 200:
            return result.json()
        else:
            print(result.content)
            raise Exception('{} to {} failed: {}'.format(
                method.upper(),
                url,
                result.content))

