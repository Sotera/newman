# -*- coding: utf-8 -*-

'''
functions
'''
def identity(x): return x

def noop(*args, **kwargs): pass

def head(arr):
    return arr[0]

def empty(arr):
    return not arr

def rest(arr):
    return arr[1:]

def subList(array, start_index, end_index):
    if array:
        return array[start_index:end_index]
    else:
        return None
    
    
def last(arr):
    l = arr[-1:]
    if l:
        return l[0]
    else:
        return None

def nth(arr, i, out_of_range=None):
    if len(arr) > i:
        return arr[i]
    return out_of_range

def juxt(*funs):
    ''' juxtaposition '''
    return lambda *args: [fn(*args) for fn in funs]

def inc(n):
    return n+1

def dec(n):
    return n-1

def utf8(sz):
    return sz.encode('utf-8')

def partition(l, n):
    """ 
    Yield successive n-sized partitions from l.
    >>> partition(range(1,10),2)
    [[1, 2], [3, 4], [5, 6], [7, 8], [9]]
    """
    def _part():
        for i in xrange(0, len(l), n):
            yield l[i:i+n]
    #I prefer it to be a list instead of generator
    return [i for i in _part()]

def counter(start=0):
    n = start
    while True:
        yield n
        n = inc(n)

def lower(s):
   return s.lower() if s else ''

# passing 1 argument returns substring to the end 
# passing 2 arguments returns the substring from arguments
def substr(sz, *args):
    if not sz:
        return ''
    if len(args) == 1:
        return sz[nth(args, 0):]
    return sz[nth(args, 0): nth(args, 1)]

# insert a string at an index in another string
def insert_at(sz, sz_insert, idx):
    return "{}{}{}".format(substr(sz, 0, idx), sz_insert, substr(sz, idx))

def jsonGet(arraypath, j, default=None):
    if not j:
        return j 
    if not arraypath:
        return j
    else:
        return jsonGet(arraypath[1:], j.get(arraypath[0]), default) \
            if j.get(arraypath[0]) else default
