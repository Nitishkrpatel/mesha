
def consecutive_segments(grid_data):
    segment_list = []
    segment_list_sog = []    
    unique_traj_id = grid_data['traj_id'].unique()
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
    n = len(segment_list)   
    print(n)


def input_segments(x):
    input_segments = list(product(x, repeat = 2))
    return input_segments
def input_segments_sog(y):
    input_segments_sog = list(product(y, repeat = 2))
    return input_segments_sog

def hausdroff_segments(V1):
    haudroff_lis = []
    for i in range(0,len(V1)):
        x1 = V1[i]
        distance3=directed_hausdorff(np.array(V1[i][0]), np.array(V1[i][1]), seed=0)  
        haudroff_lis.append(distance3[0])
    return haudroff_lis

def speed_segments(points):
    speed_distance_lis = []
    for i in range(0,len(points)):
        x1 = (points[i][0][0] + points[i][0][1])/2
        x2 = (points[i][1][0] + points[i][1][1])/2
        speed_distance = x2-x1
        speed_distance_lis.append(speed_distance)
    return speed_distance_lis

    
def directional_segments(points):

    directionaldistance =[]
    for i in range(0,len(points)):
        distance3= d.euclidean(points[i][0][0],points[i][0][1])  
        distance4= d.euclidean(points[i][1][0], points[i][1][1]) 
        x = min(distance3, distance4)
        angle = np.dot(distance3 , distance4)
        if int(angle) >= 0 and int(angle) <= 90:
            distance = x * math.sin(angle) 
            directionaldistance.append(distance)
        elif int(angle) >= 90 and int(angle) <= 180 :
            distance = x
            directionaldistance.append(distance)
    return directionaldistance   
 
