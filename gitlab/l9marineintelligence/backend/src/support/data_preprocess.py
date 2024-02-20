import sys
import os
import pandas as pd
from io import StringIO
from shapely.geometry import Point
import geopandas as gpd
from multiprocessing import Pool, Manager
sys.path.append(os.getcwd())
from src.config import shipdb_pool  # noqa
from src.support.ship_trajectory import find_trajectory_from_database

def data_preprocess_csv(df):
    """Preprocess AIS data to generate cleaned data for trajectory computation."""
    try:
        # columns as in csv
        # ['FID', 'mmsi', 'imo', 'vessel_name', 'callsign', 'vessel_type',
        # 'vessel_type_code', 'vessel_type_cargo', 'vessel_class', 'length',
        # 'width', 'flag_country', 'flag_code', 'destination', 'eta', 'draught',
        # 'longitude', 'latitude', 'sog', 'cog', 'rot', 'heading', 'nav_status',
        # 'nav_status_code', 'source', 'ts_pos_utc', 'ts_static_utc',
        # 'dt_pos_utc', 'dt_static_utc', 'vessel_type_main', 'vessel_type_sub',
        # 'message_type']

        # delete rows with null values
        print(df.head(10))
        df = df.replace(to_replace=[',', '\\\\', '\'', '\"'], value='', regex=True)
        df = df[~df['mmsi'].isnull()]  # MMSI
        df = df[~df['dt_pos_utc'].isnull()]   # UTC_TIME - TRANSMISSION TIME
        df = df[~df['latitude'].isnull()]   # COORDINATES
        df = df[~df['longitude'].isnull()]
        df = df[~df['sog'].isnull()]  # SPEED
        df = df[~df['cog'].isnull()]   # COURSE
        # drop  rows if datetime is not proper
        df['dt_pos_utc'] = pd.to_datetime(df['dt_pos_utc'], errors='coerce')
        df = df[~df['dt_pos_utc'].isnull()]
        # df = df[~df.astype(str).apply(lambda x: x.str.match(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')).any(axis=1)] 
        # df['nav_status_code'] = pd.to_numeric(df['nav_status_code'], errors='coerce')
        # df = df[~df['nav_status_code'].isnull()]

        # Transmission time converted to IST
        df["ist_time"] = pd.to_datetime(df['dt_pos_utc'].dt.tz_localize('UTC').
                                        dt.tz_convert('Asia/Kolkata'))
        df['ist_time'] = df['ist_time'].dt.strftime("%Y-%m-%d %H:%M:%S")
        df['dt_pos_utc'] = df['dt_pos_utc'].astype('str')
        df['ist_time'] = df['ist_time'].astype('str')
        df['eta'] = df['eta'].fillna(0)
        df['eta'] = pd.to_datetime(df['ist_time']) + pd.to_timedelta(df['eta'], unit='s')
        df['eta'] = pd.to_datetime(df['eta']).dt.strftime("%Y-%m-%d %H:%M:%S")
        df['eta'] = df['eta'].astype('str')
        # https://api.vtexplorer.com/docs/ref-aistypes.html
        # https://help.marinetraffic.com/hc/en-us/articles/205579997-What-is-the-significance-of-the-AIS-Shiptype-number-
        # ship_types as in csv
        # ['Cargo' 'Unknown' 'Tanker' 'Tug' 'Pilot' 'Passenger' 'Other' 'Fishing'
        # 'UNAVAILABLE' 'WIG' 'Dredging' 'Spare' 'Reserved' 'Not Available' 'HSC'
        # 'Sailing' 'Towing' 'Pleasure Craft' 'Diving' 'Port Tender'
        # 'Law Enforcement' 'Military' 'Ships Not Party to Armed Conflict' 'SAR'
        # 'Vessel With Anti-Pollution Equipment' 'Medical Transport']
        df['category_id'] = df[['vessel_type', 'vessel_type_code']].apply(
            lambda x: 1 if ((x.vessel_type_code >= 70 and x.vessel_type_code <= 79) or x.vessel_type.lower() == 'cargo')
            else 2 if (x.vessel_type_code == 30 or x.vessel_type.lower() == 'fishing')
            else 3 if ((x.vessel_type_code >= 80 and x.vessel_type_code <= 89) or x.vessel_type.lower() == 'tanker')
            else 4 if ((x.vessel_type_code >= 60 and x.vessel_type_code <= 69) or x.vessel_type.lower() == 'passenger')
            else 5 if ((x.vessel_type_code >= 40 and x.vessel_type_code <= 49) or x.vessel_type.lower() == 'hsc')
            else 6 if ((x.vessel_type_code >= 20 and x.vessel_type_code <= 29) or x.vessel_type.lower() == 'wig')
            else 7 if ((x.vessel_type_code >= 90 and x.vessel_type_code <= 99) or x.vessel_type.lower() == 'other')
            else 8 if (x.vessel_type_code in (10, 11, 12, 16, 17, 18, 19, 38, 39) or x.vessel_type.lower() == 'reserved')
            else 9 if (x.vessel_type_code in (31, 32) or x.vessel_type.lower() == 'towing')
            else 10 if (x.vessel_type_code == 52 or x.vessel_type.lower() == 'tug')
            else 11 if (x.vessel_type_code == 33 or x.vessel_type.lower() == 'dredging')
            else 12 if (x.vessel_type_code == 51 or x.vessel_type.lower() == 'sar')  # Search and Rescue vessel
            else 13 if (x.vessel_type_code in (56, 57) or x.vessel_type.lower() == 'spare')
            else 14 if (x.vessel_type_code == 35 or x.vessel_type.lower() == 'military')
            else 15 if (x.vessel_type.lower() == 'pilot' or x.vessel_type_code == 50)
            else 16 if (x.vessel_type_code == 37 or 'pleasure' in x.vessel_type.lower())
            else 17 if (x.vessel_type_code == 34 or x.vessel_type.lower() == 'diving')
            else 18 if (x.vessel_type_code == 36 or x.vessel_type.lower() == 'sailing')
            else 19 if (x.vessel_type_code == 53 or 'tender' in x.vessel_type.lower())
            else 20 if (x.vessel_type_code == 54 or 'pollution' in x.vessel_type.lower())
            else 21 if (x.vessel_type_code == 55 or 'law' in x.vessel_type.lower())
            else 22 if (x.vessel_type_code == 58 or 'medical' in x.vessel_type.lower())
            else 23 if (x.vessel_type_code == 59 or 'armed conflict' in x.vessel_type.lower())
            # Noncombatant ship according to RR Resolution No. 18
            else 24,  # NA, unknown, unavailable
            axis=1
        )
        df['destination'] = df['destination'].fillna('Not Available')
        df["imo"] = df['imo'].fillna(100100100)  # random value
        df["imo"] = df["imo"].astype(int)
        df["message_type"] = df["message_type"].astype(int)
        df["nav_status_code"] = df["nav_status_code"].astype(int)
        return df
    except Exception as e:
        print(e)
        return


