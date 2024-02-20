from calendar import monthrange
from datetime import datetime, timedelta
from flask import Blueprint, request, make_response, jsonify
from flask_restful import Api, Resource
import pandas as pd
from src.config import shipdb_pool
from src.support.decorators import token_required
import json


roi = Blueprint("region_of_interest", __name__)
api = Api(roi)


def check_roi_availibity(user_name, roi_name):
    with shipdb_pool.connect() as connection:
        query = "select true from user_roi where region_name=%s and user_name=%s"
        res = connection.execute(query, (roi_name, user_name))
        res = res.fetchone()
    if not res:
        return False
    return res[0]


def roi_name(region_id, user_name):
    with shipdb_pool.connect() as connection:
        query = "select region_name from user_roi where region_id=%s and user_name=%s"
        res = connection.execute(query, (region_id, user_name))
        res = res.fetchone()
    if res:
        return res[0]
    else:
        return ''

class Create_Region(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        roi_name = data['roi']  # region name
        roi_coords = data['roi_coords']
        return self.Add_ROI(roi_name, roi_coords)

    @token_required
    def Add_ROI(self, roi_name, roi_coords, user_name):
        roi = check_roi_availibity(user_name, roi_name)
        roi_created_date = datetime.now()
        if roi:
            msg = "region name is already take, enter new region name!"
            return make_response(jsonify({"status": "failure", "message": msg}), 400)
        geom = "SRID=4326;POLYGON(" + str(roi_coords) + ")"
        with shipdb_pool.connect() as connection:
            query = """INSERT INTO user_roi(created_time,user_name,region_name,
                    region_coords) values (%s,%s,%s,%s);"""
            connection.execute(query, (roi_created_date, user_name, roi_name, geom))
        msg = str(roi_name) + " added to user region of intrest"
        return make_response(jsonify({"status": "success", "data": msg}), 200)


class Display_Regions(Resource):
    def get(self):
        return self.display_roi()

    @token_required
    def display_roi(self, user_name):
        user_roi = []
        with shipdb_pool.connect() as connection:
            query = """select region_id,region_name,ST_AsText(region_coords)
                    from user_roi where user_name=%s"""
            res = connection.execute(query, (user_name,))
        regions = res.fetchall()
        for roi in regions:
            print(roi)
            data = {'region_id': roi[0], 'region_name': roi[1], 'coords': roi[2]}
            user_roi.append(data)
        return make_response(jsonify({"status": "success", "data": user_roi}), 200)


class Delete_Region(Resource):
    def post(self):
        data = request.get_data().decode("utf-8")
        data = json.loads(data)
        region_id = data['roi']  # region id
        return self.Delete_ROI(region_id)

    @token_required
    def Delete_ROI(self, region_id, user_name):
        region_name = roi_name(region_id, user_name)
        if not region_name:
            msg = "region does not exists!."
            return make_response(jsonify({"status": "failure", "data": msg}), 400)
        with shipdb_pool.connect() as connection:
            query = """Delete from user_roi where region_id=%s and user_name=%s;"""
            connection.execute(query, (int(region_id), user_name))
        msg = str(region_name) + " deleted from user region of intrest"
        return make_response(jsonify({"status": "success", "data": msg}), 200)


class Edit_Region(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.edit_roi(post_data)

    @token_required
    def edit_roi(self, data, user_name):
        if data['old_roi'] == data['new_roi']:
            msg = 'same region name'
            return make_response(jsonify({"status": "failure", "data": msg}), 400)
        else:
            with shipdb_pool.connect() as connection:
                query = """update user_roi set region_name=%s where region_name=%s
                        and user_name=%s;"""
                connection.execute(query, (data['new_roi'], data['old_roi'], user_name))
            msg = "ROI name is updated"
            return make_response(jsonify({"status": "success", "data": msg}), 200)


class Region_LKP(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.roi_lkp(post_data)

    @token_required
    def roi_lkp(self, post_data, user_name):
        pass


class Region_Anomaly(Resource):
    def post(self):
        post_data = json.loads(request.get_data().decode("utf-8"))
        return self.roi_anomaly(post_data)

    @token_required
    def roi_anomaly(self, post_data, user_name):
        pass


api.add_resource(Create_Region, "/interests/create_roi")
api.add_resource(Display_Regions, "/interests/display_roi")
api.add_resource(Delete_Region, "/interests/delete_roi")
api.add_resource(Edit_Region, "/interests/edit_roi")
api.add_resource(Region_LKP, "/interests/roi_lkp")
api.add_resource(Region_Anomaly, "/interests/roi_anomaly")
