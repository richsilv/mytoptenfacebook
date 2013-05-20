from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from models import *

db_connection = 'postgresql+psycopg2://samduguqeoqreu:9kluutG-6Y13MOAvROkWW5q9eY@ec2-54-225-84-29.compute-1.amazonaws.com/dffdsram87s8dl'

def syncdb():
    engine = create_engine(db_connection, echo=True)
    Base.metadata.create_all(engine)

def setupModels():
    engine = create_engine(db_connection, echo=True)
    Session = sessionmaker(bind=engine)
    session = Session()
    return session  

if __name__ == "__main__":
    syncdb()