from calendar import monthrange
from datetime import datetime, timedelta
from flask import Blueprint, request, make_response, jsonify
from flask_restful import Api, Resource
import pandas as pd
from src.config import shipdb_pool
from src.support.decorators import token_required
from src.config import interval, transmission_distance_threshold, transmission_time_threshold
import json
from sqlalchemy import text
from collections import Counter


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

        # india ships
        query = """SELECT DISTINCT ON(ship_transmission.mmsi)ship_transmission.mmsi,
            ship_category.category FROM ship_transmission INNER JOIN ship ON
            ship_transmission.mmsi=ship.mmsi INNER JOIN ship_category ON
            ship.category_id=ship_category.category_id WHERE ist_time
            BETWEEN :from_date AND :timestamp AND origin_country ilike 'india%'"""

        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(from_date=from_date, timestamp=timestamp)
            result = connection.execute(stmt)
            ship_df = pd.DataFrame(result, columns=['mmsi', 'category'])

        india_count = len(ship_df)
        india_data = ship_df['category'].value_counts().reset_index().to_dict('records')
        return make_response(jsonify({"status": "success", "data": data, "count": '{:,}'.format(count),
                                     "india_data": india_data, "india_count": india_count}), 200)


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
                ship_category.category, origin_country FROM ship_transmission
                INNER JOIN ship ON ship_transmission.mmsi=ship.mmsi
                INNER JOIN ship_category ON ship.category_id=ship_category.category_id
                WHERE ist_time BETWEEN :from_date AND :timestamp AND
                origin_country IN :neighbor_countries"""

        neighbor_countries = tuple(neighbor_country)

        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(from_date=from_date, timestamp=timestamp,
                                          neighbor_countries=neighbor_countries)
            result = connection.execute(stmt)
            data = result.fetchall()

        # Create a Counter dictionary with origin_country as keys and their occurrences as values
        country_count = Counter(row['origin_country'] for row in data)

        # Create a list of dictionaries with all neighbor countries and their counts (including 0 count)
        data_list = [{'origin_country': country, 'count': country_count.get(country, 0)}
                     for country in neighbor_country]

        total_count = len(data)

        return make_response(jsonify({"status": "success", "data": data_list,
                                     "total_count": '{:,}'.format(total_count)}), 200)


# 03 Anomaly - Speed
class Speed_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.speed_anomaly(post_data)

    @token_required
    def speed_anomaly(self, data, _):
        min_speed = 2
        limit = 150
        offset = data['offset']
        if data['timestamp']:
            ts = data['timestamp']
            ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            fdate = ts - timedelta(minutes=int(interval))

            query = """SELECT distinct mmsi,traj_id,month,year,measure,unit
                FROM mmsi_transmission_anomaly_info WHERE traj_id in (select traj_id
                from mmsi_trajectories where stime<=:ts AND etime>=:ts OR
                (stime BETWEEN :fdate AND :ts OR etime BETWEEN :fdate AND :ts)) AND
                anomaly_type='speed' ORDER BY traj_id DESC offset :offset limit :limit"""
            with shipdb_pool.connect() as conn:
                result = conn.execute(text(query), {'ts': ts, 'fdate': fdate, "offset": offset,
                                                    "limit": limit})

        else:
            month = data['month']
            year = data['year']
            q = """SELECT distinct mmsi,traj_id,month,year,measure,unit FROM mmsi_transmission_anomaly_info
                    WHERE anomaly_type='speed' AND month=:month AND year=:year
                    ORDER BY mmsi,traj_id DESC OFFSET :offset LIMIT :limit"""

            with shipdb_pool.connect() as conn:
                result = conn.execute(text(q), {'month': month, 'year': year, 'offset': offset,
                                                'limit': limit})
        data_list = [dict(row) for row in result]
        if not data_list:
            return make_response(jsonify({"status": "success", "remark": "", "speed": [],
                                          "count": 0, "offset": offset + limit}), 200)

        # Step 1: Get unique 'mmsi' values
        mmsi_unique = {row['mmsi'] for row in data_list}

        # Step 2: Batch call 'get_category' function for unique 'mmsi'
        category_mapping = {mmsi: get_category(int(mmsi)) for mmsi in mmsi_unique}

        # Step 3: Map the categories back to the 'data_list'
        for row in data_list:
            row['category'] = category_mapping.get(row['mmsi'], '')

        ship_types = {row['category'] for row in data_list}

        # Step 4: Batch fetch the speed thresholds for ship categories
        q = """SELECT category,speed_threshold_max FROM ship_category
            WHERE category IN :ship_types"""

        with shipdb_pool.connect() as conn:
            result = conn.execute(text(q), {'ship_types': tuple(ship_types)})
            category_speeds = {row['category']: row['speed_threshold_max'] for row in result}

        # Step 5: Add 'min_speed' and 'max_speed' to each row in 'data_list'
        for row in data_list:
            row['min_speed'] = min_speed
            row['max_speed'] = category_speeds.get(row['category'], '')

        # Sort the data_list based on 'category'
        data_list.sort(key=lambda x: x['category'])

        remark = f"""Any ship assumed to maintain an average speed within a trajectory.
        Speed anomaly exists if the average speed of the ship within the trajectory is not
        between minimum speed threshold {min_speed} nmi and max speed threshold of ship type."""

        return make_response(jsonify({"status": "success", "remark": remark, "speed": data_list,
                                     "count": len(data_list), "offset": offset + limit}), 200)


# 04 Anomaly - Transmission
class Transmission_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.transmission_anomaly(post_data)

    @token_required
    def transmission_anomaly(self, data, _):
        dist = transmission_distance_threshold
        time = transmission_time_threshold
        offset = data['offset']
        limit = 150
        if data['timestamp']:
            ts = data['timestamp']
            ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            fdate = ts - timedelta(minutes=int(interval))
            query = """select distinct mmsi,traj_id from mmsi_transmission_anomaly_info
                where anomaly_type='transmission' and ntime between :fdate and :ts
                order by mmsi,traj_id offset :offset limit :limit"""
            with shipdb_pool.connect() as conn:
                stmt = text(query).bindparams(fdate=fdate, ts=ts, offset=offset, limit=limit)
                result = conn.execute(stmt)
        else:
            month = data['month']
            year = data['year']
            query = """select distinct mmsi,traj_id from mmsi_transmission_anomaly_info
                where anomaly_type='transmission' and month=:month and year=:year
                order by mmsi,traj_id offset :offset limit :limit"""
            with shipdb_pool.connect() as conn:
                stmt = text(query).bindparams(month=month, year=year, offset=offset, limit=limit)
                result = conn.execute(stmt)

        # Convert the query result directly to a list of dictionaries without using a DataFrame
        trans_anomalies = [dict(row) for row in result]

        # Step 1: Get unique 'mmsi' values
        mmsi_unique = set(entry['mmsi'] for entry in trans_anomalies)

        # Step 2: Batch call 'get_category' function for unique 'mmsi'
        category_mapping = {mmsi: get_category(int(mmsi)) for mmsi in mmsi_unique}

        # Step 3: Map the categories back to the 'trans_anomalies' list of dictionaries
        for entry in trans_anomalies:
            entry['category'] = category_mapping[entry['mmsi']]

        count = len(trans_anomalies)

        remark = """Transmission anomaly(spatial or temporal) exists if distance between two
                transmissions is greater than {} nmi or time between two transmissions
                is greater than {} hours within trajectory""".format(dist, time)

        return make_response(jsonify({"status": "success", "remark": remark, 
                                     "trans": trans_anomalies, "count": count,
                                      "offset": offset + limit}), 200)

# 05 Anomaly - Ship type
class Shiptype_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.shiptype_anomaly(post_data)

    @token_required
    def shiptype_anomaly(self, data, _):
        offset = data['offset']
        limit = 150
        if data['timestamp']:
            ts = data['timestamp']
            ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            fdate = ts - timedelta(minutes=int(interval))
        else:
            month = int(data['month'])
            year = int(data['year'])
            day = monthrange(year, month)
            end_day = day[1]
            fdate = datetime(year, month, 1, 00, 00, 00)
            ts = datetime(year, month, end_day, 23, 59, 59)
        query = """select distinct mmsi,traj_id from mmsi_anomalies_type where ntime between
                :fdate and :ts order by mmsi,traj_id desc offset :offset limit :limit"""
        with shipdb_pool.connect() as conn:
            stmt = text(query).bindparams(fdate=fdate, ts=ts, offset=offset, limit=limit)
            result = conn.execute(stmt)

        # Convert the query result directly to a list of dictionaries without using a DataFrame
        anomaly = [dict(row) for row in result]

        # Step 1: Get unique 'mmsi' values
        mmsi_unique = set(entry['mmsi'] for entry in anomaly)

        # Step 2: Batch call 'get_category' function for unique 'mmsi'
        category_mapping = {mmsi: get_category(int(mmsi)) for mmsi in mmsi_unique}

        # Step 3: Map the categories back to the 'anomaly' list of dictionaries
        for entry in anomaly:
            entry['category'] = category_mapping[entry['mmsi']]

        count = len(anomaly)
        return make_response(jsonify({"status": "success", "data": anomaly, "count": count,
                                      "offset": offset + limit}), 200)


# 06 Anomaly Info
class Anomaly_Info_Trajectory(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.anomaly_info_trajectory(post_data)

    @token_required
    def anomaly_info_trajectory(self, data, _):
        traj_id = data['traj_id']
        mmsi = data['mmsi']
        flag = data['flag']
        if flag:  # transmission
            query = """select mmsi,traj_id,plat,plong,ptime,nlat,nlong,ntime,measure,unit
                    from mmsi_transmission_anomaly_info where anomaly_type='transmission'
                    and traj_id=:traj_id"""
            with shipdb_pool.connect() as conn:
                stmt = text(query).bindparams(traj_id=traj_id)
                result = conn.execute(stmt)
            anomalies = [dict(row) for row in result]      
        else:
            query = """select mmsi,traj_id,previous_type,changed_type,plat,plong,ptime,nlat,
                    nlong,ntime from mmsi_anomalies_type where traj_id=:traj_id"""
            with shipdb_pool.connect() as conn:
                stmt = text(query).bindparams(traj_id=traj_id)
                result = conn.execute(stmt)
            anomalies = [dict(row) for row in result]

        traj_query = """select lat,long,COALESCE(cog,LAG(cog) OVER(ORDER BY ist_time)) AS cog,
                    ist_time from ship_transmission where traj_id=:traj_id and smooth_pt is true
                    order by ist_time"""
        with shipdb_pool.connect() as conn:
            stmt = text(traj_query).bindparams(traj_id=traj_id)
            result = conn.execute(stmt)
        traj = [dict(row) for row in result]
        ship = [{"traj_id": traj_id, "mmsi": mmsi, "points": traj}]
        return make_response(jsonify({"status": "success", "flag": flag, "anomaly": anomalies,
                                      "traj": ship}), 200)


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
api.add_resource(Anomaly_Info_Trajectory, "/dashboard/anomaly_info")  # 06
