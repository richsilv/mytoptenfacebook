import os
import simplejson as json
import requests
from musicapi import *
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.heroku import Heroku
from flask import Flask, render_template, request, redirect, url_for, session
from simplekv.memory import DictStore
from flaskext.kvsession import KVSessionExtension
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from user_agents import parse
import facebook
from models import *
from datetime import datetime
from random import shuffle

SECRET_KEY = 'sdvnfobinerpbiajbASUBOks'
DEBUG = True
FACEBOOK_APP_ID = '447399068676640'
FACEBOOK_APP_SECRET = 'c0db54e1c98cf390e618dbe88438f4bf'
FACEBOOK_TEMP_TOKEN = 'CAAGW6DaPsiABALH4cWrZBCy5h2vXsXauOwLaCKVYGn3GZC5vHh0JR6KVpgEYAc7WGdTYnfiHPakqEupml2LTIlm8g3qybb7eEVH5DuoKSf0ZBOyELVQQIlM2DndVG84CIA8EJ5RJDkDmVobWlioN1Kd7bkJtH4ZD'
graph = None

providers = ['SoundCloud', 'Spotify', 'YouTube', "Vimeo", "Hype Machine"]

NUMSONGS = 10

SPLITSTRINGS = (" - ", " | ", " -", " |", "- ", "| ", "-", "|")
BANNED_CHARS = (34, 38, 47, 60, 62, 92)
    
def db_connect(details):
    engine = create_engine(details)
    Session = sessionmaker(bind=engine)
    pg = Session()
    return pg

store = DictStore()    
app = Flask(__name__)
KVSessionExtension(store, app)
app.config.update(DEBUG = DEBUG)
app.secret_key = SECRET_KEY

if 'HEROKU_RUN' in os.environ:
    print "Running on Heroku!"
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    db = SQLAlchemy(app)
    pg = db.session
    FBAUTH = True
else:
    print "Running locally!"
    FACEBOOK_APP_ID = '442425319177351'
    FACEBOOK_APP_SECRET = '940524184c7cb0318dd7a6229275002e'
    db_connection = 'postgresql+psycopg2://samduguqeoqreu:9kluutG-6Y13MOAvROkWW5q9eY@ec2-54-225-84-29.compute-1.amazonaws.com/dffdsram87s8dl'
    pg = db_connect(db_connection)
    FBAUTH = False

########## ACCESSIBLE URLS ##############

@app.route('/',  methods=['GET', 'POST'])
def index():
    if FBAUTH:
        return render_template('topframe_loader.html', application_id=FACEBOOK_APP_ID, redirect_uri=url_for('facebook_loggedin', _external=True))
    else:
        session['userdata'] = {'id': '61', 'first_name': 'Richard', 'last_name': 'Silverton', 'gender': 'male'}
        session['token'] = FACEBOOK_TEMP_TOKEN
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
        rawtoken = requests.get('https://graph.facebook.com/oauth/access_token', params=paramlist).text.split("&")
        token = {}
        for dat in rawtoken:
            decompose = dat.split("=")
            token[decompose[0]] = decompose[1]
        checkparams = {'input_token': token['access_token'], 'access_token': '447399068676640|zI9xAUR31ZFb16J6Yaawlr9lKQs'}
        r = requests.get("https://graph.facebook.com/debug_token", params=checkparams).json()['data']
        if FBAUTH: session['token'] = token['access_token']
        session['userdata'] = facebook.GraphAPI(token["access_token"]).get_object("me")
        if int(r['user_id']) != int(session['userdata']['id']) or int(r['app_id']) != int(FACEBOOK_APP_ID):
            return render_template('csrf_problem.html')
        return redirect("https://apps.facebook.com/mytoptenapp"+url_for('default', _external=False))
    else:
        return str(request.args)

