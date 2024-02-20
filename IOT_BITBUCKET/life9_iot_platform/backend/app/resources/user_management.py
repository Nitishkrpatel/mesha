"""
User Management Module

This module provides functionality for managing users by tenant admin, including reset passowrd,
edit profile, list all users of the teant, creating user and assign role to new user.

Classes:
    ResetPassword: A resource for handling password change.
    Editprofile: A resource for handling user profile modification.
    TenantUserList: A resource for handling users information retrieval.
    UserRegistration: A resource for handling new user creation.
"""
import json
from flask_restful import Resource, reqparse
from flask import jsonify, make_response, request
from app import api
import os
import requests
import configparser
import datetime
import pytz
from loguru import logger


# Reset/Change Password
class ResetPassword(Resource):
    """
    Resource for resetting user passwords.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful resources.
    """
    def __init__(self):
        """
        Initializes the ResetPassword resource.

        Args:
            current_dir (str): The current directory path.
            config_path (str): The path to the configuration file.
            config (configparser.ConfigParser): The configuration parser object.
            KEYCLOAK_ADMIN_URL (str): The URL of the Keycloak admin.
            KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
            kcadminusername (str): The username for Keycloak admin.
            kcadminpassword (str): The password for Keycloak admin.
            kcadminclient (str): The client ID for Keycloak admin.
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

    def post(self):
        """
        Handles POST requests for resetting user passwords.

        Args:
            username (str): The username of the user whose password is being reset.
            password (str): The new password to set for the user.

        Returns:
            dict: A dictionary containing a success message or an error message.
        """
        data = request.get_json(force=True)
        username = data.get('username')
        password = data.get('password')

        # Ensure that password,username is provided
        if not self.password or not self.username:
            return make_response(jsonify({"message": "Details is required."}), 400)
        # Ensure that password and username are provided
        if not password or not username:
            return make_response(jsonify({"message": "Username and password are required."}), 400)

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
            url = f"{self.KEYCLOAK_REALM_URL}/users?username={username}"

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
                user_id = response.json()[0]["id"]

                # Define the URL and payload for the PUT request
                url = f'{self.KEYCLOAK_REALM_URL}/users/{user_id}/reset-password'
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                data = {
                    "type": "password",
                    "value": password,
                    "temporary": False
                }

                # Send the PUT request
                response = requests.put(url, headers=headers, json=data)

                # Check the response
                if response.status_code == 204:
                    return make_response(jsonify({"message": "Password reset was successful."}), 200)
                else:
                    error_message = f"Error: Failed to reset password. Status code: {response.status_code}, Response: {response.text}"
                    logger.error(error_message)
                    return make_response(jsonify({"message": error_message}), 500)
            else:
                error_message = f"Error: Failed to fetch user details. Status code: {response.status_code}, Response: {response.text}"
                logger.error(error_message)
                return make_response(jsonify({"message": error_message}), 500)
        else:
            error_message = f"Error: Failed to get access token. Status code: {response.status_code}, Response: {response.text}"
            logger.error(error_message)
            return make_response(jsonify({"message": error_message}), 500)


# Change Profile data
class Editprofile(Resource):
    """
    Resource for editing user profiles.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful
            resources.
    """
    def __init__(self):
        """
        Initializes the Editprofile resource.

        Args:
            current_dir (str): The current directory path.
            config_path (str): The path to the configuration file.
            config (configparser.ConfigParser): The configuration parser
                object.
            KEYCLOAK_ADMIN_URL (str): The URL of the Keycloak admin.
            KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
            kcadminusername (str): The username for Keycloak admin.
            kcadminpassword (str): The password for Keycloak admin.
            kcadminclient (str): The client ID for Keycloak admin.
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

    def post(self):
        """
        Handles POST requests for editing user profiles.

        Args:
            username (str): The username of the user whose profile is being
                edited.
            fname (str): The first name of the user.
            lname (str): The last name of the user.
            email (str): The email address of the user.
            mobile (str): The mobile number of the user.
            altmobile (str): The alternate mobile number of the user.
            tenant_id (str): The ID of the tenant associated with the user.

        Returns:
            dict: A dictionary containing a success message or an error
                message.
        """
        data = request.get_json(force=True)
        self.username = data.get('username')
        self.fname = data.get('fname')
        self.lname = data.get('lname')
        self.email = data.get('email')
        self.mobile = data.get('mobile')
        self.altmobile = data.get('altmobile')
        self.tenant_id = data.get('tenant_id')

        # Ensure that password is provided
        if not self.username:
            return make_response(jsonify({"message": "username is required."}), 400)

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

                # Define the URL and payload for the PUT request
                url = f"{self.KEYCLOAK_REALM_URL}/users/{self.user_id}"
                headers = {
                    'Authorization': f"Bearer {access_token}",
                    'Content-Type': 'application/json'
                }
                data = {
                    'firstName': self.fname,
                    'lastName': self.lname,
                    'email': self.email,
                    'attributes': {
                        "tenant_id": self.tenant_id,
                        'mobile': self.mobile,
                        'altmobile': self.altmobile
                    }
                }

                # Make the PUT request
                response = requests.put(url, headers=headers, json=data)

                # Check the response
                if response.status_code == 204:
                    return make_response(jsonify({"message": "Profile updated."}), 200)
                else:
                    error_message = f"Error: Failed to update profile. Status code: {response.status_code}, Response: {response.text}"
                    logger.error(error_message)
                    return make_response(jsonify({"message": error_message}), 500)
            else:
                error_message = f"Error: Failed to fetch user details. Status code: {response.status_code}, Response: {response.text}"
                logger.error(error_message)
                return make_response(jsonify({"message": error_message}), 500)
        else:
            error_message = f"Error: Failed to get access token. Status code: {response.status_code}, Response: {response.text}"
            logger.error(error_message)
            return make_response(jsonify({"message": error_message}), 500)


