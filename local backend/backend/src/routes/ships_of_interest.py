from flask import Blueprint, request, make_response, jsonify
from flask_restful import Api, Resource
from src.config import shipdb_pool
from src.support.decorators import token_required
from src.config import interval
import json
from sqlalchemy import bindparam, text
from datetime import datetime, timedelta


soi_goi = Blueprint("soi_goi", __name__)
api = Api(soi_goi)


# SoI
# 01. List all user individual ships of interest
class User_Ships_of_Interest(Resource):
    def get(self):
        return self.Ships_of_Interest()

    @token_required
    def Ships_of_Interest(self, user_name):
        query = """SELECT ship.mmsi,ship.ship_name as name FROM ship JOIN user_soi ON
                ship.mmsi=ANY(user_soi.ships_of_interest) WHERE user_soi.user_name=:user_name
                ORDER BY ship.ship_name"""

        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(bindparam('user_name', user_name))
            res = connection.execute(stmt)
        data = [dict(row) for row in res]  # Convert rows to dictionaries

        return make_response(jsonify({"status": "success", "data": data}), 200)


# 02. Select and add MMSI to SoI from ship map
class Add_Ships_of_Interest(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        mmsi = data['mmsi']
        return self.Add_SoI(mmsi)

    @token_required
    def Add_SoI(self, mmsi, user_name):
        check_query = """SELECT TRUE FROM user_soi WHERE :mmsi=ANY(ships_of_interest)
                        AND user_name=:user_name"""
        with shipdb_pool.connect() as connection:
            stmt = text(check_query).bindparams(bindparam('mmsi', mmsi),
                                                bindparam('user_name', user_name))
            res = connection.execute(stmt)
            is_mmsi_present = res.fetchone()

        if is_mmsi_present:
            msg = "MMSI already present in ships of interest"
            return make_response(jsonify({"status": "failure", "message": msg}), 400)
        else:
            update_query = """UPDATE user_soi SET ships_of_interest=ships_of_interest || :mmsi
                            WHERE user_name = :user_name"""
            with shipdb_pool.connect() as connection:
                stmt = text(update_query).bindparams(bindparam('mmsi', mmsi),
                                                     bindparam('user_name', user_name))
                connection.execute(stmt)

        msg = str(mmsi) + " added to user ships of interest"
        return make_response(jsonify({"status": "success", "data": msg}), 200)


# 03. Delete selected MMSI from SoI
class Delete_Ships_of_Interest(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        mmsi = data['mmsi']
        return self.Delete_SoI(mmsi)

    @token_required
    def Delete_SoI(self, mmsi, user_name):
        query = """SELECT TRUE FROM user_soi WHERE :mmsi=ANY(ships_of_interest) AND
                user_name=:user_name"""

        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(bindparam('mmsi', mmsi),
                                          bindparam('user_name', user_name))
            res = connection.execute(stmt)
            is_mmsi_present = res.fetchone()

        if is_mmsi_present:
            query = """UPDATE user_soi SET ships_of_interest=ARRAY_REMOVE(ships_of_interest,:mmsi)
                    WHERE user_name = :user_name"""
            with shipdb_pool.connect() as connection:
                stmt = text(query).bindparams(bindparam('mmsi', mmsi),
                                              bindparam('user_name', user_name))
                connection.execute(stmt)

            msg = str(mmsi) + " deleted from user ships of interest"
            return make_response(jsonify({"status": "success", "data": msg}), 200)
        else:
            msg = "Cannot delete MMSI, does not exist in ships of interest"
            return make_response(jsonify({"status": "failure", "message": msg}), 400)


# GoI
# Check availabilty of group name for group creation
def check_group_name_availibity(user_name, group_name):
    with shipdb_pool.connect() as connection:
        query = text("""SELECT TRUE FROM user_groups WHERE group_name=:group_name
                     AND user_name=:user_name""")
        query = query.bindparams(bindparam('group_name', group_name),
                                 bindparam('user_name', user_name))
        res = connection.execute(query)
        return res.fetchone() is not None


# 04. List all groups and MMSI added in these groups
class User_Groups_of_Interest(Resource):
    def get(self):
        return self.Groups_of_Interest()

    @token_required
    def Groups_of_Interest(self, user_name):
        with shipdb_pool.connect() as connection:
            query = text("""SELECT group_name,mmsi_list FROM user_groups
                            WHERE user_name=:user_name ORDER BY group_name""")
            query = query.bindparams(bindparam('user_name', value=user_name))
            res = connection.execute(query)
            res = res.fetchall()
            user_groups = []

            # Create a list to store the MMSI numbers for all groups
            all_mmsi = []
            # Create a mapping of MMSI to ship name
            mmsi_ship_map = {}

            for row in res:
                group_name = row[0]
                mmsi_list = row[1]
                all_mmsi.extend(mmsi_list)

                # Add the MMSI numbers to the map for later use
                for mmsi in mmsi_list:
                    if mmsi not in mmsi_ship_map:
                        mmsi_ship_map[mmsi] = None

            # Retrieve ship names for all MMSI numbers using a single query
            ship_query = text("""SELECT mmsi,ship_name FROM ship WHERE mmsi IN :mmsi_list""")
            ship_query = ship_query.bindparams(bindparam('mmsi_list', value=tuple(all_mmsi), expanding=True))
            with shipdb_pool.connect() as conn:
                ship_result = conn.execute(ship_query)
                for mmsi, ship_name in ship_result.fetchall():
                    mmsi_ship_map[mmsi] = ship_name
            # Process the data to create the response
            for row in res:
                group_name = row[0]
                mmsi_list = row[1]
                ship_info = [{"name": mmsi_ship_map[mmsi], "mmsi": mmsi} for mmsi in mmsi_list
                             if mmsi_ship_map[mmsi]]
                data = {"group_name": group_name, "group_info": sorted(ship_info, key=lambda j: j['name'])}
                user_groups.append(data)
        return make_response(jsonify({"status": "success", "data": user_groups}), 200)


# 05. Add MMSI to an existing group or to a new group
class Add_Ship_to_GoI(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.Add_to_Group(data)

    @token_required
    def Add_to_Group(self, data, user_name):
        group_name = data["group_name"]
        mmsi = data['mmsi']  # array

        if data['flag']:  # create group and add mmsi
            if check_group_name_availibity(user_name, group_name):
                msg = "Choose a new group name, the entered name already exists!"
                return make_response(jsonify({"status": "failure", "message": msg}), 400)

            with shipdb_pool.connect() as connection:
                if not mmsi:
                    query = text("""INSERT INTO user_groups (user_name, group_name, mmsi_list)
                                    VALUES (:user_name, :group_name, ARRAY[]::integer[])""")
                else:
                    query = text("""INSERT INTO user_groups (user_name, group_name, mmsi_list)
                                    VALUES (:user_name, :group_name, ARRAY[:mmsi])""")
                    query = query.bindparams(bindparam('mmsi', value=mmsi))

                query = query.bindparams(bindparam('user_name', value=user_name),
                                         bindparam('group_name', value=group_name))

                connection.execute(query)
                msg = "Created group " + group_name + " for user " + user_name if not mmsi else \
                    "Added " + str(mmsi) + " to user group " + group_name

        else:  # append to existing group
            with shipdb_pool.connect() as connection:
                query = text("""SELECT :mmsi=ANY(mmsi_list) FROM user_groups
                            WHERE group_name=:group_name AND user_name=:user_name""")
                query = query.bindparams(bindparam('mmsi', value=mmsi),
                                         bindparam('group_name', value=group_name),
                                         bindparam('user_name', value=user_name))
                res = connection.execute(query).scalar()

                if res:
                    msg = "Selected MMSI already exists in the group, " + group_name
                    return make_response(jsonify({"status": "failure", "message": msg}), 400)

                query = text("""UPDATE user_groups SET mmsi_list=ARRAY_APPEND(mmsi_list, :mmsi)
                                WHERE group_name=:group_name AND user_name=:user_name""")
                query = query.bindparams(bindparam('mmsi', value=mmsi),
                                         bindparam('group_name', value=group_name),
                                         bindparam('user_name', value=user_name))
                connection.execute(query)
                msg = "Added " + str(mmsi) + " to user group " + group_name

        return make_response(jsonify({"status": "success", "message": msg}), 200)


# 06. Delete a group or MMSI within a group
class Delete_Ship_from_GoI(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.Delete_from_Group(data['mmsi'], data['group_name'])

    @token_required
    def Delete_from_Group(self, mmsi, group_name, user_name):
        if mmsi:
            with shipdb_pool.connect() as connection:
                query = text("""SELECT :mmsi=ANY(mmsi_list) FROM user_groups WHERE
                                group_name=:group_name AND user_name=:user_name""")
                query = query.bindparams(bindparam('mmsi', value=mmsi),
                                         bindparam('group_name', value=group_name),
                                         bindparam('user_name', value=user_name))
                res = connection.execute(query).scalar()

            if not res:
                msg = "MMSI does not exist"
                return make_response(jsonify({"status": "failure", "message": msg}), 400)

            with shipdb_pool.connect() as connection:
                query = text("""UPDATE user_groups SET mmsi_list=ARRAY_REMOVE(mmsi_list, :mmsi)
                                WHERE group_name=:group_name AND user_name=:user_name""")
                query = query.bindparams(bindparam('mmsi', value=mmsi),
                                         bindparam('group_name', value=group_name),
                                         bindparam('user_name', value=user_name))
                connection.execute(query)
            msg = "Successfully deleted {} mmsi".format(mmsi)
        else:
            with shipdb_pool.connect() as connection:
                query = text("""DELETE FROM user_groups WHERE group_name=:group_name
                                AND user_name=:user_name""")
                query = query.bindparams(bindparam('group_name', value=group_name),
                                         bindparam('user_name', value=user_name))
                connection.execute(query)
            msg = "Successfully deleted {} group".format(group_name)

        return make_response(jsonify({"status": "success", "data": msg}), 200)


# 07. Track and ship type anomaly Info for selected SoI
class Ship_Track_Info(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.Track_info(data)

    def track_anomoly_info(self, timestamp, mmsi):
        with shipdb_pool.connect() as connection:
            query = text("""SELECT ship_category.category,ship_name FROM ship INNER JOIN
                ship_category ON ship.category_id=ship_category.category_id WHERE mmsi=:mmsi""")
            query = query.bindparams(bindparam('mmsi', value=mmsi))
            sc = connection.execute(query).fetchone()

            query = text("""SELECT traj_id,stime,etime,sport,dport,destination,distance,
                        transmission_count FROM mmsi_trajectories WHERE mmsi=:mmsi AND
                        stime<=:timestamp ORDER BY traj_id DESC""")
            query = query.bindparams(bindparam('mmsi', value=mmsi),
                                     bindparam('timestamp', value=timestamp))
            traj_data = connection.execute(query).fetchall()

            ship_data = []
            type_data = []

            for i in traj_data:
                traj_details = {"trid": i.traj_id, "atd": str(i.stime), "eta": str(i.etime),
                                "sport": i.sport, "dport": i.dport, "dest": i.destination,
                                "dist": str(i.distance) + ' nmi', "cnt": i.transmission_count,
                                "dos": (i.etime - i.stime).days}
                ship_data.append(traj_details)

                query = text("""SELECT traj_id,previous_type,changed_type,plat,nlat,plong,nlong,
                            ptime,ntime FROM mmsi_anomalies_type WHERE mmsi=:mmsi AND
                            traj_id=:traj_id ORDER BY traj_id DESC""")
                query = query.bindparams(bindparam('mmsi', value=mmsi),
                                         bindparam('traj_id', value=i.traj_id))
                anomoly_data = connection.execute(query).fetchall()
                if len(anomoly_data) == 0:
                    continue
                anomoly_info = []
                for an in anomoly_data:
                    details = {"trid": an.traj_id, "plat": an.plat, "plong": an.plong,
                               "ptype": an.previous_type, "ntype": an.changed_type,
                               "nlat": an.nlat, "nlong": an.nlong,
                               "ptime": str(an.ptime), "ntime": str(an.ntime)}
                    anomoly_info.append(details)

                type_data.append({"trid": i.traj_id, "atd": str(i.stime), "sport": i.sport,
                                 "eta": str(i.etime), "dport": i.dport, "anomoly": anomoly_info})

        traj_info = {"mmsi": mmsi, "sc": sc[0], "traj_info": ship_data, "jc": len(traj_data),
                     "sn": sc[1]}
        anomoly_info = {"mmsi": mmsi, "sc": sc[0], "anomoly_info": type_data, "sn": sc[1]}
        return make_response(jsonify({"status": "success", "traj_data": traj_info,
                                      "anomoly_data": anomoly_info}), 200)

    @token_required
    def Track_info(self, data, user_name):
        timestamp = data["timestamp"]
        if not data['group_name']:
            # SOI / GoI - individual MMSI Selected
            return self.track_anomoly_info(timestamp, data['mmsi'])
        else:
            # GoI - Group selected
            group_name = data['group_name']
            mmsi_list = data['mmsi']
            track_info = []
            anomoly_info = []

            if not mmsi_list:
                query = text("""SELECT mmsi_list FROM user_groups WHERE user_name = :user_name
                                AND group_name = :group_name""")
                query = query.bindparams(bindparam('user_name', value=user_name),
                                         bindparam('group_name', value=group_name))

                with shipdb_pool.connect() as connection:
                    result = connection.execute(query)
                    mmsi_list = result.fetchone()[0]

            for mmsi in mmsi_list:
                query = text("""SELECT ship_category.category, ship_name
                                FROM ship INNER JOIN ship_category
                                ON ship.category_id = ship_category.category_id
                                WHERE mmsi = :mmsi""")
                query = query.bindparams(bindparam('mmsi', value=mmsi))

                with shipdb_pool.connect() as connection:
                    sc = connection.execute(query).fetchone()

                res = self.track_anomoly_info(timestamp, mmsi)
                res = json.loads(res.get_data(as_text=True))

                traj_info = res["traj_data"]
                traj_info.update({"mmsi": mmsi, "sc": sc[0], "sn": sc[1]})
                track_info.append(traj_info)
                anomoly_info.append(res["anomoly_data"])

            return make_response(jsonify({"status": "success", "traj_data": track_info,
                                         "anomoly_data": anomoly_info}), 200)


# 08. Trajectory of selected traj_id in SoI/GoI
class SoI_Trajectory(Resource):
    def post(self):
        post_data = request.get_data().decode("utf-8")
        post_data = json.loads(post_data)
        traj_id = post_data['traj_id']
        timestamp = post_data['timestamp']
        mmsi = post_data['mmsi']
        return self.soi_track_trajectory(timestamp, traj_id, mmsi)

    @token_required
    def soi_track_trajectory(self, timestamp, traj_id, mmsi, _):
        to_date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        from_date = to_date - timedelta(minutes=int(interval))

        query = """SELECT lat,long,ist_time,COALESCE(cog,LAG(cog) OVER(ORDER BY ist_time)) AS cog
                FROM ship_transmission WHERE traj_id=:traj_id AND (ist_time<:timestamp AND smooth_pt
                is true OR ist_time BETWEEN :from_date AND :timestamp) ORDER BY ist_time"""

        annomoly_query = """SELECT nlat AS lat,nlong AS long,ntime AS ist_time
                            FROM mmsi_anomalies_type WHERE traj_id=:traj_id"""

        with shipdb_pool.connect() as connection:
            # Fetch data from the first query
            stmt = text(query).bindparams(traj_id=traj_id, timestamp=timestamp, from_date=from_date)
            result = connection.execute(stmt)
            data = [dict(row) for row in result]

            # Fetch data from the second query and merge it with the first data
            stmt = text(annomoly_query).bindparams(traj_id=traj_id)
            result = connection.execute(stmt)
            data.extend([dict(row) for row in result])

        # Order the merged data by the 'ist_time' column
        data.sort(key=lambda x: x['ist_time'])

        ship = [{"traj_id": traj_id, "mmsi": mmsi, "points": data}]
        return make_response(jsonify({'status': 'success', 'data': ship}), 200)


# 09. Edit group name
class Edit_Groupname(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.goi_username_update(data)

    @token_required
    def goi_username_update(self, data, user_name):
        if data['new_goi'] == data['old_goi']:
            msg = 'Entered same name!'
            return make_response(jsonify({"status": "failure", "data": msg}), 400)
        else:
            group_name = data['new_goi']
            available = check_group_name_availibity(group_name, user_name)
            if not available:
                with shipdb_pool.connect() as connection:
                    query = """UPDATE user_groups SET group_name=:new_goi
                            WHERE group_name=:old_goi AND user_name=:user_name"""
                    stmt = text(query).bindparams(new_goi=data['new_goi'],
                                                  old_goi=data['old_goi'],
                                                  user_name=user_name)
                    connection.execute(stmt)
                msg = 'Group name updated successfully!'
                return make_response(jsonify({"status": "success", "message": msg}), 200)
            else:
                msg = 'Group name not available, choose a different name'
                return make_response(jsonify({"status": "failure", "message": msg}), 400)


api.add_resource(User_Ships_of_Interest, "/interests/user_soi")  # 01
api.add_resource(Add_Ships_of_Interest, "/interests/add_soi")  # 02
api.add_resource(Delete_Ships_of_Interest, "/interests/delete_soi")  # 03
api.add_resource(User_Groups_of_Interest, "/interests/user_goi")  # 04
api.add_resource(Add_Ship_to_GoI, "/interests/add_to_goi")  # 05
api.add_resource(Delete_Ship_from_GoI, "/interests/delete_from_goi")  # 06
api.add_resource(Ship_Track_Info, "/interests/track_info")  # 07
api.add_resource(SoI_Trajectory, "/interests/soi_trajectory")  # 08
api.add_resource(Edit_Groupname, "/interests/update_goi")  # 09