@app.route('/default',  methods=['GET', 'POST'])
def default():
    user_agent_string = request.user_agent.string
    user_agent = parse(user_agent_string)
    if user_agent.is_bot:
        return "Bot query"
    if not session.get('userdata'):
        return redirect("https://apps.facebook.com/mytoptenapp"+url_for('index', _external=False))
    fbdata = session['userdata']
    fb = facebook.GraphAPI(session['token'])
    new_user = False
    user = pg.query(TopTenUser).filter(TopTenUser.facebook_id == str(fbdata['id'])).first()
    if not user: 
        user = createUser(fbdata)
        new_user = True
    user.last_login = datetime.now()
    pg.commit()
    topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == user.facebook_id).filter(TopTen.active == True).first()
    if not topten:
        topten   = createTopTen(fbdata)
    songlist = topten.songs
    if (len(songlist) < NUMSONGS):
        if user_agent.is_mobile:
            return redirect(url_for('makeSongsMob', facebook_id=user.facebook_id, new_user=new_user))
        else:
            return redirect(url_for('makeSongs', facebook_id=user.facebook_id, new_user=new_user))            
    else:
        if user_agent.is_mobile:
            return redirect(url_for('showSongsMob', facebook_id=user.facebook_id))
        else:    
            return redirect(url_for('showSongs', facebook_id=user.facebook_id))
    return 'Hello World!'

@app.route('/make_songs/<string:facebook_id>/<new_user>',  methods=['GET', 'POST'])
def makeSongs(facebook_id, new_user=False):
    if not session.get('userdata'): return redirect(url_for('index'))
    if session['userdata']['id'] != facebook_id: return redirect(url_for('showSongs', facebook_id=session['userdata']['id']))
    topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = sorted(topten.songs, key=lambda x: x.num)
    if len(songlist) < NUMSONGS:
        existing_ten = False
    else:
        existing_ten = topten.topten_id
    return render_template('editsongsdesk.html', songlist=songlist, providers=providers, facebook_id=facebook_id, topten_id=topten.topten_id, existing_ten=existing_ten, new_user=new_user)

@app.route('/show_songs/<string:facebook_id>',  methods=['GET', 'POST'])
def showSongs(facebook_id):
    if not session.get('userdata'): return redirect(url_for('index'))
    if facebook_id != session['userdata']['id'] and not friendCheck(session['userdata'], facebook_id): return redirect(url_for('friendList', facebook_id=session['userdata']['id']))
    if facebook_id.find("?") > -1: facebook_id = facebook_id[:facebook_id.find("?")]
    owner = pg.query(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).first()
    if not owner:
        return redirect(url_for('showSongs', facebook_id=session['userdata']['id']))
    ownername = owner.first_name + " " + owner.last_name
    topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = sorted(topten.songs, key=lambda x: x.num)
    return render_template('showsongsdesk.html', songlist=songlist, facebook_id=facebook_id, topten_id=topten.topten_id, userdata=session['userdata'], ownername=ownername)

@app.route('/friends_list/<string:facebook_id>', methods=['GET', 'POST'])
def friendList(facebook_id):
    if not session.get('userdata'): return redirect(url_for('index'))
    fb = facebook.GraphAPI(session['token'])    
    allfriends = [x['id'] for x in fb.get_connections("me", "friends")['data']]
    friendusers = pg.query(TopTenUser).filter(TopTenUser.facebook_id.in_(allfriends)).all()
    return render_template('showfriendsdesk.html', friends=friendusers, userdata=session['userdata'])

