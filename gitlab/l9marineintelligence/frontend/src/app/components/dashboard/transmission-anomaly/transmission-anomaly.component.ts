import * as moment from 'moment';

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { AnomalyInfoService } from '../../shared/anomaly-info.service';
import { CookieService } from 'ngx-cookie-service';
import Map from 'ol/Map';
import { MatDatepicker } from '@angular/material/datepicker';
import { MessageService } from '../../shared/message.service';
import { Moment } from 'moment';
import MousePosition from 'ol/control/MousePosition';
import { OSM } from 'ol/source';
import Overlay from 'ol/Overlay';
import { ServiceService } from '../../shared/service.service';
import { Sort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { createStringXY } from 'ol/coordinate';
import { defaults as defaultControls } from 'ol/control';
import { Feature } from 'ol';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import WebGLPoints from 'ol/layer/WebGLPoints';
import Icon from 'ol/style/Icon';
import { formatDate } from '@angular/common';
import { MultiLineString, Point } from 'ol/geom';

@Component({
  selector: 'app-transmission-anomaly',
  templateUrl: './transmission-anomaly.component.html',
  styleUrls: ['./transmission-anomaly.component.scss'],
})
export class TransmissionAnomalyComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  transmissionAnomalySub!: Subscription;
  showtransmissionAnoamlies = false;
  map!: Map;

  totalTransmissionAnomalies = 0;
  totalAnomalyCount = 0;
  showNote = true;
  transmissioncurrentPage: number = 1;
  transmissionAnomalyData: any[] = [];
  transmissionAnomalysortedData: any[] = [];
  selectedTransmissionShip: any[] = [];
  selectedTransmissionShipArray: any[] = [];
  itemsPerPage!: number;
  offset: number = 0;
  transmissionAnomalyMap!: Map | any;
  plotTime: any;
  isloading: boolean = false;
  maxDate = new Date();
  transmissionAnomalyNote: any;

  constructor(
    private AnomalyService: AnomalyInfoService,
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  transmissionanomalySearchForm = new FormGroup({
    transmissionanomaly_search_text: new FormControl(''),
  });

  fromdate = new FormControl(moment());
  from_year: any = new Date().getFullYear();
  from_month: any = Number(new Date().getMonth()) + 1;

  ngOnInit(): void {
    this.plotTime = this.cookieService.get('plotTime');
    this.itemsPerPage = 15;
    this.removeTransmissionMap();
  }

  ngAfterViewInit(): void {
    this.transmissionAnomalySub = this.AnomalyService.TDA.subscribe((msg) => {
      if (msg === 'true') {
        this.showtransmissionAnoamlies = true;
        this.transmissioncurrentPage = 1;
        this.offset = 0;
        this.transmissionAnomalyData = [];
        this.transmissionAnomalysortedData = [];
        this.totalTransmissionAnomalies = 0;
        this.selectedTransmissionShip = [];
        this.plotTime = this.cookieService.get('plotTime');
        this.showNote = true;
        this.removeTransmissionMap();
        this.getTransmissionAnomalies();
        this.getTotalAnomalyCount();
        this.transmissionAnomalysortedData.forEach((ship) => {
          this.transmissionAnomalyMap
            .getLayers()
            .getArray()
            .filter((layer: any) => layer.getClassName() === Number(ship.id))
            .forEach((layer: any) => {
              layer.getSource().clear();
              this.transmissionAnomalyMap.removeLayer(layer);
            });
        });
        if (document.getElementById('Transmission Anomalies') !== null) {
          document
            .getElementById('Transmission Anomalies_img')!
            .setAttribute(
              'src',
              'assets/anomaly-info/selected/Transmission Anomalies.svg'
            );
          if (document.getElementById('Transmission Anomalies_name') !== null) {
            document.getElementById(
              'Transmission Anomalies_name'
            )!.style.color = '#FFBE3D';
          }
        }
      } else {
        this.showtransmissionAnoamlies = false;
        this.transmissioncurrentPage = 1;
        this.offset = 0;
        this.transmissionAnomalyData = [];
        this.transmissionAnomalysortedData = [];
        this.totalTransmissionAnomalies = 0;
        this.selectedTransmissionShip = [];
        this.removeTransmissionMap();
        this.transmissionAnomalysortedData.forEach((ship) => {
          this.transmissionAnomalyMap
            .getLayers()
            .getArray()
            .filter((layer: any) => layer.getClassName() === Number(ship.id))
            .forEach((layer: any) => {
              layer.getSource().clear();
              this.transmissionAnomalyMap.removeLayer(layer);
            });
        });
        if (document.getElementById('Transmission Anomalies') !== null) {
          document
            .getElementById('Transmission Anomalies_img')!
            .setAttribute(
              'src',
              'assets/anomaly-info/Transmission Anomalies.svg'
            );
          if (document.getElementById('Transmission Anomalies_name') !== null) {
            document.getElementById(
              'Transmission Anomalies_name'
            )!.style.color = 'white';
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
    const element = document.getElementById('transmission_month_year');
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
    this.offset = 0;
    this.plotTime = '';
    this.transmissioncurrentPage = 1;
    this.transmissionAnomalyData = [];
    this.transmissionAnomalysortedData = [];
    this.totalTransmissionAnomalies = 0;
    this.selectedTransmissionShip = [];
    this.getTransmissionAnomalies();
    this.getTotalAnomalyCount();
    this.showNote = false;
  }

  // Display map in transmission anomaly
  displayMapInTransmission(): void {
    this.removeTransmissionMap();
    if (this.transmissionAnomalyMap === undefined) {
      const shippopupdiv = document.getElementById('popup')!;
      const overlay = new Overlay({
        element: shippopupdiv,
        positioning: 'center-center',
      });
      this.transmissionAnomalyMap = new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
            visible: true,
            className: 'transmissionanomalymap',
          }),
        ],
        overlays: [overlay],
        target: 'transmissionanomalymap',
        view: new View({
          center: [78, 20],
          zoom: 4,
          projection: 'EPSG:4326',
        }),
        controls: defaultControls().extend([
          new MousePosition({
            coordinateFormat: createStringXY(4),
            projection: 'EPSG:4326',
          }),
        ]),
      });
    }
  }

  removeTransmissionMap(): void {
    if (this.transmissionAnomalyMap) {
      // Remove layers
      this.transmissionAnomalyMap
        .getLayers()
        .forEach((layer: any) =>
          this.transmissionAnomalyMap?.removeLayer(layer)
        );

      // Remove controls
      this.transmissionAnomalyMap
        .getControls()
        .forEach((control: any) =>
          this.transmissionAnomalyMap?.removeControl(control)
        );

      // Remove interactions
      this.transmissionAnomalyMap
        .getInteractions()
        .forEach((interaction: any) =>
          this.transmissionAnomalyMap?.removeInteraction(interaction)
        );

      // Remove map from DOM
      this.transmissionAnomalyMap.setTarget(null);

      // Set map reference to undefined to clean up memory
      this.transmissionAnomalyMap = undefined;
    }
  }

  // sending offset for pagination
  setTransmissionAnomalyOffset(event: any) {
    this.transmissioncurrentPage = event;
    if (this.transmissioncurrentPage * 15 === this.offset) {
      this.getTransmissionAnomalies();
    }
  }

  getTransmissionAnomalies() {
    this.isloading = true;
    const reqData = {
      timestamp: this.plotTime,
      month: this.from_month,
      year: this.from_year,
      offset: this.offset,
    };
    this.service.getTransmissionAnomaly(reqData).subscribe({
      next: (data) => {
        this.displayMapInTransmission();

        if (data.status === 'success') {
          this.transmissionAnomalyData.push(...data.trans);
          this.offset = data.offset;
          this.transmissionAnomalyData.forEach((t, index) => {
            t.id = index;
          });
          this.transmissionAnomalysortedData =
            this.transmissionAnomalyData.slice();
          this.totalTransmissionAnomalies = this.transmissionAnomalyData.length;
          this.transmissionAnomalyNote = data.remark;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.displayMapInTransmission();
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Search in transmission anomaly.
  getSearchResultForTransmissionAnomaly(e: string): void {
    const searchTerm = e.toString();
    this.transmissionAnomalysortedData = this.transmissionAnomalyData.filter(
      (obj) => obj.mmsi.toString().startsWith(searchTerm)
    );
    this.transmissioncurrentPage = 1;
  }

  // show in map checkbox for individual ship in transmission anomaly
  transmissionAnomalyCheckboxChange(e: any): void {
    if (e.target.checked) {
      this.selectedTransmissionShipArray.push(e.target.value);
      this.selectedTransmissionShip[e.target.value] = true;
      this.transmissionAnomalysortedData.forEach((ship) => {
        if (ship.traj_id === Number(e.target.value)) {
          this.getShipTrajectoryAnomaly(ship);
        }
      });
    } else {
      const index = this.selectedTransmissionShipArray.indexOf(
        Number(e.target.value)
      );
      if (index > -1) {
        this.selectedTransmissionShipArray.splice(index, 1);
      }
      this.selectedTransmissionShip[e.target.value] = false;

      this.transmissionAnomalyMap
        .getLayers()
        .getArray()
        .filter(
          (layer: any) =>
            layer.getClassName() === Number(e.target.value) ||
            layer.getClassName() === Number(e.target.value) + 'anomaly'
        )
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.transmissionAnomalyMap.removeLayer(layer);
        });
    }
  }

  getShipTrajectoryAnomaly(ship: any) {
    this.isloading = true;
    const reqData = {
      mmsi: ship.mmsi,
      traj_id: ship.traj_id,
      timestamp: this.plotTime,
      flag: [2],
    };
    this.service.getTrajectoryForAnomaly(reqData).subscribe({
      next: (data) => {
        if (data.status === 'success') {
          this.plotTrack(data.traj, ship);
          this.plotPrevTransmissionAnomalies(data.trans, ship);
          this.plotNextTransmissionAnomalies(data.trans, ship);
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
  plotPrevTransmissionAnomalies(
    transmissionanamolypoints: any,
    ship: any
  ): void {
    const transmissionAnomalyPointForTraj: any[] =
      transmissionanamolypoints.map((anomalypoint: any) => {
        const feature = new Feature({
          geometry: new Point([anomalypoint.plong, anomalypoint.plat]),
          prevTransmissionanmolyData: anomalypoint,
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: 'assets/soi/anomalyGreen.svg',
              scale: 1,
            }),
          })
        );

        return feature;
      });

    this.transmissionAnomalyMap.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: transmissionAnomalyPointForTraj,
        }),
        className: ship.traj_id + 'anomaly',
      })
    );
  }

  // Plot ship Type anomaly  on map
  plotNextTransmissionAnomalies(
    transmissionanamolypoints: any,
    ship: any
  ): void {
    const transmissionAnomalyPointForTraj: any[] =
      transmissionanamolypoints.map((anomalypoint: any) => {
        const feature = new Feature({
          geometry: new Point([anomalypoint.nlong, anomalypoint.nlat]),
          nextTransmissionanmolyData: anomalypoint,
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              src: 'assets/soi/anomalyRed.svg',
              scale: 1,
            }),
          })
        );

        return feature;
      });

    this.transmissionAnomalyMap.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: transmissionAnomalyPointForTraj,
        }),
        className: ship.traj_id + 'anomaly',
      })
    );
  }

  // Sorting transmission anomaly
  sortTransmissionAnomaliesData(sort: Sort): any {
    const data = this.transmissionAnomalysortedData.slice();

    if (!sort.active || sort.direction === '') {
      this.transmissionAnomalysortedData = data;
      return;
    }
    this.transmissionAnomalysortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'mmsi':
          return this.compare(a.mmsi, b.mmsi, isAsc);
        case 'trajid':
          return this.compare(a.trajid, b.trajid, isAsc);
        case 'category':
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
  plotTrack(pastTrackData: any, ship: any): void {
    if (pastTrackData.length >= 1) {
      const track = pastTrackData;
      track.forEach((t: any) => {
        const trajData = { mmsi: t.mmsi, id: t.traj_id };
        const trajectoryfeature: any[] = [];
        const polygoncoordinates: any[] = [];
        const trajectoryPointforonetrack: any[] = [];
        t.points.forEach((tH: any, i: any) => {
          polygoncoordinates.push([tH.long, tH.lat]);
          trajectoryPointforonetrack.push(
            new Feature({
              geometry: new Point([tH.long, tH.lat]),
              transtrajectoryData: trajData,
              cog: tH.cog,
            })
          );
        });

        trajectoryfeature.push(
          new Feature({
            geometry: new MultiLineString([polygoncoordinates]),
            transtrajectoryData: trajData,
          })
        );
        trajectoryfeature[0].setStyle(
          new Style({
            stroke: new Stroke({
              color: 'brown',
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
              src: '../../assets/soi/circle.svg',
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
              src: '../../assets/soi/ship-green.svg',
              scale: 1,
              rotation: (Math.PI / 180) * t.points[t.points.length - 1].cog,
            }),
          })
        );

        const trajStyle = {
          symbol: {
            symbolType: 'image',
            src: 'assets/map/arrow.svg',
            color: 'YELLOW',
            size: 15,
            rotateWithView: true,
            offset: [0, 0],
            opacity: 0.8,
            rotation: ['*', ['get', 'cog'], Math.PI / 180],
          },
        };

        this.transmissionAnomalyMap.addLayer(
          new VectorLayer({
            source: new VectorSource({
              features: trajectoryfeature,
            }),
            className: ship.traj_id,
          })
        );

        this.transmissionAnomalyMap.addLayer(
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

  getTotalAnomalyCount() {
    this.isloading = true;
    const reqData = {
      timestamp: this.plotTime,
      month: this.from_month,
      year: this.from_year,
      offset: this.offset,
      flag:2
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

  // Hover on trajectory
  onTrajectoryHover() {
    const trajHoverDivElement = document.getElementById(
      'trannsmissionAnomalytrajhover'
    )!;
    const trajoverlay = new Overlay({
      element: trajHoverDivElement,
      positioning: 'center-center',
    });

    this.transmissionAnomalyMap.on('pointermove', (e: any) => {
      const trajHoverData = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature: any) => feature
      );

      if (!trajHoverData) {
        if (trajHoverDivElement) {
          trajHoverDivElement.setAttribute('style', 'display:none');
        }

        return;
      }

      let overlayContent = '';
      let overlayPositioning: any = 'bottom-right';

      if (trajHoverData.get('transtrajectoryData') !== undefined) {
        const traj = trajHoverData.get('transtrajectoryData');
        overlayContent = `
              <p style="margin-bottom: 0px;"><b>MMSI: </b>${traj.mmsi}</p>
              <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${traj.id}</p>
            `;
      } else if (
        trajHoverData.get('prevTransmissionanmolyData') !== undefined
      ) {
        const anomaly = trajHoverData.get('prevTransmissionanmolyData');
        const time = formatDate(anomaly.ptime, 'dd-MM-yyyy,hh:mm a', 'en-US');
        overlayContent = `
              <p style="margin-bottom: 0px;"><b>*Anomaly starting point</b></p>
              <p style="margin-bottom: 0px;"><b>MMSI: </b>${anomaly.mmsi}</p>
              <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${
                anomaly.traj_id
              }</p>
              <p style="margin-bottom: 0px;"><b>Measure: </b>${anomaly.measure.toFixed(
                2
              )} ${anomaly.unit}</p>
              <p style="margin-bottom: 0px;"><b>Starting time: </b>${time}</p>
            `;
      } else if (
        trajHoverData.get('nextTransmissionanmolyData') !== undefined
      ) {
        const anomaly = trajHoverData.get('nextTransmissionanmolyData');
        const time = formatDate(anomaly.ntime, 'dd-MM-yyyy,hh:mm a', 'en-US');
        overlayContent = `
              <p style="margin-bottom: 0px;"><b>*Anomaly end point</b></p>
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
          trajHoverDivElement.setAttribute('style', 'display:none');
        }
        return;
      }

      if (trajHoverDivElement) {
        trajHoverDivElement.setAttribute('style', 'display:block');
      }
      trajoverlay.setPositioning(overlayPositioning);
      trajoverlay.setPosition(e.coordinate);
      trajoverlay.setOffset(
        this.calculateOverlayOffset(this.transmissionAnomalyMap, trajoverlay)
      );
      if (trajHoverDivElement) {
        trajHoverDivElement.innerHTML = overlayContent;
      }
      this.transmissionAnomalyMap.addOverlay(trajoverlay);
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
    if (this.transmissionAnomalySub !== undefined) {
      this.transmissionAnomalySub.unsubscribe();
    }
  }
}
