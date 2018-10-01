from app import app
from flask import send_from_directory
from flask import request, redirect
import requests

@app.route('/')
def root():
    # payload = {'username': 'elasticsearch', 'password': 'password'}
    # token = requests.post('http://amino3.vbox.keyw/amino-api/AminoUsers/login',payload).json()['id']
    # redirect_to_index = redirect('/index')
    # response = app.make_response(redirect_to_index)
    # response.set_cookie('aminoToken', value=token)
    # return response
    return app.send_static_file('index.html')

@app.route('/index')
def index():
    headers = request.headers
    return app.send_static_file('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('.', path)