@app.route('/jukebox/<string:facebook_id>', methods=['GET', 'POST'])
def jukeBox(facebook_id):
    if not FBAUTH:
        songlist = [{'title': "September Song", 'artist': "Hosts", 'reason': "Yorkshire.", 'url': "40995778", 'provider': "4", 'owner': "Craig Shakespeare"}, 
                {'title': "Couleurs", 'artist': "M83", 'reason': "The best thing at the Somerset House gig.", 'url': "WtUWsVNJHdc", 'provider': "3", 'owner': "Alan Tankard"},
                {'title': "Hey", 'artist': "Pixies", 'reason': "Another one of my faves.", 'url': "http://www.electricadolescence.com/audio/pixies%20-%20hey.mp3", 'provider': "5", 'owner': "Craig Shakespeare"}]
        return render_template('jukebase.html', songlist=songlist, userdata=session['userdata'])        
    if not session.get('userdata'): return redirect(url_for('index'))
    fb = facebook.GraphAPI(session['token'])  
    allfriends = [x['id'] for x in fb.get_connections("me", "friends")['data']]
    friendusers = pg.query(TopTenUser).filter(TopTenUser.facebook_id.in_(allfriends)).all()
    songlist = []
    for friend in friendusers:
        topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == friend.facebook_id).filter(TopTen.active == True).first()
        for song in topten.songs:
            if song.provider != 2:
                songlist.append({'title': song.title, 'artist': song.artist, 'reason': song.reason, 'url': song.url, 'provider': song.provider, 'owner': friend.first_name + " " + friend.last_name})
    shuffle(songlist)    
    return render_template('jukeboxdesk.html', songlist=songlist, userdata=session['userdata'])

########### MOBILE PAGES ##############

@app.route('/mobile',  methods=['GET', 'POST'])
def mobile():
    fbdata = session['userdata']
    fb = facebook.GraphAPI(session['token'])
    new_user = False
    user = pg.query(TopTenUser).filter(TopTenUser.facebook_id == str(fbdata['id'])).first()
    if not user: 
        user = createUser(fbdata)
        new_user = True
    topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == user.facebook_id).filter(TopTen.active == True).first()
    if not topten:
        topten = createTopTen(fbdata)
    songlist = sorted(topten.songs, key=lambda x: x.num)
    if (len(songlist) < NUMSONGS):
        return redirect(url_for('makeSongs', facebook_id=user.facebook_id, new_user=new_user))
    else:
        return redirect(url_for('showSongs', facebook_id=user.facebook_id))
    return 'Hello World!'

@app.route('/make_songs_mob/<string:facebook_id>/<new_user>',  methods=['GET', 'POST'])
def makeSongsMob(facebook_id, new_user=False):
    if not session.get('userdata'): return redirect(url_for('index'))
    if session['userdata']['id'] != facebook_id: return redirect(url_for('showSongsMob', facebook_id=session['userdata']['id']))
    topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = sorted(topten.songs, key=lambda x: x.num)
    if len(songlist) < NUMSONGS:
        existing_ten = False
    else:
        existing_ten = topten.topten_id
    return render_template('editsongsmob.html', songlist=songlist, providers=providers, facebook_id=facebook_id, topten_id=topten.topten_id, existing_ten=existing_ten, new_user=new_user)

@app.route('/show_songs_mob/<string:facebook_id>',  methods=['GET', 'POST'])
def showSongsMob(facebook_id):
    if not session.get('userdata'): return redirect(url_for('index'))
    if facebook_id != session['userdata']['id'] and not friendCheck(session['userdata'], facebook_id): return redirect(url_for('friendListMob', facebook_id=session['userdata']['id']))
    if facebook_id.find("?") > -1: facebook_id = facebook_id[:facebook_id.find("?")]
    owner = pg.query(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).first()
    if not owner:
        return redirect(url_for('showSongsMob', facebook_id=session['userdata']['id']))
    ownername = owner.first_name + " " + owner.last_name
    topten = pg.query(TopTen).join(TopTenUser).filter(TopTenUser.facebook_id == facebook_id).filter(TopTen.active == True).first()
    songlist = sorted(topten.songs, key=lambda x: x.num)
    return render_template('showsongsmob.html', songlist=songlist, facebook_id=facebook_id, topten_id=topten.topten_id, userdata=session['userdata'], ownername=ownername)

@app.route('/friends_list_mob/<string:facebook_id>', methods=['GET', 'POST'])
def friendListMob(facebook_id):
    if not session.get('userdata'): return redirect(url_for('index'))
    fb = facebook.GraphAPI(session['token'])    
    allfriends = [x['id'] for x in fb.get_connections("me", "friends")['data']]
    friendusers = pg.query(TopTenUser).filter(TopTenUser.facebook_id.in_(allfriends)).all()
    return render_template('showfriendsmob.html', friends=friendusers, userdata=session['userdata'])
    
