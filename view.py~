import os
import simplejson as json
import requests
from musicapi import *
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.heroku import Heroku
from flask import Flask, render_template, request, redirect, url_for
from flask_oauth import OAuth
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import facebook
from models import *

SECRET_KEY = 'sdvnfobinerpbiajbASUBOks'
DEBUG = True
FACEBOOK_APP_ID = '447399068676640'
FACEBOOK_APP_SECRET = 'c0db54e1c98cf390e618dbe88438f4bf'
graph = None
facebook_data = {'id': 57, 'first_name': 'Richard', 'last_name': 'Silverton'}

providers = ['SoundCloud', 'Spotify', 'YouTube']

NUMSONGS = 3
    
def db_connect(details):
    engine = create_engine(details)
    Session = sessionmaker(bind=engine)
    session = Session()
    return session
    
FBAUTH = True
app = Flask(__name__)
app.config.update(DEBUG = True)
app.secret_key = SECRET_KEY
sessiondata = {}

if 'HEROKU_RUN' in os.environ:
    print "Running on Heroku!"
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    db = SQLAlchemy(app)
    session = db.session
else:
    print "Running locally!"
    FACEBOOK_APP_ID = '442425319177351'
    FACEBOOK_APP_SECRET = '940524184c7cb0318dd7a6229275002e'
    db_connection = 'postgresql+psycopg2://samduguqeoqreu:9kluutG-6Y13MOAvROkWW5q9eY@ec2-54-225-84-29.compute-1.amazonaws.com/dffdsram87s8dl'
    session = db_connect(db_connection)

#oauth = OAuth()
#facebook = oauth.remote_app('facebook',
#   base_url='https://graph.facebook.com/',
#   request_token_url=None,
#   access_token_url='/oauth/access_token',
#   authorize_url='https://www.facebook.com/dialog/oauth',
#   consumer_key=FACEBOOK_APP_ID,
#   consumer_secret=FACEBOOK_APP_SECRET,
#   request_token_params={'scope': 'email'}
#   )

########## ACCESSIBLE URLS ##############

@app.route('/test')
def test():
    return "Test works"

@app.route('/',  methods=['GET', 'POST'])
def index():
    if FBAUTH:
        return render_template('topframe_loader.html', application_id=FACEBOOK_APP_ID, redirect_uri=url_for('facebook_loggedin', _external=True))
    else:
        return redirect(url_for('default'))

@app.route('/login',  methods=['GET', 'POST'])
def login():
    return facebook.authorize(callback=url_for('topframe_loader', url="https://apps.facebook.com/mytoptenapp"+url_for('facebook_loggedin',
        next=request.args.get('next') or request.referrer or None, _external=False)))

@app.route('/topframe_loader/<path:url>', methods=['GET', 'POST'])
def topframe_loader(url):
    return render_template('topframe_loader.html', url=url)

@app.route('/facebook_loggedin')
def facebook_loggedin():
    if request.args.get('error_reason'):
        return request.args.get('error_description')
    elif request.args.get('code'):
        paramlist = {'client_id': FACEBOOK_APP_ID, 'redirect_uri': url_for('facebook_loggedin', _external=True),  
              'client_secret': FACEBOOK_APP_SECRET, 'code': request.args['code']}
        rawtoken = requests.get('https://graph.facebook.com/oauth/access_token', params=paramlist).text
        return "Kind of logged in, ish."
        token = {}
        for dat in rawtoken:
            decompose = dat.split["="]
            token[decompose[0]] = decompose[1]
        print "The returned token is " + token['access_token'] + ". This expires at UNIX time " + token['expires'] + "."
        checkparams = {'input_token': token['access_token'], 'access_token': '447399068676640|zI9xAUR31ZFb16J6Yaawlr9lKQs'}
        ###  ADD TOKEN CHECKER HERE FOR SECURITY ###
        sessiondata['token'] = token['access_token']
        graph = facebook.GraphAPI(user["access_token"])
        facebook_data = graph.get_object("me")
        return redirect(url_for('default'))
    else:
        return "You should not be here!"
    
#@app.route('/facebook_token_received')
#def facebook_token_received():
#    return str(request.args)

#@app.route('/login/authorized',  methods=['GET', 'POST'])
#@facebook.authorized_handler
#def facebook_authorized(resp):
#    if resp is None:
#        return 'Access denied: reason=%s error=%s' % (
#            request.args['error_reason'],
#            request.args['error_description']
#        )
#    sessiondata['oauth_token'] = (resp['access_token'], '')
#    user = facebook.get('/me')
#    facebook_data['id'] = user.data['id']
#    facebook_data['first_name'] = user.data['first_name']
#    facebook_data['last_name'] = user.data['last_name']     
#    return redirect(url_for('default'))

def get_facebook_oauth_token():
    return sessiondata.get('token')

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
