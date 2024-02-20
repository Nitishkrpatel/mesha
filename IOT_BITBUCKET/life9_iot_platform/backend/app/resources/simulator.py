import subprocess
import json
import random
import time
import logging
from datetime import datetime, timedelta

start_date = datetime(2023, 11, 1)
end_date = datetime(2024, 12, 31)


def execute_curl_command():
    curl_command = [
        '/usr/bin/curl',
        '-i',
        '-k',
        '-X', 'GET',
        'https://10.97.156.136:28443/v1/tenants'
    ]
    try:
        result = subprocess.run(curl_command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True)
        output_parts = result.stdout.strip().split('\n\n')
        json_response = output_parts[-1]
        output_json = json.loads(json_response)
        ids = [item['id'] for item in output_json['result']]
        return ids
    except subprocess.CalledProcessError as e:
        print(f"Error executing curl command: {e}")


password = 'my-password'


def get_alldevice(ids):
    while True:
        for tenant_name in ids:
            curl_command = [
                '/usr/bin/curl',
                '-i',
                '-k',
                '-X', 'GET',
                f'https://10.97.156.136:28443/v1/devices/{tenant_name}'
            ]
            try:
                result = subprocess.run(curl_command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                        text=True)
                output_parts = result.stdout.strip().split('\n\n')
                json_response = output_parts[-1]
                response_data = json.loads(json_response)
                if 'result' not in response_data:
                    print(f"No devices found for tenant: {tenant_name}")
                    continue

                for device_info in response_data['result']:
                    device_id = device_info['id']
                    organization, device_id = device_id.split(':')
                    if 'Sanitizer' in device_id:
                        device_type = 'Sanitizer'
                    elif 'EVB' in device_id:
                        device_type = 'EVB'
                    elif 'BMC' in device_id:
                        device_type = 'BMC'
                    else:
                        # If none of the keywords are found, log a warning and return
                        logging.warning(f"No device type found for device {device_id}")
                        return

                    print(device_type, "device_id")

                    topic = f"{organization}/{device_id}/things/twin/commands/modify"

                    if device_type == 'Sanitizer':
                        data = {
                            "topic": topic,
                            "headers": {"Authorization": f"Bearer {password}"},
                            "path": "/features",
                            "value": {
                                "dispenseVolume": {"properties": {"value": random.randint(10, 90)}},
                                "fluidLevel": {"properties": {"value": random.randint(10, 90)}},
                                "liquidType": {"properties": {"value": random.randint(10, 90)}},
                                "batteryVoltage": {"properties": {"value": random.randint(10, 90)}},
                                "activeStatus": {"properties": {"value": random.choice(['On', 'Off'])}},
                                "alertAlarmStatus": {"properties": {"value": random.choice([True, False])}},
                                "batteryStatus": {"properties": {"value": random.choice(['High', 'Low'])}},
                                "powerStatus": {"properties": {"value": random.choice([True, False])}}
                            }
                        }
                    elif device_type == 'BMC':
                        data = {
                            "topic": topic,
                            "headers": {"Authorization": f"Bearer {password}"},
                            "path": "/features",
                            "value": {
                                "top temperature": {"properties": {"value": random.randint(10, 90)}},
                                "bottom temperature": {"properties": {"value": random.randint(10, 90)}},
                                "lid": {"properties": {"value": random.randint(10, 90)}},
                                "ambient temperature": {"properties": {"value": random.randint(10, 90)}},
                                "humidity": {"properties": {"value": random.randint(10, 90)}}
                            }
                        }
                    elif device_type == 'EVB':
                        data = {
                            "topic": topic,
                            "headers": {"Authorization": f"Bearer {password}"},
                            "path": "/features",
                            "value": {
                                "v1": {"properties": {"value": random.randint(10, 90)}},
                                "v2": {"properties": {"value": random.randint(10, 90)}},
                                "v3": {"properties": {"value": random.randint(10, 90)}},
                                "v4": {"properties": {"value": random.randint(10, 90)}},
                                "Dc": {"properties": {"value": random.randint(10, 90)}}
                            }
                        }
                    print(data, "output")

                    auth_info = f"{device_id}@{tenant_name}:{password}"
                    curl_command = [
                        '/usr/bin/curl',
                        '-i',
                        '-k',
                        '-u', auth_info,
                        '-H', 'Content-Type: application/json',
                        '--data-binary', json.dumps(data),
                        f'https://10.105.77.117:8443/telemetry'
                    ]
                    print(curl_command)

                    try:
                        result = subprocess.run(curl_command, check=True, stdout=subprocess.PIPE,
                                                stderr=subprocess.PIPE, text=True)
                        logging.info(f"Telemetry data sent for device {device_id} of tenant {tenant_name}.")
                    except subprocess.CalledProcessError as e:
                        logging.error(f"Error: The cURL command exited with code {e.returncode}")
                        logging.error(e.output)
            except Exception as e:
                logging.error(f"Error executing curl command: {str(e)}")
        time.sleep(3)


ids = execute_curl_command()
get_alldevice(ids)