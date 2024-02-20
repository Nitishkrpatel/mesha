"""
Tenant Registration Module

This module provides functionality for managing tenants, including creating tenant and
registering tenant admins in keycloak, edit tenane name, listing all tenants.

Classes:
    TenantRegistration: A resource for handling tenant registration operations.
    EditTenant: A resource for handling tenant name changes.
    TenantInformation: A resource for handling tenants information retrieval.
"""
import json
import secrets
from flask_restful import Resource, reqparse
from flask import jsonify, make_response, request
from app import api, db
from app.models import Tenant
import os
import subprocess
import requests
import configparser
from loguru import logger


# SUPER ADMIN
# Tenant name - organization name (Ex: Mesha, Farm Connect, Life9, Prestige) Display name
# tenant ID - created from tenant name
# Creata a hono to ditto connection for this tenant id
# Store tenant info in postgres database - tenant id and tenant name
class TenantRegistration(Resource):
    """
    Resource for handling tenant registration.
    """
    def __init__(self):
        """
        Initializes the TenantRegistration resource.

        Args:
            KEYCLOAK_ADMIN_URL (str): The URL of the Keycloak admin.
            KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
            kcadminusername (str): The username for Keycloak admin.
            kcadminpassword (str): The password for Keycloak admin.
            kcadminclient (str): The client ID for Keycloak admin.
            clientid (str): The client ID for the application.
            roleid (str): The role ID for the user.
            REGISTRY_BASE_URL (str): The base URL of the registry.
            DITTO_API_BASE_URL (str): The base URL of the Ditto API.
            NS (str): The namespace.
            RELEASE (str): The release version.
            DITTO_DEVOPS_PWD (str): The password for Ditto devops.
            KAFKA_CERT (str): The certificate for Kafka.
        """
        current_dir = os.path.dirname(os.path.realpath(__file__))
        config_path = os.path.abspath(os.path.join(current_dir, "../../config.ini"))
        config = configparser.ConfigParser()
        config.read(config_path)

        self.KEYCLOAK_ADMIN_URL = config.get("urls", "KEYCLOAK_ADMIN_URL", fallback="ERROR: Configuration not found")
        self.KEYCLOAK_REALM_URL = config.get("urls", "KEYCLOAK_REALM_URL", fallback="ERROR: Configuration not found")

        self.kcadminusername = str(config.get("keycloak", "USERNAME", fallback="ERROR: Configuration not found"))
        self.kcadminpassword = str(config.get("keycloak", "PASSWORD", fallback="ERROR: Configuration not found"))
        self.kcadminclient = str(config.get("keycloak", "client_id", fallback="ERROR: Configuration not found"))
        self.clientid = str(config.get("keycloak", "clientid", fallback="ERROR: Configuration not found"))
        self.roleid = str(config.get("keycloak", "roleid", fallback="ERROR: Configuration not found"))

        self.devops = str(config.get("credentials", "devops_auth", fallback="ERROR: Configuration not found"))

        self.REGISTRY_BASE_URL = config.get("urls", "REGISTRY_BASE_URL", fallback="ERROR: Configuration not found")
        self.DITTO_API_BASE_URL = config.get("urls", "DITTO_API_BASE_URL", fallback="ERROR: Configuration not found")
        self.NS = config.get("namespace", "NS", fallback="ERROR: Configuration not found")
        self.RELEASE = config.get("namespace", "RELEASE", fallback="ERROR: Configuration not found")

        self.DITTO_DEVOPS_PWD = subprocess.check_output(f'kubectl --namespace {self.NS} get secret {self.RELEASE}-ditto-gateway-secret\
                                                        -o jsonpath="{{.data.devops-password}}" | base64 --decode', shell=True, text=True).strip()
        self.KAFKA_CERT = subprocess.check_output(f'kubectl --namespace {self.NS} get secret {self.RELEASE}-kafka-example-keys\
                                                  -o jsonpath="{{.data.tls\.crt}}" | base64 --decode', shell=True, text=True).strip()

    def post(self):
        """
        Handles POST requests for tenant registration.

        Args:
            tenant_name (str): The name of the tenant.
            username (str): The username of the tenant admin.
            password (str): The login password for the tenant admin.
            firstname (str): The first name of the tenant admin.
            lastname (str): The last name of the tenant admin.
            mobile (bigint): The mobile number of the tenant admin.
            alternate_mobile (bigint): The alternate mobile number of the tenant admin.
            email (str): The email address of the tenant admin.

        Returns:
            dict: A dictionary containing a message indicating the success or failure of the tenant registration process.

        Raises:
            Exception: If there is an error during the tenant registration process.
        """
        data = request.get_json(force=True)
        self.tenant_name = data.get('tenant_name')
        self.realm_name = data.get('tenant_name').replace(" ", "_")
        self.tenant_id = f'tenant_{secrets.token_urlsafe(4)}'
        self.username = data.get('username')
        self.firstname = data.get('firstname')
        self.lastname = data.get('lastname')
        self.pwd = data.get('password')
        self.mobile = data.get('mobile')
        self.altmobile = data.get('alternate_mobile')
        self.email = data.get('email')

        new_tenant = Tenant(tenant_id=self.tenant_id, tenant_name=self.tenant_name)
        try:
            existing_tenant = Tenant.query.filter_by(tenant_name=self.tenant_name).first()
            if existing_tenant:
                return make_response(jsonify({"message": f"Tenant '{self.tenant_name}' already exists."}), 400)
        except Exception:
            logger.exception(f"Database Error: Failed to access database - Tenant Name: '{self.tenant_name}'.")
            return make_response(jsonify({"message": f"Error in creating Tenant '{self.tenant_name}', Please Retry."}), 500)
        # create hono tenant and connection to ditto
        create_connection_status = self.create_tenant()
        if not create_connection_status:
            logger.exception(f"Error in creating Tenant and connection'{self.tenant_name}'.")
            return make_response(jsonify({"message": f"Error in creating Tenant '{self.tenant_name}', Please Retry."}), 500)
        # Add the new tenant to the database
        try:
            db.session.add(new_tenant)
            db.session.commit()
        except Exception:
            # Rollback the session to clear any pending changes
            db.session.rollback()
            # Delete the tenant instance added
            if 'new_tenant' in locals():
                db.session.delete(new_tenant)
            self.delete_tenant()
            logger.exception(f"Error in creating Tenant '{self.tenant_name}'.")
            return make_response(jsonify({"message": f"Error in creating Tenant '{self.tenant_name}', Please Retry."}), 500)

        # create tenant_admin
        status = self.create_keycloak_account()
        if status:
            return make_response(jsonify({"message": f"Tenant '{self.tenant_name}' added successfully."}), 200)
        else:
            self.delete_tenant()
            logger.exception(f"Error in creating Keycloak Tenant Admin'{self.tenant_name}'.")
            return make_response(jsonify({"message": f"Error in creating Tenant '{self.tenant_name}', Please Retry."}), 500)

    def create_keycloak_account(self):
        """
        Creates a new user account in Keycloak.

        This method sends HTTP requests to Keycloak's admin API to create a new user account.
        It includes steps to obtain an access token, create the user account, assign roles, and handle errors.

        Returns:
            bool: True if the user account creation is successful, False otherwise.
        """
        # Define the payload for the POST request
        payload = {
            "client_id": self.kcadminclient,
            "username": self.kcadminusername,
            "password": self.kcadminpassword,
            "grant_type": "password"
        }

        # Define the URL for the token endpoint
        url = self.KEYCLOAK_ADMIN_URL
        # Send the POST request
        response = requests.post(url, data=payload)

        # Check if the request was successful - fetch token
        if response.status_code == 200:
            # Parse the JSON response
            response_data = json.loads(response.text)
            # Extract the access token
            access_token = response_data.get('access_token')

            # Define the URL and payload for the POST request - Create user
            url = f"{self.KEYCLOAK_REALM_URL}/users"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            data = {
                "username": self.username,
                "email": self.email,
                "firstName": self.firstname,
                "lastName": self.lastname,
                "enabled": True,
                "attributes": {
                    "mobile": self.mobile,
                    "altmobile": self.altmobile,
                    "tenant_id": self.tenant_id,
                    "realm_name": self.realm_name
                },
                "credentials": [
                    {
                        "type": "password",
                        "value": self.pwd,
                        "temporary": False
                    }
                ]
            }

            # Send the POST request
            response = requests.post(url, headers=headers, json=data)

            # Check if the request was successful - User creation
            if response.status_code == 201:  # 201 Created status code
                # Define the URL for the GET request - Get role info for ID
                url = f"{self.KEYCLOAK_REALM_URL}/roles?search={self.roleid}"

                # Define headers for the GET request
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }

                # Send the GET request
                response = requests.get(url, headers=headers)

                # Check if the request was successful
                if response.status_code == 200:  # 200 OK status code
                    # Parse the response JSON and extract the role_id
                    self.role_id = response.json()[0]["id"]
                    # Define the URL for the GET request - Get userID
                    url = f"{self.KEYCLOAK_REALM_URL}/users?username={self.username}"

                    # Define headers for the GET request
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }

                    # Send the GET request
                    response = requests.get(url, headers=headers)

                    # Check if the request was successful
                    if response.status_code == 200:  # 200 OK status code
                        # Parse the response JSON and extract the user ID - Assign role
                        self.user_id = response.json()[0]["id"]
                        url = f"{self.KEYCLOAK_REALM_URL}/users/{self.user_id}/role-mappings/realm"
                        headers = {
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json"
                        }

                        # Define the payload data
                        payload = [
                            {
                                "id": self.role_id,
                                "name": self.roleid,
                                "composite": False
                            }
                        ]

                        # Send the POST request
                        response = requests.post(url, headers=headers, json=payload)

                        # Check if the request was successful
                        if response.status_code in (200, 204):
                            return True
                        else:
                            delete_user(self.KEYCLOAK_REALM_URL, self.user_id, headers)
                            logger.error(f"Failed to mao role to keycloak user {response.status_code}")
                            return False
                    else:
                        delete_user(self.KEYCLOAK_REALM_URL, self.user_id, headers)
                        logger.error(f"Failed to fetch keycloak user id {response.status_code}")
                        return False
                else:
                    delete_user(self.KEYCLOAK_REALM_URL, self.user_id, headers)
                    logger.error(f"Failed to search keycloak role {response.status_code}")
                    return False
            else:
                logger.error(f"Failed to create keycloak user - Tenant Admin {response.status_code}")
                return False
        else:
            logger.error(f"Failed to access keycloak admin URL {response.status_code}")
            return False

    def create_tenant(self):
        """
        Creates a new tenant.

        Returns:
            bool: True if the tenant creation and connection establishment are successful, False otherwise.
        """
        curl_command = [
            '/usr/bin/curl',
            '-i',
            '-k',
            '-X', 'POST',
            f'{self.REGISTRY_BASE_URL}/v1/tenants/{self.tenant_id}'
        ]
        try:
            # Run the curl command
            completed_process = subprocess.run(curl_command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            # Check the subprocess status
            if completed_process.returncode != 0:
                logger.error(f"Create Tenant: The cURL command exited with non-zero status code {completed_process.returncode}")
                logger.error(completed_process.stderr)
                return False
        except subprocess.CalledProcessError as e:
            logger.error(f"Create Tenant and connection: The cURL command exited with code {e.returncode}")
            logger.error(e.output)
            return False
        # Call create_connection
        return self.create_connection()

    def delete_tenant(self):
        """
        Deletes a tenant from the registry.

        This method sends a DELETE request to the registry API to delete a tenant based on the tenant ID.
        It uses the cURL command to perform the HTTP request and handles any errors that may occur during the process.

        Returns:
            None
        """
        curl_command = [
            '/usr/bin/curl',
            '-i',
            '-k',
            '-X', 'DELETE',
            f'{self.REGISTRY_BASE_URL}/v1/tenants/{self.tenant_id}'
        ]
        try:
            response = subprocess.run(curl_command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if response.returncode == 0:
                logger.info(f"Tenant '{self.tenant_id}' deleted successfully.")
            else:
                logger.error(f"Error: The cURL command for deleting tenant exited with code {response.returncode}")
                logger.error(response.stderr)
        except subprocess.CalledProcessError as e:
            logger.error(f"Error: The cURL command for deleting tenant exited with code {e.returncode}")
            logger.error(e.output)

    def create_connection(self):
        """
        Establishes a connection with the DITTO API for Tenant.

        Returns:
            bool: True if the connection is successfully established, False otherwise.
        """
        json_data = {
            "name": f"[Hono/Kafka] {self.tenant_id}",
            "connectionType": "kafka",
            "connectionStatus": "open",
            "uri": f"ssl://ditto-c2e:verysecret@{self.RELEASE}-kafka:9092",
            "ca": self.KAFKA_CERT,
            "failoverEnabled": True,
            "sources": [
                {
                    "addresses": [f"hono.telemetry.{self.tenant_id}"],
                    "consumerCount": 3,
                    "authorizationContext": [f"pre-authenticated:hono-connection-{self.tenant_id}"],
                    "qos": 0,
                    "enforcement": {
                        "input": "{{ header:device_id }}",
                        "filters": ["{{ entity:id }}"]
                    },
                    "headerMapping": {},
                    "payloadMapping": [],
                    "replyTarget": {
                        "enabled": True,
                        "address": f"hono.command.{self.tenant_id}/{{ thing:id }}",
                        "headerMapping": {
                            "device_id": "{{ thing:id }}",
                            "subject": "{{ header:subject | fn:default(topic:action-subject) | fn:default(topic:criterion) }}-response",
                            "correlation-id": "{{ header:correlation-id }}"
                        },
                        "expectedResponseTypes": ["response", "error"]
                    },
                    "acknowledgementRequests": {
                        "includes": [],
                        "filter": "fn:delete()"
                    },
                    "declaredAcks": []
                },
                # Add additional source configurations if needed
            ],
            "targets": [
                {
                    "address": f"hono.command.{self.tenant_id}/{{ thing:id }}",
                    "authorizationContext": [f"pre-authenticated:hono-connection-{self.tenant_id}"],
                    "headerMapping": {
                        "device_id": "{{ thing:id }}",
                        "subject": "{{ header:subject | fn:default(topic:action-subject) }}",
                        "correlation-id": "{{ header:correlation-id }}",
                        "response-required": "{{ header:response-required }}"
                    },
                    "topics": ["_/_/things/live/commands", "_/_/things/live/messages"]
                },
                {
                    "address": f"hono.command.{self.tenant_id}/{{ thing:id }}",
                    "authorizationContext": [f"pre-authenticated:hono-connection-{self.tenant_id}"],
                    "topics": ["_/_/things/twin/events", "_/_/things/live/events"],
                    "headerMapping": {
                        "device_id": "{{ thing:id }}",
                        "subject": "{{ header:subject | fn:default(topic:action-subject) }}",
                        "correlation-id": "{{ header:correlation-id }}"
                    }
                },
                # Add additional target configurations if needed
            ],
            "specificConfig": {
                "saslMechanism": "plain",
                "bootstrapServers": f"{self.RELEASE}-kafka:9092",
                "groupId": self.tenant_id + "_{{ connection:id}}"
            },
            "clientCount": 3,
            "failoverEnabled": True,
            "validateCertificates": True
        }

        # Make the HTTP request
        try:
            response = requests.put(f"{self.DITTO_API_BASE_URL}/api/2/connections/hono-kafka-connection-for-{self.tenant_id.replace('.', '_')}",
                                    auth=(self.devops, self.DITTO_DEVOPS_PWD),
                                    headers={'Content-Type': 'application/json'},
                                    json=json_data,
                                    verify=False  # Set to True if you want to verify SSL certificates
                                    )
            if response.ok:
                return True
            else:
                logger.error(f"Create Connection: HTTP request failed with status code: {response.status_code}")
                self.delete_tenant()
                return False
        except requests.RequestException as e:
            logger.error(f"Create connection: Error making HTTP request: {e}")
            self.delete_tenant()
            return False


class EditTenant(Resource):
    """
    Resource for editing tenant details.
    """
    # Define the parser for parsing the request parameters
    parser = reqparse.RequestParser()
    parser.add_argument('tenant_id', type=str, location='args', required=True, help='tenant id is required')
    parser.add_argument('new_tenant_name', type=str, location='args', required=True, help='tenant  name is required')

    def get(self):
        """
        Handles GET requests for editing tenant details.

        Args:
            tenant_id (str): The ID of the tenant to be edited.
            new_tenant_name (str): The new name for the tenant.

        Returns:
            dict: A dictionary containing a message indicating the success or failure of the tenant editing process.
        """
        # Parse the request arguments
        args = self.parser.parse_args()
        self.tenant_id = args['tenant_id']
        self.new_tenant_name = args['new_tenant_name']
        try:
            existing_tenant = Tenant.query.get(self.tenant_id)
            if not existing_tenant:
                return {"message": f"Tenant with ID {self.tenant_id} not found."}
            # Update the tenant name
            existing_tenant.tenant_name = self.new_tenant_name
            db.session.commit()
            return {"message": f"Tenant with ID {self.tenant_id} updated successfully."}
        except Exception as e:
            db.session.rollback()
            response_body = {"message": f"Error in updating Tenant '{self.tenant_id}' - {e}"}
            logger.exception(response_body['message'])
            return make_response(jsonify(response_body), 500)


# SUPER ADMIN - Super admin login page
# Fetch all tenants from hono - Super Admin page
class TenantInformation(Resource):
    """
    Resource for retrieving tenant information.
    """
    def __init__(self):
        """
        Initializes the DeviceInformation resource.

        Args:
            REGISTRY_BASE_URL (str): The base URL of the registry.
        """
        current_dir = os.path.dirname(os.path.realpath(__file__))
        config_path = os.path.abspath(os.path.join(current_dir, "../../config.ini"))
        config = configparser.ConfigParser()
        config.read(config_path)
        self.REGISTRY_BASE_URL = config.get("urls", "REGISTRY_BASE_URL", fallback="ERROR: Configuration not found")

    def get(self):
        """
        Handles GET requests for retrieving device information.

        Returns:
            dict: A dictionary containing a list of tenants with their IDs and names.
        """
        try:
            tenants = Tenant.query.with_entities(Tenant.tenant_id, Tenant.tenant_name).all()

            # Convert the tenants to a list of dictionaries
            tenants_list = [
                {
                    'tenant_id': tenant.tenant_id,
                    'tenant_name': tenant.tenant_name
                }
                for tenant in tenants
            ]
            return make_response(jsonify({'tenants_list': tenants_list}), 200)
        except Exception as e:
            logger.error(f"Error retrieving device information: {e}")
            return make_response(jsonify({'message': 'Failed to retrieve device information. Please try again later.'}), 500)


def delete_user(KEYCLOAK_REALM_URL, user_id, headers):
    """
    Deletes a user from the Keycloak realm.

    Args:
        KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
        user_id (str): The ID of the user to delete.
        headers (dict): The headers for the HTTP request.

    Returns:
        None
    """
    # Delete the user if the role assignment fails
    url = f"{KEYCLOAK_REALM_URL}/users/{user_id}"
    try:
        response = requests.delete(url, headers=headers)
        if response.status_code == 204:
            logger.info("User deleted successfully.")
        else:
            logger.error(f"Failed to delete user: {response.text}")
    except requests.RequestException as e:
        logger.error(f"Error deleting user: {e}")


# Add the tenant registration resource to the API
api.add_resource(TenantRegistration, '/tenant_registry')
api.add_resource(EditTenant, '/edit_tenant')
api.add_resource(TenantInformation, '/tenant_list')
