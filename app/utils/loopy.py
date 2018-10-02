from __future__ import print_function
import requests
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
        params = {}
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
                    params['request_cache'] = value
                if key is 'fielddata_fields':
                    params['fielddata_fields'] = value
                if key is 'fields':
                    params['fields'] = value
                if key is 'completion_fields':
                    params['completion_fields'] = value
                if key is 'size':
                    merged_body[key] = value
                if key is 'doc_type':
                    doc_type = value + '/'

                params['access_token'] = self.get_token()

        url = '{}{}{}{}'.format(self.query_url, index, doc_type, verb)
        if len(merged_body) == 0:
            merged_body = None

        result = requests.request(method, url, json=merged_body, params=params)
        if result.status_code == 200 or result.status_code == 201:
            return result if return_result else result.json()
        if result.status_code == 401:
            params['access_token'] = self.get_token(True)
            print("Access token error, attempting to refresh auth token and try again.")
            result = requests.request(method, url, json=merged_body, params=params)
        if not return_result and (result.status_code != 200 or result.status_code == 201):
            print(result.content)
            raise Exception('{} to {} failed: {}'.format(method.upper(), url, result.content))
        return result if return_result else result.json()

    def stats(self, **kwargs):
        index = ''
        verb = '_stats'
        if kwargs is not None:
            for key, value in kwargs.iteritems():
                if key is 'index' and value is not '_all':
                    index = value + '/'
        method = 'GET'
        url = '{}{}{}'.format(self.query_url, index, verb)

        result = requests.request(method, url, params={'access_token': self.get_token()})
        if result.status_code == 200:
            return result.json()
        if result.status_code == 401:
            print("Access token error, attempting to refresh auth token and try again.")
            result = requests.request(method, url, params={'access_token': self.get_token(True)})
        if result.status_code != 200:
            print(result.content)
            raise Exception('{} to {} failed: {}'.format(method.upper(), url, result.content))
        return result.json()

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
            return self.verb(kwargs, method='PUT')
        raise Exception('kwargs insufficient, exists requires index, doc_type, id and body')

    def get_token(self, force=False):
        if force or 'amino_token' not in session:
            payload = {'username': session['amino_user'], 'password': 'password'}
            session['amino_token'] = requests.post('{}{}'.format(self.base_url.strip().rstrip('/') +
                                                  '/', 'amino-api/AminoUsers/login'), payload).json()['id']
        return session['amino_token']

