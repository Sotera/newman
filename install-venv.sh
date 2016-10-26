#!/usr/bin/env bash

#Install virtualenv
sudo apt-get -y install python-virtualenv

#create a venv for flask
virtualenv flask

#Dependencies for Flask
flask/bin/pip install flask
flask/bin/pip install flask-login
flask/bin/pip install flask-openid
flask/bin/pip install flask-mail
flask/bin/pip install flask-sqlalchemy
flask/bin/pip install sqlalchemy-migrate
flask/bin/pip install flask-whooshalchemy
flask/bin/pip install flask-wtf
flask/bin/pip install flask-babel
flask/bin/pip install guess_language
flask/bin/pip install flipflop
flask/bin/pip install coverage

#Dependencies for Newman  app
flask/bin/pip install elasticsearch==2.4.0
flask/bin/pip install beautifulsoup4
flask/bin/pip install python-dateutil

#Supervisor application which will be used to manage newman process
flask/bin/pip install supervisor
