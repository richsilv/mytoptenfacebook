import os
from musicapi import *
from flask import Flask, render_template, request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import *

songlist = [{'title': 'Loneliness of a Tower Crane Driver', 'artist': 'Elbow', 'reason': 'A brilliant use of an orchestra'},
            {'title': 'Bloodbuzz Ohio', 'artist': 'The National', 'reason': "The best song about Ohio I can remember"},
            {'title': 'Where is My Mind?', 'artist': 'The Pixies'},
            {'title': 'Sweet Dreams', 'artist': 'The Eurythmics'},
            {'title': 'Today', 'artist': 'The Smashing Pumpkins'},
            ]

providers = ['SoundCloud', 'Spotify', 'YouTube']
    
def db_connect(details):
    engine = create_engine(details)
    Session = sessionmaker(bind=engine)
    session = Session()
    return session
    
FBAUTH = False
facebook_data = {'id': 57, 'first_name': 'Richard', 'last_name': 'Silverton'}
    
db_connection = 'postgresql+psycopg2://samduguqeoqreu:9kluutG-6Y13MOAvROkWW5q9eY@ec2-54-225-84-29.compute-1.amazonaws.com/dffdsram87s8dl'
session = db_connect(db_connection)

app = Flask(__name__)
app.debug=True
app.config.from_pyfile('config.py')

#####################################

@app.route('/')
def default():
    if FBAUTH:
        fbdata = #put something here#0
    else:
        fbdata = facebook_data
    user = session.query(TopTenUser).filter(TopTenUser.facebook_id == fbdata['id']).first()
    if not user: user = createUser(fbdata)
    return 'Hello World!'

@app.route('/make_songs/')
def test():
    return render_template('accordionbase.html', songlist=songlist, providers=providers)
    
@app.route('/get_selector/', methods=['POST', 'GET'])
def get_selector():
    rdata = request.form
    searchfunction = [None, soundcloud_request, spotify_request, youtube_request][int(rdata['provider'])]
    optionset = searchfunction(rdata['songtitle'], rdata['songartist'])
    return render_template('songselector.html', provider=rdata['provider'], optionset=optionset)
    
@app.route('/get_confirm/', methods=['POST', 'GET'])
def get_confirm():
    rdata = request.form
    provider=providers[int(rdata['provider'])-1]
    return render_template('songconfirm.html', title=rdata['songtitle'], artist=rdata['songartist'], provider=provider, songprov=rdata['provider'], tag=rdata['songtag'])
    
@app.route('/new_panel/', methods=['POST', 'GET'])
def new_panel():
    rdata = request.form
    return render_template('newpanel.html', songnum=int(rdata['newsong']), providers=providers)

##############################

def createUser(fbdata):
    newuser = TopTenUser(fbdata['id'], fbdata['first_name'], fbdata['last_name'])
    session.add(newuser)
    session.commit()
    return newuser
