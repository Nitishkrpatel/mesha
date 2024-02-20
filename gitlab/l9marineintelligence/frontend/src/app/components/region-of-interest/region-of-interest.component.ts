import * as Highcharts from "highcharts";
import * as moment from "moment";

import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";

import { CookieService } from "ngx-cookie-service";
import { FormControl } from "@angular/forms";
import { MatDatepicker } from "@angular/material/datepicker";
import { MessageService } from "../shared/message.service";
import { Moment } from "moment";
import { ServiceService } from "../shared/service.service";
import { ShareDataService } from "../shared/share-data.service";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { formatDate } from "@angular/common";

@Component({
  selector: "app-region-of-interest",
  templateUrl: "./region-of-interest.component.html",
  styleUrls: ["./region-of-interest.component.scss"],
})
export class RegionOfInterestComponent implements OnInit, OnDestroy {
  isRoiFeature = "false";
  isRoiFeatureSidenav = false;
  isloading = false;
  roisubscription!: Subscription;

  allCategory: any = [];
  usersroi: any;
  selectedregionid: any = [];
  selectedregion: any = [];
  roiselectedmmsi: any = [];
  roiData: any = [];
  // shiptypes
  selectedtimelinecriteria: any = [];
  selectedcategory: any;
  // stats info
  statinfo: any = [];
  statinfolength!: number;
  roitimeline: any = [];
  UpdateroiSub!: Subscription;

  deletingregionid = "";

  regionmmsiList: any = [];
  roishiptypeanomaly: any = [];

  roishiptypeanomalytrajmmsi: any = [];
  roishiptypeanomalytrajid: any = [];
  roishiptypeanomalytrajrid: any = [];
  roibottompannel = false;
  roibuttonpannel = false;

  plotTime: any;
  type_ids: any = [];

  // month and year selector
  fromdate = new FormControl(moment());
  year: any = new Date().getFullYear();
  month: any = Number(new Date().getMonth()) + 1;
  todate = new FormControl(moment());
  maxDate = new Date();

  constructor(
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService,
    private ShareDataservice: ShareDataService,
  ) {}

  @Output() markareaEvent = new EventEmitter();
  @Output() markPolygonEvent = new EventEmitter();
  @Output() markregionEvent = new EventEmitter();
  @Output() removemarkedregionEvent = new EventEmitter();
  @Output() ROISelectedEvent = new EventEmitter();
  @Output() EditROIEvent = new EventEmitter();
  @Output() DeleteROIEvent = new EventEmitter();
  @Output() RoITrajectoryEvent = new EventEmitter();
  @Output() RemoveRoITrajectoryEvent = new EventEmitter();
  @Output() UpdateROIShipstoView = new EventEmitter();

  @Output() removeanomalyTrajEvent = new EventEmitter();
  @Output() shiptypedeviationtrajectoryEvent = new EventEmitter();
  @Output() shiptypedeviaitontrajanomalyEvent = new EventEmitter();

  ngOnInit(): void {
    this.plotTime = this.cookieService.get("plotTime");
    this.roisubscription = this.ShareDataservice.ROI.subscribe((message) => {
      if (message === "true") {
        this.onRoiFeatureSelected();
      } else if (message === "false") {
        this.onRoiFeatureUnselected();
      }
    });
  }

  onRoiFeatureSelected() {
    this.ROISelectedEvent.emit("Restart Ship Map");
    this.isRoiFeature = "true";
    this.getAllCategory();
    this.getRegionOfInterest();

    this.UpdateroiSub = this.ShareDataservice.updateroi.subscribe((msg) => {
      if (msg === "update roi details") {
        this.getRegionOfInterest();
        const index = this.selectedregionid.indexOf(this.deletingregionid);
        if (index > -1) {
          this.selectedregionid.splice(index, 1);
          this.removemarkedregionEvent.emit(this.deletingregionid);
          this.RemoveRoITrajectoryEvent.emit(this.deletingregionid);
          this.removeRoiAnomalyTrajectory(this.deletingregionid);
          // remove ships in that region
          this.roiData.forEach((region: any, i: any) => {
            if (region.region_id === this.deletingregionid) {
              region.details.forEach((mmsi: any) => {
                this.roiselectedmmsi.forEach(
                  (selectedmmsi: any, shipindex: any) => {
                    if (mmsi.msi === selectedmmsi.msi) {
                      this.roiselectedmmsi.splice(shipindex, 1);
                    }
                  }
                );
              });
              this.roiData.splice(i, 1);
              this.ROISelectedEvent.emit(this.roiselectedmmsi);
            }
          });

          // remove timeline info
          this.roitimeline.forEach((region: any, r: any) => {
            if (this.deletingregionid === region.region_id) {
              this.roitimeline.splice(r, 1);
            }
          });

          // remove statistical info
          this.statinfo.forEach((region: any, r: any) => {
            if (this.deletingregionid === region.region_id) {
              this.statinfo.splice(r, 1);
            }
          });
          this.statinfolength = this.statinfo.length;

          // removing ship type anomaly
          this.roishiptypeanomaly.forEach((r: any, j: any) => {
            if (r.region_id === this.deletingregionid) {
              this.roishiptypeanomaly.splice(j, 1);
            }
          });
        }
      }
    });

    this.updateActiveTextAndImage();
    if (this.isRoiFeature === "true") {
      this.isRoiFeatureSidenav = !this.isRoiFeatureSidenav;
    } else {
      this.isRoiFeatureSidenav = true;
    }
  }

