from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from models import *
import datetime

db_connection = 'postgresql+psycopg2://samduguqeoqreu:9kluutG-6Y13MOAvROkWW5q9eY@ec2-54-225-84-29.compute-1.amazonaws.com/dffdsram87s8dl'

def syncdb():
    engine = create_engine(db_connection, echo=True)
    Base.metadata.create_all(engine)

def setupModels(echo=True):
    engine = create_engine(db_connection, echo=echo)
    Session = sessionmaker(bind=engine)
    session = Session()
    return session  

def cleanupUsers(days=2):
    pg = setupModels(echo=False)
    now = datetime.datetime.now()
    L = [u for u in pg.query(TopTenUser) if max([len(x.songs) for x in u.toptens]) == 0 and now - u.last_login > datetime.timedelta(days=days)]
    for u in L:
        print "Removing user " + u.first_name + " " + u.last_name + ", last login: " + u.last_login.strftime("%c")
        pg.delete(u)
    pg.commit()

if __name__ == "__main__":
    syncdb()