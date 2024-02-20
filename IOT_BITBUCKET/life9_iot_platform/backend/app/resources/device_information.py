"""
Device Information Module

This module provides functionality for managing solutions, including uploading Web of Things
(WoT) Thing Description (TD) JSON files to create solutions and registering things and devices,
listing all solutions for a given tenant, Tree view, and downloading simulation files.

Classes:
    UploadWoTJSON: A resource for handling WoT TD JSON Upload and register things at eclipse ditto
     and devices at eclipse hono, set credentials for devices.
    GetAllSolutions: A resource for handling tenant specific solution list information retrieval.
    GetTreeViewDetails: A resource for handling Tree view represenation of devices.
    DownloadSimulatorDataJSON: A resource for handling simulation files download.
"""
import base64
import json
import os
import subprocess
import tempfile
from flask import jsonify, request, make_response
from flask_restful import Resource, reqparse
from app import api, db
from app.models import Solutions, ShellScript
import configparser
import re
from loguru import logger


# TENANT ADMIN - tenant login app
# Upload tm and tdfiles
class UploadWoTJSON(Resource):
    """
    Resource for uploading Web of Things (WoT) JSON data.
    """
    def __init__(self):
        """
        Initializes the UploadWoTJSON resource.
        Args:
            username (str): The username for accessing the resources.
            password (str): The password for accessing the resources.
            REGISTRY_BASE_URL (str): The base URL of the registry.
            THING_URL (str): The URL for accessing things.
            DITTO_API_BASE_URL (str): The base URL of the Ditto API.
            POLICY_URL (str): The URL for accessing policies.
            AUTH_HEADER (str): The authentication header for accessing resources.
            simulator_templates_list (list): A list to store simulator templates.
        """
        current_dir = os.path.dirname(os.path.realpath(__file__))
        config_path = os.path.abspath(os.path.join(current_dir, "../../config.ini"))
        config = configparser.ConfigParser()
        config.read(config_path)

        self.username = str(config.get("credentials", "USERNAME", fallback="ERROR: Configuration not found"))
        self.password = str(config.get("credentials", "PASSWORD", fallback="ERROR: Configuration not found"))

        self.REGISTRY_BASE_URL = config.get("urls", "REGISTRY_BASE_URL", fallback="ERROR: Configuration not found")
        self.THING_URL = config.get("urls", "THING_URL", fallback="ERROR: Configuration not found")
        self.DITTO_API_BASE_URL = config.get("urls", "DITTO_API_BASE_URL", fallback="ERROR: Configuration not found")
        self.POLICY_URL = config.get("urls", "POLICY_URL", fallback="ERROR: Configuration not found")

        self.AUTH_HEADER = f"Basic {base64.b64encode(f'{self.username}:{self.password}'.encode('ascii')).decode('ascii')}"
        # List to store simulator templates - for download scripts
        self.simulator_templates_list = []

    def post(self):
        """
        Handles POST requests for uploading WoT JSON data to create solutions.

        Args:
            json_data (dict): The JSON data containing solution details.
            file_name (str): The name of the file being uploaded.
            tenant_id (str): The ID of the tenant associated with the solution.
            device_td (dict): The JSON data containing device details.

        Returns:
            dict: A dictionary containing a success message or an error message.
        """
        # Handle the incoming JSON data and file upload to the database
        json_data = request.form.get('solutionJsonData')
        self.hierarchy_tm = json.loads(json_data)

        solution_name = request.form.get('fileName')
        self.tenant_id = request.form.get('tenantId')

        device_td = request.form.get('deviceJsonData')
        self.device_td = json.loads(device_td)

        # Check if the JSON data is present
        if not self.hierarchy_tm or not self.device_td:
            return jsonify({'message': 'No JSON data provided'})

        hierarchy_tm = json.dumps(self.hierarchy_tm).encode('utf-8')
        devicetd_blob = json.dumps(self.device_td).encode('utf-8')
        # Solution name created from the user input
        self.solution_name = solution_name.replace(" ", "")
        self.root_element = self.hierarchy_tm['root']
        try:
            # Store the solution data in the database
            solution_instance = Solutions(
                tdfile_blob=hierarchy_tm,
                solution_name=self.solution_name,
                tenant_id=self.tenant_id,
                devicetd_blob=devicetd_blob,
                root_element=self.root_element
            )
            db.session.add(solution_instance)
            db.session.commit()
            # Access the auto generated solution_id after the commit
            self.inserted_solution_id = solution_instance.solution_id
        except Exception as e:
            # Rollback the session to clear any pending changes
            db.session.rollback()
            # try:
            #     sequence_name = 'your_sequence_name'  # Replace with your actual sequence name
            #     db.engine.execute(f"SELECT setval('{sequence_name}', last_value - 1)")
            # except Exception as e:
            #     logger.error(f'Failed to decrease sequence value: {str(e)}')
            # Delete the solution instance added
            if 'solution_instance' in locals():
                db.session.delete(solution_instance)
            logger.exception(
                f'An error occurred during WoT TM and TD upload: {str(e)}')
            return make_response(jsonify({'message': 'Failed to upload TM and TD'}), 500)
        try:
            # Extract information from the uploaded JSON data
            self.solutions_hierarchy = []
            self.config_levels_count = []
            self.devices = []
            # Using len to get details of  levels like 'block1', 'block2'
            num_blocks = len(self.hierarchy_tm['properties'])

            # Extract information about each level and access its keys in 'properties'
            for i in range(num_blocks):
                # Levels defined in properties, Ex: No. of blocks
                block_key = list(self.hierarchy_tm['properties'].keys())[i]
                # Access properties of keys fetched from outermost properties key
                # Ex. Each block has its own set of properties, like block, floors, apartments
                solution_data = self.hierarchy_tm['properties'][block_key]['properties']
                # Levels with each block like block, No.of floors, No. of apartments
                solution_hierarchy = list(solution_data.keys())
                self.solutions_hierarchy.append(solution_hierarchy)

                config = {}
                device_count = {}
                # Accessing properties within solution hierarchy - Ex,for block, floors, apartments
                for key in range(len(solution_hierarchy)):
                    sol_info = solution_data.get(solution_hierarchy[key], {}).get('properties', {})
                    # keys within innermost properties
                    sol_info_keys = list(sol_info.keys())
                    # access value of innermost properties, which is a dictionary
                    for index, inner_dict in enumerate(sol_info.values()):
                        # Access innermost dictionary to fetch key 'default'
                        for inner_key, value in inner_dict.items():
                            if inner_key == 'default':
                                # defines no of floors, apartments in a block or so
                                config[sol_info_keys[index]] = value
                            # device list - fetch device count in each level
                            elif inner_key == 'items':
                                device_count[sol_info_keys[index]
                                             ] = inner_dict['items']['enum']
                self.devices.append(device_count)
                self.config_levels_count.append(config)
        except Exception as e:
            logger.exception(
                f'An error occurred during WoT TM and TD read: {str(e)}')
            return make_response(jsonify({'message': 'Failed to read TM and TD config'}), 500)

        # create Policy and things as per WoT TD
        if not self.create_policy():
            db.session.rollback()
            # try:
            #     sequence_name = 'your_sequence_name'  # Replace with your actual sequence name
            #     db.engine.execute(f"SELECT setval('{sequence_name}', last_value - 1)")
            # except Exception as e:
            #     logger.error(f'Failed to decrease sequence value: {str(e)}')
            if 'solution_instance' in locals():
                db.session.delete(solution_instance)
            logger.exception('An error occurred during policy creation')
            return make_response(jsonify({'message': 'Creation of policy failed'}), 500)

        if not self.create_things():
            db.session.rollback()
            # # Attempt to decrease the sequence by one value
            # try:
            #     sequence_name = 'your_sequence_name'  # Replace with your actual sequence name
            #     db.engine.execute(f"SELECT setval('{sequence_name}', last_value - 1)")
            # except Exception as e:
            #     logger.error(f'Failed to decrease sequence value: {str(e)}')
            if 'solution_instance' in locals():
                db.session.delete(solution_instance)
            logger.exception('An error occurred during things creation')
            return make_response(jsonify({'message': 'Creation of things failed'}), 500)
        return make_response(jsonify({'message': 'JSON data stored and devices registered successfully'}), 200)

    def create_policy(self):
        """
        Creates device policiy for a tenant.

        Args:
            tenant_id (str): The ID of the tenant to be associated with the policy.

        Returns:
            bool: True if the policy creation is successful, False otherwise.
        """
        # Create device policy
        DEVICE_POLICY = {
            "entries": {
                "DEFAULT": {
                    "subjects": {
                        "nginx:ditto": {
                            "type": "Ditto user authenticated via nginx"
                        }
                    },
                    "resources": {
                        "thing:/": {
                            "grant": ["READ", "WRITE"],
                            "revoke": []
                        },
                        "policy:/": {
                            "grant": ["READ", "WRITE"],
                            "revoke": []
                        },
                        "message:/": {
                            "grant": ["READ", "WRITE"],
                            "revoke": []
                        }
                    }
                },
                "HONO": {
                    "subjects": {
                        "pre-authenticated:hono-connection-" + str(self.tenant_id): {
                            "type": "Connection to Eclipse Hono"
                        }
                    },
                    "resources": {
                        "thing:/": {
                            "grant": ["READ", "WRITE"],
                            "revoke": []
                        },
                        "message:/": {
                            "grant": ["READ", "WRITE"],
                            "revoke": []
                        }
                    }
                }
            }
        }
        self.POLICY = str(self.tenant_id) + ':thing_policy'

        curl_command_policy = [
            'curl',
            '--location',
            '--request', 'PUT',  # Corrected to PUT
            f'{self.POLICY_URL}/{self.POLICY}',  # Using the correct base URL and policy endpoint
            '--header', 'Content-Type: application/json',
            '--data-raw', json.dumps(DEVICE_POLICY),  # Serialize DEVICE_POLICY to JSON
            '--header', f'Authorization: Basic {base64.b64encode(f"{self.username}:{self.password}".encode("ascii")).decode("ascii")}',
            '--insecure',  # Use this only for testing, consider removing in production
        ]
        try:
            subprocess.run(curl_command_policy, check=True, text=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.exception(f'An error occurred during policy creation: {e}')
            return False

    def create_things(self):
        """
        Creates things based on the Web of Things (WoT) configuration and hierarchy.

        Args:
            wot_config (list): A list containing dictionaries representing the WoT configuration.
            solutions_hierarchy (list): A list containing lists representing the hierarchy of solutions.

        Returns:
            bool: True if the thing creation is successful, False otherwise.
        """
        try:
            for i, config in enumerate(self.config_levels_count):
                device_stage = self.devices[i]
                devices_count = [len(values) for values in device_stage.values()]
                devices_names = [values for values in device_stage.values()]
                remaining_levels = {}
                ith_level = self.solutions_hierarchy[i]
                config_level = list(config.keys())
                key_id = config.get(config_level[0], {})

                for i, (key, value) in enumerate(config.items()):
                    if i == 0:
                        remaining_levels.update({ith_level[i]: 1})
                    else:
                        remaining_levels.update({ith_level[i]: value})
        except Exception as e:
            logger.exception(f'An error occurred during things creation: {e}')
            return False

        level = {}
        try:
            self.generate_structure_from_tm(level, list(remaining_levels.keys()), remaining_levels)
            self.generate_structure_from_td(level, ith_level, key_id, devices_names, devices_count)
        except Exception as e:
            logger.exception(f'An error occurred during structure geneartion: {e}')
            return False
        return True

    def generate_structure_from_tm(self, level, remaining_structure, remaining_levels_dict):
        """
        Generates a hierarchical structure based on the provided parameters.

        Args:
            level (dict): The current level in the hierarchical structure.
            remaining_structure (list): The remaining structure to be generated.
            dict_test (dict): A dictionary specifying the count for each key in the structure.

        Returns:
            None: The function modifies the 'level' dictionary in place.

        """
        if not remaining_structure:
            return

        current_key = remaining_structure[0]
        count = remaining_levels_dict.get(current_key, 1)

        for i in range(1, count + 1):
            level[current_key + str(i)] = {}
            # recursive call for mutilple levels
            self.generate_structure_from_tm(
                level[current_key + str(i)], remaining_structure[1:], remaining_levels_dict)

    def generate_structure_from_td(self, template, hierarchy, key_id, devices_names, devices_count, parent_id=None, index=None, count_list=[], name_list=[]):
        """
        Generates a hierarchical structure from a template.

        Args:
            template (dict): The template to generate the structure from.
            hierarchy (list): The hierarchy of keys.
            key_id (str): The ID of the key.
            parent_id (str, optional): The ID of the parent element. Defaults to None.
            index (int, optional): The index of the element. Defaults to None.

        Returns:
            dict: The generated hierarchical structure.
        """
        device_count = devices_count.pop(0) if devices_count else 0
        devices_name = devices_names[0] if devices_names else ""
        devices_names = devices_names[1:]
        if device_count != 0:
            count_list.append(device_count)
        else:
            if count_list:
                devices_count.extend(count_list)
                count_list = []

        if devices_name != "":
            name_list.append(devices_name)
        else:
            if name_list:
                devices_names.extend(name_list)
                name_list = []

        for index, (key, value) in enumerate(template.items()):
            current_id = str(key)
            if parent_id is None:
                custom_id = f"{hierarchy[0]}:{key_id}"
            else:
                updated_parent_id = re.sub(r':', '.', parent_id)
                custom_id = f"{updated_parent_id}:{current_id}"

            level = re.sub(r'\d+', '', key)
            path = path = re.sub(
                r':', '.', parent_id) if parent_id is not None else custom_id.split(':')[0]

            attributes = {
                "Name": f'{level}Name',
                "ID": custom_id,
                "Type": level,
                self.solution_name: path
            }
            thing_attribute_payload = {
                "policy": self.POLICY,
                "policyId": self.POLICY,
                "attributes": attributes
            }

            curl_command_status = self.update_digital_twin(custom_id, thing_attribute_payload)
            if not curl_command_status:
                return make_response(jsonify({'message': "Failed creating thing"}))

            for i in range(device_count):
                device_id = devices_name[i]  # unique name
                # Execute this part of the code only when parent_id is not None
                digits = re.findall(r'\d+', custom_id)
                # Join the extracted digits with underscores
                result_string = ''.join(digits)
                hono_device = "device_" + self.solution_name + "_" + device_id + "_" + result_string
                path = re.sub(r':', '.', custom_id)
                thing_id = f'{self.tenant_id + "."}{custom_id.replace(":", ".") + ":"}{hono_device}'
                device_password = 'my-password'
                # Create the device using the provided input
                device_prop = self.create_device(thing_id, device_id, custom_id, path)
                topic = thing_id.replace(":", "/")
                if not self.device_registry(thing_id, hono_device, device_password):
                    logger.error(f"Device registration failed for {thing_id} {hono_device}")
                    return make_response(jsonify({'message': 'Failed to create device'}), 500)

                simulator_template = {
                    "topic": topic,
                    "headers": {},
                    "auth_info": {hono_device: device_password},
                    "tenant": self.tenant_id,
                    "path": "/features",
                    "value": device_prop}
                # Append the simulator template to the list
                self.simulator_templates_list.append(simulator_template)
            # recursive call for mutilple devices
            self.generate_structure_from_td(
                value, hierarchy, key_id, devices_names, devices_count, custom_id, index)
        # Get the existing solution from the database
        existing_solution = db.session.query(Solutions).filter_by(solution_id=self.inserted_solution_id).first()
        if existing_solution:
            # Update the json_for_data_simulation column
            existing_solution.json_for_data_simulation = self.simulator_templates_list
            db.session.commit()

    def create_device(self, thing_id, unique_device_name, custom_id, path):
        """
        Registers a device using the provided parameters.

        Args:
            thing_id (str): The ID of the device.
            unique_device_name (str): A unique name for the device.
            solution (str): The solution or category the device belongs to.
            custom_id (str): A custom ID for the device.
            path (str): The path or location information related to the device.

        Returns:
            dict: A dictionary containing information about the registered device.

        Raises:
            Any specific exceptions that might occur during the registration process.
        """
        common_attributes = {
            "solution_name": self.solution_name,
            "id": custom_id,
            "MACID": 'MACID',
            "serialNumber": 'SerialNumber',
            self.solution_name: path
        }
        thing_payload_device = self.create_hono_device(common_attributes, unique_device_name)
        device_prop = thing_payload_device.get("features")
        curl_command_status = self.update_digital_twin(thing_id, thing_payload_device)
        if not curl_command_status:
            return make_response(jsonify({'message': "Failed creating thing"}))

        return device_prop

    def create_hono_device(self, attributes, device_name):
        """
        Recursively constructs a hierarchy from a dictionary.

        Args:
            dictionary (dict): The dictionary containing the hierarchy data.
            current_hierarchy (dict, optional): The current hierarchy being constructed. Defaults to None.
            current_level (int, optional): The current level in the hierarchy. Defaults to 0.
            prefix (str, optional): The prefix for hierarchy keys. Defaults to ''.
            solution_hierarchy (list, optional): The hierarchy structure. Defaults to None.

        Returns:
            list: A list of dictionaries representing the constructed hierarchy.
        """
        data = self.device_td
        device_title = None
        for device_title in data:
            if device_title['title'] == device_name:
                self.device_title = device_title
                break
        if self.device_title is None:
            logger.error(f"Device {device_name} not found")
            self.device_title = 'unknowndevice'

        # Extract properties
        prop = self.device_title.get('properties', {})
        prop = {key: {"properties": {"value": None}} for key in prop}
        return {
            "policy": self.POLICY,
            "policyId": self.POLICY,
            "attributes": attributes,
            "features": prop
        }

    def update_digital_twin(self, thing_id, thing_payload):
        """
        Updating a thing with attributes using cURL command.

        Args:
            thing_id (str): The ID of the thing to be updated.
            thing_payload (dict): The payload containing the updated information for the thing.

        Returns:
            bool: True if the thing update is successful, False otherwise.
        """
        command = [
            'curl',
            '--location',
            '--request', 'PUT',
            f'{self.THING_URL}/{thing_id}',
            '--header', 'Content-Type: application/json',
            '--data-raw', json.dumps(thing_payload),
            '--header', f'Authorization: {self.AUTH_HEADER}'
        ]
        try:
            # Execute a subprocess command
            subprocess.run(command, check=True, text=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed updating a thing {command}: {e}")
            return False

    def device_registry(self, thing_id, auth_id, password):
        """
        Registers a device in the device registry.

        Args:
            thing_id (str): The ID of the device.
            auth_id (str): The authentication ID for the device.
            password (str): The password for the device.

        Returns:
            dict: A dictionary containing a success message or an error message.
        """
        # Initial curl command
        register_device = [
            '/usr/bin/curl',
            '-i',
            '-k',
            '-X', 'POST',
            f'{self.REGISTRY_BASE_URL}/v1/devices/{self.tenant_id}/{thing_id}'
        ]
        try:
            # Execute the curl command to register the device
            subprocess.run(register_device, check=True)
        except subprocess.CalledProcessError as e:
            return make_response(jsonify({'message': f"Error creating device: {e}"}))
        # Set credentials for device
        endpoint = f"{self.REGISTRY_BASE_URL}/v1/credentials/{self.tenant_id}/{thing_id}"
        data = [
            {
                "type": "hashed-password",
                "auth-id": auth_id,
                "secrets": [
                    {
                        "pwd-plain": password
                    }
                ]
            }
        ]
        curl_command = [
            '/usr/bin/curl',
            '-i',
            '-k',
            '-X', 'PUT',
            '-H', 'Content-Type: application/json',
            '--data', json.dumps(data), endpoint
        ]
        try:
            # Execute the curl command to create device credentials
            subprocess.run(curl_command, check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Error creating device credentials: {e}")
            return False
            # return make_response(jsonify({'message': f"Error creating device credentials: {e}"}))


# Fetch all solutions of a tenant, given tenant ID
class GetAllSolutions(Resource):
    """
    Resource for retrieving all solutions associated with a specific tenant.

    Args:
        parser (reqparse.RequestParser): The request parser for parsing the request parameters.
            It expects a 'tenant_id' parameter in the request.

    Attributes:
        parser (reqparse.RequestParser): The request parser for parsing the request parameters.
        tenant_id (str): The ID of the tenant for which solutions are retrieved.
    """
    parser = reqparse.RequestParser()
    parser.add_argument('tenant_id', type=str, location='args', required=True, help='Tenant ID is required')

    def get(self):
        """
        Handles GET requests to retrieve all solutions associated with a specific tenant.

        Args:
            tenant_id (str): The ID of the tenant associated with the solution.

        Returns:
            dict: A dictionary containing the list of solutions associated with the tenant,
                  or an error message if an exception occurs.
        """
        try:
            # # Fetch all solutions from the Solutions table
            args = self.parser.parse_args()
            self.tenant_id = args['tenant_id']
            # Fetch solutions for the specified tenant_id
            solutions = Solutions.query.with_entities(
                Solutions.solution_name,
                Solutions.solution_id,
                Solutions.root_element
            ).filter_by(tenant_id=self.tenant_id).all()

            # Convert the solution types to a list of dictionaries
            solution_types_list = [
                {
                    'solution_name': solution.solution_name,
                    'solution_id': solution.solution_id,
                    'root': solution.root_element
                }
                for solution in solutions
            ]
            # Sort the list of dictionaries by the 'solution_id' key
            solution_types_list = sorted(solution_types_list, key=lambda x: x['solution_id'])
            return make_response(jsonify({'solution_types': solution_types_list}), 200)
        except Exception as e:
            logger.exception(f'Failed to fetch solution list: {str(e)}')
            return make_response(jsonify({'message': 'Failed to fetch solution list'}), 500)


class GetTreeViewDetails(Resource):
    """
    Resource for retrieving tree view details for a given solution ID and path.
    """
    parser = reqparse.RequestParser()
    parser.add_argument('solution_id', type=str, location='args', required=True, help='solution id is required')
    parser.add_argument('path', type=str, location='args', required=True, help='path is required')

    def __init__(self):
        """
         Initializes the GetTreeViewDetails resource.

        Reads configuration values from config.ini file and initializes required attributes.

        Args:
            username (str): The username for authentication.
            password (str): The password for authentication.
            DITTO_SEARCH_URL (str): The base URL for the Ditto search API.
        """
        current_dir = os.path.dirname(os.path.realpath(__file__))
        config_path = os.path.abspath(os.path.join(current_dir, "../../config.ini"))

        config = configparser.ConfigParser()
        config.read(config_path)
        self.username = str(config.get("credentials", "USERNAME", fallback="ERROR: Configuration not found"))
        self.password = str(config.get("credentials", "PASSWORD", fallback="ERROR: Configuration not found"))
        self.DITTO_SEARCH_URL = str(config.get("urls", "DITTO_SEARCH_URL", fallback="ERROR: Configuration not found"))

    def get(self):
        """
        Handles GET requests to retrieve tree view details for a given solution ID and path.

        Returns:
            dict: A dictionary containing the tree view details or an error message.

        Args:
            solution_id (str): The ID of the solution.
            path (str): The path to retrieve tree view details for.
        """
        args = self.parser.parse_args()
        self.solution_name = args['solution_id']
        self.path = args['path']

        # Constructing the URL with quotes around the filter value
        url = f'{self.DITTO_SEARCH_URL}?filter=eq(attributes/{self.solution_name},\'{self.path}\')&fields=thingId'

        # Construct the curl command
        command = [
            'curl',
            '-i',
            '-X', 'GET',
            '-u', f'{self.username}:{self.password}',
            f'"{url}"'
        ]

        # Join the command elements without extra quotes
        full_command = ' '.join(command)
        try:
            result = subprocess.run(full_command, check=True, capture_output=True, text=True, shell=True)
            status_code = result.returncode
            # Check for a successful status code
            if status_code == 0:
                if not result.stdout.strip():
                    return {'message': 'Empty response from curl command.'}
                # Extract the JSON content from the curl output
                json_start = result.stdout.find("{")
                json_end = result.stdout.rfind("}") + 1
                output_json = result.stdout[json_start:json_end]
                output_json = json.loads(output_json)
                # Add count to the JSON
                count = len(output_json['items'])
                response_data = {'status_code': status_code, 'count': count, 'data': output_json['items']}
                return make_response(jsonify(response_data), status_code)
            else:
                response_data = {'status_code': status_code, 'error': f'Error in executing curl command: {full_command}'}
                logger.error(response_data['error'])
                return make_response(jsonify(response_data), status_code)
        except subprocess.CalledProcessError as e:
            error_output = e
            response_data = {'status_code': 500, 'error': f'An error occurred: {error_output}'}
            logger.error(response_data['error'])
            return make_response(jsonify(response_data), 500)


class DownloadSimulatorDataJSON(Resource):
    """
    Resource for downloading simulator device details and shell script.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful resources.

    """
    def get(self, solution_id):
        """
        Handles GET requests to download simulator device details in JSON format and shell script for a given solution ID.

        Args:
            solution_id (str): The ID of the solution.

        Returns:
            dict: A dictionary containing the solution name, file contents and script content, or an error message if the solution is not found.
        """
        # Query the database to get json_for_data_simulation for the given solution_id
        solution = db.session.query(Solutions).filter_by(solution_id=solution_id).first()

        if solution:
            # Convert json_for_data_simulation to a temporary file
            with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_file:
                temp_file.write(json.dumps(solution.json_for_data_simulation, indent=2))
                temp_file_path = temp_file.name

            # Read the content of the file
            with open(temp_file_path, 'r') as file_content:
                file_content_str = file_content.read()

            # Query the database to get the shell script data
            shell_script = ShellScript.query.first()
            if shell_script:
                # Convert binary script content to a string
                script_content = shell_script.simulator_script.decode('utf-8')
                # Create a temporary file with a '.sh' extension
                with tempfile.NamedTemporaryFile(mode='w+', suffix='.sh', delete=False) as script_temp_file:
                    script_temp_file.write(script_content)
                    script_temp_file_path = script_temp_file.name

                # Read the content of the script file
                with open(script_temp_file_path, 'r') as script_file_content:
                    script_file_content_str = script_file_content.read()

            # Include solution_name and file content in the response body
            response_data = {
                "solution_name": solution.solution_name,
                "file_content": file_content_str,
                "script_content": script_file_content_str
            }
            return make_response(jsonify(response_data), 200)
        else:
            logger.error('Solution not found')
            return make_response(jsonify({'message': 'Solution not found'}), 404)


# Add resources to the API
api.add_resource(UploadWoTJSON, '/upload_solution_and_device')
api.add_resource(GetAllSolutions, '/get_all_solution_types')
api.add_resource(GetTreeViewDetails, "/tree_view")
api.add_resource(DownloadSimulatorDataJSON, "/download_json/<int:solution_id>")
