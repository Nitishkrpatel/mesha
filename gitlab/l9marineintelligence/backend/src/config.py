# import os
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool
from psycopg2.extras import NamedTupleCursor

# uncomment the line below for postgres database url from environment variable
# postgres_local_base = os.environ['DATABASE_URL']

# basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # SECRET_KEY = os.getenv('SECRET_KEY', 'my_precious_secret_key')
    SECRETE_KEY = 'some_screte_key_for_test'
    DEBUG = False


class DevelopmentConfig(Config):
    # uncomment the line below to use postgres
    DEBUG = True
    # SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://postgres@localhost/shipdb'
    # SQLALCHEMY_BINDS = {'db2': 'postgresql+psycopg2://postgres@localhost/soidb'}
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class TestingConfig(Config):
    DEBUG = True
    TESTING = True
    # SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://postgres@localhost/shipdb'
    # SQLALCHEMY_BINDS = {'db2': 'postgresql+psycopg2://postgres@localhost/shipdb'}
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class ProductionConfig(Config):
    DEBUG = False
    # uncomment the line below to use postgres
    # SQLALCHEMY_DATABASE_URI = postgres_local_base


config_by_name = dict(
    dev=DevelopmentConfig,
    test=TestingConfig,
    prod=ProductionConfig
)

key = Config.SECRETE_KEY


shipdb = 'postgresql+psycopg2://postgres@192.168.31.180/shipdb'
# url = "postgresql://user:password@host:port/database?sslmode=verify-ca&sslrootcert=/path/to/certificate.pem"
# soidb = 'postgresql+psycopg2://postgres@localhost/soidb'


def create_connection_pool(db_uri):
    pool_size = 5  # Number of connections in the pool
    max_overflow = 10  # Maximum number of connections that can be created temporarily
    engine = create_engine(db_uri, pool_size=pool_size, max_overflow=max_overflow, poolclass=QueuePool,
                           connect_args={'cursor_factory': NamedTupleCursor})
    return engine


shipdb_pool = create_connection_pool(shipdb)
# Wrap the engine with a connection pool
# shipdb_pool = QueuePool(creator=engine.connect, max_overflow=10, pool_size=5)


# configurable paramaters
trajectory_break_time_threshold = 20  # hours
time_threshold = 10  # hours
distance_threshold = 50  # nautical miles(nmi)
port_threshold = 5  # nmi
interval = 30
transmission_distance_threshold = 30
transmission_time_threshold = 3
