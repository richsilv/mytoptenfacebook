from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Sequence, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship, backref
import datetime

Base = declarative_base()

class TopTenUser(Base):
    __tablename__ = 'users'
    facebook_id = Column(Integer, primary_key=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    joined_on = Column(DateTime)

    def __init__(self, facebook_id, first_name, last_name):
        self.facebook_id = facebook_id
        self.first_name = first_name
        self.last_name = last_name
        self.joined_on = datetime.datetime.today()

    def __repr__(self):
       return "<User('%s %s', %s)>" % (self.first_name, self.last_name, self.facebook_id)

class TopTen(Base):
    __tablename__ = 'toptens'
    topten_id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    facebook_id = Column(Integer, ForeignKey('users.facebook_id'))
    opened = Column(DateTime)
    closed = Column(DateTime)
    active = Column(Boolean)
    
    toptenuser = relationship("TopTenUser", backref=backref('toptens', order_by=facebook_id))

    def __init__(self, facebook_id):
        self.facebook_id = facebook_id
        self.opened = datetime.datetime.today()
        self.active = True

    def __repr__(self):
       return "<Top Ten(%s, belongs to %s, ACTIVE = %s)>" % (self.topten_id, self.facebook_id, self.active)
       
class Song(Base):
    __tablename__ = 'songs'
    song_id = Column(Integer, Sequence('user_id_seq'), primary_key=True)
    facebook_id = Column(Integer, ForeignKey('users.facebook_id'))
    topten_id = Column(Integer, ForeignKey('toptens.topten_id'))
    title = Column(String(100))
    artist = Column(String(100))
    reason = Column(String(250))
    provider = Column(Integer)
    url = Column(String(250))
    
    toptenuser = relationship("TopTenUser", backref=backref('songs', order_by=song_id))
    topten = relationship("TopTen", backref=backref('songs', order_by=song_id))

    def __init__(self, facebook_id, topten_id, title, artist, reason, provider, url):
        self.facebook_id = facebook_id
        self.topten_id = topten_id
        self.title = title
        self.artist = artist
        self.reason = reason
        self.provider = provider
        self.url = url

    def __repr__(self):
       return "<Song(%s by %s, belongs to %s)>" % (self.title, self.artist, self.facebook_id)    
