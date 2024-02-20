from calendar import monthrange
from datetime import datetime, timedelta
from flask import Blueprint, request, make_response, jsonify
from flask_restful import Api, Resource
import pandas as pd
from src.config import shipdb_pool
from src.support.decorators import token_required
from src.config import interval, transmission_distance_threshold, transmission_time_threshold
import json
from sqlalchemy import bindparam, text


dashboard = Blueprint("dashboard", __name__)
api = Api(dashboard)

neighbor_country = ["Afghanistan", "Bangladesh", "Bhutan", "China", "Maldives", "Myanmar",
                    "Nepal", "Pakistan", "Sri Lanka"]


# 01. Overview - Ship count
class Overview_Shipcount(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        timestamp = post_data['timestamp']
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        return self.ship_count(timestamp)

    @token_required
    def ship_count(self, timestamp, _):
        from_date = timestamp - timedelta(minutes=int(interval))
        query = """SELECT DISTINCT ON(ship_transmission.mmsi)ship_transmission.mmsi,
            ship_category.category FROM ship_transmission INNER JOIN ship ON
            ship_transmission.mmsi=ship.mmsi INNER JOIN ship_category ON
            ship.category_id=ship_category.category_id WHERE ist_time
            BETWEEN :from_date AND :timestamp"""

        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(from_date=from_date, timestamp=timestamp)
            result = connection.execute(stmt)
            ship_df = pd.DataFrame(result, columns=['mmsi', 'category'])

        count = len(ship_df)
        data = ship_df['category'].value_counts().reset_index().to_dict('records')
        return make_response(jsonify({"status": "success", "data": data, "count": '{:,}'.format(count)}), 200)


# 02. Overview - Neighbouring countries ship count
class Overview_Neighbouring_Country_Shipcount(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        timestamp = post_data['timestamp']
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        return self.neighbouring_country_ship_count(timestamp)

    @token_required
    def neighbouring_country_ship_count(self, timestamp, _):
        from_date = timestamp - timedelta(minutes=int(interval))
        query = """SELECT DISTINCT ON(ship_transmission.mmsi) ship_transmission.mmsi,
        ship_category.category,origin_country FROM ship_transmission INNER JOIN ship ON
        ship_transmission.mmsi=ship.mmsi INNER JOIN ship_category ON ship.category_id=
        ship_category.category_id WHERE ist_time BETWEEN :from_date AND :timestamp AND
        origin_country IN :neighbor_countries"""

        neighbor_countries = tuple(neighbor_country)  # Assuming neighbor_country is a list

        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(from_date=from_date, timestamp=timestamp,
                                          neighbor_countries=neighbor_countries)
            result = connection.execute(stmt)
            ship_df = pd.DataFrame(result, columns=['mmsi', 'category', 'origin_country'])

        total_count = len(ship_df)
        data = ship_df['origin_country'].value_counts().reset_index().to_dict('records')
        return make_response(jsonify({"status": "success", "data": data,
                                      "total_count": '{:,}'.format(total_count)}), 200)


# 03 Anomaly - Speed
class Speed_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.speed_anomaly(post_data)

    @token_required
    def speed_anomaly(self, data, _):
        min_speed = 2
        offset = data['offset']
        # speed anomaly as per user plot time
        if data['timestamp']:
            ts = data['timestamp']
            # limit = 250
            ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            fdate = ts - timedelta(minutes=int(interval))
            query = """SELECT traj_id FROM mmsi_trajectories WHERE (stime<=:ts AND etime>=:ts)
                    OR (stime BETWEEN :fdate AND :ts OR etime BETWEEN :fdate AND :ts)
                    order by traj_id desc"""
            with shipdb_pool.connect() as conn:
                df = pd.read_sql_query(text(query), conn, params={'ts': ts, 'fdate': fdate})
            traj_list = list(df['traj_id'])
            q = """SELECT mmsi,traj_id,month,year,measure,unit FROM mmsi_transmission_anomaly_info
                WHERE anomaly_type='speed' AND traj_id IN :traj_list"""
            with shipdb_pool.connect() as conn:
                df = pd.read_sql_query(text(q).bindparams(bindparam('traj_list', expanding=True)),
                                       conn, params={'traj_list': traj_list})
        else:
            limit = 200
            month = data['month']
            year = data['year']
            q = """SELECT mmsi,traj_id,month,year,measure,unit FROM mmsi_transmission_anomaly_info
                WHERE anomaly_type='speed' AND month=:month and year=:year order by mmsi,traj_id
                desc offset :offset limit :limit"""
            with shipdb_pool.connect() as conn:
                df = pd.read_sql_query(text(q), conn, params={'month': month, 'year': year,
                                                              'offset': offset, 'limit': limit})

        df = df.drop_duplicates('traj_id', keep='first')
        count = len(df)
        df['min_speed'] = min_speed
        # Step 1: Get unique 'mmsi' values
        mmsi_unique = df['mmsi'].unique()

        # Step 2: Apply 'get_category' function to each unique 'mmsi'
        category_mapping = {mmsi: get_category(int(mmsi)) for mmsi in mmsi_unique}

        # Step 3: Map the categories back to the original DataFrame
        df['category'] = df['mmsi'].map(category_mapping)

        ship_types = df['category'].unique()

        q = """SELECT category,speed_threshold_max FROM ship_category
            WHERE category IN :ship_types"""
        with shipdb_pool.connect() as conn:
            result = conn.execute(text(q).bindparams(bindparam('ship_types', expanding=True)),
                                  {'ship_types': tuple(ship_types)})

        category_speeds = result.fetchall()
        speed_threshold_dict = dict(category_speeds)

        df['max_speed'] = df['category'].map(speed_threshold_dict)

        data = df.to_json(orient='records')
        speed = json.loads(data)
        remark = f"""Any ship assumed to maintain an average speed within a trajectory.
                 Speed anomaly occurs if the average speed of the ship within the trajectory is not between
                 minimum speed threshold {min_speed} nmi and max speed threshold of ship type."""
        return make_response(jsonify({"status": "success", "remark": remark.strip(),
                                     "speed": speed, "count": count}), 200)


# 04 Anomaly - Transmission
class Transmission_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.transmission_anomaly(post_data)

    # @token_required
    def transmission_anomaly(self, data):
        dist = transmission_distance_threshold
        time = transmission_time_threshold
        offset = data['offset']
        limit = 200
        if data['timestamp']:
            ts = data['timestamp']
            ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            fdate = ts - timedelta(minutes=int(interval))
            query = """select mmsi,traj_id,plat,plong,ptime,nlat,nlong,ntime,measure,unit from
                    mmsi_transmission_anomaly_info where anomaly_type='transmission' and ntime
                    between :fdate and :ts order by mmsi,traj_id offset :offset limit :limit"""
            with shipdb_pool.connect() as conn:
                stmt = text(query).bindparams(fdate=fdate, ts=ts, offset=offset, limit=limit)
                result = conn.execute(stmt)
            df = pd.DataFrame(result, columns=['mmsi', 'traj_id', 'plat', 'plong', 'ptime',
                                               'nlat', 'nlong', 'ntime', 'measure', 'unit'])
        else:
            month = data['month']
            year = data['year']
            query = """select mmsi,traj_id,plat,plong,ptime,nlat,nlong,ntime,measure,unit
                    from mmsi_transmission_anomaly_info where anomaly_type='transmission' and
                month=:month and year=:year order by mmsi,traj_id offset :offset limit :limit"""
            with shipdb_pool.connect() as conn:
                stmt = text(query).bindparams(month=month, year=year, offset=offset, limit=limit)
                result = conn.execute(stmt)
            df = pd.DataFrame(result, columns=['mmsi', 'traj_id', 'plat', 'plong', 'ptime',
                                               'nlat', 'nlong', 'ntime', 'measure', 'unit'])
        data = df.to_json(orient='records')
        count = len(df)
        trans = json.loads(data)
        remark = """Transmission anomaly(spatial or temporal) ouccurs if distance between two
        transmissions is greater than """ + str(dist) + """ nmi or time between two transmissions
        is greater than """ + str(time) + " hours within trajectory"

        return make_response(jsonify({"status": "success", "remark": remark,
                                     "trans": trans, "count": count}), 200)

# 05 Anomaly - Ship type
class Shiptype_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.shiptype_anomaly(post_data)

    # @token_required
    def shiptype_anomaly(self, data):
        if data['timestamp']:
            ts = data['timestamp']
            fdate = ts - timedelta(minutes=int(interval))
            query = """select mmsi,traj_id,previous_type,changed_type,plat,plong,ptime,nlat,
                    nlong,ntime from mmsi_anomalies_type where ntime between %s and %s"""
            with shipdb_pool.connect() as conn:
                df = pd.read_sql_query(query, conn, params=(fdate, ts))
        else:
            month = int(data['month'])
            year = int(data['year'])
            day = monthrange(year, month)
            end_day = day[1]
            from_date = datetime(year, month, 1, 00, 00, 00)
            to_date = datetime(year, month, end_day, 23, 59, 59)
            query = """select mmsi,traj_id,previous_type,changed_type,plat,plong,ptime,nlat,
                    nlong,ntime from mmsi_anomalies_type where ntime between %s and %s"""
            with shipdb_pool.connect() as conn:
                df = pd.read_sql_query(query, conn, params=(from_date, to_date))
        df['category'] = ''
        mmsi_list = set(df['mmsi'])
        count = len(mmsi_list)
        df['category'] = df['mmsi'].apply(lambda x: get_category(x))
        df.sort_values('category', inplace=True)
        anomaly = df.to_json(orient='records')
        anomaly = json.loads(anomaly)
        return make_response(jsonify({"status": "success", "data": anomaly, "count": count}), 200)


def get_category(mmsi):
    with shipdb_pool.connect() as conn:
        query = """select category from ship_category inner join ship on
                ship.category_id=ship_category.category_id where mmsi=%s"""
        result = conn.execute(query, (mmsi,))
        result = result.fetchone()
    return result[0]


api.add_resource(Overview_Shipcount, "/dashboard/ship_count")  # 01
api.add_resource(Overview_Neighbouring_Country_Shipcount, "/dashboard/shipcount_by_country")  # 02
api.add_resource(Speed_Anomaly, "/dashboard/speed_anomaly")  # 03
api.add_resource(Transmission_Anomaly, "/dashboard/transmission_anomaly")  # 04
api.add_resource(Shiptype_Anomaly, "/dashboard/type_anomaly")  # 05
