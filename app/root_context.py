from app import app
from flask import send_from_directory
from flask import session, request
import os

DEFAULT_USER = os.getenv("DEFAULT_USER")
app.secret_key = app.config["root_context"].get('secret_key')


def validate_user():
    username = DEFAULT_USER if 'username' not in request.headers else request.headers['username']
    amino_user = None if 'aminoUser' not in session else session['aminoUser']

    if username is not amino_user or amino_user is None:
        session['amino_user'] = username
        session['amino_token'] = ''


@app.route('/')
def root():
    validate_user()
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('.', path)


