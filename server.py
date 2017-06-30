#!flask/bin/python
from app import app

# The app will spawn twice because of the reloader  set this to stop the behaviour
# ref. http://stackoverflow.com/questions/25504149/why-does-running-the-flask-dev-server-run-itself-twice
# app.run(port=5000, debug=True, host='0.0.0.0', use_reloader=False)

# start server and allow binding to local host
# app.run(host='127.0.0.1', port=5000, debug=True, use_evalex=False, use_reloader=False)

# start server and allow binding to any address
app.run(host='0.0.0.0', port=5000, debug=True, use_evalex=False, use_reloader=False)

