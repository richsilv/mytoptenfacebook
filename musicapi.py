import requests
from difflib import SequenceMatcher
import gdata.youtube
import gdata.youtube.service
import soundcloud

HYPEMURL = 'http://hypem.com/playlist/search/'
HYPEMSTUB = '/json/1/data.js'

SOUNDCLOUDID = '79d197150fc7eb6ace136a9cb5253317'
sc_client = soundcloud.Client(client_id=SOUNDCLOUDID)

SPOTIFY_URL = 'http://ws.spotify.com/search/1/track.json'

YOUTUBE_URL = 'http://gdata.youtube.com/feeds/api/videos'

yt_service = gdata.youtube.service.YouTubeService()
yt_service.ssl = True

def hypem_request(title, artist):
	r = requests.get(HYPEMURL + artist + " " + title + HYPEMSTUB)
	if not r: return None
	data = r.json()
	structure = [{'title': x['title'], 'artist': x['artist'], 'url': x['posturl']} for x in data.values() if type(x)==dict]
	return structure
	
def find_mp3(url):
	req = requests.get(url)
	if not req: return None
	else: r = req.text
	linkend, linkstart = 0, 0
	mp3s = []
	while True:
		tagstart = r.find("<a", linkend)
		if -1 in [tagstart, linkend] or linkstart == 5: break
		linkstart = r.find('href="', tagstart) + 6
		linkend = r.find('"', linkstart)
		link = r[linkstart:linkend]
		if link[-4:] in [".mp3", ".png"]:
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
		code = requests.head(mp3link, timeout=1).status_code
		if code != 200: return None
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