# read csv
def read_csv_from_folder():
    # DB COLUMNS
    # mmsi,lat,long,sog,cog,category_id,category,heading,callsign,ship_type_code,nav_status
    # nav_status_code, utc_time, ist_time, destination, draught, eta, rot, message_type
    cols = ['mmsi', 'imo', 'vessel_name', 'callsign', 'vessel_type', 'vessel_type_code',
            'vessel_class', 'length', 'width', 'flag_country', 'destination', 'eta',
            'draught', 'longitude', 'latitude', 'sog', 'cog', 'rot', 'heading',
            'nav_status', 'nav_status_code', 'dt_pos_utc', 'message_type']
    
    cols_csv = ['FID', 'mmsi', 'imo', 'vessel_name', 'callsign', 'vessel_type',
                'vessel_type_code', 'vessel_type_cargo', 'vessel_class', 'length',
                'width', 'flag_country', 'flag_code', 'destination', 'eta', 'draught',
                'longitude', 'latitude', 'sog', 'cog', 'rot', 'heading', 'nav_status',
                'nav_status_code', 'source', 'ts_pos_utc', 'ts_static_utc',
                'dt_pos_utc', 'dt_static_utc', 'vessel_type_main', 'vessel_type_sub',
                'message_type']
    # files = os.listdir(os.path.join(os.getcwd(), "csv_data"))
    files = os.listdir(os.path.join(os.getcwd(), "csv_data"))
    for file in sorted(files):

        df = pd.read_csv(os.path.join(os.getcwd(), "csv_data", file), usecols=cols)

        # filtered_df = df[df.filter(regex=r'^Unnamed').notnull().any(axis=1)].index
        # df = df.drop(filtered_df)
        # df = df.reset_index(drop=True)
        # df = df[cols]
        cleaned_df = data_preprocess_csv(df)
        del df
        extract_ship_table_data(cleaned_df)
        extract_transmission_table_data(cleaned_df)
        del cleaned_df


