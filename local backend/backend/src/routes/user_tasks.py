from flask import Blueprint, request, make_response, jsonify, current_app
from flask_restful import Api, Resource
import pandas as pd
import jwt
from datetime import datetime, timedelta
from src.config import shipdb_pool
from werkzeug.security import check_password_hash
from src.support.decorators import token_required, roles_from_token
from werkzeug.security import generate_password_hash
import json
from cryptography.fernet import Fernet

user = Blueprint("user", __name__)
api = Api(user)


# 01. User login
class User_Login(Resource):
    def post(self):
        credentials = request.authorization
        if not credentials or not credentials.username or not credentials.password:
            return make_response(jsonify({"status": "failure",
                                          "message": "Missing credentials"}), 401)
        return self.user_login_db(credentials)

    def user_login_db(self, credentials):
        user_name = credentials.username

        roles_str = ''

        sql_select_query = """select name,paswd,role,plot_time,adjusted_time,clock_speed,
                            is_adjustedtime,security_qa,is_pause from users where user_name=%s"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(sql_select_query, connection, params=(user_name,))
        if len(df) == 0:
            msg = "Account doesnot exists, Please contact admin"
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        if not check_password_hash(df['paswd'][0], credentials.password):
            return make_response(jsonify({"status": "failure",
                                         "message": "Incorrect username or password"}), 401)
        features = []
        for role in df['role'][0]:
            sql_select_query = """select role_name,feature_mapping from user_roles_feature_mapping
                                where role_id=%s"""
            with shipdb_pool.connect() as connection:
                result = connection.execute(sql_select_query, (role,))
                y = result.fetchone()
            features.extend(list(y[1]))
            roles_str += y[0] + ' '
        roles_string = roles_str.strip()
        payload = {'username': user_name, 'role': roles_str, "is_pause": str(df['is_pause'][0]),
                   "adjtime_flag": str(df['is_adjustedtime'][0]), "speed": df['clock_speed'][0],
                   'exp': datetime.utcnow() + timedelta(minutes=60), "name": df['name'][0],
                   "plot_time": str(df['plot_time'][0])}
        secret_key = user_name + roles_string
        current_app.config[user_name + '_roles'] = roles_string
        current_app.config[user_name] = True
        key = current_app.config["_key"]
        cipher = Fernet(key)
        encrypted_data = cipher.encrypt(user_name.encode())
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        return make_response(jsonify({"status": "success",
                                      "token": token + " " + encrypted_data.decode()}), 200)


# 02. User profile information
class User_Profile(Resource):
    def get(self):
        return self.user_profile_db()

    @token_required
    def user_profile_db(self, user_name):
        sql_select_query = """select name,email,mobile from users where user_name=%s"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(sql_select_query, connection, params=(user_name,))
        df_to_json = df.to_json(orient='records')
        data = json.loads(df_to_json)
        return make_response(jsonify({"status": "success", "data": data}), 200)


