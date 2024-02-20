from flask import Flask
from flask_restful import Api
from flask_compress import Compress
from .config import config_by_name
from flask_cors import CORS
from cryptography.fernet import Fernet

def create_app(config_name):
    app = Flask(__name__)
    api = Api(app)  # noqa
    compress = Compress()
    # Register blueprints
    from .routes.user_tasks import user  # noqa: E402
    from .routes.admin_tasks import admin  # noqa: E402
    from .routes.ship_map import ship_map
    from .routes.ships_of_interest import soi_goi
    from .routes.dashboard import dashboard
    key = Fernet.generate_key()
    app.config["_key"] = key
    app.register_blueprint(user)
    app.register_blueprint(admin)
    app.register_blueprint(ship_map)
    app.register_blueprint(soi_goi)
    app.register_blueprint(dashboard)
    app.config.from_object(config_by_name[config_name])
    CORS(app, origins='*')
    compress.init_app(app)
    return app