  onRoiFeatureUnselected() {
    this.selectedregionid.forEach((ele: any) => {
      this.removemarkedregionEvent.emit(ele);
      this.RemoveRoITrajectoryEvent.emit(ele);
      this.removeRoiAnomalyTrajectory(ele);
    });
    this.selectedcategory = "";
    this.ShareDataservice.changeNavbarInROI(false);
    this.isRoiFeature = "false";
    this.isRoiFeatureSidenav = false;
    this.selectedregionid = [];
    this.selectedregion = [];
    this.roiselectedmmsi = [];
    this.statinfo = [];
    this.statinfolength = 0;
    this.roitimeline = [];

    this.regionmmsiList = [];
    this.roishiptypeanomaly = [];
    this.roishiptypeanomalytrajmmsi = [];
    this.roishiptypeanomalytrajid = [];
    this.roishiptypeanomalytrajrid = [];
    this.markareaEvent.emit("no");
    this.markPolygonEvent.emit("no");

    this.resetActiveTextAndImage();
  }

  resetToPlotime() {
    const element = document.getElementById("roi_month_year");
    if (element) {
      element.style.display = "none";
    }
    this.plotTime = this.cookieService.get("plotTime");
    this.ChangeCategory(this.selectedcategory);
  }

  // Function to update active text and image
  updateActiveTextAndImage() {
    const regionOfInterestName = document.getElementById(
      "Region of Interest_name"
    );
    if (regionOfInterestName !== null) {
      regionOfInterestName.setAttribute("class", "active_text");
    }
    const regionOfInterestImg = document.getElementById(
      "Region of Interest_img"
    );
    if (regionOfInterestImg) {
      regionOfInterestImg.setAttribute(
        "src",
        "assets/side-nav/selected_features_orange/Region-of-Interest.svg"
      );
    }
  }

  // Function to reset active text and image
  resetActiveTextAndImage() {
    const regionOfInterestName = document.getElementById(
      "Region of Interest_name"
    );
    if (regionOfInterestName !== null) {
      regionOfInterestName.setAttribute("class", "");
    }
    const regionOfInterestImg = document.getElementById(
      "Region of Interest_img"
    );
    if (regionOfInterestImg) {
      regionOfInterestImg.setAttribute(
        "src",
        "assets/side-nav/Region-of-Interest.svg"
      );
    }
  }

  // Add interaction to mark area on map
  addSquareInteraction(): void {
    this.markareaEvent.emit("yes");
    document
      .getElementById("markarea-color")!
      .setAttribute("class", "btn markarea selected-markarea-button");
  }

  // Add interaction to mark polygon on map
  addPloygonInteraction(): void {
    this.markPolygonEvent.emit("yes");
    document
      .getElementById("markpolygon-color")!
      .setAttribute("class", "btn markarea selected-markarea-button");
  }

