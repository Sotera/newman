#!flask/bin/python
from app import app

# The app will spawn twice because of the reloader  set this to stop the behaviour
# ref. http://stackoverflow.com/questions/25504149/why-does-running-the-flask-dev-server-run-itself-twice
# app.run(port=5000, debug=True, host='0.0.0.0', use_reloader=False)

app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=True)

