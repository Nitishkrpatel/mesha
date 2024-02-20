import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnomalyInfoService {
  private OverViewSource = new BehaviorSubject('');
  Overview = this.OverViewSource.asObservable();

  private STASource = new BehaviorSubject('');
  STA = this.STASource.asObservable();

  private SDASource = new BehaviorSubject('');
  SDA = this.SDASource.asObservable();

  private TDASource = new BehaviorSubject('');
  TDA = this.TDASource.asObservable();

  private OvelappingSource = new BehaviorSubject('');
  OvelappingAnomaly = this.OvelappingSource.asObservable();

  constructor() {}

  // Select Ship type anoamly
  changedToOverview(message: any): void {
    this.OverViewSource.next(message);
  }

  // Select Ship type anoamly
  changedToShipTypeAnoamly(message: any): void {
    this.STASource.next(message);
  }

  // select speed anoamly
  changedToSpeedAnoamly(message: any): void {
    this.SDASource.next(message);
  }

  // Select transmission anoamly
  changedToTransmissionAnoamly(message: any): void {
    this.TDASource.next(message);
  }

  changedToOverlappingAnoamly(message: any): void {
    this.OvelappingSource.next(message);
  }
}
