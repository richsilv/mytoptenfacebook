import os
import simplejson as json
from musicapi import *
from flask import Flask, render_template, request, redirect, url_for
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

NUMSONGS = 3
    
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

########## ACCESSIBLE URLS ##############

@app.route('/')
def default():
    if FBAUTH:
        fbdata = 0#put something here
    else:
        fbdata = facebook_data
    user = session.query(TopTenUser).filter(TopTenUser.facebook_id == fbdata['id']).first()
    if not user: user = createUser(fbdata)
    topten = session.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == user.facebook_id).filter(TopTen.active == True).first()
    if not topten: topten = createTopTen(fbdata)
    songlist = session.query(Song).join(TopTen).filter(Song.topten_id == topten.topten_id)
    if (songlist.count() < NUMSONGS):
        return redirect(url_for('makeSongs', facebook_id=user.facebook_id))
    else:
        return redirect(url_for('showSongs', facebook_id=user.facebook_id))
    return 'Hello World!'

@app.route('/make_songs/<int:facebook_id>')
def makeSongs(facebook_id):
    topten = session.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = session.query(Song).join(TopTen).filter(Song.topten_id == topten.topten_id).all()
    if len(songlist) < NUMSONGS:
        existing_ten = False
    else:
        existing_ten = True
    return render_template('accordionbase.html', songlist=songlist, providers=providers, facebook_id=facebook_id, topten_id=topten.topten_id, existing_ten=existing_ten)

@app.route('/show_songs/<int:facebook_id>')
def showSongs(facebook_id):
    topten = session.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = session.query(Song).join(TopTen).filter(Song.topten_id == topten.topten_id).all()  
    return render_template('showbase.html', songlist=songlist)

########### AJAX REQUESTS #############

@app.route('/get_selector/', methods=['POST'])
def get_selector():
    rdata = request.form
    searchfunction = [None, soundcloud_request, spotify_request, youtube_request][int(rdata['provider'])]
    optionset = searchfunction(rdata['songtitle'], rdata['songartist'])
    return render_template('songselector.html', provider=rdata['provider'], optionset=optionset)
    
@app.route('/get_confirm/', methods=['POST'])
def get_confirm():
    rdata = request.form
    provider=providers[int(rdata['provider'])-1]
    return render_template('songconfirm.html', title=rdata['songtitle'], artist=rdata['songartist'], provider=provider, songprov=rdata['provider'], tag=rdata['songtag'])
    
@app.route('/new_panel/', methods=['POST'])
def new_panel():
    rdata = request.form
    return render_template('newpanel.html', songnum=int(rdata['newsong']), providers=providers)

@app.route('/save_songs/', methods=['POST'])
def save_songs():
    rdata = json.loads(request.form['songlist'])
    topten = session.query(TopTen).filter(TopTen.topten_id == request.form['topten_id']).first()
    for song in rdata:
        songinstance = saveSong(song)
        topten.songs.append(songinstance)
        session.commit()
    return 'hi'

############# UTILITIES ##################

def createUser(fbdata):
    newuser = TopTenUser(fbdata['id'], fbdata['first_name'], fbdata['last_name'])
    session.add(newuser)
    session.commit()
    return newuser
    
def createTopTen(fbdata):
    newtopten = TopTen(fbdata['id'])
    session.add(newtopten)
    session.commit()
    return newtopten

def saveSong(song):
    songsearch = session.query(Song).filter(Song.title == song[0]).filter(Song.artist == song[1]).filter(Song.reason == song[2]).first()
    if songsearch:
        return songsearch
    else:
        newsong = Song(*song)
        session.add(newsong)
        session.commit()
        return newsong
