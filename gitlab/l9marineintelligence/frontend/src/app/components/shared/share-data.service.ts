import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShareDataService {
  private vesselCountSource = new BehaviorSubject(0);
  vesselCount = this.vesselCountSource.asObservable();

  private timeInSideNavSource = new BehaviorSubject('');
  time = this.timeInSideNavSource.asObservable();

  private zoomLevelSource = new BehaviorSubject(0);
  zoomLevel = this.zoomLevelSource.asObservable();

  private SOISource = new BehaviorSubject('');
  SOI = this.SOISource.asObservable();

  private ROISource = new BehaviorSubject('');
  ROI = this.ROISource.asObservable();

  private VFSource = new BehaviorSubject('');
  VF = this.VFSource.asObservable();

  private ExtentSource = new BehaviorSubject('');
  Extent = this.ExtentSource.asObservable();

  private clearSearchSource = new BehaviorSubject('');
  clearsearch = this.clearSearchSource.asObservable();

  private updateSOISource = new BehaviorSubject('');
  updatesoi = this.updateSOISource.asObservable();

  private updateGOISource = new BehaviorSubject('');
  updategoi = this.updateGOISource.asObservable();

  private updateROISource = new BehaviorSubject('');
  updateroi = this.updateROISource.asObservable();
  
  private VFUpdateSource = new BehaviorSubject('');
  updatevf = this.VFUpdateSource.asObservable();

  private NavbarInROISource = new BehaviorSubject(false);
  NavbarInROI = this.NavbarInROISource.asObservable();

  private OverlappingAnomalySource = new BehaviorSubject(false);
  OverlappingAnomaly = this.OverlappingAnomalySource.asObservable();

  constructor() {}

  changeVesselCount(message: number): void {
    this.vesselCountSource.next(message);
  }

  changeTimeInSideNav(message: string): void {
    this.timeInSideNavSource.next(message);
  }

  changeZoomLevel(message: number): void {
    this.zoomLevelSource.next(message);
  }

  changedtoSOI(message: string): void {
    this.SOISource.next(message);
  }

  changedtoROI(message: string): void {
    this.ROISource.next(message);
  }

  changedtoVF(message: string): void {
    this.VFSource.next(message);
  }

  // Add Extent in vessel filter
  addExtentInVF(message:string): void {
    this.ExtentSource.next(message);
  }

  // List update in vessel filter
  VesselFilterListUpdate(message:string): void {
    this.VFUpdateSource.next(message);
  }


  clearSearch(message: string): void {
    this.clearSearchSource.next(message);
  }

  SOIupdate(msg: string): void {
    this.updateSOISource.next(msg);
  }

  GOIupdate(msg: string): void {
    this.updateGOISource.next(msg);
  }

   // updating roi details
   ROIupdate(msg:string): void {
    this.updateROISource.next(msg);
  }

  // change time series visible in main nav
  changeNavbarInROI(message:boolean): void {
    this.NavbarInROISource.next(message);
  }

  // get Trajectory list from dashboard 
  getOverlappingAnomalyTrajList(message:boolean): void {
    this.OverlappingAnomalySource.next(message);
  }

}