  getRegionOfInterest(): void {
    this.isloading = true;
    this.service.getRoIDetailsForUser().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.usersroi = result.data;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Edit region of interest name
  editRoI(roi: any): void {
    this.EditROIEvent.emit(roi);
  }

  // Delete region of interest
  deleteRoI(roi: any): void {
    this.DeleteROIEvent.emit(roi);
    this.deletingregionid = roi.region_id;
  }

  getAllCategory(): void {
    this.isloading = true;
    this.service.getAllCategories().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.allCategory = result.data;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      },
    });
  }
  
  getShipsForSelectedRegion(e: any, val: any): void {
    const offset = 0;
    const mmsi_count = 0;
    if (e.target.checked) {
      this.selectedregion[val.region_id] = true;
      let selectdRegionCoord = val.coords.replace("POLYGON((", "");
      selectdRegionCoord = selectdRegionCoord.replaceAll(")", "");
      const selectedRegionCoordArray: any[] = [];
      selectdRegionCoord.split(",").forEach((a: any) => {
        a = a.split(" ");
        selectedRegionCoordArray.push([parseFloat(a[0]), parseFloat(a[1])]);
      });
      this.selectedregionid.push(val.region_id);
      this.markregionEvent.emit({
        region_id: val.region_id,
        region_name: val.region_name,
        points: [selectedRegionCoordArray],
      });
      this.ROISelectedEvent.emit("Stop Ship Map");
      if (this.selectedregionid.length === 1) {
        this.ROISelectedEvent.emit("Show time alert");
      }
      const regiondata = {
        timestamp: this.plotTime,
        year: this.year.toString(),
        month: this.month,
        category: this.selectedcategory,
        region_id: this.selectedregionid,
      };
      this.isloading = true;
      this.service.getShipDetailsBasedOnRoI(regiondata).subscribe({
        next: (result) => {
          if (result.status === "success") {
            this.ShareDataservice.changeTimeInSideNav(result.timestamp);
            this.roiData = [];
            this.roiselectedmmsi = [];
            this.regionmmsiList = [];
            this.roiData = result.data;
            this.regionmmsiList = [];
            result.data.forEach((region: any) => {
              this.regionmmsiList.push({
                region_id: region.region_id,
                mmsi: region.mmsi_list,
              });
            });
            // get stats info
            const requestdata = {
              year: this.year.toString(),
              month: this.month,
              category: this.selectedcategory,
              region_id: this.regionmmsiList,
              timestamp: this.plotTime,
            };
            this.isloading = true;
            this.service.getStatInfo(requestdata).subscribe({
              next: (result) => {
                if (result.status === "success") {
                  result.data[0].src = "../../../assets/soi/switch-offf.svg";
                  this.statinfo = result.data;
                  this.type_ids = [];
                  result.data.forEach((region: any) => {
                    this.type_ids.push({
                      region_id: region.region_id,
                      type_ids: region.type_ids,
                    });
                  });
                  // get anomaly info
                  this.getAnomalyInfo(this.type_ids, offset);
                  this.isloading = false;
                  this.statinfolength = this.statinfo.length;
                  this.roitimeline = result.data;
                  this.plotHighCharts();
                }
              },
              error: (error) => {
                this.msgservice.postErrorFunc(error);
                this.isloading = false;
              },
            });
            this.ROISelectedEvent.emit(this.roiData);
          }
        },
        error: (error) => {
          this.msgservice.postErrorFunc(error);
          this.isloading = false;
        },
      });
    } else {
      this.selectedregion[val.region_id] = false;
      const index = this.selectedregionid.indexOf(val.region_id);
      if (index > -1) {
        this.selectedregionid.splice(index, 1);
      }
      this.removemarkedregionEvent.emit(val.region_id);
      this.RemoveRoITrajectoryEvent.emit(val.region_id);
      this.removeRoiAnomalyTrajectory(val.region_id);
      this.statinfo.forEach((region: any, i: any) => {
        if (region.region_id === val.region_id) {
          this.statinfo.splice(i, 1);
        }
      });
      this.regionmmsiList = [];
      this.statinfolength = this.statinfo.length;

      this.roiData.forEach((region: any, i: any) => {
        if (region.region_id === val.region_id) {
          this.roiData.splice(i, 1);
          this.ROISelectedEvent.emit(this.roiData);
        }
      });

      // removing ship type anomaly
      this.roishiptypeanomaly.forEach((r: any, j: any) => {
        if (r.region_id === val.region_id) {
          this.roishiptypeanomaly.splice(j, 1);
        }
      });
      if (this.selectedregionid.length === 0) {
        this.ROISelectedEvent.emit("Restart Ship Map");
      }
    }
  }

  handleChangeEvent(event: Event): void {
    if (event.target) {
      const value = (event.target as HTMLSelectElement).value;
      this.ChangeCategory(value);
    }
  }

  // selecting ship category
  ChangeCategory(name: any): void {
    this.selectedcategory = name;
    if (this.selectedregionid.length >= 1) {
      this.getRoIShipsInfo();
    }
  }

  setFromMonthAndYear(
    normalizedMonthAndYear: Moment,
    datepicker: MatDatepicker<Moment>
  ) {
    const element = document.getElementById("roi_month_year");
    if (element) {
      element.style.display = "block";
    }
    const setDateValue: any = this.fromdate.value!;
    setDateValue.month(normalizedMonthAndYear.month());
    setDateValue.year(normalizedMonthAndYear.year());
    this.fromdate.setValue(setDateValue);
    datepicker.close();
    this.year = this.fromdate.value?.toDate().getFullYear();
    this.month = Number(this.fromdate.value?.toDate().getMonth()) + 1;
    this.plotTime = "";
    this.ChangeCategory(this.selectedcategory);
  }

  getRoIShipsInfo(): void {
    const offset = 0;
    const mmsi_count = 0;
    this.selectedregionid.forEach((r: any) => {
      this.RemoveRoITrajectoryEvent.emit(r);
    });

    this.roiData = [];
    const regiondata = {
      timestamp: this.plotTime,
      year: this.year.toString(),
      month: this.month,
      category: this.selectedcategory,
      region_id: this.selectedregionid,
    };
    this.isloading = true;
    this.service.getShipDetailsBasedOnRoI(regiondata).subscribe({
      next: (result) => {
        this.roiselectedmmsi = [];
        this.roishiptypeanomaly = [];
        this.regionmmsiList = [];
        if (result.status === "success") {
          this.roiData = result.data;
          this.isloading = false;
          this.ShareDataservice.changeTimeInSideNav(result.timestamp);
          result.data.forEach((region: any) => {
            region.details.forEach((mmsi: any) => {
              this.roiselectedmmsi.push(mmsi);
            });
            this.regionmmsiList.push({
              region_id: region.region_id,
              mmsi: region.mmsi_list,
            });
          });
          this.ROISelectedEvent.emit(this.roiData);
          this.getStatInfo();
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // loading shiptype anomalies
  // loadNextShipTypeAnomalies(s: any) {
    // this.getNextSetOfShipTypeAnomalies(s, 'n');
  // }

  // loadPrevShipTypeAnomalies(s: any) {
  //   if (s.offset > 20) {
  //     const rem = s.offset % 10;
  //     if (rem !== 0) {
  //       s.offset = s.offset - (rem + 10);
  //     } else {
  //       s.offset = s.offset - 20;
  //     }
  //   } else {
  //     s.offset = 0;
  //   }
    // this.getNextSetOfShipTypeAnomalies(s, 'p');
  // }

  showRoiShiptAnomalyTracjectory(regionid: any, mmsi: any, tj: any): void {
    const layername = `${regionid}_${mmsi}_${tj}_roishiptypeanomaly`;
    const isSwitchedOn =
      document.getElementById(layername)?.getAttribute("src") ===
      "../../../assets/soi/switch-on.svg";
    if (isSwitchedOn) {
      const mmsiIndex = this.roishiptypeanomalytrajmmsi.indexOf(mmsi);
      if (mmsiIndex > -1) {
        this.roishiptypeanomalytrajmmsi.splice(mmsiIndex, 1);
      }
      const trajIndex = this.roishiptypeanomalytrajid.indexOf(tj);
      if (trajIndex > -1) {
        this.roishiptypeanomalytrajid.splice(trajIndex, 1);
      }
      const regionidIndex = this.roishiptypeanomalytrajrid.indexOf(regionid);
      if (regionidIndex > -1) {
        this.roishiptypeanomalytrajrid.splice(regionidIndex, 1);
      }
      document
        .getElementById(layername)!
        .setAttribute("src", "../../../assets/soi/switch-offf.svg");
      // remove trajectory
      this.removeanomalyTrajEvent.emit(layername);
    } else {
      document
        .getElementById(layername)!
        .setAttribute("src", "../../../assets/soi/switch-on.svg");
      this.roishiptypeanomalytrajrid.push(regionid);
      this.roishiptypeanomalytrajmmsi.push(mmsi);
      this.roishiptypeanomalytrajid.push(tj);
      // show trajctory
      const mmsiArray = [mmsi];
      const trajArray = [tj];
      const shiptypedeviation = {
        timestamp: this.cookieService.get("plotTime"),
        mmsi: mmsi,
        traj_id: tj,
        rid: regionid,
        year: this.year.toString(),
      };
      this.getShipTrack(shiptypedeviation, "shiptype", regionid);
      let roishiptypeanamolypoints: any[] = [];
      this.roishiptypeanomaly.forEach((region: any) => {
        if (regionid === region.region_id) {
          region.type_anomaly.forEach((ship: any) => {
            if (mmsi === ship.mmsi) {
              ship.type_anomalies.forEach((traj: any) => {
                if (tj === traj.tj) {
                  const RID: any = "rid";
                  const MMSI: any = "mmsi";
                  const trajId: any = "tj";
                  roishiptypeanamolypoints = traj.an;
                  roishiptypeanamolypoints[RID] = regionid;
                  roishiptypeanamolypoints[MMSI] = mmsi;
                  roishiptypeanamolypoints[trajId] = tj;
                }
              });
            }
          });
        }
      });
      this.shiptypedeviaitontrajanomalyEvent.emit(roishiptypeanamolypoints);
    }
  }

  getStatInfo(): void {
    const offset = 0;
    const requestdata = {
      year: this.year.toString(),
      month: this.month,
      category: this.selectedcategory,
      region_id: this.regionmmsiList,
      timestamp: this.plotTime,
    };
    this.isloading = true;
    this.service.getStatInfo(requestdata).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.statinfo = result.data;
          this.isloading = false;
          this.statinfo.forEach((region: any) => {
            region.src = "../../../assets/soi/switch-offf.svg";
          });
          this.statinfolength = this.statinfo.length;
          this.type_ids = [];
          result.data.forEach((region: any) => {
            this.type_ids.push({
              region_id: region.region_id,
              type_ids: region.type_ids,
            });
          });
          this.getAnomalyInfo(this.type_ids, offset);
          this.roitimeline = result.data;
          this.plotHighCharts();
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Draw Graph
  plotHighCharts() {
    this.roitimeline.forEach((timelinedata: any) => {
      const chartOptions: any = {
        chart: {
          type: "column",
        },
        title: {
          text: `Region: ${timelinedata.region_name}`,
          align: "center",
        },
        // subtitle: {
        //   text: "Showing count of mmsi",
        //   align: "center",
        // },
        xAxis: {
          categories: ["MMSI CATEGORY"],
          crosshair: true,
        },
        yAxis: {
          min: 0,
          title: {
            text: "MMSI COUNT",
          },
        },
        tooltip: {},
        colors: [
          "#32CD32", // Lime Green
          "#FF6666", // Coral
          "#6666FF", // Medium Blue
          "#FFFF66", // Canary Yellow
          "#FF66FF", // Orchid
          "#66FFFF", // Light Blue (Medium Cyan)
          "#808080", // Gray
          "#FFC0CB", // Pink (Medium contrast with Gray)
          "#993399", // Medium Purple
          "#FF8C00", // Dark Orange (Medium contrast with Gray)
          "#006400", // Dark Green (Medium contrast with Gray)
          "#800000", // Maroon
          "#808080", // Gray (Repeated color for consistency)
          "#D2B48C", // Tan
          "#B87333", // Copper
          "#FFD700", // Gold (Medium contrast with Gray)
          "#32CD99", // Sea Green
          "#20B2AA", // Light Sea Green (Medium contrast with Gray)
          "#8B4513", // Saddle Brown
          "#FF6347", // Tomato
          "#FF7F50", // Coral (Medium contrast with Gray)
          "#5F9EA0", // Cadet Blue
          "#800000", // Maroon (Repeated color for consistency)
          "#BA55D3", // Medium Orchid
        ],
        plotOptions: {
          column: {
            pointPadding: 0.2,
            borderWidth: 0,
            pointWidth: 10,
            dataLabels: {
              enabled: true, // Enable data labels
              // You can customize data label settings here
              format: '{y}', // Display the y-value on the column
              style: {
                fontWeight: 'bold'
              }
            }
          },
        },
        series: timelinedata.chart,
      };

      // Get the container element
      const container = document.getElementById(
        timelinedata.region_id + "_highcharts"
      );

      // Create the chart with the defined options
      if (container) {
        Highcharts.chart(container as any, chartOptions);
      } else {
        console.error("Container element not found.");
      }
    });
  }

  getAnomalyInfo(type_id: any, offset: any): void {
    const regiondata = {
      timestamp: this.plotTime,
      year: this.year.toString(),
      month: this.month,
      category: this.selectedcategory,
      region_id: type_id,
      offset: offset,
    };
    this.isloading = true;
    this.service.getAnomalyInfoInRoI(regiondata).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.isloading = false;
          this.roishiptypeanomaly = [];
          result.details.forEach((region: any) => {
            region.type_anomaly.forEach((ship: any) => {
              ship.detailslength = ship.type_anomalies.length;
              ship.type_anomalies.forEach((traj: any) => {
                // traj.ATD_act = traj.ATD;
                // traj.ETA_act = traj.ETA;
                traj.ATD = new Date(traj.ATD);
                traj.ETA = new Date(traj.ETA);
                if (
                  this.roishiptypeanomalytrajrid.includes(region.region_id) ===
                    true &&
                  this.roishiptypeanomalytrajmmsi.includes(ship.mmsi) ===
                    true &&
                  this.roishiptypeanomalytrajid.includes(traj.tj)
                ) {
                  traj.src = "../../../assets/soi/switch-on.svg";
                } else {
                  traj.src = "../../../assets/soi/switch-offf.svg";
                }
                this.calculateAnomalyPercentage(traj);
                traj.ATD = formatDate(traj.ATD, "dd-MM-yyyy,hh:mm a", "en-US");
                traj.ETA = formatDate(traj.ETA, "dd-MM-yyyy,hh:mm a", "en-US");
              });
            });
            this.roishiptypeanomaly.push({
              region_id: region.region_id,
              region_name: region.region_name,
              type_anomaly: region.type_anomaly,
              type_anomaly_length: region.type_anomaly.length,
              offset: region.offset,
              type_anomalyid_list: type_id,
              count: region.count,
              mmsi_count: region.mmsi_count,
            });
          });
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  calculateAnomalyPercentage(traj: any): void {
    const totalTimeTravelled = Math.abs(traj.ETA - traj.ATD);
    traj.an.forEach((anomaly: any, i: any) => {
      anomaly.ntime = new Date(anomaly.ntime);
      const anomalyTimeFromStartTime = Math.abs(anomaly.ntime - traj.ATD);
      anomaly.ntime = new Date(anomaly.ntime);
      let percentage = (anomalyTimeFromStartTime / totalTimeTravelled) * 100;
      if (i > 0) {
        const diff = Math.abs(anomaly.percentage - traj.an[i - 1].percentage);
        if (diff < 2) {
          anomaly.percentage += 2;
        }
      }
      anomaly.percentage = Math.min(percentage, 96);
      anomaly.message = `Change from ${anomaly.ptype} to ${anomaly.ntype}`;
    });
  }

  getShipTrack(reqdata: any, type: any, rid: any): void {
    this.isloading = true;
    this.service.shipTrack(reqdata).subscribe(
      (data: any) => {
        if (data.status === "success") {
          const track = data.data;
          this.isloading = false;
          track.rid = rid;
          if (type === "shiptype") {
            this.shiptypedeviationtrajectoryEvent.emit(track);
          }
        }
      },
      (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      }
    );
  }

  // Remove Roi Anomaly Trajectory
  removeRoiAnomalyTrajectory(rid: any): void {
    if (this.roishiptypeanomalytrajrid.length > 0) {
      const regionidindex = this.roishiptypeanomalytrajrid.indexOf(rid);
      if (regionidindex > -1) {
        this.roishiptypeanomaly.forEach((region: any) => {
          if (region.region_id === rid) {
            region.type_anomaly.forEach((ship: any) => {
              const mmsiindex = this.roishiptypeanomalytrajmmsi.indexOf(
                ship.mmsi
              );
              if (mmsiindex > -1) {
                ship.type_anomalies.forEach((traj: any) => {
                  const trajindex = this.roishiptypeanomalytrajid.indexOf(
                    traj.tj
                  );
                  if (trajindex > -1) {
                    this.roishiptypeanomalytrajid.splice(trajindex, 1);
                    this.roishiptypeanomalytrajmmsi.splice(mmsiindex, 1);
                    this.roishiptypeanomalytrajrid.splice(regionidindex, 1);
                    const layername = `${rid}_${ship.mmsi}_${traj.tj}_roishiptypeanomaly`;
                    this.removeanomalyTrajEvent.emit(layername);
                  }
                });
              }
            });
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.roisubscription !== undefined) {
      this.roisubscription.unsubscribe();
    }
    if (this.UpdateroiSub !== undefined) {
      this.UpdateroiSub.unsubscribe();
    }
  }
}