def extract_ship_table_data(df):
    df1 = [df["imo"], df["mmsi"], df["vessel_name"], df["flag_country"],
           df["length"], df["width"], df["vessel_class"], df["category_id"]]
    ship_columns = ["imo", "mmsi", "ship_name", "origin_country",
                    "length", "width", "class", "category_id"]
    df1 = pd.concat(df1, axis=1, keys=ship_columns)
    df1 = df1.replace(',', ' ', regex=True)
    df1["ship_name"] = df1["ship_name"].str.replace(r'\\', '', regex=True)
    df1["origin_country"] = df1["origin_country"].str.replace(r'\\', '', regex=True)
    
    df1.sort_values(['mmsi', 'length', 'width'], inplace=True, ascending=False, ignore_index=True)
    df1 = df1.drop_duplicates(subset="mmsi", keep="first")
    df1['origin_country'] = df1['origin_country'].fillna('Not Available')
    row = [tuple(row) for row in df1.to_numpy()]
    query = """insert into ship(imo,mmsi,ship_name,origin_country,length,width,class,category_id)
            values(%s,%s,%s,%s,%s,%s,%s,%s) on conflict(mmsi) do nothing"""
    connection = shipdb_pool.connect()
    trans = connection.begin()
    try:
        connection.execute(query, row)
        trans.commit()
        print("Inserted to ship table")
    except Exception as e:
        print(e)
        trans.rollback()
        return
    finally:
        del df1
        if connection:
            connection.close()


