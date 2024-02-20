import { ShareDataService } from "./../../shared/share-data.service";
import * as moment from "moment";

import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MultiLineString, Point } from "ol/geom";

import { AnomalyInfoService } from "../../shared/anomaly-info.service";
import { CookieService } from "ngx-cookie-service";
import Map from "ol/Map";
import { MatDatepicker } from "@angular/material/datepicker";
import { MessageService } from "../../shared/message.service";
import { Moment } from "moment";
import MousePosition from "ol/control/MousePosition";
import { OSM } from "ol/source";
import Overlay from "ol/Overlay";
import { ServiceService } from "../../shared/service.service";
import { Sort } from "@angular/material/sort";
import { Subscription } from "rxjs";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import { createStringXY } from "ol/coordinate";
import { defaults as defaultControls } from "ol/control";
import { Feature } from "ol";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import WebGLPoints from "ol/layer/WebGLPoints";
import Icon from "ol/style/Icon";
import { formatDate } from "@angular/common";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-overlapping-anomaly",
  templateUrl: "./overlapping-anomaly.component.html",
  styleUrls: ["./overlapping-anomaly.component.scss"],
})
export class OverlappingAnomalyComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  overlappingAnomalySub!: Subscription;
  showOverlappingAnoamlies = false;
  totalOverlappingAnomalies = 0;
  totalAnomalyCount = 0;
  showNote = true;
  overlappingAnomalyCurrentPage: number = 1;
  overlappingAnomalyData: any[] = [];
  overlappingAnomalySortedData: any[] = [];
  selectedOverlappingAnomaly: any[] = [];
  selectedAllOverlappingAnomaly = false;
  selectedOverlappingAnomalyArray: any[] = [];
  itemsPerPage!: number;
  offset: number = 0;
  overlappingAnomalyMap!: Map | any;
  plotTime: any;
  isloading: boolean = false;
  maxDate = new Date();
  overlappingAnomalyTajListSub!: Subscription;
  overlappingTrajList: any;
  title: any;
  flag: any;

  constructor(
    private AnomalyService: AnomalyInfoService,
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService,
    private ShareDataservice: ShareDataService,
    private toastr: ToastrService
  ) {}

  overlappingAnomalySearchForm = new FormGroup({
    overlappingAnomaly_search_text: new FormControl(""),
  });

  fromdate = new FormControl(moment());
  from_year: any = new Date().getFullYear();
  from_month: any = Number(new Date().getMonth()) + 1;

  ngOnInit(): void {
    this.plotTime = this.cookieService.get("plotTime");
    this.itemsPerPage = 15;
    this.removeOverlappingAnomalyMap();
    this.overlappingAnomalyTajListSub =
      this.ShareDataservice.OverlappingAnomaly.subscribe((msg) => {
        this.overlappingTrajList = msg;
      });
  }

  ngAfterViewInit(): void {
    this.overlappingAnomalySub =
      this.AnomalyService.OvelappingAnomaly.subscribe((msg) => {
        if (msg === "true") {
          this.showOverlappingAnoamlies = true;
          this.overlappingAnomalyCurrentPage = 1;
          this.offset = 0;
          this.overlappingAnomalyData = [];
          this.overlappingAnomalySortedData = [];
          this.totalOverlappingAnomalies = 0;
          this.selectedOverlappingAnomaly = [];
          this.plotTime = this.cookieService.get("plotTime");
          this.showNote = true;
          this.removeOverlappingAnomalyMap();
          this.getOverlappingAnomalies();
          this.overlappingAnomalySortedData.forEach((ship) => {
            this.overlappingAnomalyMap
              .getLayers()
              .getArray()
              .filter((layer: any) => layer.getClassName() === Number(ship.id))
              .forEach((layer: any) => {
                layer.getSource().clear();
                this.overlappingAnomalyMap.removeLayer(layer);
              });
          });
          if (document.getElementById("Overlapping Anomalies") !== null) {
            document
              .getElementById("Overlapping Anomalies_img")!
              .setAttribute(
                "src",
                "assets/anomaly-info/selected/Overlapping Anomalies.svg"
              );
            if (
              document.getElementById("Overlapping Anomalies_name") !== null
            ) {
              document.getElementById(
                "Overlapping Anomalies_name"
              )!.style.color = "#FFBE3D";
            }
          }
        } else {
          this.showOverlappingAnoamlies = false;
          this.overlappingAnomalyCurrentPage = 1;
          this.offset = 0;
          this.overlappingAnomalyData = [];
          this.overlappingAnomalySortedData = [];
          this.totalOverlappingAnomalies = 0;
          this.selectedOverlappingAnomaly = [];
          this.removeOverlappingAnomalyMap();
          this.overlappingAnomalySortedData.forEach((ship) => {
            this.overlappingAnomalyMap
              .getLayers()
              .getArray()
              .filter((layer: any) => layer.getClassName() === Number(ship.id))
              .forEach((layer: any) => {
                layer.getSource().clear();
                this.overlappingAnomalyMap.removeLayer(layer);
              });
          });
          if (document.getElementById("Overlapping Anomalies") !== null) {
            document
              .getElementById("Overlapping Anomalies_img")!
              .setAttribute(
                "src",
                "assets/anomaly-info/Overlapping Anomalies.svg"
              );
            if (
              document.getElementById("Overlapping Anomalies_name") !== null
            ) {
              document.getElementById(
                "Overlapping Anomalies_name"
              )!.style.color = "white";
            }
          }
        }
      });
  }

  // Restrict to only number in mobile number
  onlyNumberKey(event: any): any {
    return event.charCode === 8 || event.charCode === 0
      ? null
      : event.charCode >= 48 && event.charCode <= 57;
  }

  setFromMonthAndYear(
    normalizedMonthAndYear: Moment,
    datepicker: MatDatepicker<Moment>
  ) {
    const element = document.getElementById("overlapping_anomaly_month_year");
    if (element) {
      element.style.display = "block";
    }

    const setDateValue: any = this.fromdate.value!;
    setDateValue.month(normalizedMonthAndYear.month());
    setDateValue.year(normalizedMonthAndYear.year());
    this.fromdate.setValue(setDateValue);
    datepicker.close();
    this.from_year = this.fromdate.value?.toDate().getFullYear();
    this.from_month = Number(this.fromdate.value?.toDate().getMonth()) + 1;
    this.offset = 0;
    this.plotTime = "";
    this.overlappingAnomalyCurrentPage = 1;
    this.overlappingAnomalyData = [];
    this.overlappingAnomalySortedData = [];
    this.totalOverlappingAnomalies = 0;
    this.selectedOverlappingAnomaly = [];
    this.getOverlappingAnomalies();
    // this.getTotalAnomalyCount();
    this.showNote = false;
  }

  // Display map in ShipType anomaly
  displayMapInShipType(): void {
    this.removeOverlappingAnomalyMap();
    if (this.overlappingAnomalyMap === undefined) {
      const shippopupdiv = document.getElementById("popup")!;
      const overlay = new Overlay({
        element: shippopupdiv,
        positioning: "center-center",
      });
      this.overlappingAnomalyMap = new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
            visible: true,
            className: "overlappingAnomalyMap",
          }),
        ],
        overlays: [overlay],
        target: "overlappingAnomalyMap",
        view: new View({
          center: [78, 20],
          zoom: 4,
          projection: "EPSG:4326",
        }),
        controls: defaultControls().extend([
          new MousePosition({
            coordinateFormat: createStringXY(4),
            projection: "EPSG:4326",
          }),
        ]),
      });
    }
  }

  removeOverlappingAnomalyMap(): void {
    if (this.overlappingAnomalyMap) {
      // Remove layers
      this.overlappingAnomalyMap
        .getLayers()
        .forEach((layer: any) =>
          this.overlappingAnomalyMap?.removeLayer(layer)
        );

      // Remove controls
      this.overlappingAnomalyMap
        .getControls()
        .forEach((control: any) =>
          this.overlappingAnomalyMap?.removeControl(control)
        );

      // Remove interactions
      this.overlappingAnomalyMap
        .getInteractions()
        .forEach((interaction: any) =>
          this.overlappingAnomalyMap?.removeInteraction(interaction)
        );

      // Remove map from DOM
      this.overlappingAnomalyMap.setTarget(null);

      // Set map reference to undefined to clean up memory
      this.overlappingAnomalyMap = undefined;
    }
  }

  // sending offset for pagination
  setshipTypeAnomalyOffset(event: any) {
    this.overlappingAnomalyCurrentPage = event;
    if (this.overlappingAnomalyCurrentPage * 15 === this.offset) {
      this.getOverlappingAnomalies();
    }
  }

  getOverlappingAnomalies() {
    this.isloading = true;
    const reqData = {
      timestamp: this.plotTime,
      month: this.from_month,
      year: this.from_year,
      offset: this.offset,
      traj_id: this.overlappingTrajList,
    };
    if (this.overlappingTrajList.length > 0) {
      this.service.getOverlappingAnomalies(reqData).subscribe({
        next: (data) => {
          this.displayMapInShipType();

          if (data.status === "success") {
            this.overlappingAnomalyData.push(...data.data);
            this.offset = data.offset;
            this.title = data.name;
            this.flag = data.flag;
            this.overlappingAnomalyData.forEach((t, index) => {
              t.id = index;
            });
            this.overlappingAnomalySortedData =
              this.overlappingAnomalyData.slice();
            this.totalOverlappingAnomalies = this.overlappingAnomalyData.length;
            this.isloading = false;
          }
        },
        error: (error: any) => {
          this.displayMapInShipType();
          this.msgservice.postErrorFunc(error);
          this.isloading = false;
        },
      });
    } else {
      this.toastr.warning(
        "Please select overlapping anomaly from dashboard!",
        "",
        {
          timeOut: 3000,
        }
      );
      this.isloading = false;
    }
  }

  // Search in shipTypeanomaly.
  getSearchResultForShipTypeAnomaly(e: string): void {
    const searchTerm = e.toString();
    this.overlappingAnomalySortedData = this.overlappingAnomalyData.filter(
      (obj) => obj.mmsi.toString().startsWith(searchTerm)
    );
    this.overlappingAnomalyCurrentPage = 1;
  }

  // show in map checkbox for individual ship in shiptypeAnomaly
  shipTypeAnomalyCheckboxChange(e: any): void {
    if (e.target.checked) {
      this.selectedOverlappingAnomalyArray.push(e.target.value);
      this.selectedOverlappingAnomaly[e.target.value] = true;
      this.overlappingAnomalySortedData.forEach((ship) => {
        if (ship.traj_id === Number(e.target.value)) {
          this.getShipTrajectoryAnomaly(ship);
        }
      });
    } else {
      const index = this.selectedOverlappingAnomalyArray.indexOf(
        Number(e.target.value)
      );
      if (index > -1) {
        this.selectedOverlappingAnomalyArray.splice(index, 1);
      }
      this.selectedOverlappingAnomaly[e.target.value] = false;
      this.selectedAllOverlappingAnomaly = false;

      this.overlappingAnomalyMap
        .getLayers()
        .getArray()
        .filter(
          (layer: any) =>
            layer.getClassName() === Number(e.target.value) ||
            layer.getClassName() === Number(e.target.value) + "anomaly"
        )
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.overlappingAnomalyMap.removeLayer(layer);
        });
    }
  }

  getShipTrajectoryAnomaly(ship: any) {
    this.isloading = true;
    const reqData = {
      mmsi: ship.mmsi,
      traj_id: ship.traj_id,
      timestamp: this.plotTime,
      flag: this.flag,
    };
    this.service.getTrajectoryForAnomaly(reqData).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.plotTrack(data.traj, ship, data.speed);
          this.plotTransmissionAnomalies(data.trans, ship);
          this.plotShipTypeAnomalies(data.type, ship);
          this.isloading = false;
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Plot ship Type anomaly  on map
  plotShipTypeAnomalies(shiptypeanamolypoints: any, ship: any): void {
    const shipTypeAnomalyPointForTraj: any[] = shiptypeanamolypoints.map(
      (anomalypoint: any) => {
        const feature = new Feature({
          geometry: new Point([anomalypoint.nlong, anomalypoint.nlat]),
          shiptypeanmolyData: anomalypoint,
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: "assets/soi/anomalyRed.svg",
              scale: 1,
            }),
          })
        );

        return feature;
      }
    );

    this.overlappingAnomalyMap.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: shipTypeAnomalyPointForTraj,
        }),
        className: ship.traj_id + "anomaly",
      })
    );
  }

  // Plot ship Type anomaly  on map
  plotTransmissionAnomalies(transmissionAnamolypoints: any, ship: any): void {
    const shipTypeAnomalyPointForTraj: any[] = transmissionAnamolypoints.map(
      (transanomalypoint: any) => {
        const feature = new Feature({
          geometry: new Point([
            transanomalypoint.nlong,
            transanomalypoint.nlat,
          ]),
          transAnmolyData: transanomalypoint,
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: "assets/soi/anomalyGreen.svg",
              scale: 1,
            }),
          })
        );

        return feature;
      }
    );

    this.overlappingAnomalyMap.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: shipTypeAnomalyPointForTraj,
        }),
        className: ship.traj_id + "anomaly",
      })
    );
  }

  // Sorting shiptypeAnomaly
  sortShipTypeAnomaliesData(sort: Sort): any {
    const data = this.overlappingAnomalySortedData.slice();

    if (!sort.active || sort.direction === "") {
      this.overlappingAnomalySortedData = data;
      return;
    }
    this.overlappingAnomalySortedData = data.sort((a, b) => {
      const isAsc = sort.direction === "asc";
      switch (sort.active) {
        case "mmsi":
          return this.compare(a.mmsi, b.mmsi, isAsc);
        case "trajid":
          return this.compare(a.trajid, b.trajid, isAsc);
        case "category":
          return this.compare(a.category, b.category, isAsc);
        default:
          return 0;
      }
    });
  }
  compare(a: number | string, b: number | string, isAsc: boolean): any {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  // Plot track
  plotTrack(pastTrackData: any, ship: any, speedData: any): void {
    if (pastTrackData.length >= 1) {
      const track = pastTrackData;
      track.forEach((t: any) => {
        let trajData: any = { mmsi: t.mmsi, id: t.traj_id };
        if (speedData.length > 0) {
          trajData = speedData[0];
        }
        const trajectoryfeature: any[] = [];
        const polygoncoordinates: any[] = [];
        const trajectoryPointforonetrack: any[] = [];
        t.points.forEach((tH: any, i: any) => {
          polygoncoordinates.push([tH.long, tH.lat]);
          trajectoryPointforonetrack.push(
            new Feature({
              geometry: new Point([tH.long, tH.lat]),
              trajectoryData: trajData,
              cog: tH.cog,
            })
          );
        });

        trajectoryfeature.push(
          new Feature({
            geometry: new MultiLineString([polygoncoordinates]),
            trajectoryData: trajData,
          })
        );
        trajectoryfeature[0].setStyle(
          new Style({
            stroke: new Stroke({
              color: "brown",
              width: 1,
            }),
          })
        );

        trajectoryfeature.push(
          new Feature({
            geometry: new Point(polygoncoordinates[0]),
          })
        );

        trajectoryfeature[1].setStyle(
          new Style({
            image: new Icon({
              src: "../../assets/soi/circle.svg",
              scale: 1,
            }),
          })
        );

        trajectoryfeature.push(
          new Feature({
            geometry: new Point(polygoncoordinates[t.points.length - 1]),
          })
        );

        trajectoryfeature[2].setStyle(
          new Style({
            image: new Icon({
              src: "../../assets/soi/ship-green.svg",
              scale: 1,
              rotation: (Math.PI / 180) * t.points[t.points.length - 1].cog,
            }),
          })
        );

        const trajStyle = {
          symbol: {
            symbolType: "image",
            src: "assets/map/arrow.svg",
            color: "YELLOW",
            size: 15,
            rotateWithView: true,
            offset: [0, 0],
            opacity: 0.8,
            rotation: ["*", ["get", "cog"], Math.PI / 180],
          },
        };

        this.overlappingAnomalyMap.addLayer(
          new VectorLayer({
            source: new VectorSource({
              features: trajectoryfeature,
            }),
            className: ship.traj_id,
          })
        );

        this.overlappingAnomalyMap.addLayer(
          new WebGLPoints({
            source: <any>new VectorSource({
              features: trajectoryPointforonetrack,
            }),
            className: ship.traj_id,
            style: trajStyle,
          })
        );
      });
    }

    this.onTrajectoryHover();
  }

  // Hover on trajectory
  onTrajectoryHover() {
    const trajHoverDivElement = document.getElementById(
      "shipTypeAnomalytrajhover"
    )!;
    const trajoverlay = new Overlay({
      element: trajHoverDivElement,
      positioning: "center-center",
    });

    this.overlappingAnomalyMap.on("pointermove", (e: any) => {
      const trajHoverData = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature: any) => feature
      );

      if (!trajHoverData) {
        if (trajHoverDivElement) {
          trajHoverDivElement.setAttribute("style", "display:none");
        }

        return;
      }

      let overlayContent = "";
      let overlayPositioning: any = "bottom-right";

      if (trajHoverData.get("trajectoryData") !== undefined) {
        const traj = trajHoverData.get("trajectoryData");
        if (traj.measure !== undefined) {
          overlayContent = `
            <p style="margin-bottom: 0px;"><b>*Speed Anomaly</b></p>
            <p style="margin-bottom: 0px;"><b>MMSI: </b>${traj.mmsi}</p>
            <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${traj.traj_id}</p>
            <p style="margin-bottom: 0px;"><b>Measure:</b>${traj.measure} ${traj.unit}</p>
          `;
        } else {
          overlayContent = `
            <p style="margin-bottom: 0px;"><b>MMSI: </b>${traj.mmsi}</p>
            <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${traj.id}</p>
          `;
        }
      } else if (trajHoverData.get("shiptypeanmolyData") !== undefined) {
        const anomaly = trajHoverData.get("shiptypeanmolyData");
        const time = formatDate(anomaly.ntime, "dd-MM-yyyy,hh:mm a", "en-US");
        overlayContent = `
            <p style="margin-bottom: 0px;"><b>*Ship Type Anomaly</b></p>
            <span>Changed from ${anomaly.previous_type} to ${anomaly.changed_type}</span><br/>
            <span>at ${time}</span>
          `;
      } else if (trajHoverData.get("transAnmolyData") !== undefined) {
        const anomaly = trajHoverData.get("transAnmolyData");
        const time = formatDate(anomaly.ntime, "dd-MM-yyyy,hh:mm a", "en-US");
        overlayContent = `
              <p style="margin-bottom: 0px;"><b>*Transmission Anomaly</b></p>
              <p style="margin-bottom: 0px;"><b>MMSI: </b>${anomaly.mmsi}</p>
              <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${
                anomaly.traj_id
              }</p>
              <p style="margin-bottom: 0px;"><b>Measure: </b>${anomaly.measure.toFixed(
                2
              )} ${anomaly.unit}</p>
              <p style="margin-bottom: 0px;"><b>End time: </b>${time}</p>
            `;
      } else {
        if (trajHoverDivElement) {
          trajHoverDivElement.setAttribute("style", "display:none");
        }
        return;
      }

      if (trajHoverDivElement) {
        trajHoverDivElement.setAttribute("style", "display:block");
      }
      trajoverlay.setPositioning(overlayPositioning);
      trajoverlay.setPosition(e.coordinate);
      trajoverlay.setOffset(
        this.calculateOverlayOffset(this.overlappingAnomalyMap, trajoverlay)
      );
      if (trajHoverDivElement) {
        trajHoverDivElement.innerHTML = overlayContent;
      }
      this.overlappingAnomalyMap.addOverlay(trajoverlay);
    });
  }

  // Calculating overlay position
  calculateOverlayOffset(mapName: any, overlay: any): any {
    if (
      !overlay ||
      !overlay.getElement() ||
      !mapName ||
      !mapName.getTargetElement()
    ) {
      return [0, 0]; // Return default offset when elements are not available.
    }
    const overlayRect: any = overlay.getElement().getBoundingClientRect();
    const mapRect: any = mapName.getTargetElement().getBoundingClientRect();
    const margin: any = 15;

    const calculateOffset = (
      overlayPos: any,
      mapPos: any,
      mapSize: any,
      offset: any
    ) => {
      const diff = overlayPos - mapPos - offset;
      if (diff < 0) {
        return Math.min(margin - diff, 0);
      }
      const overflow = overlayPos + overlayRect.width - (mapPos + mapSize);
      if (overflow > 0) {
        return Math.max(-(overflow + margin), 0);
      }
      return 0;
    };

    const offset = [
      calculateOffset(overlayRect.left, mapRect.left, mapRect.width, 75),
      calculateOffset(overlayRect.top, mapRect.top, mapRect.height, 75),
    ];

    return offset;
  }

  ngOnDestroy(): void {
    if (this.overlappingAnomalySub !== undefined) {
      this.overlappingAnomalySub.unsubscribe();
    }
    if (this.overlappingAnomalyTajListSub !== undefined) {
      this.overlappingAnomalyTajListSub.unsubscribe();
    }
  }
}
