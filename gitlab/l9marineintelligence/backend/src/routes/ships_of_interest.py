from flask import Blueprint, request, make_response, jsonify
from flask_restful import Api, Resource
from src.config import shipdb_pool
from src.support.decorators import token_required
from src.config import interval
import json
from sqlalchemy import text
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
        with shipdb_pool.connect() as connection:
            res = connection.execute("select ships_of_interest from user_soi where user_name=%s",
                                     (user_name,))
            res = res.fetchone()
        if not res[0]:
            return {"status": "success", "data": []}
        name = []
        for mmsi in res[0]:
            with shipdb_pool.connect() as connection:
                x = connection.execute("select ship_name from ship where mmsi=%s", (mmsi,))
                x = x.fetchone()[0]
            name.append({"name": x, "mmsi": mmsi})
        data = sorted(name, key=lambda i: i['name'])
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
        query = "SELECT TRUE FROM user_soi WHERE %s=ANY(ships_of_interest) and user_name=%s"
        with shipdb_pool.connect() as connection:
            res = connection.execute(query, (mmsi, user_name))
            res = res.fetchone()
        if res:
            msg = "MMSI already present in ships of interest"
            return make_response(jsonify({"status": "failure", "message": msg}), 400)
        else:
            with shipdb_pool.connect() as connection:
                query = """UPDATE user_soi SET ships_of_interest=ships_of_interest||ARRAY[%s]
                            WHERE user_name=%s"""
                connection.execute(query, (mmsi, user_name))
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
        query = "SELECT TRUE FROM user_soi WHERE %s=ANY(ships_of_interest) and user_name=%s"
        with shipdb_pool.connect() as connection:
            res = connection.execute(query, (mmsi, user_name))
            res = res.fetchone()
        if res[0]:
            query = """UPDATE user_soi SET ships_of_interest=ARRAY_REMOVE(ships_of_interest,%s)
                    WHERE user_name=%s"""
            with shipdb_pool.connect() as connection:
                connection.execute(query, (mmsi, user_name))
            msg = str(mmsi) + " deleted from user ships of interest"
            return make_response(jsonify({"status": "success", "data": msg}), 200)
        else:
            msg = """Cannot delete MMSI, does not exists in ships of interest"""
            return make_response(jsonify({"status": "failure", "message": msg}), 400)


# GoI
# Check availabilty of group name for group creation
def check_group_name_availibity(user_name, group_name):
    with shipdb_pool.connect() as connection:
        query = "select true from user_groups where group_name=%s and user_name=%s"
        res = connection.execute(query, (group_name, user_name))
        res = res.fetchone()
    if not res:
        return False
    return res[0]


# 04. List all groups and MMSI added in these groups
class User_Groups_of_Interest(Resource):
    def get(self):
        return self.Groups_of_Interest()

    @token_required
    def Groups_of_Interest(self, user_name):
        with shipdb_pool.connect() as connection:
            res = connection.execute("""select group_name,mmsi_list from user_groups
                            where user_name=%s order by group_name""", (user_name,))
            res = res.fetchall()
        if not res[0]:
            return {"status": "success", "data": []}
        user_groups = []
        for row in res:
            name = []
            for mmsi in row[1]:
                with shipdb_pool.connect() as connection:
                    x = connection.execute("select ship_name from ship where mmsi=%s", (mmsi,))
                    x = x.fetchone()[0]
                name.append({"name": x, "mmsi": mmsi})
            data = {"group_name": row[0], "group_info": sorted(name, key=lambda j: j['name'])}
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
                msg = "Choose new group name, Entered name already exists!"
                return make_response(jsonify({"status": "failure", "message": msg}), 400)
            if not mmsi:
                with shipdb_pool.connect() as connection:
                    connection.execute("""insert into user_groups(user_name,group_name,mmsi_list)
                                    values(%s,%s,%s::integer[])""", (user_name, group_name, []))
                msg = "Created" + group_name + "to user_group"
            else:
                with shipdb_pool.connect() as connection:
                    connection.execute("""insert into user_groups(user_name,group_name,mmsi_list)
                                    values(%s,%s,ARRAY[%s])""", (user_name, group_name, mmsi))
                msg = "Added " + str(mmsi) + " to user group, " + group_name
            return make_response(jsonify({"status": "success", "message": msg}), 200)
        else:  # append to existing group
            with shipdb_pool.connect() as connection:
                query = """select %s=ANY(mmsi_list) from user_groups where group_name=%s
                           and user_name=%s"""
                res = connection.execute(query, (mmsi, group_name, user_name,))
                res = res.fetchone()[0]
            if res:
                msg = "Selected MMSI already exists in the group, " + group_name
                return make_response(jsonify({"status": "failure", "message": msg}), 400)
            with shipdb_pool.connect() as connection:
                query = """update user_groups set mmsi_list=array_append(mmsi_list,%s)
                        where group_name=%s and user_name=%s;"""
                connection.execute(query, (mmsi, group_name, user_name))
            msg = "Added " + str(mmsi) + " to user group, " + group_name
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
                res = connection.execute("""select %s=ANY(mmsi_list) from user_groups where
                            group_name=%s and user_name=%s""", (mmsi, group_name, user_name))
                res = res.fetchone()
            if not res:
                msg = "MMSI does not exists"
                return make_response(jsonify({"status": "failure", "message": msg}), 400)
            update_query = """update user_groups set mmsi_list=array_remove(mmsi_list,%s)
                            where group_name=%s and user_name=%s;"""
            with shipdb_pool.connect() as connection:
                connection.execute(update_query, (mmsi, group_name, user_name,))
            msg = "Successfully deleted {} mmsi".format(mmsi)
        else:
            with shipdb_pool.connect() as connection:
                connection.execute("""delete from user_groups where group_name=%s
                                and user_name=%s""", (group_name, user_name))
            msg = "Successfully deleted {} group".format(group_name)
        return make_response(jsonify({"status": "success", "data": msg}), 200)