########### AJAX REQUESTS #############

@app.route('/channel', methods=['POST', 'GET'])
def channel():
    return render_template('channel.html')

@app.route('/get_selector/', methods=['POST', 'GET'])
def get_selector():
    rdata = request.form
    provider = int(rdata['provider'])
    searchfunction = [None, soundcloud_request, spotify_request, youtube_request, vimeo_request, hypem_request, deezer_request][provider]
    optionset = searchfunction(removeNonAscii(rdata['songtitle']), removeNonAscii(rdata['songartist']))
    if provider in [1, 3, 4, 5]:
        for option in optionset:
            if option['title'].find (" by ") > 0:
                option['title'], option['artist'] = [x.title() for x in option['title'].split(" by ", 1)]
            else:
                for s in SPLITSTRINGS:
                    if option['title'].find(s) > 0:
                        option['artist'], option['title'] = [x.title() for x in option['title'].split(s, 1)]
                        break
            if option['artist']: option['artist'] = option['artist'].replace('"','').title()
            if option['title']: option['title'] = option['title'].replace('"','').title()
    return render_template('songselector.html', provider=rdata['provider'], optionset=optionset)

@app.route('/get_suggestions/', methods=['POST'])
def get_suggestions():
    rdata = request.form
    songnum = rdata['songnum']
    suggestions = session['suggestions']
    return render_template('suggestions.html', suggestions=suggestions, songnum=songnum)
    
@app.route('/get_confirm/', methods=['POST'])
def get_confirm():
    rdata = request.form
    provider=providers[int(rdata['provider'])-1]
    title = rdata['songtitle']
    artist = rdata['songartist']
    for c in BANNED_CHARS:
        title = title.replace(chr(c), "")
        artist = artist.replace(chr(c), "")
    return render_template('songconfirm.html', title=title, artist=artist, provider=provider, songprov=rdata['provider'], tag=rdata['songtag'])
    
@app.route('/new_panel/', methods=['POST'])
def new_panel():
    rdata = request.form
    return render_template('newpanel.html', songnum=int(rdata['newsong']), providers=providers)

@app.route('/new_panel_mob/', methods=['POST'])
def new_panel_mob():
    rdata = request.form
    return render_template('newpanelmob.html', songnum=int(rdata['newsong']), providers=providers)

@app.route('/save_songs/', methods=['POST'])
def save_songs():
    rdata = json.loads(request.form['songlist'])
    oldtoptens = pg.query(TopTen).filter(TopTen.facebook_id==session['userdata']['id']).filter(TopTen.active==True)
    for old in oldtoptens:
        old.active = False
    topten = createTopTen({'id': request.form['facebook_id']})
    for i, song in enumerate(rdata):
        songinstance = saveSong(song, i+1)
        topten.songs.append(songinstance)
    pg.commit()
    if FBAUTH:
        fb = facebook.GraphAPI(session['token'])
        possessive = getPossessive(session['userdata'])
        try:
            fb.put_wall_post(session['userdata']['first_name'] + " " + session['userdata']['last_name'] + " just updated " + possessive + " list on My Top Ten!  Check it out and build your own at http://apps.facebook.com/mytoptenapp.")
        except:
            pass    
    return 'success'

@app.route('/load_suggestions/', methods=['POST'])
def load_suggestions():
    session['suggestions'] = topSuggestions(session['token'])
    return 'success'

@app.route('/remove_suggestion/', methods=['POST'])
def remove_suggestion():
    session['suggestions'].remove({'title': request.form['songtitle'], 'artist': request.form['songartist']})
    return 'success'

