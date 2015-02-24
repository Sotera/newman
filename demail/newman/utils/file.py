# -*- coding: utf-8 -*-
import os
import shutil
from newman.utils.functions import counter 

def slurp(filePath):
    with open(filePath) as x: data = x.read()
    return data

# same as slurp but return Array of lines instead of string
def slurpA(filePath):
    with open(filePath) as x: data = x.read().splitlines()
    return data

def spit(filePath, data, overwrite=False):
    mode= 'w' if overwrite else 'a'
    with open(filePath, mode) as x: x.write(data)

def touch(filePath, times=None):
    with open(filePath, 'a'):
        os.utime(filePath, times)

def rm(filePath):
    if os.path.isfile(filePath):
        os.remove(filePath)

def rmrf(directory):
    ignore_errors = True
    shutil.rmtree(directory, ignore_errors)

def cp(src, dest):
    shutil.copyfile(src,dest)

def mv(src, dest):
    shutil.move(src,dest)

def mkdir(path):
    os.makedirs(path)

def mkdirp(path):
    if not os.path.exists(path):
        mkdir(path)

class RollingPartsFile(object):
    '''
    rolling file writer 
    writes file until a size limit
    '''
    def __init__(self, directory, filename, extension, limit_megabytes=10):
        self.directory = directory
        self.filename = filename
        self.extension = extension 
        self.counter = counter(0)
        self.current_file = ''
        self.limit_bytes = limit_megabytes*1024*1024

    def open(self):
        part = self.counter.next()
        self.current_file = "{}/{}.part_{}.{}".format(self.directory, self.filename, str(part).zfill(6), self.extension)
        self.f = open(self.current_file, 'a+b')

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, type, value, traceback):
        self.close()

    def close(self):
        self.f.close()
    
    #write returns a tuple of the Boolean/String (file path)
    #Boolean - indicates if a file was completed 
    #String  - if True - the file path of the completed file else
    # an empty string 
    def write(self,data):
        rtn=(False, '')
        if self.f.tell() > self.limit_bytes:
            self.close()
            rtn=(True, self.current_file)
            self.open()
        self.f.write(data)
        return rtn
