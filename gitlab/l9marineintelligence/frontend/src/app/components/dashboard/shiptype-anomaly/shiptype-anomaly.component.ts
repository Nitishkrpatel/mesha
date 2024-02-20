import * as moment from 'moment';

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MultiLineString, Point } from 'ol/geom';

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

@Component({
  selector: 'app-shiptype-anomaly',
  templateUrl: './shiptype-anomaly.component.html',
  styleUrls: ['./shiptype-anomaly.component.scss'],
})
export class ShiptypeAnomalyComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  shiptypeAnomalySub!: Subscription;
  showShiptypeAnoamlies = false;
  totalShipTypeAnomalies = 0;
  totalAnomalyCount = 0;
  showNote = true;
  shiptypecurrentPage: number = 1;
  shipTypeAnomalyData: any[] = [];
  shipTypeAnomalysortedData: any[] = [];
  selectedShipType: any[] = [];
  selectAllShipType = false;
  selectedShipTypeArray: any[] = [];
  itemsPerPage!: number;
  offset: number = 0;
  ShipTypeAnomalyMap!: Map | any;
  plotTime: any;
  isloading: boolean = false;
  maxDate = new Date();

  constructor(
    private AnomalyService: AnomalyInfoService,
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService
  ) {}

  shiptypeanomalySearchForm = new FormGroup({
    shiptypeanomaly_search_text: new FormControl(''),
  });

  fromdate = new FormControl(moment());
  from_year: any = new Date().getFullYear();
  from_month: any = Number(new Date().getMonth()) + 1;

  ngOnInit(): void {
    this.plotTime = this.cookieService.get('plotTime');
    this.itemsPerPage = 15;
    this.removeShipTypeMap();
  }

  ngAfterViewInit(): void {
    this.shiptypeAnomalySub = this.AnomalyService.STA.subscribe((msg) => {
      if (msg === 'true') {
        this.showShiptypeAnoamlies = true;
        this.shiptypecurrentPage = 1;
        this.offset = 0;
        this.shipTypeAnomalyData = [];
        this.shipTypeAnomalysortedData = [];
        this.totalShipTypeAnomalies = 0;
        this.selectedShipType = [];
        this.plotTime = this.cookieService.get('plotTime');
        this.showNote = true;
        this.removeShipTypeMap();
        this.getShipTypeAnomalies();
        this.getTotalAnomalyCount();
        this.shipTypeAnomalysortedData.forEach((ship) => {
          this.ShipTypeAnomalyMap.getLayers()
            .getArray()
            .filter((layer: any) => layer.getClassName() === Number(ship.id))
            .forEach((layer: any) => {
              layer.getSource().clear();
              this.ShipTypeAnomalyMap.removeLayer(layer);
            });
        });
        if (document.getElementById('Ship Type Anomalies') !== null) {
          document
            .getElementById('Ship Type Anomalies_img')!
            .setAttribute(
              'src',
              'assets/anomaly-info/selected/Ship Type Anomalies.svg'
            );
          if (document.getElementById('Ship Type Anomalies_name') !== null) {
            document.getElementById('Ship Type Anomalies_name')!.style.color =
              '#FFBE3D';
          }
        }
      } else {
        this.showShiptypeAnoamlies = false;
        this.shiptypecurrentPage = 1;
        this.offset = 0;
        this.shipTypeAnomalyData = [];
        this.shipTypeAnomalysortedData = [];
        this.totalShipTypeAnomalies = 0;
        this.selectedShipType = [];
        this.removeShipTypeMap();
        this.shipTypeAnomalysortedData.forEach((ship) => {
          this.ShipTypeAnomalyMap.getLayers()
            .getArray()
            .filter((layer: any) => layer.getClassName() === Number(ship.id))
            .forEach((layer: any) => {
              layer.getSource().clear();
              this.ShipTypeAnomalyMap.removeLayer(layer);
            });
        });
        if (document.getElementById('Ship Type Anomalies') !== null) {
          document
            .getElementById('Ship Type Anomalies_img')!
            .setAttribute('src', 'assets/anomaly-info/Ship Type Anomalies.svg');
          if (document.getElementById('Ship Type Anomalies_name') !== null) {
            document.getElementById('Ship Type Anomalies_name')!.style.color =
              'white';
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
    const element = document.getElementById('shiptype_month_year');
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
    this.shiptypecurrentPage = 1;
    this.shipTypeAnomalyData = [];
    this.shipTypeAnomalysortedData = [];
    this.totalShipTypeAnomalies = 0;
    this.selectedShipType = [];
    this.getShipTypeAnomalies();
    this.getTotalAnomalyCount();
    this.showNote = false;
  }

  // Display map in ShipType anomaly
  displayMapInShipType(): void {
    this.removeShipTypeMap();
    if (this.ShipTypeAnomalyMap === undefined) {
      const shippopupdiv = document.getElementById('popup')!;
      const overlay = new Overlay({
        element: shippopupdiv,
        positioning: 'center-center',
      });
      this.ShipTypeAnomalyMap = new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
            visible: true,
            className: 'shiptypeanomalymap',
          }),
        ],
        overlays: [overlay],
        target: 'shiptypeanomalymap',
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

  removeShipTypeMap(): void {
    if (this.ShipTypeAnomalyMap) {
      // Remove layers
      this.ShipTypeAnomalyMap.getLayers().forEach((layer: any) =>
        this.ShipTypeAnomalyMap?.removeLayer(layer)
      );

      // Remove controls
      this.ShipTypeAnomalyMap.getControls().forEach((control: any) =>
        this.ShipTypeAnomalyMap?.removeControl(control)
      );

      // Remove interactions
      this.ShipTypeAnomalyMap.getInteractions().forEach((interaction: any) =>
        this.ShipTypeAnomalyMap?.removeInteraction(interaction)
      );

      // Remove map from DOM
      this.ShipTypeAnomalyMap.setTarget(null);

      // Set map reference to undefined to clean up memory
      this.ShipTypeAnomalyMap = undefined;
    }
  }

  // sending offset for pagination
  setshipTypeAnomalyOffset(event: any) {
    this.shiptypecurrentPage = event;
    if (this.shiptypecurrentPage * 15 === this.offset) {
      this.getShipTypeAnomalies();
    }
  }

  getShipTypeAnomalies() {
    this.isloading = true;
    const reqData = {
      timestamp: this.plotTime,
      month: this.from_month,
      year: this.from_year,
      offset: this.offset,
    };
    this.service.getShipTypeAnomaly(reqData).subscribe({
      next: (data) => {
        this.displayMapInShipType();

        if (data.status === 'success') {
          this.shipTypeAnomalyData.push(...data.data);
          this.offset = data.offset;
          this.shipTypeAnomalyData.forEach((t, index) => {
            t.id = index;
          });
          this.shipTypeAnomalysortedData = this.shipTypeAnomalyData.slice();
          this.totalShipTypeAnomalies = this.shipTypeAnomalyData.length;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.displayMapInShipType();
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Search in shipTypeanomaly.
  getSearchResultForShipTypeAnomaly(e: string): void {
    const searchTerm = e.toString();
    this.shipTypeAnomalysortedData = this.shipTypeAnomalyData.filter((obj) =>
      obj.mmsi.toString().startsWith(searchTerm)
    );
    this.shiptypecurrentPage = 1;
  }

  // show in map checkbox for individual ship in shiptypeAnomaly
  shipTypeAnomalyCheckboxChange(e: any): void {
    if (e.target.checked) {
      this.selectedShipTypeArray.push(e.target.value);
      this.selectedShipType[e.target.value] = true;
      this.shipTypeAnomalysortedData.forEach((ship) => {
        if (ship.traj_id === Number(e.target.value)) {
          this.getShipTrajectoryAnomaly(ship);
        }
      });
    } else {
      const index = this.selectedShipTypeArray.indexOf(Number(e.target.value));
      if (index > -1) {
        this.selectedShipTypeArray.splice(index, 1);
      }
      this.selectedShipType[e.target.value] = false;
      this.selectAllShipType = false;

      this.ShipTypeAnomalyMap.getLayers()
        .getArray()
        .filter(
          (layer: any) =>
            layer.getClassName() === Number(e.target.value) ||
            layer.getClassName() === Number(e.target.value) + 'anomaly'
        )
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.ShipTypeAnomalyMap.removeLayer(layer);
        });
    }
  }

  getShipTrajectoryAnomaly(ship: any) {
    this.isloading = true;
    const reqData = {
      mmsi: ship.mmsi,
      traj_id: ship.traj_id,
      timestamp: this.plotTime,
      flag: [0],
    };
    this.service.getTrajectoryForAnomaly(reqData).subscribe({
      next: (data) => {
        if (data.status === 'success') {
          this.plotTrack(data.traj, ship);
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
              src: 'assets/soi/anomalyRed.svg',
              scale: 1,
            }),
          })
        );

        return feature;
      }
    );

    this.ShipTypeAnomalyMap.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: shipTypeAnomalyPointForTraj,
        }),
        className: ship.traj_id + 'anomaly',
      })
    );
  }

  // Sorting shiptypeAnomaly
  sortShipTypeAnomaliesData(sort: Sort): any {
    const data = this.shipTypeAnomalysortedData.slice();

    if (!sort.active || sort.direction === '') {
      this.shipTypeAnomalysortedData = data;
      return;
    }
    this.shipTypeAnomalysortedData = data.sort((a, b) => {
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

        this.ShipTypeAnomalyMap.addLayer(
          new VectorLayer({
            source: new VectorSource({
              features: trajectoryfeature,
            }),
            className: ship.traj_id,
          })
        );

        this.ShipTypeAnomalyMap.addLayer(
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
      flag:0
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
      'shipTypeAnomalytrajhover'
    )!;
    const trajoverlay = new Overlay({
      element: trajHoverDivElement,
      positioning: 'center-center',
    });

    this.ShipTypeAnomalyMap.on('pointermove', (e: any) => {
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

      if (trajHoverData.get('trajectoryData') !== undefined) {
        const traj = trajHoverData.get('trajectoryData');
        overlayContent = `
            <p style="margin-bottom: 0px;"><b>MMSI: </b>${traj.mmsi}</p>
            <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${traj.id}</p>
          `;
      } else if (trajHoverData.get('shiptypeanmolyData') !== undefined) {
        const anomaly = trajHoverData.get('shiptypeanmolyData');
        const time = formatDate(anomaly.ntime, 'dd-MM-yyyy,hh:mm a', 'en-US');
        overlayContent = `
            <span>Changed from ${anomaly.previous_type} to ${anomaly.changed_type}</span><br/>
            <span>at ${time}</span>
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
        this.calculateOverlayOffset(this.ShipTypeAnomalyMap, trajoverlay)
      );
      if (trajHoverDivElement) {
        trajHoverDivElement.innerHTML = overlayContent;
      }
      this.ShipTypeAnomalyMap.addOverlay(trajoverlay);
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
    if (this.shiptypeAnomalySub !== undefined) {
      this.shiptypeAnomalySub.unsubscribe();
    }
  }
}
