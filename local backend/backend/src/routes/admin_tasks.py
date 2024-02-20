from flask import Blueprint, make_response, jsonify, request, Response
from flask_restful import Api, Resource
import time
import pandas as pd
from datetime import datetime
from src.config import shipdb_pool
from werkzeug.security import generate_password_hash
from src.support.decorators import token_required
import json
from src.support.decorators import audit_log

admin = Blueprint("admin", __name__)
api = Api(admin)


class User_Requests(Resource):
    def get(self):
        return self.display_user_requests()

    @token_required
    def display_user_requests(self, user_name):
        now = datetime.now().replace(microsecond=0)
        account_count = 0
        password_count = 0
        username_count = 0
        account_json = []
        password_json = []
        username_json = []
        query = """select request_id,request_date,user_name,name,email,request_type
                from user_requests where request_type in (%s,%s,%s) and status=%s"""
        li = ['account', 'password', 'username']
        params = tuple(li + ['pending'])
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=params)
        df['request_date'] = pd.to_datetime(df['request_date'])
        df['request_date'] = (now - df['request_date']).dt.days
        grouped = df.groupby('request_type')
        del df
        for request_type, df in grouped:
            if request_type == 'account':
                account_count = len(df)
                account_json = df.to_json(orient='records')
                account_json = json.loads(account_json)
            if request_type == 'password':
                password_count = len(df)
                password_json = df.to_json(orient='records')
                password_json = json.loads(password_json)
            if request_type == 'username':
                username_count = len(df)
                username_json = df.to_json(orient='records')
                username_json = json.loads(username_json)
        return make_response(jsonify({"status": "success", "acc": account_json,
                                      "ac": account_count, "pwd": password_json,
                                      "pc": password_count, "unm": username_json,
                                      "uc": username_count}), 200)

class Process_UserAccount_Requests(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        return self.process_user_requests(post_data)

    @token_required
    def process_user_requests(self, data, user_name):
        rid = data["request_id"]
        with shipdb_pool.connect() as connection:
            result = connection.execute("""select request_type,user_name,name,mobile,email,
                                paswd,security_question,security_answer from user_requests
                                where request_id=%s""", (rid,))
            rows = result.fetchone()
        column_names = result.keys()
        result = dict(zip(column_names, rows))
        # approves
        if data["status"]:
            with shipdb_pool.connect() as connection:
                connection.execute("update user_requests set status=%s where request_id=%s",
                                   ("Approved", rid))

            quest = {result['security_question']: result['security_answer']}
            # query to create a new user
            insert_query = """insert into users(user_name,name,mobile,role,plot_time,security_qa,
                            paswd,clock_speed,is_pause,is_adjustedtime,adjusted_time,email)
                            values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
            tm = datetime.now().replace(microsecond=0)
            record_to_insert = (result["user_name"], result["name"], result["mobile"],
                                data["role"], tm, json.dumps(quest), result["paswd"],
                                "1x", False, False, tm, result["email"])
            with shipdb_pool.connect() as connection:
                connection.execute(insert_query, record_to_insert)
                connection.execute("insert into user_soi values(%s,ARRAY[]::Integer[])",
                                   (result['user_name'],))
            audit = {"user_name": user_name, "feature": "New_user_account", "action": "create",
                     "remarks": "user added with user name " + result["user_name"]}
            audit_log(audit)
        # rejected
        else:
            with shipdb_pool.connect() as connection:
                connection.execute("update user_requests set status=%s where request_id=%s",
                                   ("Declined", rid))
        return make_response(jsonify({"status": "success", "message": "Request declined!"}), 200)


class User_Roles(Resource):
    def get(self):
        return self.display_user_roles()

    @token_required
    def display_user_roles(self, user_name):
        role = []
        query = "select role_id,role_name from user_roles_feature_mapping where role_id!=1"
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection)
        df.drop()
        df = df.sort_values('role_name')
        df = df.to_json(orient='records')
        role = json.loads(df)
        return make_response(jsonify({"status": "success", "data": role}), 200)


class Process_password_reset(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        return self.process_pwd_reset(post_data)

    @token_required
    def process_pwd_reset(self, data, user_name):
        try:
            request_id = data["request_id"]
            status = data["status"]
            if status:
                password = data['password']
                query = "select user_name from user_requests where request_id=%s"
                with shipdb_pool.connect() as connection:
                    res = connection.execute(query, (request_id,))
                    user_id = res.fetchone()[0]
                hash_pwd = generate_password_hash(password, method='scrypt')
                with shipdb_pool.connect() as connection:
                    connection.execute("update users set paswd=%s where user_name=%s",
                                       (hash_pwd, user_id))
                with shipdb_pool.connect() as connection:
                    connection.execute("update user_requests set status=%s where request_id=%s",
                                       ("Approved", request_id))
                audit = {"user_name": user_name, "feature": "Password_reset", "action": "modify",
                         "remarks": "Password changed for account with user name " + user_id}
                audit_log(audit)
                return make_response(jsonify({"status": "success",
                                              "message": "Password reset completed!"}), 200)
            else:
                with shipdb_pool.connect() as connection:
                    connection.execute("update user_requests set status=%s where request_id=%s",
                                       ("Declined", request_id))
                return make_response(jsonify({"status": "success",
                                              "message": "Request declined!"}), 200)
        except Exception as e:
            return make_response(jsonify({"status": "error", "message": str(e), "data": {}}), 500)


class Process_username_request(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        return self.process_urs_name_request(post_data)

    @token_required
    def process_urs_name_request(self, data, _):
        try:
            request_id = data["request_id"]
            if data['status']:
                with shipdb_pool.connect() as connection:
                    re = connection.execute("select email from user_requests where request_id=%s",
                                            (request_id,))
                    result = re.fetchone()
                email = result[0]
                with shipdb_pool.connect() as connection:
                    query = "select user_name from users where email=%s"
                    res = connection.execute(query, (email,))
                    user_name = res.fetchone()
                user_name = user_name[0]
                # with shipdb_pool.connect() as connection:
                #     connection.execute("update user_requests set status=%s where request_id=%s",
                #                        ("Approved", request_id))
                return make_response(jsonify({"status": "success", "username": user_name,
                                              "request_id": request_id}), 200)
            else:
                with shipdb_pool.connect() as connection:
                    connection.execute("update user_requests set status=%s where request_id=%s",
                                       ("Declined", request_id))
                return make_response(jsonify({"status": "success", "message": "v!"}), 200)
        except Exception as e:
            return make_response(jsonify({"status": "error", "message": str(e)}), 500)


class Audit_log_sse(Resource):
    def get(self):
        return Response(self.sse_stream(), mimetype='text/event-stream')

    @token_required
    def sse_stream(self, user_name):
        query = """select remarks from audit_history where user_name=%s"""
        with shipdb_pool.connect() as connection:
            results = connection.execute(query, (user_name,))
            new_messages = results.fetchall()
        # Convert messages to SSE events and send to the client
            for message in new_messages:
                event_data = json.dumps({'message': message[0]})
                yield "data: {}\n\n".format(event_data)
            time.sleep(1)  # Delay between checks


api.add_resource(User_Requests, "/admin/user_requests")
api.add_resource(Process_UserAccount_Requests, "/admin/process_requests")
api.add_resource(User_Roles, "/admin/user_roles")
api.add_resource(Process_password_reset, "/admin/password_reset")
api.add_resource(Process_username_request, "/admin/process_name_request")
api.add_resource(Audit_log_sse, "/admin/audit_log")
