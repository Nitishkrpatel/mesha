from flask import request, make_response, jsonify, current_app
from functools import wraps
import jwt
from cryptography.fernet import Fernet
from src.config import shipdb_pool
from datetime import datetime


def token_required(func):
    @wraps(func)
    def decorator(*args, **kwargs):
        token = None
        # token_data = request.cookies.get('jwt_token')
        token_data = request.headers.get('miutkn')
        if not token_data:
            return make_response(jsonify({'message': 'Token is missing', 'status': 'logout'}), 401)
        token, encrypted_data = token_data.split(" ", 2)
        try:
            key = current_app.config['_key']
            cipher = Fernet(key)
            user_name = cipher.decrypt(encrypted_data.encode()).decode()
            # Decode and verify the token
            roles_string = current_app.config[user_name + '_roles']
            secret_key = user_name + roles_string
            decoded_token = jwt.decode(token, secret_key, algorithms=['HS256'])
            if decoded_token['username'] != user_name:
                return make_response(jsonify({'message': 'Invalid user access', 'status': 'logout'}), 401)
            # Add the decoded token to the request context
            request.decoded_token = decoded_token
        except jwt.ExpiredSignatureError:
            return make_response(jsonify({'message': 'Token has expired', 'status': 'logout'}), 401)
        except Exception:
            return make_response(jsonify({'message': 'Invalid token', 'status': 'logout'}), 401)
        return func(*args, user_name, **kwargs)
    return decorator


def roles_from_token(func):
    @wraps(func)
    def decorator(*args, **kwargs):
        token = None
        token_data = request.headers.get('miutkn')
        if not token_data:
            return make_response(jsonify({'message': 'Token is missing', 'status': 'logout'}), 401)
        token, encrypted_data = token_data.split(" ", 2)
        try:
            key = current_app.config['_key']
            cipher = Fernet(key)
            user_name = cipher.decrypt(encrypted_data.encode()).decode()
            # Decode and verify the token
            roles_string = current_app.config[user_name + '_roles']
            secret_key = user_name + roles_string
            decoded_token = jwt.decode(token, secret_key, algorithms=['HS256'])
            if decoded_token['username'] != user_name:
                return make_response(jsonify({'message': 'Invalid user access', 'status': 'logout'}), 401)
            # Add the decoded token to the request context
            request.decoded_token = decoded_token
        except jwt.ExpiredSignatureError:
            return make_response(jsonify({'message': 'Token has expired', 'status': 'logout'}), 401)
        except Exception:
            return make_response(jsonify({'message': 'Invalid token', 'status': 'logout'}), 401)
        return func(*args, roles_string, **kwargs)
    return decorator


def audit_log(data):
    qy = "insert into audit_history(user_name,feature,time,action,remarks) values(%s,%s,%s,%s,%s)"
    insert_record = (data['user_name'], data['feature'], datetime.now().replace(microsecond=0),
                     data['action'], data['remarks'])
    with shipdb_pool.connect() as connection:
        connection.execute(qy, insert_record)
