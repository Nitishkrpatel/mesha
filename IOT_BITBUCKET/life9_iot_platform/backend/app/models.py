"""
Database Sqlalchemy Models

This module provides sqlalcheny models for database.

Classes:
    Tenant: A model for tenant information.
    Solutions: A model for tenant solutions.
    ShellScript: A model for simulatior script.

"""
from app import db


class Tenant(db.Model):
    __tablename__ = 'tenants'
    __table_args__ = {'schema': 'iot_platform'}

    tenant_id = db.Column(db.String(255), primary_key=True)
    tenant_name = db.Column(db.String(255), unique=True, nullable=False)

    def __init__(self, tenant_id, tenant_name):
        self.tenant_id = tenant_id
        self.tenant_name = tenant_name


class Solutions(db.Model):
    __tablename__ = 'solutions'
    __table_args__ = {'schema': 'iot_platform'}

    tdfile_blob = db.Column(db.LargeBinary)
    solution_id = db.Column(db.Integer, primary_key=True)
    solution_name = db.Column(db.String(255))
    tenant_id = db.Column(db.String(255))
    devicetd_blob = db.Column(db.LargeBinary)
    root_element = db.Column(db.String(255))
    json_for_data_simulation = db.Column(db.JSON)

    def __init__(self, tdfile_blob, solution_name, tenant_id, devicetd_blob, root_element):
        self.tdfile_blob = tdfile_blob
        self.solution_name = solution_name
        self.tenant_id = tenant_id
        self.devicetd_blob = devicetd_blob
        self.root_element = root_element
        # self.json_for_data_simulation = json_data


class ShellScript(db.Model):
    __tablename__ = 'shell_script'
    __table_args__ = {'schema': 'iot_platform'}
    simulator_script = db.Column(db.LargeBinary)
    serial_no = db.Column(db.Integer, primary_key=True)

    def __init__(self, simulator_script):
        self.simulator_script = simulator_script
