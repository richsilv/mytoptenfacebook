import os
import simplejson as json
from musicapi import *
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.heroku import Heroku
from flask import Flask, render_template, request, redirect, url_for
from flask_oauth import OAuth
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import *

SECRET_KEY = 'sdvnfobinerpbiajbASUBOks'
DEBUG = True
FACEBOOK_APP_ID = '442425319177351'
FACEBOOK_APP_SECRET = '940524184c7cb0318dd7a6229275002e'

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
    
FBAUTH = True
facebook_data = {'id': 57, 'first_name': 'Richard', 'last_name': 'Silverton'}
app = Flask(__name__)
app.config.update(DEBUG = True)
#if FBAUTH: app.config.update(SERVER_NAME = "https://apps.facebook.com/mytopten",)
app.secret_key = SECRET_KEY
sessiondata = {}

if 'HEROKU_RUN' in os.environ:
    print "Running on Heroku!"
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    db = SQLAlchemy(app)
    session = db.session
else:
    print "Running locally!"
    db_connection = 'postgresql+psycopg2://samduguqeoqreu:9kluutG-6Y13MOAvROkWW5q9eY@ec2-54-225-84-29.compute-1.amazonaws.com/dffdsram87s8dl'
    session = db_connect(db_connection)

oauth = OAuth()
facebook = oauth.remote_app('facebook',
   base_url='https://graph.facebook.com/',
   request_token_url=None,
   access_token_url='/oauth/access_token',
   authorize_url='https://www.facebook.com/dialog/oauth',
   consumer_key=FACEBOOK_APP_ID,
   consumer_secret=FACEBOOK_APP_SECRET,
   request_token_params={'scope': 'email'}
   )

########## ACCESSIBLE URLS ##############

@app.route('/test')
def test():
    return "Test works"

@app.route('/',  methods=['GET', 'POST'])
def index():
    if FBAUTH:
        return redirect(url_for('login'))
    else:
        return redirect(url_for('default'))

@app.route('/login',  methods=['GET', 'POST'])
def login():
    return "hi"
    return facebook.authorize(callback="https://apps.facebook.com/mytoptenapp" + url_for('facebook_authorized',
        next=request.args.get('next') or request.referrer or None, _external=False))

@app.route('/login/authorized',  methods=['GET', 'POST'])
@facebook.authorized_handler
def facebook_authorized(resp):
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    sessiondata['oauth_token'] = (resp['access_token'], '')
    user = facebook.get('/me')
    facebook_data['id'] = user.data['id']
    facebook_data['first_name'] = user.data['first_name']
    facebook_data['last_name'] = user.data['last_name']     
    return redirect(url_for('default'))

@facebook.tokengetter
def get_facebook_oauth_token():
    return sessiondata.get('oauth_token')

@app.route('/default',  methods=['GET', 'POST'])
def default():
    fbdata = facebook_data
    user = session.query(TopTenUser).filter(TopTenUser.facebook_id == fbdata['id']).first()
    if not user: user = createUser(fbdata)
    topten = session.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == user.facebook_id).filter(TopTen.active == True).first()
    if not topten: topten = createTopTen(fbdata)
    songlist = topten.songs
    if (len(songlist) < NUMSONGS):
        return redirect(url_for('makeSongs', facebook_id=user.facebook_id))
    else:
        return redirect(url_for('showSongs', facebook_id=user.facebook_id))
    return 'Hello World!'

@app.route('/make_songs/<int:facebook_id>',  methods=['GET', 'POST'])
def makeSongs(facebook_id):
    topten = session.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = topten.songs
    if len(songlist) < NUMSONGS:
        existing_ten = False
    else:
        existing_ten = topten.topten_id
    return render_template('accordionbase.html', songlist=songlist, providers=providers, facebook_id=facebook_id, topten_id=topten.topten_id, existing_ten=existing_ten)

@app.route('/show_songs/<int:facebook_id>',  methods=['GET', 'POST'])
def showSongs(facebook_id):
    topten = session.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = topten.songs  
    return render_template('showbase.html', songlist=songlist, facebook_id=facebook_id, topten_id=topten.topten_id)

########### AJAX REQUESTS #############

@app.route('/get_selector/', methods=['POST'])
def get_selector():
    rdata = request.form
    provider = int(rdata['provider'])
    searchfunction = [None, soundcloud_request, spotify_request, youtube_request][provider]
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
    oldtopten = session.query(TopTen).filter(TopTen.topten_id == request.form['topten_id']).first()
    oldtopten.active = False
    topten = createTopTen({'id': request.form['facebook_id']})
    for song in rdata:
        songinstance = saveSong(song)
        topten.songs.append(songinstance)
    session.commit()
    return 'success'


@app.errorhandler(404)
def page_not_found(e):
    return "Problem: " + str(e.description) + str(e.args) + str(dir(e)), 404

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
