import requests
import grequests
from difflib import SequenceMatcher
import gdata.youtube
import gdata.youtube.service
import soundcloud
import time
import uuid
import urllib2
import base64
import hashlib
import hmac

HYPEMURL = 'http://hypem.com/playlist/search/'
HYPEMSTUB = '/json/1/data.js'

SOUNDCLOUDID = '79d197150fc7eb6ace136a9cb5253317'
sc_client = soundcloud.Client(client_id=SOUNDCLOUDID)

SPOTIFY_URL = 'http://ws.spotify.com/search/1/track.json'

YOUTUBE_URL = 'http://gdata.youtube.com/feeds/api/videos'

VIMEO_QUERYURL = 'http://vimeo.com/api/rest/v2'
VIMEO_REQUESTURL = 'https://vimeo.com/oauth/request_token'
VIMEO_AUTHORIZEURL = 'https://vimeo.com/oauth/authorize'
VIMEO_ACCESSURL = 'https://vimeo.com/oauth/access_token'
VIMEO_CLIENTID = 'a05d6bc133d68e3fff30da84b60c58b93020045c'
VIMEO_SECRET = 'd25250be08636c69dd661e3505bb69bdbe69bf08'

yt_service = gdata.youtube.service.YouTubeService()
yt_service.ssl = True

def hypem_request(title, artist):
	r = requests.get(HYPEMURL + artist + " " + title + HYPEMSTUB)
	if not r: return None
	reply = r.json()
	structure = [{'title': x['title'], 'artist': x['artist'], 'url': x['posturl'], 'id':i} for i, x in enumerate(reply.values()) if type(x)==dict]
	results = []
	reqs = 	(grequests.get(x['url'], headers={'id':x['id']}) for x in structure)
	data = grequests.map(reqs)
	unpack = [([{'title': y['title'], 'artist': y['artist']} for y in structure if y['id'] == x.request.headers['id']][0], x.text, x.request.headers['id']) for x in data if x.status_code == 200]
	links = [{'url': bestmp3choice(find_mp3(x[1]), x[0]), 'title': x[0]['title'], 'artist': x[0]['artist'], 'id': x[2]} for x in unpack]
	secondreqs = (grequests.head(x['url'], headers={'id': x['id']}) for x in links if x['url'])
	feedback = grequests.map(secondreqs)
	for f in feedback:
	   if f:
	       if f.status_code == 200 and f.headers.get('content-type') == 'audio/mpeg':
	           results.append({'title': [x['title'] for x in links if x['id'] == f.request.headers['id']][0], 'artist': [x['artist'] for x in links if x['id'] == f.request.headers['id']][0], 'url': f.url})
	return results
	
def find_mp3(r):
	linkend, linkstart = 0, 0
	mp3s = []
	while True:
		tagstart = r.find("<a", linkend)
		if -1 in [tagstart, linkend] or linkstart == 5: break
		linkstart = r.find('href="', tagstart) + 6
		linkend = r.find('"', linkstart)
		link = r[linkstart:linkend]
		if link[-4:] in [".mp3"]:
			mp3s.append(link)
	return mp3s

def bestmp3choice(cand, song):
	if not cand	: return None
	bestbytitle = max([(x, SequenceMatcher(None, song['title'], x).quick_ratio()) for x in cand], key=lambda y: y[1])
	bestbyartist = max([(x, SequenceMatcher(None, song['artist'], x).quick_ratio()) for x in cand], key=lambda y: y[1])
	if bestbytitle[1] > bestbyartist[1]: return bestbytitle[0]
	return bestbyartist[0]

def check_hypem_choice(choice):
	mp3link = bestmp3choice(find_mp3(choice['url']), choice)
	try:
		head = requests.head(mp3link, timeout=1)
		if head.status_code != 200 or head.headers.get('content-type') != 'audio/mpeg': return None
		else: return mp3link
	except:
		return None

def soundcloud_request(title, artist):
	tracks = sc_client.get('/tracks', embeddable_by='all', q=title + ' ' + artist)
	worthwhile = [t for t in tracks if t.title.lower().find(title.lower()) > 0]
	return [{'title': t.title, 'artist': t.user['username'], 'url': t.uri} for t in worthwhile]

def spotify_request(title, artist):
	paramlist = {'q': title + " " + artist}
	req = requests.get(SPOTIFY_URL, params=paramlist)
	if not req: return None
	r = req.json()['tracks']
	return [{'title': x.get('name'), 'artist': x.get('artists')[0].get('name'), 'url': x.get('href')} for x in r if x.get('album').get('availability').get('territories').find('GB')>-1]

def youtube_request(title, artist):
    paramlist = {'v': '2',
                 'q': title + " " + artist,
                 'racy': 'exclude',
                 'orderby': 'relevance',
                 'max_results': '10',
                 'alt': 'json'}
    req = requests.get(YOUTUBE_URL, params = paramlist)
    if not req: return None
    return [{'title': x['title']['$t'], 'artist': None, 'url': x['media$group']['yt$videoid']['$t']} for x in req.json()['feed'].get('entry')]
    
def vimeo_request(title, artist):
    nonce = str(uuid.uuid4().hex)
    timestamp = str(int(time.time()))
    paramlist = {'format': 'json',
                 'method': 'videos.search',
                 'query': title + " AND " + artist,
                 'sort': 'relevant',
                 'summary_response': 'true',
                 'oauth_consumer_key': VIMEO_CLIENTID,
                 'oauth_nonce': nonce,
                 'oauth_signature_method': 'HMAC-SHA1',
                 'oauth_timestamp': timestamp,
                 'oauth_version': '1.0'}
    sbs = '&'.join([oauthEscape("GET"), oauthEscape(VIMEO_QUERYURL), oauthEscape('&'.join([oauthEscape(x) + "=" + oauthEscape(paramlist[x]) for x in sorted(paramlist.keys())]))])
    signature = base64.b64encode(hmac.new(VIMEO_SECRET+"&", sbs, hashlib.sha1).digest())
    paramlist['oauth_signature'] = signature
    req = requests.get(VIMEO_QUERYURL, params = paramlist).json()['videos']['video']
    return [{'title': x['title'], 'artist': x['owner'].get('display_name'), 'url': x['id']} for x in req if title.lower() in x['title'].lower()]
    
def oauthEscape(string):
    if not string:
        return ''
    string = urllib2.quote(string)
    return string.replace('/', '%2F').replace('+', '%20')\
            .replace('!', '%21').replace('*', '%2A')\
            .replace('\\', '%27').replace('(', '%28').\
            replace(')', '%29')