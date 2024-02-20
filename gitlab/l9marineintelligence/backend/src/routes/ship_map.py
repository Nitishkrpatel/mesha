from datetime import datetime, timedelta
from flask import Blueprint, request, make_response, jsonify
from flask_restful import Api, Resource
import pandas as pd
from src.config import shipdb_pool
from src.support.decorators import token_required
from src.config import interval
import json
from sqlalchemy import text

ship_map = Blueprint("ship_map", __name__)
api = Api(ship_map)

# Mapping category ID to Category name
def map_id_to_category(id):
    with shipdb_pool.connect() as connection:
        res = connection.execute("select category from ship_category where category_id=%s", (id,))
        return res.fetchone()[0]


# Last Known position of ships as per user plottime and interval
class Ship_Map_plot(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.Ship_lkp(data)

    @token_required
    def Ship_lkp(self, data, user_name):
        timestamp = data["timestamp"]
        if not timestamp:
            return make_response(jsonify({"status": "success",
                                          "message": "Timestamp is missing"}), 200)
        now = datetime.now().replace(microsecond=0)
        etime = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        start_date = etime - timedelta(minutes=int(interval))
        if etime > now:
            etime = now
        update_query = "update users set plot_time=%s where user_name=%s"
        with shipdb_pool.connect() as connection:
            connection.execute(update_query, (etime, user_name))
        if data['mmsi_list']:
            sql_select_query = """SELECT subquery.* FROM (SELECT ship_transmission.mmsi,ship_name,
                        lat,long,sog,cog,heading,ship_transmission.category_id, ist_time,
                        ship_category.category,ST_AsGeoJSON(point),ROW_NUMBER() OVER (PARTITION BY
                        ship_transmission.mmsi ORDER BY ist_time DESC) AS row_num
                        FROM ship_transmission INNER JOIN ship ON ship.mmsi=ship_transmission.mmsi
                        INNER JOIN ship_category ON ship.category_id=ship_category.category_id
                        WHERE ship_transmission.mmsi IN %(mmsi_list)s AND ist_time BETWEEN
                        %(start_date)s AND %(end_date)s) AS subquery WHERE subquery.row_num=1
                        ORDER BY subquery.mmsi;"""
            # Prepare the parameters for the SQL query
            params = {'mmsi_list': tuple(data['mmsi_list']),
                      'start_date': str(start_date), 'end_date': str(etime)}
            # Execute the SQL query with the modified code
            with shipdb_pool.connect() as connection:
                df = pd.read_sql_query(sql_select_query, connection, params=params)
        else:
            sql_select_query = """SELECT subquery.* FROM (SELECT ship_transmission.mmsi,ship_name,
                lat,long,sog,cog,heading,ship_transmission.category_id,ist_time,
                ship_category.category,ST_AsGeoJSON(point),ROW_NUMBER() OVER (PARTITION BY
                ship_transmission.mmsi ORDER BY ist_time DESC) AS row_num FROM ship_transmission
                INNER JOIN ship ON ship.mmsi=ship_transmission.mmsi INNER JOIN ship_category ON
                ship.category_id=ship_category.category_id WHERE ist_time BETWEEN %s AND %s)
                AS subquery WHERE subquery.row_num=1 ORDER BY subquery.mmsi;"""
            with shipdb_pool.connect() as connection:
                df = pd.read_sql_query(sql_select_query, connection, params=(start_date, etime))
        count = len(df)
        df['ist_time'] = df['ist_time'].astype(str)
        df_to_json = df.to_json(orient='records')
        data = json.loads(df_to_json)
        return make_response(jsonify({"status": "success", "data": data,
                                      "timestamp": str(etime), "count": count}), 200)


# MMSI details when selected (popup)
class mmsi_pop_details(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        mmsi = post_data['mmsi']
        timestamp = post_data['timestamp']
        return self.mmsi_details(mmsi, timestamp)

    def is_mmsi_present(self, user_name, search_mmsi):
        query = "SELECT mmsi_list FROM user_groups WHERE user_name=%s"
        with shipdb_pool.connect() as connection:
            result = connection.execute(query, (user_name,))
            goi_mmsi_list = result.fetchall()
        for mmsi_lists in goi_mmsi_list:
            if search_mmsi in mmsi_lists[0]:
                return True
        return False

    @token_required
    def mmsi_details(self, mmsi, timestamp, user_name):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        query = """select imo,cog,sog,heading,eta,ship_name,length,width,class_name,
                origin_country,destination from ship_transmission inner join ship on
                ship.mmsi=ship_transmission.mmsi where ship_transmission.mmsi=%s
                and ist_time BETWEEN %s AND %s order by ist_time desc limit 1"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=(mmsi, from_date, to_date,))
        df['eta'] = df['eta'].astype(str)
        query = """SELECT EXISTS(SELECT 1 FROM user_soi WHERE %s=ANY(ships_of_interest)
                and user_name=%s)"""
        with shipdb_pool.connect() as connection:
            result = connection.execute(query, (mmsi, user_name))
            soi_flag = result.scalar()
        goi_flag = self.is_mmsi_present(user_name, mmsi)
        df['soi_flag'] = soi_flag
        df['goi_flag'] = goi_flag
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({'status': 'success', 'data': data}), 200)


# Search for ships by mmsi,name,imo,destination,country of origin
# search for port
# List all starting with search text entered
class Search(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        text = post_data['search_txt']
        timestamp = post_data['timestamp']
        criteria = post_data['criteria']
        if criteria == 'MMSI':
            return self.mmsi_search(text, timestamp)
        elif criteria == 'IMO':
            return self.shipimo_search(text, timestamp)
        elif criteria == 'name':
            return self.shipname_search(text, timestamp)
        elif criteria == 'Coo':
            return self.ship_origin_search(text, timestamp)
        elif criteria == 'dest':
            return self.ship_destination_search(text, timestamp)
        elif criteria == 'port':
            return self.port_search(text)
        else:
            return make_response(jsonify({'status': 'failure', 'message': "Invalid choice"}), 401)

    @token_required
    def mmsi_search(self, text, timestamp, _):
        length = len(str(text))
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        try:
            search_text = int(text)
        except ValueError:
            msg = "mmsi must be integer!"
            return make_response(jsonify({'status': 'failure', 'message': msg}), 401)
        smmsi = int(str(search_text) + ''.zfill(9 - length))
        if smmsi < 200000000 or smmsi > 999999999:
            msg = "No results for MMSI"
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        emmsi = int(str(search_text) + ''.zfill(9 - length).replace('0', '9'))
        query = """select distinct mmsi FROM ship_transmission where mmsi between %s and %s
                and ist_time between %s and %s order by mmsi"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=(smmsi, emmsi, from_date, to_date))
        if len(df) == 0:
            msg = """Particular mmsi doesnt exists!."""
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        df.columns = ['val']
        df['type'] = 'MMSI'
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({'status': 'success', 'data': data}), 200)

    @token_required
    def shipname_search(self, ship_name, timestamp, _):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        query = """select distinct ship_name from ship inner join ship_transmission on
            ship.mmsi=ship_transmission.mmsi where ship_name ILIKE concat(%s,'%%') and
            ist_time between %s and %s order by ship_name"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=(ship_name, from_date, to_date))
        if len(df) == 0:
            msg = """Particular ship name doesnt exists!"""
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        df.columns = ['val']
        df['type'] = 'name'
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({'status': 'success', 'data': data}), 200)

    @token_required
    def shipimo_search(self, imo, timestamp, _):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        query = """select distinct imo from ship inner join ship_transmission on
            ship.mmsi=ship_transmission.mmsi where imo ILIKE concat(%s,'%%') and
            ist_time between %s and %s order by imo"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=(imo, from_date, to_date))
        if len(df) == 0:
            msg = """Particular imo doesnt exists!"""
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        df.columns = ['val']
        df['type'] = 'IMO'
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({'status': 'success', 'data': data}), 200)

    @token_required
    def ship_origin_search(self, origin_country, timestamp, _):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        query = """select distinct origin_country from ship inner join ship_transmission on
            ship.mmsi=ship_transmission.mmsi where origin_country ILIKE concat(%s,'%%') and
            ist_time between %s and %s order by origin_country"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=(origin_country, from_date, to_date))
        if len(df) == 0:
            msg = """Particular origin_country doesnt exists!"""
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        df.columns = ['val']
        df['type'] = 'Coo'
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({'status': 'success', 'data': data}), 200)

    @token_required
    def ship_destination_search(self, port, timestamp, _):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        query = """select distinct destination from ship_transmission where destination
                ILIKE concat(%s,'%%') and ist_time between %s and %s order by destination"""
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(query, connection, params=(port, from_date, to_date))
        if len(df) == 0:
            msg = """Particular port doesnt exists!"""
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        df.columns = ['val']
        df['type'] = 'dest'
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({'status': 'success', 'data': data}), 200)

    @token_required
    def port_search(self, port_name, _):
        port_search_query = "SELECT port_name FROM ports WHERE port_name ILIKE %s"
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query(port_search_query, connection, params=(port_name + "%",))
        df.columns = ['val']
        df['type'] = 'port'
        if len(df) == 0:
            msg = """Particular port doesnt exists!"""
            return make_response(jsonify({"status": "failure", "message": msg}), 401)
        df = df.to_json(orient='records')
        data = json.loads(df)
        return make_response(jsonify({"status": "success", "data": data}), 200)


# All port coordinates for plotting
class Ports_details(Resource):
    def get(self):
        return self.ports()

    @token_required
    def ports(self, _):
        ports_query = """select port_id,country_name,lat,long,port_name from ports"""
        with shipdb_pool.connect() as connection:
            result = connection.execute(ports_query,)
            ports_data = result.fetchall()
        data = pd.DataFrame(ports_data)
        data = data.to_json(orient='records')
        data = json.loads(data)
        return make_response(jsonify({"status": "success", "data": data}), 200)


# Search for ships by mmsi,name,imo,destination,country of origin
# search for port
# Highlight searched item in ship map
class Search_result(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        search_txt = post_data['search_txt']
        timestamp = post_data['timestamp']
        criteria = post_data['criteria']
        return self.ship_search_results(search_txt, timestamp, criteria)

    def store_search(self, criteria, search_txt, user_name):
        # Retrieve existing search history for the user
        with shipdb_pool.connect() as connection:
            result = connection.execute("""SELECT search_history FROM search_history
                                        WHERE user_name = %s;""", (user_name,))
        existing_searches = result.fetchone()
        if existing_searches is None:
            search_history = []
        else:
            search_history = json.loads(json.dumps(existing_searches[0]))
        for search in search_history:
            if search['search_type'] == criteria and search['search_query'] == search_txt:
                return
        # Add the new search to the search history
        search_history.append({"search_type": criteria, "search_query": search_txt})
        # Limit the search history to the most recent 5 searches
        search_history = search_history[-5:]

        # Store the updated search history in the ship_search_history table
        query = """INSERT INTO search_history (user_name, search_history) VALUES (%s, %s) ON
                CONFLICT (user_name) DO UPDATE SET search_history=EXCLUDED.search_history;"""
        with shipdb_pool.connect() as connection:
            connection.execute(query, (user_name, json.dumps(search_history)))

    @token_required
    def ship_search_results(self, search_txt, timestamp, criteria, user_name):
        try:
            to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
            from_date = to_date - timedelta(minutes=int(interval))
            if criteria == 'MMSI':
                self.store_search(criteria, search_txt, user_name)
                sql_query = """select distinct on(mmsi)mmsi,lat,long,ist_time from
                               ship_transmission where mmsi=%s and ist_time between
                               %s and %s order by mmsi,ist_time desc limit 1"""
                with shipdb_pool.connect() as connection:
                    data = pd.read_sql_query(sql_query, connection,
                                             params=(search_txt, from_date, to_date))
            elif criteria == 'IMO':
                self.store_search(criteria, search_txt, user_name)
                sql_query = """select distinct on(ship_transmission.mmsi)ship_transmission.mmsi,
                               lat,long,ist_time from ship_transmission
                               inner join ship on ship_transmission.mmsi=ship.mmsi where imo=%s
                               and ist_time between %s and %s
                               order by ship_transmission.mmsi,ist_time desc limit 1"""
                with shipdb_pool.connect() as connection:
                    data = pd.read_sql_query(sql_query, connection,
                                             params=(search_txt, from_date, to_date))
            elif criteria == 'name':
                self.store_search(criteria, search_txt, user_name)
                sql_query = """select distinct on(ship_transmission.mmsi)ship_transmission.mmsi,
                               lat,long,ist_time from ship_transmission
                               inner join ship on ship_transmission.mmsi=ship.mmsi
                               where ship_name=%s and ist_time between %s and %s
                               order by ship_transmission.mmsi,ist_time desc limit 1"""
                with shipdb_pool.connect() as connection:
                    data = pd.read_sql_query(sql_query, connection,
                                             params=(search_txt, from_date, to_date))
            elif criteria == 'dest':
                self.store_search(criteria, search_txt, user_name)
                sql_query = """select distinct on(mmsi)mmsi,lat,long,ist_time from
                               ship_transmission where destination=%s and ist_time
                               between %s and %s order by mmsi,ist_time desc"""
                with shipdb_pool.connect() as connection:
                    data = pd.read_sql_query(sql_query, connection,
                                             params=(search_txt, from_date, to_date))
            elif criteria == 'Coo':
                self.store_search(criteria, search_txt, user_name)
                sql_query = """select distinct on(ship_transmission.mmsi)ship_transmission.mmsi,
                               lat,long,ist_time from ship_transmission
                               inner join ship on ship_transmission.mmsi=ship.mmsi
                               where origin_country=%s and ist_time between %s and %s
                               order by ship_transmission.mmsi,ist_time desc"""
                with shipdb_pool.connect() as connection:
                    data = pd.read_sql_query(sql_query, connection,
                                             params=(search_txt, from_date, to_date))
            elif criteria == 'port':
                self.store_search(criteria, search_txt, user_name)
                port_search_query = "select lat,long from ports where port_name=%s limit 1"
                with shipdb_pool.connect() as connection:
                    data = pd.read_sql_query(port_search_query, connection, params=(search_txt,))
                data = data.to_json(orient='records')
                data = json.loads(data)
                return make_response(jsonify({'status': 'success', 'data': data}), 200)

            if not data.empty:
                data['ist_time'] = data['ist_time'].astype(str)
                data = data.to_json(orient='records')
                data = json.loads(data)
                return make_response(jsonify({'status': 'success', 'data': data}), 200)
            else:
                return make_response(jsonify({"status": "failure",
                                              "message": "No results found check data", }), 400)
        except Exception as e:
            return make_response(jsonify({"status": "error", "message": str(e)}), 500)


# Last or ongoing trajectory of selected ship as per user plot time
class Past_track(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        mmsi = post_data['mmsi']
        timestamp = post_data['timestamp']
        return self.past_track(mmsi, timestamp)

    # def past_track(self, mmsi, timestamp):
    #     traj_id_query = """select max(traj_id) from mmsi_trajectories
    #                         where mmsi=%s and stime<%s"""
    #     with shipdb_pool.connect() as connection:
    #         traj_id = connection.execute(traj_id_query, (mmsi, timestamp, )).scalar()
    #     lat_lon_query = """SELECT lat,long FROM ship_transmission WHERE traj_id=%s
    #                     AND ist_time<=%s"""
    #     with shipdb_pool.connect() as connection:
    #         df = pd.read_sql_query(lat_lon_query, connection, params=(traj_id, timestamp,))
    #         data = df.to_json(orient='records')
    #     data = json.loads(data)
    #     return make_response(jsonify({'status': 'success', 'data': data}), 200)
    @token_required
    def past_track(self, mmsi, timestamp, _):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))
        query = "SELECT max(traj_id) FROM mmsi_trajectories WHERE mmsi=:mmsi AND stime<:timestamp"
        traj_id_query = text(query)
        with shipdb_pool.connect() as connection:
            traj_id = connection.execute(traj_id_query, mmsi=mmsi, timestamp=timestamp).scalar()
        query = """SELECT lat,long,cog,mmsi,traj_id FROM ship_transmission WHERE traj_id=:traj_id
                AND (ist_time<=:timestamp and smooth_pt is true or ist_time between
                :from_date and :timestamp) order by ist_time"""
        query = text(query)
        with shipdb_pool.connect() as connection:
            result = connection.execute(query, traj_id=traj_id, timestamp=timestamp, from_date=from_date)
            data = [dict(row) for row in result]
        return make_response(jsonify({'status': 'success', 'data': data}), 200)


api.add_resource(Past_track, "/ship_map/past_track")
api.add_resource(Ship_Map_plot, "/ship_map/ship_lkp")
api.add_resource(mmsi_pop_details, "/ship_map/mmsi_details")
api.add_resource(Search, "/ship_map/search")
api.add_resource(Ports_details, "/ship_map/ports")
api.add_resource(Search_result, "/ship_map/search_result")
