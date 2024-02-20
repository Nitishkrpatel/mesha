import pandas as pd
import psycopg2
from mpl_toolkits.basemap import Basemap
import matplotlib.pyplot as plt
from h3 import h3
import h3pandas


# def fetch_traj_id():
#     conn = psycopg2.connect(
#     host="192.168.31.180",
#     database="shipdb",
#     user="postgres",
#     password=""
#     )
#     cursor = conn.cursor()
#     cursor.execute("SELECT distinct(traj_id) FROM mmsi_trajectories where sport!='NA' and dport!='NA' and sport!=dport")
#     results = cursor.fetchall()
#     return results

def find_grids(data):
    data = data.h3.geo_to_h3(1)
    # preprocess_data.head(30)
    # Add geometry with centroid of each H3 address to the DataFrame.
    data=data.h3.h3_to_geo().reset_index()
    # print(len(data['h3_01'].unique()))
    return data

def fetch_trajectories():
    # traj_ids = fetch_traj_id()
    traj_ids = [2,3,8,10,106,54367,61319,304198,314898,319975,175101,106,132,135,178,113416,186]
    # traj_ids = [49105, 55598, 59344, 126952, 100952, 284726, 263681, 284988, 126421, 297249, 62111, 234946, 307151, 11526, 308668, 1457, 12029, 20602]
    all_data = pd.DataFrame()
    for traj_id in traj_ids:
        # print(traj_id)
        lat = []
        long = []
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
            all_data = pd.concat([all_data, df], ignore_index=True)
            # if len(results) >= 50:
            #     lat, long = df['lat'], df['lng']
            #     lat = list(lat)
            #     long = list(long)
            #     map = Basemap(projection='mill', llcrnrlat=-90, urcrnrlat=90,
            #                   llcrnrlon=-180, urcrnrlon=180, resolution='c')

            #     # Draw coastlines and country borders
            #     map.drawcoastlines(linewidth=0.5)
            #     map.drawcountries(linewidth=0.5)
            #     x, y = map(long, lat)
            #     map.plot(x, y, 'ro', markersize=0.2)
            #     # plt.savefig('/home/user/Documents/l9_MI_project/figure.png', dpi=300)
            #     filename = f'/home/user/Documents/destination_prediction/figure_traj_{traj_id}.png'
            #     # print(filename)
            #     plt.savefig(filename, dpi=300)
            #     plt.clf()
            
        except Exception as e:
            print(f"An exception occurred for traj_id={i[0]}: {e}")
        finally:
            cursor.close()
            conn.close()
    all_data = find_grids(all_data)
    all_data.to_csv('output.csv', index=False)
    # print(all_data)
    # lat = list(all_data['lat'])
    # lng = list(all_data['lng'])
    # hex_ids = list(all_data['h3_01'])

    # # Create a Basemap instance
    # map = Basemap(projection='mill', llcrnrlat=-90, urcrnrlat=90,
    #             llcrnrlon=-180, urcrnrlon=180, resolution='c')

    # # Draw coastlines and country borders
    # map.drawcoastlines(linewidth=0.5)
    # map.drawcountries(linewidth=0.5)

    # # Plot the hexagonal grids
    # for hex_id in hex_ids:
    #     vertices = h3.h3_to_geo_boundary(hex_id)
    #     x, y = map([v[1] for v in vertices], [v[0] for v in vertices])
    #     map.plot(x, y, color='red', linewidth=0.5)

    # # Plot the data points
    # x, y = map(lng, lat)
    # map.plot(x, y, 'bo', markersize=0.2)

    # # Save the figure
    # filename = '/home/user/Documents/destination_prediction/alldata.png'
    # plt.savefig(filename, dpi=300)
    # plt.clf()
fetch_trajectories()

