from app import app
from flask import request, send_from_directory

@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('js', path)