def extract_transmission_table_data(df):
    # mmsi,lat,long,sog,cog,category_id,category,heading,callsign,ship_type_code,nav_status
    # nav_status_code, utc_time, ist_time, destination, draught, eta, rot, message_type
    df1 = [df["mmsi"], df["latitude"], df["longitude"], df["sog"], df["cog"], df['category_id'],
           df["vessel_type"], df["heading"], df["callsign"], df["vessel_type_code"],
           df["nav_status"], df["nav_status_code"], df["dt_pos_utc"], df["ist_time"],
           df["destination"], df["draught"], df["eta"], df["rot"], df['message_type']]
    ship_headers = ["mmsi", "lat", "long", "sog", "cog", "category_id", "category", "heading",
                    "callsign", "ship_type_code", "nav_status", "nav_status_code", "utc_time",
                    "ist_time", "destination", "draught", "eta", "rot", "message_type"]

    df1 = pd.concat(df1, axis=1, keys=ship_headers)
    df1 = df1.replace('\'', '', regex=True)
    df1 = df1.replace('\"', '', regex=True)
    df1 = df1.replace(',', ' ', regex=True)
    df1["destination"] = df1["destination"].str.replace(r'\\', '', regex=True)
    df1["destination"] = df1["destination"].str.replace(r'\,', ' ', regex=True)
    # df2 = df1[~df1['mmsi'].between(201000000, 775999999)]
    df1 = df1[df1['mmsi'].between(201000000, 775999999)]
    # Create a GeoDataFrame
    geometry = gpd.GeoSeries([Point(lon, lat) for lon, lat in zip(df1['long'], df1['lat'])], crs='EPSG:4326')
    df1['point'] = geometry
    print(df1.tail(10))
    ship_headers = ["mmsi", "lat", "long", "sog", "cog", "category_id", "category", "heading",
                    "callsign", "ship_type_code", "nav_status", "nav_status_code", "utc_time",
                    "ist_time", "destination", "draught", "eta", "rot", "message_type", "point"]
    buffer = StringIO()
    df1.to_csv(buffer, index=False, header=False, columns=ship_headers)
    buffer.seek(0)
    conn = shipdb_pool.connect()
    trans = conn.begin()
    try:
        cursor = conn.connection.cursor()
        cursor.copy_from(buffer, 'ship_transmission', sep=",", null="", columns=ship_headers)
        trans.commit()
        cursor.close()
        buffer.close()
        print("Inserted to transmission table")
    except Exception as error:
        print("Error: Rollingback " + str(error))
        trans.rollback()
    finally:
        if conn:
            cursor.close()
            conn.close()
        del df1
    # # invalid mmsi transmission
    # ship_headers = ["mmsi", "lat", "long", "sog", "cog", "category_id", "category", "heading",
    #                 "callsign", "ship_type_code", "nav_status", "nav_status_code", "utc_time",
    #                 "ist_time", "destination", "draught", "eta", "rot", "message_type"]
    # buffer = StringIO()
    # df2.to_csv(buffer, index=False, header=False, columns=ship_headers)
    # buffer.seek(0)
    # conn = shipdb_pool.connect()
    # trans = conn.begin()
    # try:
    #     cursor = conn.connection.cursor()
    #     cursor.copy_from(buffer, 'ship_transmission_invalid', sep=",", null="", columns=ship_headers)
    #     trans.commit()
    #     cursor.close()
    #     buffer.close()
    #     print("Inserted to transmission_invalid table")
    # except Exception as error:
    #     print("Error: Rollingback " + str(error))
    #     trans.rollback()
    #     cursor.close()
    #     return
    # finally:
    #     if conn:
    #         cursor.close()
    #         conn.close()
    #     del df2


def trajectory_pool():
    # with shipdb_pool.connect() as connection:
    #     mmsi_list_df = pd.read_sql_query("""select mmsi from ship where mmsi between
    #                               201000000 and 775999999""", connection)

    # with shipdb_pool.connect() as connection:
    #     computed_mmsi= pd.read_sql_query("select distinct mmsi from mmsi_traj_info", connection)

    # mmsi_list = list(mmsi_list_df['mmsi'])
    # mmsi_list = set(mmsi_list)
    # computed_mmsi_list = set(computed_mmsi['mmsi'])
    # mmsi_list = list(mmsi_list.difference(computed_mmsi_list))
    mmsi_list = [413323610]
    print("Total MMSI present:", len(mmsi_list))
    manager = Manager()
    with shipdb_pool.connect() as connection:
        all_ports = pd.read_sql_query("select h3_01,lat,long,port_name from ports", connection)
    shared_df = manager.Namespace()
    manager_df = all_ports
    # Create a pool of processes
    pool = Pool(processes=4)

    # Combine the Manager DataFrame and the list into a tuple
    # data = (manager_df, mmsi_list)
    # Combine the list and the Manager DataFrame into a tuple
    data = [(item, manager_df) for item in mmsi_list]
    pool.map(find_trajectory_from_database, data)
#     # Apply the process_data function to the shared Manager DataFrame
    # results = pool.apply(find_trajectory_from_database, args=(data,))

#     # # Access the modified shared Manager DataFrame
#     # manager_df_updated = results.get()
    # pool.map(mmsi_traj_from_db, mmsi_list)


if __name__ == '__main__':
    read_csv_from_folder()
    # trajectory_pool()


# df = pd.read_csv('/home/muralidhara/Downloads/W1-20230605T123501Z-001/W1/20171201040000_20171201080000.csv', usecols=['nav_status', 'nav_status_code'])
# # print(df.columns)
# # df = df.drop_duplicates(subset=['nav_status', 'nav_status_code'], keep='first')
# # df.to_csv("nav_status.csv")
# print(df['nav_status_code'].unique())
