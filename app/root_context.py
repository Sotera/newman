from app import app
from flask import send_from_directory
from flask import session
import requests

app.secret_key = app.config["root_context"].get('newman_secret_key')

@app.route('/')
def root():
    # TODO: get this information from the Headers
    session['aminoUser'] = 'elasticsearch'
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('.', path)


