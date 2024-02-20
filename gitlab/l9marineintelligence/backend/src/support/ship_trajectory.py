import sys
import os
import numpy as np
import pandas as pd
import psycopg2
from io import StringIO
import warnings
from datetime import datetime
import json
# from scipy.spatial import KDTree
# from haversine import haversine_vector, Unit, haversine
sys.path.append(os.getcwd())
from src.config import shipdb_pool  # noqa
from src import config  # noqa
warnings.filterwarnings('ignore')


# Function to find the nearest port within threshold distance
def find_nearest_port(lat, lon, manager_df):
    ports_df = pd.DataFrame(manager_df)
    threshold = config.port_threshold
    ports_coordinates = ports_df[['lat', 'long']].values
    kdtree = KDTree(ports_coordinates)

    distances, indices = kdtree.query([(lat, lon)], k=1, distance_upper_bound=threshold)

    if distances[0] < threshold:
        nearest_port_index = indices[0]
        nearest_port = ports_df.loc[nearest_port_index, 'port_name']
        return nearest_port
    return 'NA'


def fetch_maximun_speed(mmsi):
    with shipdb_pool.connect() as connection:
        result = connection.execute("""select vessel_category,max_speed_threshold
                    from ship_category,ship where mmsi=%s and
                    ship.catid=ship_category.catid""", (mmsi,))
        vessel_speed = result.fetchone()
    return vessel_speed.vessel_category, vessel_speed.max_speed_threshold



def new_trajectory(mmsi, df, manager_portsdf):  # noqa
    try:
        # Find the indices where the status code changes from 1 to 5 or 6
        status_changes = df[(df['nav_status_code'].shift().isin([1, 5, 6])) & ~df['nav_status_code'].isin([1, 5, 6])].index

        segments = []
        start_index = 0

        for change_index in status_changes:
            midpoint_index = (start_index + change_index) // 2
            segment = df[start_index:midpoint_index]
            segments.append(segment)
            start_index = midpoint_index

        # Add the last segment from the last midpoint index to the end of the DataFrame
        last_segment = df[start_index:]
        segments.append(last_segment)

        # Print the segments
        for i, segment in enumerate(segments):
            print(f"Segment {i+1}:")
            segment.to_csv(f"{i+1}_df.csv")
            print(segment)
            print()
    except Exception as e:
        print("Excepion at start new trajectory breaks:" + str(mmsi) + "__" + str(e))


def mmsi_trajectory_start(mmsi, df, manager_portsdf):
    try:
        new_trajectory(mmsi, df, manager_portsdf)
    except Exception as e:
        print("Exception in finding trajectories for:" + str(mmsi) + "-->" + str(e))


# with shipdb_pool.connect() as connection:
#     all_ports = pd.read_sql_query("select grid_id,lat,long,port_name from ports", connection)


# STARTS HERE
def find_trajectory_from_database(args):
    try:
        mmsi, manager_portsdf = args
        with shipdb_pool.connect() as connection:
            df = pd.read_sql_query("""select lat,long,sog,cog,category_id,category,nav_status_code,
                                ist_time,destination from ship_transmission where mmsi=%s""",
                                   connection, params=(mmsi,))
        if df.empty:
            return

        df.reset_index(inplace=True, drop=True)
        df['mmsi'] = mmsi
        df['ist_time'] = pd.to_datetime(df['ist_time'])
        df.sort_values(['mmsi', 'ist_time'], inplace=True, ignore_index=True)
        df.drop_duplicates('ist_time', inplace=True, keep='first')

        timestamps = df['ist_time'].values
        time_diff = np.diff(timestamps) / np.timedelta64(1, 'h')
        # Add the time differences as a new column in the dataframe
        df['ist_time_diff'] = np.insert(time_diff, 0, np.nan)
 
        df['transmission_anomaly_time'] = False
        df['transmission_anomaly_distance'] = False
        df['transmission_anomaly_category'] = ''

        # # Define a function to calculate distance using haversine
        # def calculate_distance(row):
        #     lat1, lon1 = row['lat'], row['long']
        #     lat2, lon2 = row['lat_shifted'], row['lon_shifted']
        #     distance = haversine((lat1, lon1), (lat2, lon2), unit='nmi')
        #     return distance

        # # Shift the latitude and longitude columns
        # df['lat_shifted'] = df['lat'].shift()
        # df['lon_shifted'] = df['long'].shift()

        # # Apply the calculate_distance function on DataFrame rows
        # df['dist'] = df.apply(lambda row: calculate_distance(row), axis=1)
        # df.at[0, 'dist'] = 0.0
        df['dist'] = 0.0
        # df.drop(['lat_shifted', 'lon_shifted'], inplace=True, axis=1)
        df.loc[df['ist_time_diff'] > config.time_threshold, 'transmission_anomaly_time'] = True
        df.loc[df['dist'] > config.distance_threshold, 'transmission_anomaly_distance'] = True
        df['cat_shifted'] = df['category'].shift()
        # previous_value = df['category'].shift()
        # df['category_change'] = pd.Series([True if current != previous else False for current, previous in zip(df['category'], previous_value)])
        df['cat_change'] = np.where(df['category'] != df['cat_shifted'], True, False)  # noqa
        df.at[0, 'cat_change'] = False
        # df.at[0, 'category_change'] = False
        mmsi_trajectory_start(mmsi, df, manager_portsdf)
        del df
    except Exception as e:
        print("Exception raised for finding trajectory for mmsi: " + str(mmsi) + str(e))
        return