# tenant users
class TenantUserList(Resource):
    """
    Resource for fetching a list of users belonging to a specific tenant.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful
            resources.
    """
    parser = reqparse.RequestParser()
    parser.add_argument('tenant_id', type=str, location='args', required=True, help='tenant ID is required')

    def __init__(self):
        """
        Initializes the TenantUserList resource.

        Args:
            current_dir (str): The current directory path.
            config_path (str): The path to the configuration file.
            config (configparser.ConfigParser): The configuration parser
                object.
            KEYCLOAK_ADMIN_URL (str): The URL of the Keycloak admin.
            KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
            kcadminusername (str): The username for Keycloak admin.
            kcadminpassword (str): The password for Keycloak admin.
            kcadminclient (str): The client ID for Keycloak admin.
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

    # Function to convert timestamp to IST
    def convert_to_ist(self, timestamp):
        """
        Converts a UNIX timestamp to Indian Standard Time (IST) format.

        Args:
            timestamp (int): The UNIX timestamp to be converted.

        Returns:
            str: The timestamp converted to IST format.
        """
        utc_datetime = datetime.datetime.utcfromtimestamp(timestamp / 1000)
        utc_datetime = pytz.utc.localize(utc_datetime)
        ist_timezone = pytz.timezone('Asia/Kolkata')
        ist_datetime = utc_datetime.astimezone(ist_timezone)
        return ist_datetime.strftime('%Y-%m-%d %H:%M:%S')

    # Function to fetch user roles
    def fetch_user_roles(self, user_id, access_token):
        """
        Fetches the roles assigned to a user.

        Args:
            user_id (str): The ID of the user.
            access_token (str): The access token for authorization.

        Returns:
            dict: A dictionary containing the user's role mappings.
        """
        # Define the URL and headers to fetch user role mappings
        url = f"{self.KEYCLOAK_REALM_URL}/users/{user_id}/role-mappings/realm"
        headers = {
            'Authorization': f"Bearer {access_token}",
            'Content-Type': 'application/json'
        }
        # Send the GET request
        response = requests.get(url, headers=headers)
        # Check if the request was successful
        if response.status_code == 200:
            # Parse the JSON response
            return response.json()
        else:
            return []

    def get(self):
        """
        Handles GET requests for fetching a list of users belonging to a
        specific tenant.

        Args:
            tenant_id (str): The ID of the tenant.

        Returns:
            dict: A dictionary containing the list of users and their details.
        """
        args = self.parser.parse_args()
        self.tenant_id = args['tenant_id']

        # Ensure that password is provided
        if not self.tenant_id:
            return make_response(jsonify({"message": "tenant ID is required."}), 400)

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

            # Define the URL and headers - search by attributes
            url = f"{self.KEYCLOAK_REALM_URL}/users?q=tenant_id:{self.tenant_id}"
            headers = {
                'Authorization': f"Bearer {access_token}",
                'Content-Type': 'application/json'
            }

            # Send the GET request
            response = requests.get(url, headers=headers)

            # Check if the request was successful
            if response.status_code == 200:
                # Convert response to JSON
                user_data = response.json()

                # Convert timestamp to IST in each user object
                for user in user_data:
                    user['createdTimestamp'] = self.convert_to_ist(user['createdTimestamp'])
                    # Fetch user roles and add to user data
                    user_roles = self.fetch_user_roles(user['id'], access_token)
                    role_names = [role['name'] for role in user_roles]
                    user['roles'] = role_names
                return make_response(jsonify({"users": user_data}), 200)
            else:
                error_message = f"Error: Failed to fetch user details. Status code: {response.status_code}, Response: {response.text}"
                logger.error(error_message)
                return make_response(jsonify({"message": error_message}), 500)
        else:
            error_message = f"Error: Failed to get access token. Status code: {response.status_code}, Response: {response.text}"
            logger.error(error_message)
            return make_response(jsonify({"message": error_message}), 500)


def delete_user(KEYCLOAK_REALM_URL, user_id, headers):
    """
    Deletes a user from Keycloak.

    Args:
        KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
        user_id (str): The ID of the user to delete.
        headers (dict): The headers for the HTTP request.

    Returns:
        None: No return value.

    Raises:
        Exception: If there is an error during the user deletion process.
    """
    url = f"{KEYCLOAK_REALM_URL}/users/{user_id}"
    response = requests.delete(url, headers=headers)
    if response.status_code == 204:
        logger.info(f"User {user_id} deleted successfully.")
    else:
        logger.error(f"Failed to delete user {user_id}: {response.text}")


class UserRegistration(Resource):
    """
    Resource for registering a new user.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful
            resources.
    """
    parser = reqparse.RequestParser()
    parser.add_argument('tenant_id', type=str, location='args', required=True, help='tenant ID is required')
    parser.add_argument('username', type=str, location='args', required=True, help='tenant admin username is required')
    parser.add_argument('password', type=str, location='args', required=True, help='tenant admin temporary password is required')
    parser.add_argument('firstname', type=str, location='args', required=True, help='tenant admin firstname is required')
    parser.add_argument('lastname', type=str, location='args', required=True, help='tenant admin lastname is required')
    parser.add_argument('mobile', type=str, location='args', required=True, help='tenant admin mobile is required')
    parser.add_argument('alternate_mobile', type=str, location='args', required=True, help='tenant admin alternate_mobile is required')
    parser.add_argument('email', type=str, location='args', required=True, help='tenant admin email is required')

    def __init__(self):
        """
        Initializes the UserRegistration resource.

        Args:
            current_dir (str): The current directory path.
            config_path (str): The path to the configuration file.
            config (configparser.ConfigParser): The configuration parser
                object.
            KEYCLOAK_ADMIN_URL (str): The URL of the Keycloak admin.
            KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
            kcadminusername (str): The username for Keycloak admin.
            kcadminpassword (str): The password for Keycloak admin.
            kcadminclient (str): The client ID for Keycloak admin.
            realm_name (str): The name of the Keycloak realm.
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
        self.realm_name = str(config.get("keycloak", "realm_name", fallback="ERROR: Configuration not found"))

    def post(self):
        """
        Handles POST requests for user registration.

        Args:
            tenant_id (str): The ID of the tenant.
            username (str): The username of the tenant admin.
            password (str): The login password for the tenant admin.
            firstname (str): The first name of the tenant admin.
            lastname (str): The last name of the tenant admin.
            mobile (bigint): The mobile number of the tenant admin.
            alternate_mobile (bigint): The alternate mobile number of the tenant admin.
            email (str): The email address of the tenant admin.
            roleid(str): The role ID to assign to user.
            rolename(str): The role ID to assign to user.

        Returns:
            dict: A dictionary containing a message indicating the success or failure of the user registration process.

        Raises:
            Exception: If there is an error during the user registration process.
        """
        data = request.get_json(force=True)
        self.tenant_id = data.get('tenant_id')
        self.username = data.get('username')
        self.firstname = data.get('firstname')
        self.lastname = data.get('lastname')
        self.pwd = data.get('password')
        self.mobile = data.get('mobile')
        self.altmobile = data.get('alternate_mobile')
        self.email = data.get('email')
        self.roleid = data.get('roleid')
        self.rolename = data.get('rolename')

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
                        "temporary": True
                    }
                ]
            }

            # Send the POST request
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 201:
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
                            "id": self.roleid,
                            "name": self.rolename,
                            "composite": False
                        }
                    ]
                    # Send the POST request
                    response = requests.post(url, headers=headers, json=payload)
                    # Check if the request was successful
                    if response.status_code in (200, 204):
                        return make_response(jsonify({"message": "User created!"}), 200)
                    else:
                        delete_user(self.KEYCLOAK_REALM_URL, self.user_id, headers)
                        error_message = f'Error: Failed to create user. Status code: {response.status_code}, Response: {response.text}'
                        logger.error(error_message)
                        return make_response(jsonify({"message": error_message}), 500)
                else:
                    error_message = f'Error: Failed to create user. Status code: {response.status_code}, Response: {response.text}'
                    logger.error(error_message)
                    return make_response(jsonify({"message": error_message}), 500)
            else:
                error_message = f'Error: Failed to create user. Status code: {response.status_code}, Response: {response.text}'
                logger.error(error_message)
                return make_response(jsonify({"message": error_message}), 500)
        else:
            error_message = f'Error: Failed to get access token. Status code: {response.status_code}, Response: {response.text}'
            logger.error(error_message)
            return make_response(jsonify({"message": error_message}), 500)