# 07. Track and ship type anomaly Info for selected SoI
class Ship_Track_Info(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        return self.Track_info(data)

    def track_anomoly_info(self, timestamp, mmsi):
        ship_data = []
        type = []
        with shipdb_pool.connect() as connection:
            qry = """select ship_category.category,ship_name from ship inner join ship_category
                    on ship.category_id=ship_category.category_id where mmsi=%s"""
            sc = connection.execute(qry, (mmsi,))
        sc = sc.fetchone()
        with shipdb_pool.connect() as connection:
            query = """select traj_id,stime,etime,sport,dport,destination,distance,
                transmission_count from mmsi_trajectories where mmsi=%s and stime<=%s
                order by traj_id desc"""
            traj_data = connection.execute(query, (mmsi, timestamp))
            traj_data = traj_data.fetchall()
            if traj_data:
                for i in traj_data:
                    traj_details = {"trid": i.traj_id, "atd": str(i.stime), "eta": str(i.etime),
                                    "sport": i.sport, "dport": i.dport, "dest": i.destination,
                                    "dist": str(i.distance) + ' nmi', "cnt": i.transmission_count,
                                    "dos": (i.etime - i.stime).days}
                    ship_data.append(traj_details)
                    # ship type anomalies - for each trajectory
                    with shipdb_pool.connect() as connection:
                        query = """select traj_id,previous_type,changed_type,plat,nlat,plong,
                                nlong,ptime,ntime from mmsi_anomalies_type where mmsi=%s and
                                traj_id=%s order by traj_id desc"""
                        anomoly_data = connection.execute(query, (mmsi, i.traj_id))
                        anomoly_data = anomoly_data.fetchall()
                        if anomoly_data:
                            anomoly_info = []
                            for an in anomoly_data:
                                details = {"trid": an.traj_id, "plat": an.plat, "plong": an.plong,
                                           "ptype": an.previous_type, "ntype": an.changed_type,
                                           "nlat": an.nlat, "nlong": an.nlong,
                                           "ptime": str(an.ptime), "ntime": str(an.ntime)}
                                anomoly_info.append(details)
                            type.append({"trid": i.traj_id, "atd": str(i.stime), "sport": i.sport,
                                         "eta": str(i.etime), "dport": i.dport,
                                         "anomoly": anomoly_info})
            traj_info = {"mmsi": mmsi, "sc": sc[0], "traj_info": ship_data, "jc": len(traj_data),
                         "sn": sc[1]}
            anomoly_info = {"mmsi": mmsi, "sc": sc[0], "anomoly_info": type, "sn": sc[1]}
            return make_response(jsonify({"status": "success", "traj_data": traj_info,
                                          "anomoly_data": anomoly_info}), 200)

    @token_required
    def Track_info(self, data, user_name):
        timestamp = data["timestamp"]
        if not data['group_name']:
            # mmsi = int(data['mmsi'])
            # SOI / GoI - individual MMSI Selected
            return self.track_anomoly_info(timestamp, data['mmsi'])
        else:
            # GoI - Group selected
            group_name = data['group_name']
            mmsi_list = data['mmsi']
            track_info = []
            anomoly_info = []
            if not mmsi_list:
                query = "SELECT mmsi_list FROM user_groups WHERE user_name=%s and group_name=%s"
                with shipdb_pool.connect() as connection:
                    result = connection.execute(query, (user_name, group_name))
                    mmsi_list = result.fetchone()[0]
            for mmsi in mmsi_list:
                res = self.track_anomoly_info(timestamp, mmsi)
                res = json.loads(res.get_data(as_text=True))
                track_info.append(res["traj_data"])
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
        query = """SELECT lat,long,ist_time,cog FROM ship_transmission WHERE traj_id=:traj_id
                   and (ist_time<:timestamp and smooth_pt is true or ist_time between
                   :from_date and :timestamp) order by ist_time"""
        with shipdb_pool.connect() as connection:
            stmt = text(query).bindparams(traj_id=traj_id, timestamp=timestamp, from_date=from_date)
            result = connection.execute(stmt)
            data = [dict(row) for row in result]
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
                    connection.execute("""update user_groups set group_name=%s where
                                       group_name=%s and user_name=%s""",
                                       (data['new_goi'], data['old_goi'], user_name))
                msg = 'Group name updated succesfully!'
                return make_response(jsonify({"status": "success", "message": msg}), 200)
            else:
                msg = 'Group name not available, choose different name'
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
