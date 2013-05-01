import os
from musicapi import *
from flask import Flask, render_template, request

songlist = [{'title': 'Loneliness of a Tower Crane Driver', 'artist': 'Elbow', 'reason': 'A brilliant use of an orchestra'},
            {'title': 'Bloodbuzz Ohio', 'artist': 'The National', 'reason': "The best song about Ohio I can remember"},
            {'title': 'Where is My Mind?', 'artist': 'The Pixies'},
            {'title': 'Sweet Dreams', 'artist': 'The Eurythmics'},
            {'title': 'Today', 'artist': 'The Smashing Pumpkins'},
            ]

providers = ['SoundCloud', 'Spotify', 'YouTube']

app = Flask(__name__)
app.debug=True
app.config.from_pyfile('config.py')

@app.route('/')
def hello():
    return 'Hello World!'

@app.route('/test/')
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