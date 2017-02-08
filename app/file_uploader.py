from app import app
from flask import request, jsonify, flash, redirect, url_for
from werkzeug.exceptions import BadRequest
from werkzeug.utils import secure_filename

import datetime
import os

ALLOWED_EXTENSIONS = set(['zip', 'tgz', 'gz'])

def fmtNow():
    return datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload/', methods=['GET', 'POST'])
def upload_file():
    # if POST  multipart form with file upload
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({"status"  : "Failed", "Message" : "No file part."})
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status"  : "Failed", "Message" : "No selected file."})
        if not allowed_file(file.filename):
            return jsonify({"status" : "Failed", "Message" : "File type not accepted - must be of type: " + ", ".join(ALLOWED_EXTENSIONS)})
        if file:
            filename = secure_filename(file.filename)
            filename  = "{}_{}".format(fmtNow(), filename)
            file.save(os.path.join(app.config['upload_dir'], filename))
            return jsonify({"status" : "Success", "Message" : "Upload complete."})
    #     if   GET   return simple html form
    return '''
    <!doctype html>
    <title>Upload a File</title>
    <h1>Upload a File</h1>
    <form method=post enctype=multipart/form-data>
      <p><input type=file name=file>
         <input type=submit value=Upload>
    </form>
    '''