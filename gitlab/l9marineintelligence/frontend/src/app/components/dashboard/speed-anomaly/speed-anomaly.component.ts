import * as moment from 'moment';

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AnomalyInfoService } from '../../shared/anomaly-info.service';
import { CookieService } from 'ngx-cookie-service';
import { MatDatepicker } from '@angular/material/datepicker';
import { MessageService } from '../../shared/message.service';
import { Moment } from 'moment';
import { ServiceService } from '../../shared/service.service';
import { Sort } from '@angular/material/sort';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-speed-anomaly',
  templateUrl: './speed-anomaly.component.html',
  styleUrls: ['./speed-anomaly.component.scss'],
})
export class SpeedAnomalyComponent implements OnInit, OnDestroy, AfterViewInit {
  speedAnomalySub!: Subscription;
  showspeedAnoamlies = false;
  itemsPerPage!: number;
  offset: number = 0;
  plotTime: any;
  showMonthYear: any = true;
  showNote: any = false;
  totalAnomalyCount: any;
  totalSpeedAnomaly!: number;
  speedcurrentPage = 1;
  speedAnomalyData: any[] = [];
  speedAnomalySortedData: any[] = [];
  speedAnomalyNote = '';
  shipTypeTrajList: any;
  anomalyType: any;
  speedtraj_id: any;
  isloading: boolean = false;
  maxDate = new Date();

  constructor(
    private AnomalyService: AnomalyInfoService,
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  speedSearchForm = new FormGroup({
    speed_search_text: new FormControl(''),
  });

  fromdate = new FormControl(moment());
  from_year: any = new Date().getFullYear();
  from_month: any = Number(new Date().getMonth()) + 1;

  ngOnInit(): void {
    this.plotTime = this.cookieService.get('plotTime');
    this.itemsPerPage = 15;
    // this.fromdate.setValue(null);
  }

  ngAfterViewInit(): void {
    this.speedAnomalySub = this.AnomalyService.SDA.subscribe((msg) => {
      if (msg === 'true') {
        this.showspeedAnoamlies = true;
        this.offset = 0;
        this.speedcurrentPage = 1;
        this.speedAnomalyData = [];
        this.speedAnomalySortedData = [];
        this.totalSpeedAnomaly = 0;
        this.plotTime = this.cookieService.get('plotTime');
        this.showNote = true;
        this.getSpeedAnomaly();
        this.getTotalAnomalyCount();
        if (document.getElementById('Speed Anomalies') !== null) {
          document
            .getElementById('Speed Anomalies_img')!
            .setAttribute(
              'src',
              'assets/anomaly-info/selected/Speed Anomalies.svg'
            );
          if (document.getElementById('Speed Anomalies_name') !== null) {
            document.getElementById('Speed Anomalies_name')!.style.color =
              '#FFBE3D';
          }
        }
      } else {
        this.showspeedAnoamlies = false;
        this.offset = 0;
        this.speedcurrentPage = 1;
        this.speedAnomalyData = [];
        this.speedAnomalySortedData = [];
        this.totalSpeedAnomaly = 0;
        if (document.getElementById('Speed Anomalies') !== null) {
          document
            .getElementById('Speed Anomalies_img')!
            .setAttribute(
              'src',
              'assets/anomaly-info/Speed Anomalies.svg'
            );
          if (document.getElementById('Speed Anomalies_name') !== null) {
            document.getElementById('Speed Anomalies_name')!.style.color =
              'white';
          }
        }
      }
    });
  }

  setFromMonthAndYear(
    normalizedMonthAndYear: Moment,
    datepicker: MatDatepicker<Moment>
  ) {
    const element = document.getElementById('speed_month_year');
    if (element) {
      element.style.display = 'block';
    }
    const setDateValue: any = this.fromdate.value!;
    setDateValue.month(normalizedMonthAndYear.month());
    setDateValue.year(normalizedMonthAndYear.year());
    this.fromdate.setValue(setDateValue);
    datepicker.close();
    this.from_year = this.fromdate.value?.toDate().getFullYear();
    this.from_month = Number(this.fromdate.value?.toDate().getMonth()) + 1;
    this.showNote = false;
    this.speedtraj_id = '';
    this.offset = 0;
    this.plotTime = '';
    this.speedcurrentPage = 1;
    this.speedAnomalyData = [];
    this.speedAnomalySortedData = [];
    this.totalSpeedAnomaly = 0;
    this.getSpeedAnomaly();
    this.getTotalAnomalyCount();
    this.showNote = false;
  }

  // setting offset for pagination
  setspeedOffset(event: any) {
    this.speedcurrentPage = event;
    // this.offset = (this.speedcurrentPage - 1) * this.itemsPerPage;
    if (this.speedcurrentPage * 15 === this.offset) {
      this.getSpeedAnomaly();
    }
  }

  getSpeedAnomaly(): void {
    this.isloading = true;
    const reqData = {
      offset: this.offset,
      month: this.from_month,
      year: this.from_year,
      // traj_id: this.speedtraj_id,
      timestamp: this.plotTime,
    };
    this.service.getSpeedAnomaly(reqData).subscribe({
      next: (data) => {
        if (data.status === 'success') {
          this.speedAnomalyData.push(...data.speed);
          this.offset = data.offset;
          this.speedAnomalySortedData = this.speedAnomalyData.slice();
          this.totalSpeedAnomaly = this.speedAnomalyData.length;
          this.speedAnomalyNote = data.remark;
          this.isloading = false;
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = true;
      },
    });
  }

  // Search in speed deviation.
  getSearchResultForSpeedAnomaly(e: string): void {
    const searchTerm = e.toString();
    this.speedAnomalySortedData = this.speedAnomalyData.filter(obj => obj.mmsi.toString().startsWith(searchTerm));
    this.speedcurrentPage = 1;
  }
  

  // Restrict to only number in mobile number
  onlyNumberKey(event: any): any {
    return event.charCode === 8 || event.charCode === 0
      ? null
      : event.charCode >= 48 && event.charCode <= 57;
  }

  // Sorting speed deviation
  sortSpeedAnomalyData(sort: Sort): any {
    const data = this.speedAnomalySortedData.slice();

    if (!sort.active || sort.direction === '') {
      this.speedAnomalySortedData = data;
      return;
    }
    this.speedAnomalySortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'mmsi':
          return this.compare(a.mmsi, b.mmsi, isAsc);
        case 'trajid':
          return this.compare(a.trajid, b.trajid, isAsc);
        case 'ship_type':
          return this.compare(a.ship_type, b.ship_type, isAsc);
        case 'min_speed':
          return this.compare(a.min_speed, b.min_speed, isAsc);
        case 'month':
          return this.compare(a.month, b.month, isAsc);
        case 'year':
          return this.compare(a.year, b.year, isAsc);
        case 'measure':
          return this.compare(a.measure, b.measure, isAsc);
        case 'max_speed':
          return this.compare(a.max_speed, b.max_speed, isAsc);
        default:
          return 0;
      }
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean): any {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  getTotalAnomalyCount() {
    this.isloading = true;
    const reqData = {
      timestamp: this.plotTime,
      month: this.from_month,
      year: this.from_year,
      offset: this.offset,
      flag:1
    };
    this.service.getAnomalyCount(reqData).subscribe({
      next: (data: any) => {
        if (data.status === 'success') {
          this.totalAnomalyCount = data.count;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }
  
  ngOnDestroy(): void {
    if (this.speedAnomalySub !== undefined) {
      this.speedAnomalySub.unsubscribe();
    }
  }
}
