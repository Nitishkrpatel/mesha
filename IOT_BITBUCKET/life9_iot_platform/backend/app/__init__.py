from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql+psycopg2://postgres@localhost:5432/iot_platform'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

api = Api(app)
db = SQLAlchemy(app)
CORS(app)


# Import resources to add them to the API
# from app.resources import solution_things_creation
from app.resources import tenant_registration
from app.resources import device_information
from app.resources import device_management
from app.resources import user_management
