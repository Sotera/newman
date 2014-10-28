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


def jsonGet(arraypath, j, default=None):
    if not j:
        return j 
    if not arraypath:
        return j
    else:
        return jsonGet(arraypath[1:], j.get(arraypath[0]), default) \
            if j.get(arraypath[0]) else default
