import pandas as pd
import psycopg2
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
import matplotlib
import pandas
from h3 import h3
import h3pandas
from itertools import product
from scipy.spatial.distance import directed_hausdorff
import numpy as np
from scipy.spatial import distance as d
import math
from sklearn.preprocessing import minmax_scale


def fetch_traj_id():
    conn = psycopg2.connect(
    host="192.168.31.180",
    database="shipdb",
    user="postgres",
    password=""
    )
    cursor = conn.cursor()
    cursor.execute("SELECT distinct(traj_id) ,sport, dport FROM mmsi_trajectories where sport!='NA' and dport!='NA' and sport!=dport limit 1;")
    results = cursor.fetchall()
    conn.close()
    cursor.close()
    return results

# def find_grids(data):
#     data['h3_index'] = data.apply(lambda row: h3.geo_to_h3(row['lat'], row['long'], 1), axis=1)
#     print(data['h3_index'])
#     return data

def find_grids(data):
    data = data.h3.geo_to_h3(1)
    # preprocess_data.head(30)
    # Add geometry with centroid of each H3 address to the DataFrame.
    data=data.h3.h3_to_geo().reset_index()
    # print(len(data['h3_01'].unique()))
    return data



def preprocess(data):
    alpha = 0.1
    beta = 0.2
    preprocess_data = pd.DataFrame()
    data['cog_1'] = data['cog'].diff()
    data['sog_1'] = data['sog'].diff()
    data = data.fillna(0)
    data.squeeze()
    data['sog_1'] = data['sog_1'].abs()
    data['cog_1'] = data['cog_1'].abs()
    preprocess_data = data[(data.cog_1 > alpha) & (data.sog_1 > beta)].copy()
    preprocess_data = preprocess_data.drop(['sog_1', 'cog_1'], axis=1)
    preprocess_data = preprocess_data.reset_index(drop=True) 
    return preprocess_data

def fetch_trajectories_and_preprocess(traj_id):
        try:
            conn = psycopg2.connect(
                host="192.168.31.180",
                database="shipdb",
                user="postgres",
                password=""
            )
            cursor = conn.cursor()
            # Execute a sample query
            cursor.execute("SELECT lat, long, cog, sog, traj_id FROM ship_transmission WHERE traj_id=%s ORDER BY ist_time", (traj_id,))
            # Fetch and print the results
            results = cursor.fetchall()
            df = pd.DataFrame(results, columns=['lat','long','cog','sog','traj_id'])
            df = df.rename(columns={'long':'lng'})
            prerocessed_data = preprocess(df)
            return prerocessed_data
        except Exception as e:
            print(f"An exception occurred for traj_id={traj_id}: {e}")
        finally:
            cursor.close()
            conn.close()


def input_segments(x):
    input_segments = list(product(x, repeat=2))
    return input_segments
def input_segments_sog(y):
    input_segments_sog = list(product(y, repeat=2))
    return input_segments_sog


def hausdroff_segments(V1):
    haudroff_lis = []
    for i in range(0, len(V1)):
        distance3 = directed_hausdorff(np.array(V1[i][0]), np.array(V1[i][1]), seed=0)  
        haudroff_lis.append(distance3[0])
    return haudroff_lis

def hausdroff_segments(V1):
    haudroff_lis = []
    for i in range(0,len(V1)):
        distance3 = directed_hausdorff(np.array(V1[i][0]), np.array(V1[i][1]), seed=0)  
        haudroff_lis.append(distance3[0])
    return haudroff_lis

def directional_segments(points):

    directionaldistance =[]
    for i in range(0,len(points)):
        distance3 = d.euclidean(points[i][0][0],points[i][0][1])  
        distance4 = d.euclidean(points[i][1][0], points[i][1][1]) 
        x = min(distance3, distance4)
        angle = np.dot(distance3 , distance4)
        if int(angle) >= 0 and int(angle) <= 90:
            distance = x * math.sin(angle) 
            directionaldistance.append(distance)
        elif int(angle) >= 90 and int(angle) <= 180 :
            distance = x
            directionaldistance.append(distance)
    return directionaldistance   
 

def speed_segments(points):
    # print(points)
    speed_distance_lis = []
    for i in range(0,len(points)):
        # print(points[i][0][0],points[i][0][1],points[i][1][0], points[i][1][1] )
        x1 = (points[i][0][0] + points[i][0][1])/2
        x2 = (points[i][1][0] + points[i][1][1])/2
        # print(points[i][0][0] , points[i][0][1], x1)
        # print(points[i][1][0] , points[i][1][1], x2)
        speed_distance = x2-x1
        # print(speed_distance)
        speed_distance_lis.append(speed_distance)
    return speed_distance_lis

def structural_similarity(scaled_data):
    sdis = scaled_data['hausdroff']*0.2 + scaled_data['speed']*0.2 + scaled_data['direction']*0.2
    scaled_data['SDIS'] = pd.DataFrame(sdis)
    distance_matrix = scaled_data['SDIS'].values
    return distance_matrix

def main():
    data = fetch_traj_id()
    for value in data:
        trajectory = fetch_trajectories_and_preprocess(value[0])
        trajectory_g = find_grids(trajectory)
        grid_data = trajectory_g.head(7)
        unique_traj_id = grid_data['traj_id'].unique()
        segment_list = []
        segment_list_sog = []
        for i in range(len(unique_traj_id)):
            traj_data = grid_data[['lat','lng']].loc[grid_data['traj_id']== unique_traj_id[i]]
            traj_data = traj_data.reset_index(drop=True)  
            traj_data_sog = grid_data['sog'].loc[grid_data['traj_id']== unique_traj_id[i]]
            traj_data_sog = traj_data_sog.reset_index(drop=True)  
            x = traj_data.values.tolist()
            y = traj_data_sog.values.tolist()
            for i in range(0, len(x)-1):
                x1 = [x[i], x[i+1]]
                segment_list.append(x1)
            for i in range(0, len(y)-1):
                y1 = [y[i], y[i+1]]
                segment_list_sog.append(y1)
        if len(segment_list)>1:
            input_segment = input_segments(segment_list)
            input_segment_sog = input_segments_sog(segment_list_sog)
            hausdroff_distance = hausdroff_segments(input_segment)
            directional_distance = directional_segments(input_segment)
            speed_distance = speed_segments(input_segment_sog)
            df_hausdroff = pd.DataFrame(hausdroff_distance)
            df_hausdroff=df_hausdroff.rename(columns={0:'hausdroff'})
            df_direction = pd.DataFrame(directional_distance)
            df_direction=df_direction.rename(columns={0:'direction'})
            df_speed = pd.DataFrame(speed_distance)
            df_speed=df_speed.rename(columns={0:'speed'})
            frames = [df_hausdroff, df_direction, df_speed]
            data = pd.concat(frames, axis=1)
            data = data.fillna(0)
            data[['hausdroff','speed','direction']]= minmax_scale(data[['hausdroff','speed','direction']])
            distance_matrix = structural_similarity(data)
            print(distance_matrix)
main()
