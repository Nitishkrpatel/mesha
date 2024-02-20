import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  // serverURL = 'http://202.131.150.86:5010/'; // public server
  // serverURL = 'http://192.168.31.75:5000/'; // prashant laptop
  // serverURL = 'http://192.168.31.132:5000/'; //murali laptop
  serverURL = 'http://192.168.31.249:5000/'; //murali desktop
  // serverURL = 'http://192.168.31.180:5000/'; //prashant desktop
  // serverURL = 'http://192.168.31.231:5000/'; //my laptop
  // serverURL = 'http://192.168.43.105:5000/'; //my laptop-phone

  userEndPoints = `${this.serverURL}user/`;
  adminEndPoints = `${this.serverURL}admin/`;
  shipEndPoints = `${this.serverURL}ship_map/`;
  shipInterestEndPoints = `${this.serverURL}interests/`;
  vesselFilterEndPoints = `${this.serverURL}vessel_filter/`;
  dashboardEndPoints = `${this.serverURL}dashboard/`;
  playHistoryEndPoints = `${this.serverURL}playhistory/`;

  constructor(private http: HttpClient) {}

  getAllSecurityQuestions(): Observable<any> {
    const securityquestionURL = this.userEndPoints + 'security_questions';
    return this.http.get(securityquestionURL);
  }

  // Login Component
  // User login
  userLogin(data: any): Observable<any> {
    const httpoptions = {
      headers: new HttpHeaders({
        'content-type': 'application/json',
        Authorization: 'Basic ' + btoa(data.userid + ':' + data.password),
      }),
    };
    const userLoginURL = this.serverURL;
    data = JSON.stringify('');
    return this.http
      .post<any>(userLoginURL, data, httpoptions)
      .pipe(catchError(this.errorHandler));
  }

  logout(username: any): Observable<any> {
    const logoutURL = this.userEndPoints + 'logout?user_name=';
    return this.http.get(logoutURL + username);
  }

  requestApproval(data: {}): Observable<any> {
    const requestApprovalURL = this.adminEndPoints + 'process_requests';
    data = JSON.stringify(data);
    return this.http
      .post<any>(requestApprovalURL, data)
      .pipe(catchError(this.errorHandler));
  }

  forgotUserPassword(data: {}): Observable<any> {
    const requestApprovalURL = this.userEndPoints + 'forgot_password';
    data = JSON.stringify(data);
    return this.http
      .post<any>(requestApprovalURL, data)
      .pipe(catchError(this.errorHandler));
  }

  forgotUserName(data: any): Observable<any> {
    const forgotusernameURL = this.userEndPoints + 'forgot_username';
    data = JSON.stringify(data);
    return this.http
      .post<any>(forgotusernameURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getUserSecurityQuestion(username: any): Observable<any> {
    const userSecurityquestionlURL =
      this.userEndPoints + 'user_security_question?user_name=';
    return this.http.get(userSecurityquestionlURL + username);
  }

  // End Login Component

  // User Register component
  checkUserIdOrEmailId(data: any): Observable<any> {
    const checkforemailidandusernameURL =
      this.userEndPoints + 'check_availability';
    data = JSON.stringify(data);
    return this.http
      .post<any>(checkforemailidandusernameURL, data)
      .pipe(catchError(this.errorHandler));
  }

  userRegister(data: {}): Observable<any> {
    const userregisterURL = this.userEndPoints + 'new_account_request';
    data = JSON.stringify(data);
    return this.http
      .post<any>(userregisterURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // Admin-console -> Queue requests ->
  getAllUserRequests(): Observable<any> {
    const url = this.adminEndPoints + 'user_requests';
    return this.http.get(url);
  }

  getAllRoles(): Observable<any> {
    const getallrolesURL = this.adminEndPoints + 'user_roles';
    return this.http.get(getallrolesURL);
  }

  createTempPwd(data: any): Observable<any> {
    const createTemPwdURL = this.adminEndPoints + 'password_reset';
    data = JSON.stringify(data);
    return this.http
      .post<any>(createTemPwdURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getForgotUsername(data: any): Observable<any> {
    const forgetPwdURL = this.adminEndPoints + 'process_name_request';
    data = JSON.stringify(data);
    return this.http
      .post<any>(forgetPwdURL, data)
      .pipe(catchError(this.errorHandler));
  }
  
  // manage-uesrs 
  getAllUsers(): Observable<any> {
    const url = this.adminEndPoints + 'users';
    return this.http.get(url);
  }

  deleteUser(user_name: any): Observable<any> {
    const url = this.adminEndPoints + 'delete_user?user_name=';
    return this.http.get(url + user_name);
  }

  editUser(data: any): Observable<any> {
    const editUserURL = this.adminEndPoints + 'edit_user';
    data = JSON.stringify(data);
    return this.http
      .post<any>(editUserURL, data)
      .pipe(catchError(this.errorHandler));
  }

  addNewUser(data: any): Observable<any> {
    const newUserURL = this.adminEndPoints + 'add_user';
    data = JSON.stringify(data);
    return this.http
      .post<any>(newUserURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // Roles and permissions

  getAllRolesAndPermission(): Observable<any> {
    const url = this.adminEndPoints + 'roles';
    return this.http.get(url);
  }

  deleteRole(role: any): Observable<any> {
    const url = this.adminEndPoints + 'delete_role?role=';
    return this.http.get(url + role);
  }

  editRole(data: any): Observable<any> {
    const editRoleURL = this.adminEndPoints + 'edit_role';
    data = JSON.stringify(data);
    return this.http
      .post<any>(editRoleURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getAllFeatures(): Observable<any> {
    const url = this.adminEndPoints + 'features';
    return this.http.get(url);
  }

  addNewRole(data: any): Observable<any> {
    const addNewRoleURL = this.adminEndPoints + 'add_role';
    data = JSON.stringify(data);
    return this.http
      .post<any>(addNewRoleURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // main-navbar-component
  updateAdjusteTime(data: any): Observable<any> {
    const updateAdjustedTimeURL = this.userEndPoints + 'update_time';
    data = JSON.stringify(data);
    return this.http
      .post<any>(updateAdjustedTimeURL, data)
      .pipe(catchError(this.errorHandler));
  }

  updateSpeed(speed: any): Observable<any> {
    const updateSpeedURL = this.userEndPoints + 'update_speed?speed=';
    return this.http.get(updateSpeedURL + speed);
  }

  clockStatus(data: {}): Observable<any> {
    const clockstatusURL = this.userEndPoints + 'pause';
    data = JSON.stringify(data);
    return this.http
      .post<any>(clockstatusURL, data)
      .pipe(catchError(this.errorHandler));
  }

  //end main-navbar-component

  getUserAdjustedTime(): Observable<any> {
    const getUserAdjustedTimeURL = this.userEndPoints + 'fetch_time';
    return this.http.get(getUserAdjustedTimeURL);
  }

  getSearchOptionsResult(data: {}): Observable<any> {
    const getsearchoptionsresultURL = this.shipEndPoints + 'search';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getsearchoptionsresultURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getSearchHistory(): Observable<any> {
    const getsearchHistoryURL = this.userEndPoints + 'search_history';
    return this.http.get(getsearchHistoryURL);
  }

  getSearchResult(data: {}): Observable<any> {
    const getsearcresultURL = this.shipEndPoints + 'search_result';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getsearcresultURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // ship-map

  getShipsLkp(data: {}): Observable<any> {
    const shipURL = this.shipEndPoints + 'ship_lkp';
    data = JSON.stringify(data);
    return this.http
      .post<any>(shipURL, data)
      .pipe(catchError(this.errorHandler));
  }

  fetchShipDetailsData(data: {}): any {
    const shipURL = this.shipEndPoints + 'mmsi_details';
    data = JSON.stringify(data);
    return this.http
      .post<any>(shipURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getPortsData(): Observable<any> {
    const portsURL = this.shipEndPoints + 'ports';
    return this.http.get(portsURL);
  }

  getAnchorsData(): Observable<any> {
    const portsURL = this.shipEndPoints + 'anchors';
    return this.http.get(portsURL);
  }

  addShipToSoI(data: {}): Observable<any> {
    const addSoiURL = this.shipInterestEndPoints + 'add_soi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(addSoiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getPastTrackData(data: {}): Observable<any> {
    const pastTrackURL = this.shipEndPoints + 'past_track';
    data = JSON.stringify(data);
    return this.http
      .post<any>(pastTrackURL, data)
      .pipe(catchError(this.errorHandler));
  }

  //sidenav
  getFeatureForRole(): any {
    const getfeatureforroleURL = this.userEndPoints + 'role_features';
    return this.http.get(getfeatureforroleURL);
  }

  //Ship of interest

  getShipOfInterestOfUser(): Observable<any> {
    const userSoiURL = this.shipInterestEndPoints + 'user_soi';
    return this.http.get(userSoiURL);
  }

  deleteSoI(data: {}): Observable<any> {
    const deletesoiURL = this.shipInterestEndPoints + 'delete_soi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(deletesoiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  soigoiTrackInfo(trackinfo: {}): Observable<any> {
    const soitrackinfoURL = this.shipInterestEndPoints + 'track_info';
    trackinfo = JSON.stringify(trackinfo);
    return this.http
      .post<any>(soitrackinfoURL, trackinfo)
      .pipe(catchError(this.errorHandler));
  }

  // goi

  getGoIDetailsForUser(): any {
    const userGoiDetailsURL = this.shipInterestEndPoints + 'user_goi';
    return this.http.get(userGoiDetailsURL);
  }

  addToGoI(data: {}): any {
    const groupsofinterestURL = this.shipInterestEndPoints + 'add_to_goi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(groupsofinterestURL, data)
      .pipe(catchError(this.errorHandler));
  }

  editGoI(data: {}): Observable<any> {
    const editgoiURL = this.shipInterestEndPoints + 'update_goi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(editgoiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  deleteGoI(deletegoi: {}): Observable<any> {
    const deletegoiURL = this.shipInterestEndPoints + 'delete_from_goi';
    deletegoi = JSON.stringify(deletegoi);
    return this.http
      .post<any>(deletegoiURL, deletegoi)
      .pipe(catchError(this.errorHandler));
  }

  shipTrack(shiptrackdata: {}): Observable<any>{
    const shipTrajectoryURL = this.shipInterestEndPoints + 'soi_trajectory';
    shiptrackdata = JSON.stringify(shiptrackdata);
    return this.http
      .post(shipTrajectoryURL, shiptrackdata)
      .pipe(catchError(this.errorHandler));
  }

  // Dashboard Start
  //Overview Dashboard
  getOverviewData(shipCountData: {}):Observable<any> {
    const shipTrajectoryURL = this.dashboardEndPoints + 'ship_count';
    shipCountData = JSON.stringify(shipCountData);
    return this.http
      .post(shipTrajectoryURL, shipCountData)
      .pipe(catchError(this.errorHandler));
  }

  getNeighbouringCountryShipCount(shipCountData: {}):Observable<any> {
    const shipTrajectoryURL = this.dashboardEndPoints + 'shipcount_by_country';
    shipCountData = JSON.stringify(shipCountData);
    return this.http
      .post(shipTrajectoryURL, shipCountData)
      .pipe(catchError(this.errorHandler));
  }

  getVennChartData(timeStamp:any):Observable<any>{
    const anomalyChartURL = this.dashboardEndPoints + 'anomaly_chart?timestamp=';
    // anomalyChartData = JSON.stringify(anomalyChartData);
    return this.http.get(anomalyChartURL + timeStamp)
          //  .pipe(catchError(this.errorHandler));
  }

  // Anomaly Information:

  //shipType Anomaly Information
  getShipTypeAnomaly(data: {}): Observable<any> {
    const shiptypeanomalyURL = this.dashboardEndPoints + 'type_anomaly';
    data = JSON.stringify(data);
    return this.http
      .post<any>(shiptypeanomalyURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getTrajectoryForAnomaly(data: {}): Observable<any> {
    const shiptypeanomalyURL = this.dashboardEndPoints + 'anomaly_info';
    data = JSON.stringify(data);
    return this.http
      .post<any>(shiptypeanomalyURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // speed anomaly information
  getSpeedAnomaly(data: {}): Observable<any> {
    const speedeanomalyURL = this.dashboardEndPoints + 'speed_anomaly';
    data = JSON.stringify(data);
    return this.http
      .post<any>(speedeanomalyURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // transmission anomaly information
  getTransmissionAnomaly(data: {}): Observable<any> {
    const speedeanomalyURL = this.dashboardEndPoints + 'transmission_anomaly';
    data = JSON.stringify(data);
    return this.http
      .post<any>(speedeanomalyURL, data)
      .pipe(catchError(this.errorHandler));
  }

  //get total Anomaly count Of any anomaly

  getAnomalyCount(data: {}): Observable<any> {
    const speedeanomalyURL = this.dashboardEndPoints + 'anomaly_count';
    data = JSON.stringify(data);
    return this.http
      .post<any>(speedeanomalyURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // overlapping anomaly

  getOverlappingAnomalies(data: {}): Observable<any> {
    const speedeanomalyURL = this.dashboardEndPoints + 'overlapping_anomaly';
    data = JSON.stringify(data);
    return this.http
      .post<any>(speedeanomalyURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // ROI

  addRoI(data: {}): Observable<any> {
    const addroiURL = this.shipInterestEndPoints + 'create_roi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(addroiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getRoIDetailsForUser(): Observable<any> {
    const roidetailsforuserURL = this.shipInterestEndPoints + 'display_roi';
    return this.http.get(roidetailsforuserURL);
  }

  editRoI(data: {}): Observable<any> {
    const editroiURL = this.shipInterestEndPoints + 'edit_roi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(editroiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  deleteRoI(data: {}): Observable<any> {
    const deleteroiURL = this.shipInterestEndPoints + 'delete_roi';
    data = JSON.stringify(data);
    return this.http
      .post<any>(deleteroiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getAllCategories(): Observable<any> {
    const categoriesListUserURL = this.shipInterestEndPoints + 'categories';
    return this.http.get(categoriesListUserURL);
  }


  getShipDetailsBasedOnRoI(data: {}): Observable<any> {
    const getshipdetailsbasedonroiURL = this.shipInterestEndPoints + 'roi_lkp';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getshipdetailsbasedonroiURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getStatInfo(data: {}): Observable<any> {
    const getRoiStatInfoURL = this.shipInterestEndPoints + 'stats_info';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getRoiStatInfoURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getAnomalyInfoInRoI(data: {}): Observable<any> {
    const getRoiStatInfoURL = this.shipInterestEndPoints + 'roi_anomaly';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getRoiStatInfoURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // vessel filter

  getSearchResultInVesselFilter(data: {}): Observable<any> {
    const vesselFilterSearchURL = this.vesselFilterEndPoints + 'search';
    data = JSON.stringify(data);
    return this.http
      .post<any>(vesselFilterSearchURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getVesselFilterData(data: {}): Observable<any> {
    const vesselFilterDataURL = this.vesselFilterEndPoints;
    data = JSON.stringify(data);
    return this.http
      .post<any>(vesselFilterDataURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getAllPreset(): Observable<any> {
    const getAllPresetURL = this.vesselFilterEndPoints + 'preset_list';
    return this.http.get(getAllPresetURL);
  }

  getPresetResults(pid:any): Observable<any> {
    const getPresetResultsURL = this.vesselFilterEndPoints + 'preset_select?pid=';
    return this.http.get(getPresetResultsURL + pid);
  }

  deletePreset(pid:any): Observable<any> {
    const deletePresetURL = this.vesselFilterEndPoints + 'preset_delete?pid=';
    return this.http.get(deletePresetURL + pid);
  }

  getPredictDestination(data: {}): Observable<any> {
    const destinationURL = this.shipEndPoints + 'destination';
    data = JSON.stringify(data);
    return this.http
      .post<any>(destinationURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // play History API
  getSearchResultInPlayHistory(data: {}): Observable<any> {
    const getSearchResultInPlayHistoryURL = this.playHistoryEndPoints + 'search';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getSearchResultInPlayHistoryURL, data)
      .pipe(catchError(this.errorHandler));
  }

  addToList(data: {}): Observable<any> {
    const getSearchResultInPlayHistoryURL = this.playHistoryEndPoints + 'add_to_list';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getSearchResultInPlayHistoryURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getHistoryList(): Observable<any> {
    const getHistoryListURL = this.playHistoryEndPoints + 'history_list';
    return this.http.get(getHistoryListURL);
  }

  deleteFromHistoryList(data: {}): Observable<any> {
    const deleteFromHistoryListURL = this.playHistoryEndPoints + 'history_delete';
    data = JSON.stringify(data);
    return this.http
      .post<any>(deleteFromHistoryListURL, data)
      .pipe(catchError(this.errorHandler));
  }

  getPlayHistory(data: {}): Observable<any> {
    const getPlayHistoryURL = this.playHistoryEndPoints + 'play';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getPlayHistoryURL, data)
      .pipe(catchError(this.errorHandler));
  }

  // route prediction 
  getPredictRoute(data: {}): Observable<any> {
    const getPlayHistoryURL = this.shipEndPoints + 'route_prediction';
    data = JSON.stringify(data);
    return this.http
      .post<any>(getPlayHistoryURL, data)
      .pipe(catchError(this.errorHandler));
  }
  
  
  errorHandler(error: HttpErrorResponse): any {
    return throwError(error);
  }
}