# 03. User request for new account
class New_Account_request(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        return self.new_account_request(post_data)

    def new_account_request(self, data):
        if len(data["password"]) < 6 or len(data["password"]) > 12:
            msg = "Password must be of length 6 to 12 characters"
            return make_response(jsonify({"status": "failure",
                                         "message": msg}), 400)

        with shipdb_pool.connect() as connection:
            res = connection.execute("select request_id from user_requests where user_name=%s",
                                     (data['user_name'],))
            result1 = res.fetchone()
            result2 = connection.execute("select user_name from users where user_name=%s",
                                         (data['user_name'],))
            result2 = result2.fetchone()
        if result1 or result2:
            msg = "Request already exists with same user name"
            return make_response(jsonify({"status": "failure", "message": msg}), 400)
        hash_pwd = generate_password_hash(data['password'], method="scrypt")
        query = """insert into user_requests(request_type,request_date,user_name,name,email,paswd,
        security_question,security_answer,status) values(%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        with shipdb_pool.connect() as connection:
            connection.execute(query, ("account", datetime.now().replace(microsecond=0),
                                       data["user_name"], data["name"],
                                       data["email"], hash_pwd, data["security_quest"],
                                       data["sq_answer"], "pending"))

        if data['mobile']:
            update_query = """update user_requests set mobile=%s where user_name=%s"""
            with shipdb_pool.connect() as connection:
                connection.execute(update_query, (data['mobile'], data['user_name']))
        msg = "Your request has been sent to admin for approval"
        return make_response(jsonify({"status": "success", "message": msg}), 200)


# 04. All security questions listed during new account request
class Security_questions(Resource):
    def get(self):
        return self.security_questions_db()

    def security_questions_db(self):
        try:
            sql_select_query = """select question from security_questions"""
            with shipdb_pool.connect() as connection:
                df = pd.read_sql_query(sql_select_query, connection)
            questions = list(df['question'])
            return make_response(jsonify({"status": "success", "data": questions}), 200)
        except Exception as e:
            return make_response(jsonify({"status": "error", "message": str(e), "data": {}}), 500)


# 05. User_name/Email availability during new account request
class Check_Availability(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        is_email = int(post_data['is_email'])
        text = post_data['text']
        return self.check_availabilty(is_email, text)

    def check_availabilty(self, is_email, text):
        if is_email:
            with shipdb_pool.connect() as connection:
                result = connection.execute("SELECT COUNT(*) FROM users WHERE email=%s", (text,))
                count1 = result.fetchone()
                res = connection.execute("""select count(*) from user_requests where email=%s and
                                        status in %s""", (text, tuple(["Approved", "Pending"])))
                count2 = res.fetchone()
            if count1[0] == 0 and count2[0] == 0:
                return make_response(jsonify({"status": "success",
                                             "message": "EmailID is available"}), 200)
            else:
                return make_response(jsonify({"status": "failure",
                                             "message": "EmailID is already taken!"}), 400)
        else:
            with shipdb_pool.connect() as connection:
                result = connection.execute("SELECT COUNT(*) FROM users WHERE user_name=%s", (text,))
                count1 = result.fetchone()
                res = connection.execute("""select count(*) from user_requests where user_name=%s
                                    and status in %s""", (text, tuple(["Approved", "Pending"])))
                count2 = res.fetchone()
            if count1[0] == 0 and count2[0] == 0:
                return make_response(jsonify({"status": "success",
                                             "message": "Username is available"}), 200)
            else:
                return make_response(jsonify({"status": "failure",
                                             "message": "Username is already taken!"}), 400)


# 06. User session Logout
class Logout(Resource):
    def get(self):
        user_name = request.args.get('user_name')
        return self.logout(user_name)

    def logout(self, user_name):
        try:
            del current_app.config[user_name]
            del current_app.config[user_name + '_roles']
        except Exception:
            pass
        return make_response(jsonify({"status": "success", "message": "User session logged out"}),
                             200)


# 07. Request for forgot user password
class User_forgot_password(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.user_acc_forgot_password(data)

    def user_acc_forgot_password(self, data):
        try:
            query = """select exists(select 1 from user_requests where status=%s and user_name=%s
                        and request_type=%s)"""
            with shipdb_pool.connect() as connection:
                result = connection.execute(query, ("pending", data["username"], "password"))
                result = result.fetchone()
            result = result[0]
            if result:
                return make_response(jsonify({"status": "failure",
                                     "message": "Similar request already exists!"}), 401)
            select_query = """select name,security_qa from users where user_name=%s"""
            with shipdb_pool.connect() as connection:
                user_data = pd.read_sql_query(select_query, connection, params=(data["username"],))
            if len(user_data) == 0:
                msg = "Entered credentials is incorrect!"
                return make_response(jsonify({"status": "failure", "message": msg}), 400)
            security_question = user_data['security_qa']
            question = list(security_question[0].keys())[0]
            if question != data["securityQuestion"]:
                msg = "Please select your valid security question!"
                return make_response(jsonify({"status": "failure", "message": msg}), 400)
            sql_query = """select name from users where security_qa->>%s=%s and user_name=%s"""
            with shipdb_pool.connect() as connection:
                res = connection.execute(sql_query, (data["securityQuestion"],
                                                     data["securityAnswer"], data["username"]))
                name = res.fetchone()
            if name is None:
                return make_response(jsonify({"status": "failure",
                                     "message": "Incorrect answer", "data": {}}), 400)
            query = """insert into user_requests(request_type,user_name,name,security_question,
                    security_answer,request_date,status) values (%s,%s,%s,%s,%s,%s,%s)"""
            request_info = ('password', data["username"], name[0], data["securityQuestion"],
                            data["securityAnswer"], datetime.now().replace(microsecond=0),
                            'pending')
            with shipdb_pool.connect() as connection:
                connection.execute(query, request_info)
            return make_response(jsonify({"status": "success"}), 200)
        except Exception as e:
            return make_response(jsonify({"status": "error", "message": str(e), "data": {}}), 500)


# 08. Request for forgot username
class User_forgot_username(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.user_forgot_acc_username(data)

    def user_forgot_acc_username(self, data):
        try:
            query = """select exists(select 1 from user_requests where status=%s and email=%s
                       and request_type=%s)"""
            with shipdb_pool.connect() as connection:
                result = connection.execute(query, ("pending", data["email"], "account"))
                result = result.fetchone()[0]
            if result:
                return make_response(jsonify({"status": "failure",
                                     "message": "contact admin for account activation"}), 401)
            query = """select exists(select 1 from user_requests where status=%s and email=%s
                       and request_type=%s)"""
            with shipdb_pool.connect() as connection:
                result = connection.execute(query, ("pending", data["email"], "username"))
                result = result.fetchone()[0]
            if result:
                return make_response(jsonify({"status": "failure",
                                             "message": "Similar request already exists!"}), 401)

            query = "select name,security_qa from users where email=%s"
            with shipdb_pool.connect() as connection:
                result = connection.execute(query, (data["email"],))
                result = result.fetchone()
            if result:
                name = result[0]
                security_question = result[1]
                question = list(security_question.keys())[0]
                answer = list(security_question.values())[0]
                now = datetime.now().replace(microsecond=0)
                if name.lower().strip() != data['name'].lower().strip() or question != data["quest"]\
                        or answer != data['ans']:
                    return make_response(jsonify({"status": "failure",
                                         "message": "Incorrect information"}), 401)
                else:
                    query = """insert into user_requests(request_type,security_question,email,
                        security_answer,request_date,status,name) values (%s,%s,%s,%s,%s,%s,%s)"""
                    request_info = ('username', data["quest"], data["email"], data["ans"], now,
                                    'pending', data["name"])
                    with shipdb_pool.connect() as connection:
                        connection.execute(query, request_info)
                    return make_response(jsonify({"status": "success"}), 200)
            else:
                return make_response(jsonify({"status": "failure",
                                              "message": "Incorrect information"}), 400)
        except Exception as e:
            return make_response(jsonify({"status": "error", "message": str(e), "data": {}}), 500)


# 09. Update user clock
class Update_User_Time(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.update_adjusted_time(data)

    @token_required
    def update_adjusted_time(self, data, user_name):
        update_query = """update users set plot_time=%s,adjusted_time=%s,
                        is_adjustedtime=%s where user_name=%s"""
        if not data['is_adjusted']:
            timestamp = datetime.now().replace(microsecond=0)
            update_data = (timestamp, timestamp, False, user_name)
        else:
            timestamp = data['timestamp']
            update_data = (timestamp, timestamp, True, user_name)
        with shipdb_pool.connect() as connection:
            connection.execute(update_query, update_data)
        return make_response(jsonify({"status": "success", "message": "Time updated"}), 200)


# 10. Update user clock running speed
class Update_Clock_Speed(Resource):
    def get(self):
        speed = request.args.get('speed')
        return self.update_clock_speed(speed)

    @token_required
    def update_clock_speed(self, speed, user_name):
        update_query = """update users set clock_speed=%s where user_name=%s"""
        with shipdb_pool.connect() as connection:
            connection.execute(update_query, (speed, user_name))
        return make_response(jsonify({"status": "success", "message": "Speed updated"}), 200)


# 11. Fetch user clock
class Fetch_User_Time(Resource):
    def get(self):
        return self.fetch_user_time()

    @token_required
    def fetch_user_time(self, user_name):
        with shipdb_pool.connect() as connection:
            result = connection.execute("""select is_adjustedtime,adjusted_time,plot_time
                                        from users where user_name=%s""", (user_name,))
            result = result.fetchone()

        if not result[0]:
            timestamp = datetime.now().replace(microsecond=0)
            data = {"at": str(timestamp), "pt": str(timestamp)}
        else:
            data = {"at": str(result[1]), "pt": str(result[2])}
        return make_response(jsonify({"status": "success", "data": data}), 200)


# 12. User clock play/pause state change and retrieval
class User_play_pause(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.user_play_pause(data)

    @token_required
    def user_play_pause(self, data, user_name):
        if data['flag'] == 0:
            with shipdb_pool.connect() as connection:
                result = connection.execute("""select is_pause from users where user_name=%s""",
                                            (user_name, ))
                pause = result.fetchone()
                return make_response(jsonify({"status": "success", "data": pause[0]}), 200)
        elif data['flag'] == 1:
            with shipdb_pool.connect() as connection:
                connection.execute("""update users set is_pause=%s where user_name=%s""",
                                   (data['pause'], user_name,))
                return make_response(jsonify({"status": "success", "data": data['pause']}), 200)
        else:
            return make_response(jsonify({"status": "failure", "message": 'invalid_flag'}), 401)


# 13. User search history limiting to latest 5
class User_search_history(Resource):
    def get(self):
        return self.user_search_history()

    @token_required
    def user_search_history(self, user_name):
        result = []
        with shipdb_pool.connect() as connection:
            result = connection.execute("""select search_history from
                                        search_history where user_name=%s""", (user_name,))
            search_history = result.fetchone()
        if search_history is not None:
            result = search_history[0]
        else:
            result = []
        return make_response(jsonify({"status": "success", "data": result[::-1]}), 200)


# 14. Features mapped to user roles
class Features_for_Role(Resource):
    def get(self):
        return self.role_features()

    @roles_from_token
    def role_features(self, roles):
        roles = roles.split(' ')
        features = []
        feature_names = []
        for role in roles:
            query = "select feature_mapping from user_roles_feature_mapping where role_name=%s"
            with shipdb_pool.connect() as connection:
                result = connection.execute(query, (role,))
                y = result.fetchone()
            features.extend(list(y[0]))
        features = set(features)
        for feature_id in features:
            query = "select feature_id,feature_name from all_features where feature_id=%s"
            with shipdb_pool.connect() as connection:
                result = connection.execute(query, (feature_id))
                y = result.fetchone()
            feature_names.append({"fid": y[0], "featurename": y[1],
                                  "featurelink": y[1].replace(" ", "-")})
        return make_response(jsonify({"status": "success", "data": feature_names}), 200)


api.add_resource(User_Login, "/")  # 01
api.add_resource(User_Profile, "/user/user_profile")  # 02
api.add_resource(New_Account_request, "/user/new_account_request")  # 03
api.add_resource(Security_questions, "/user/security_questions")  # 04
api.add_resource(Check_Availability, "/user/check_availability")  # 05
api.add_resource(Logout, "/user/logout")  # 06
api.add_resource(User_forgot_password, "/user/forgot_password")  # 07
api.add_resource(User_forgot_username, "/user/forgot_username")  # 08
api.add_resource(Update_User_Time, "/user/update_time")  # 09
api.add_resource(Update_Clock_Speed, "/user/update_speed")  # 10
api.add_resource(Fetch_User_Time, "/user/fetch_time")  # 11
api.add_resource(User_play_pause, "/user/pause")  # 12
api.add_resource(User_search_history, "/user/search_history")  # 13
api.add_resource(Features_for_Role, "/user/role_features")  # 14
