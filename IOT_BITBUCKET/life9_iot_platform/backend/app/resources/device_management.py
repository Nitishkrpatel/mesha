"""
Device Information Module

This module provides functionality for managing devices of different solutions of a tenant.

Classes:
    DeviceManagement: A resource for handling devices grouping by solutions of a tenant.
"""
import json
import os
import subprocess
from flask import jsonify, make_response
from flask_restful import Resource, reqparse
from app import api
import configparser
from loguru import logger


class DeviceManagement(Resource):
    """
    Resource for managing devices.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful resources.

    """
    parser = reqparse.RequestParser()
    parser.add_argument('tenant_id', type=str, location='args', required=True, help='Tenant ID is required')

    def __init__(self):
        """
        Initializes the DeviceManagement resource.

        Args:
            REGISTRY_BASE_URL (str): The base URL of the registry.
            current_dir (str): The current directory path.
            config_path (str): The path to the configuration file.
            config (configparser.ConfigParser): The configuration parser object.
        """
        current_dir = os.path.dirname(os.path.realpath(__file__))
        config_path = os.path.abspath(os.path.join(current_dir, "../../config.ini"))
        config = configparser.ConfigParser()
        config.read(config_path)
        self.REGISTRY_BASE_URL = config.get("urls", "REGISTRY_BASE_URL", fallback="ERROR: Configuration not found")

    def get(self):
        """
        Handles GET requests for retrieving device information.

        Args:
            tenant_id (str): The ID of the tenant.

        Returns:
            dict: A dictionary containing device information, or an error message.
        """
        args = self.parser.parse_args()
        self.tenant_id = args['tenant_id']
        # Initialize an empty list to store dictionaries
        url = f'{self.REGISTRY_BASE_URL}/v1/devices/{self.tenant_id}'

        # Construct the curl command
        command = [
            'curl',
            '-i',
            '-k',
            '-X', 'GET',
            f'"{url}"'
        ]
        full_command = ' '.join(command)

        result = subprocess.run(full_command, check=True, capture_output=True, text=True, shell=True)
        status_code = result.returncode
        # Check for a successful status code
        if status_code == 0:
            try:
                # Extract JSON data from stdout
                json_start = result.stdout.find('{')
                json_end = result.stdout.rfind('}') + 1
                json_data = result.stdout[json_start:json_end]
                result_data = json.loads(json_data).get('result', [])
                result = []

                # Extract solution name from each 'id' and group by solution name
                for item in result_data:
                    id_parts = item['id'].split(':')
                    solution_name_parts = id_parts[-1].split('_')
                    solution_name = solution_name_parts[1]
                    mac_id = "Not Available"
                    serial_no = "Not Available"

                    response_item = {
                        'id': item['id'],
                        "device_suffix": id_parts[1],
                        'mac_id': mac_id,
                        'serial_no': serial_no,
                        "solution_name": solution_name
                    }
                    result.append(response_item)
                return make_response(jsonify(result), 200)

            except json.JSONDecodeError as e:
                error_message = f"Error decoding JSON: {str(e)}"
                logger.error(error_message)
                return make_response(jsonify({'message': error_message}), 500)
        else:
            # Handle subprocess error
            error_message = f"Error in executing curl command: {full_command}"
            logger.error(error_message)
            return make_response(jsonify({'message': error_message}), status_code)


api.add_resource(DeviceManagement, '/device_list')
