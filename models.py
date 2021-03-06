from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Sequence, DateTime, Boolean, ForeignKey, Table, Text
from sqlalchemy.orm import relationship, backref
import datetime

Base = declarative_base()
       
topten_song = Table('topten_song', Base.metadata,
   Column('topten_id', Integer, ForeignKey('toptens.topten_id')),
   Column('song_id', Integer, ForeignKey('songs.song_id')))

toptenuser_song = Table('toptenuser_song', Base.metadata,
    Column('facebook_id', String(20), ForeignKey('users.facebook_id')),
    Column('song_id', Integer, ForeignKey('songs.song_id')))

class TopTenUser(Base):
    __tablename__ = 'users'
    facebook_id = Column(String(20), primary_key=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    joined_on = Column(DateTime)
    last_login = Column(DateTime)
    notified = Column(Boolean)

    songs = relationship("Song", secondary=toptenuser_song, backref="toptenusers")

    def __init__(self, facebook_id, first_name, last_name):
        self.facebook_id = facebook_id
        self.first_name = first_name
        self.last_name = last_name
        self.joined_on = datetime.datetime.today()
        self.last_login =  datetime.datetime.today()
        self.notified = False

    def __repr__(self):
       return "<User('%s %s', %s)>" % (self.first_name.encode('raw_unicode_escape'), self.last_name.encode('raw_unicode_escape'), self.facebook_id)

class TopTen(Base):
    __tablename__ = 'toptens'
    topten_id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    facebook_id = Column(String(20), ForeignKey('users.facebook_id'))
    opened = Column(DateTime)
    closed = Column(DateTime)
    active = Column(Boolean)
    private = Column(Boolean)
    
    toptenuser = relationship("TopTenUser", backref=backref('toptens', order_by=facebook_id))
    
    songs = relationship("Song", secondary=topten_song, backref="toptens")

    def __init__(self, facebook_id):
        self.facebook_id = facebook_id
        self.opened = datetime.datetime.today()
        self.active = True
        self.private = True

    def __repr__(self):
       return "<Top Ten(%s, belongs to %s, ACTIVE = %s)>" % (self.topten_id, self.facebook_id, self.active)

    def songCount(self):
        return len(self.songs)
     
class Song(Base):
    __tablename__ = 'songs'
    song_id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    facebook_id = Column(String(20), ForeignKey('users.facebook_id'))
    title = Column(String(100))
    artist = Column(String(100))
    reason = Column(String(250))
    provider = Column(Integer)
    url = Column(String(250))
    num = Column(Integer)

    def __init__(self, num, title, artist, reason, url, provider):
        self.title = title
        self.artist = artist
        self.reason = reason
        self.provider = provider
        self.url = url
        self.num = num

    def __repr__(self):
       return "<Song(%s by %s, belongs to %s)>" % (self.title, self.artist, self.facebook_id)    

class Token(Base):
    __tablename__ = 'tokens'
    token = Column(String(250), primary_key=True)
    expiry = Column(Integer)
    facebook_id = Column(String(20), ForeignKey('users.facebook_id'))

    toptenuser = relationship("TopTenUser", backref=backref('tokens', order_by=facebook_id))

    def __init__(self, token, expiry, facebook_id):
        self.token = token
        self.expiry = expiry
        self.facebook_id = facebook_id

    def __repr__(self):
       return "<Token(%s, secs to expiry: %s, belongs to %s)>" % (self.token, self.expiry, self.facebook_id)    