@app.route('/post_comment/', methods=['POST'])
def post_comment():
    fb = facebook.GraphAPI(session['token'])
    possessive = getPossessive(session['userdata'])
    owner = fb.get_object(request.form['owner'])  
    comment = request.form['comment']
    if len(comment) > 50:
        comment = comment[:comment.rfind(" ", 0, 50)] + "..."
    fb.put_wall_post(session['userdata']['first_name'] + " " + session['userdata']['last_name'] + " just commented on  " + owner['first_name'] + " " + owner['last_name'] + "'s list on My Top Ten: \"" + comment + """"" http://apps.facebook.com/mytoptenapp""")    
    fb.put_object(request.form['owner'], "notifications", template=session['userdata']['first_name']+" "+session['userdata']['last_name']+" just commented on your list on My Top Ten!", href="/show_songs/"+request.form['owner'])
    return 'success'

@app.errorhandler(404)
def page_not_found(e):
    return "Problem: " + str(e.description) + str(e.args) + str(dir(e)), 404

############# UTILITIES ##################

def friendCheck(fbdata, friend):
    fb = facebook.GraphAPI(session['token'])    
    allfriends = [x['id'] for x in fb.get_connections("me", "friends")['data']]
    return friend in allfriends    

def createUser(fbdata):
    newuser = TopTenUser(str(fbdata['id']), fbdata['first_name'], fbdata['last_name'])
    pg.add(newuser)
    pg.commit()
    return newuser
    
def createTopTen(fbdata):
    newtopten = TopTen(str(fbdata['id']))
    pg.add(newtopten)
    pg.commit()
    return newtopten

def saveSong(song, num):
    songsearch = pg.query(Song).filter(Song.title == song[0]).filter(Song.artist == song[1]).filter(Song.reason == song[2]).filter(Song.url == song[3]).filter(Song.num == num).first()
    if songsearch:
        return songsearch
    else:
        newsong = Song(num, *song)
        pg.add(newsong)
        pg.commit()
        return newsong

def getPossessive(data):
    if data.get('gender') == "male":
        return "his"
    elif data.get('gender') == "female":
        return "her"
    else:
        return "its"

def topSuggestions(access_token):
    suggestions = getOpenGraphRecommendations(access_token)
    suggestions += suggestions[:5] + getFacebookRecommendations(access_token) + suggestions[5:]
    suggestions += getBBCPlayed()
    return suggestions

def getFacebookRecommendations(access_token, facebook_id = "me"):
    try:
        fb = facebook.GraphAPI(access_token)
        artists = [x['name'] for x in fb.get_object(facebook_id + "/music")['data'] if x['category'] == "Musician/band"][:10]
    except:
        print "Doesn't like " + access_token
        return []
    suggestions = getSuggestions(artists)
    return suggestions

def getOpenGraphRecommendations(access_token, facebook_id = "me"):
    r = requests.get('https://graph.facebook.com/' + facebook_id + '/music.listens?access_token=' + access_token + '&limit=500')
    if r.status_code != 200: return []
    suggestions = []
    urls = [x['data']['song']['url'] for x in r.json()['data']]
    urllist = sorted(set([(x, urls.count(x)) for x in urls]), key = lambda y: -y[1])[:10]
    for entry in urllist:
        url = entry[0]
        spotifyid = url[url.find("/track/")+7:]
        spotifydata = requests.get("http://ws.spotify.com/lookup/1/.json?uri=spotify:track:" + spotifyid).json()['track']
        suggestions.append({'title': spotifydata['name'], 'artist': spotifydata['artists'][0]['name']})
    return suggestions      

def getBBCPlayed():
    r = requests.get("http://www.bbc.co.uk/programmes/music/artists/charts.json").json()['artists_chart']['artists']
    artists = [x['name'] for x in r][:10]
    suggestions = getSuggestions(artists)
    return suggestions

def getSuggestions(artists):
    suggestions = [{'title': x['title'], 'artist': x['artist']} for x in [(spotify_request("", y)[:1] or [None])[0] for y in artists] if x]
    return suggestions
    
def get_facebook_oauth_token():
    return session.get('token')

def removeNonAscii(s): return "".join(i for i in s if ord(i)<128)