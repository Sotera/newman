#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import socket

#sys.path.append("./demail")

class TikaClient(object):
    def __init__(self, host='localhost', port=9999):
        self.host=host
        self.port=port
        self.sock=None

    def open(self):
        pass

    # input fully qualified local file path
    # returns (successful?:Boolean, data:String)
    def send(self, file_path):
        try:
            self.sock= socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((self.host, self.port))
            self.sock.sendall(file_path + "\n")
            data = []
            rtn = self.sock.recv(1)
            if rtn == 0:
                #Log some error
                print "Failed {}".format(file_path)
                return (False, "")
            while 1:
                rcv = self.sock.recv(8192)
                #received end of stream byte \x00
                if rcv.endswith("\x00"):
                    data.append(rcv[:-1])
                    break
                data.append(rcv)
            return (True, "".join(data))
        finally:
            print file_path
            self.sock.close()

    def close(self):
        pass

    def __enter__(self):
        #self.open()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()