class UserRoles(Resource):
    """
    Resource for fetching all user roles.

    Args:
        Resource (flask_restful.Resource): The base class for creating RESTful
            resources.
    """
    parser = reqparse.RequestParser()
    parser.add_argument('tenant_id', type=str, location='args', required=True, help='tenant ID is required')

    def __init__(self):
        """
        Initializes the ResetPassword resource.

        Args:
            current_dir (str): The current directory path.
            config_path (str): The path to the configuration file.
            config (configparser.ConfigParser): The configuration parser object.
            KEYCLOAK_ADMIN_URL (str): The URL of the Keycloak admin.
            KEYCLOAK_REALM_URL (str): The URL of the Keycloak realm.
            kcadminusername (str): The username for Keycloak admin.
            kcadminpassword (str): The password for Keycloak admin.
            kcadminclient (str): The client ID for Keycloak admin.
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

    def get(self):
        """
        Handles GET requests for retrieving user role information.

        Returns:
            dict: A dictionary containing a list of user roles with their IDs and names.
        """
        args = self.parser.parse_args()
        self.tenant_id = args['tenant_id']

        # Ensure that password is provided
        if not self.tenant_id:
            return make_response(jsonify({"message": "tenant ID is required."}), 400)

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
            url = f"{self.KEYCLOAK_REALM_URL}/roles"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            try:
                # Send the GET request
                response = requests.get(url, headers=headers)

                # Check if the request was successful
                if response.status_code == 200:
                    # Parse the JSON response
                    roles = response.json()

                    # Extract role details with attributes
                    roles_info = []
                    for role in roles:
                        if 'role_type' in role.get('description', ''):
                            role_details = {
                                'roleId': role.get('id'),
                                'roleName': role.get('name'),
                                'description': role.get('description'),
                                'attributes': role.get('attributes')
                            }
                            roles_info.append(role_details)

                    return make_response(jsonify({"roles": roles_info}), 200)
                else:
                    logger.error(f'Failed to fetch roles. Status code: {response.status_code}, Response: {response.text}')
                    return make_response(jsonify({"message": "Failed to fetch roles"}), 500)
            except Exception as e:
                logger.exception(f'An error occurred while fetching roles: {str(e)}')
                return make_response(jsonify({"message": "An error occurred while fetching roles"}), 500)
        else:
            error_message = f'Error: Failed to get access token. Status code: {response.status_code}, Response: {response.text}'
            logger.error(error_message)
            return make_response(jsonify({"message": error_message}), 500)


api.add_resource(ResetPassword, '/reset_password')
api.add_resource(Editprofile, '/edit_profile')
api.add_resource(TenantUserList, "/tenant_users")
api.add_resource(UserRegistration, "/user_registration")
api.add_resource(UserRoles, "/user_roles")
