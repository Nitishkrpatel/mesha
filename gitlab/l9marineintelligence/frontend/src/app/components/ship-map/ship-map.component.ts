import "ol/ol.css";

import { Component, OnDestroy, OnInit } from "@angular/core";
import { MousePosition, defaults as defaultControls } from "ol/control";
import { AfterViewInit } from "@angular/core";
import Feature from "ol/Feature";
import Map from "ol/Map";
import { OSM, TileWMS } from "ol/source";
import { MultiLineString, Point, Polygon } from "ol/geom";
import TileLayer from "ol/layer/Tile";
import VectorSource from "ol/source/Vector";
import View from "ol/View";
import { Graticule, WebGLPoints } from "ol/layer";
import XYZ from "ol/source/XYZ";
import ZoomToExtent from "ol/control/ZoomToExtent";
import { createStringXY } from "ol/coordinate";
import Stroke from "ol/style/Stroke";
import { MessageService } from "../shared/message.service";
import { ServiceService } from "../shared/service.service";
import VectorLayer from "ol/layer/Vector";
import { formatDate } from "@angular/common";
import Overlay from "ol/Overlay";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import { CookieService } from "ngx-cookie-service";
import { ShareDataService } from "../shared/share-data.service";
import { ToastrService } from "ngx-toastr";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import Draw, { createBox, createRegularPolygon } from "ol/interaction/Draw";
import { containsXY } from "ol/extent";

@Component({
  selector: "app-ship-map",
  templateUrl: "./ship-map.component.html",
  styleUrls: ["./ship-map.component.scss"],
})
export class ShipMapComponent implements OnInit, OnDestroy {
  map!: Map;
  graticule = false;
  plotTime: any;
  ShipSource = new VectorSource();
  soiflag: any;
  goiflag: any;
  soiStatus: any;
  isIntrested = false;
  togroup = false;
  predictdestination!: boolean;
  polygoncoords: any[] = [];
  predictedDestination: any[] = [];
  predictedDestinationTraj: any[] = [];
  pastTrackData: any[] = [];
  predictionOptions: any[] = [];
  destination: any;
  goiforpopup: any;
  goiforpopuplength: any;
  shipPopupDetails: any;
  selectedmmsi: any;
  showports = false;
  showanchors = false;
  ports: any[] = [];
  anchors: any[] = [];
  clockStatus: any = false;
  speed: any;
  refreshrate = 30;
  adjustDateTimeFlag: any;
  PortsSource = new VectorSource();
  AnchorsSource = new VectorSource();
  clockRunnerFun: any;
  calculateddatetime: any;
  maptype: any = "Standard Map";
  plotdate: any;
  plottime: any;
  isExpanded = false;
  collapseNav = true;
  rolefeatures: any[] = [];
  mapoptions = [{ maptype: "Standard Map" }, { maptype: "Satellite Map" }];

  // soi
  deletingsoiship = "";
  deletingSoiShipName = "";
  soifeatureisselected = "false";
  roleSoiStatus = "false";

  // goi
  goiFormSubmitted = false;
  editinggroupname: any;
  editgoisubmitted = false;
  deletinggoiship = "";
  deletingmmsiofgoi = "";
  deletingmmsiofgoiship = "";

  // ROI
  draw: any;
  regionsubmitted = false;
  computationMessage: any;
  editingregion: any;
  editregionsubmitted = false;
  deletingroi: any;
  deletingregionname = "";

  //VF
  deletingPresetId = "";
  deletingPresetName = "";

  // spinnner
  isloading: boolean = false;

  // route prediction
  predictionTimesubmitted = false;

  shipstyle = {
    symbol: {
      symbolType: "image",
      // src: "assets/map/Marker.svg",
      src: "assets/map/Marker1.png",
      size: ["clamp", ["*", ["zoom"], 5], 5, 150],
      // size: 15,
      // color: 'black',
      color: [
        "match",
        ["get", "cid"],
        "1",
        "#00FF00", // Green
        "2",
        "#FF0000", // Red
        "3",
        "#0000FF", // Blue
        "4",
        "#FFFF00", // Yellow
        "5",
        "#FF00FF", // Magenta
        "6",
        "#00FFFF", // Cyan
        "7",
        "#000000", // Black
        "8",
        "#FFFFFF", // White
        "9",
        "#800080", // Purple
        "10",
        "#FFA500", // Orange
        "11",
        "#008000", // Dark Green
        "12",
        "#800000", // Maroon
        "13",
        "#808080", // Gray
        "14",
        "#FFFFF0", // Ivory
        "15",
        "#D2691E", // Chocolate
        "16",
        "#FFD700", // Gold
        "17",
        "#2E8B57", // Sea Green
        "18",
        "#7FFFD4", // Aquamarine
        "19",
        "#A0522D", // Sienna
        "20",
        "#FF6347", // Tomato
        "21",
        "#FFA07A", // Light Salmon
        "22",
        "#4682B4", // Steel Blue
        "23",
        "#800000", // Maroon
        "24",
        "#9932CC", // Dark Orchid

        "#008000",
      ],
      rotateWithView: true,
      offset: [0, 0],
      rotation: ["*", ["get", "cog"], Math.PI / 180],
      opacity: 0.8,
    },
  };

  trajStyle = {
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

  //Hex grid
  gridVisible: Boolean = false;

  constructor(
    private msgservice: MessageService,
    private service: ServiceService,
    private cookieService: CookieService,
    private ShareDataservice: ShareDataService,
    private toastr: ToastrService
  ) {}

  goiForm: any = new FormGroup({
    mmsi: new FormControl(),
    group_name: new FormControl("", [Validators.required]),
    flag: new FormControl(""),
  });

  get g(): any {
    return this.goiForm.controls;
  }

  editgoiForm: any = new FormGroup({
    old_goi: new FormControl(""),
    new_goi: new FormControl("", [Validators.required]),
  });

  get egf(): any {
    return this.editgoiForm.controls;
  }

  regionFrom: any = new FormGroup({
    roi: new FormControl("", [Validators.required]),
    roi_coords: new FormControl(""),
  });

  get r(): any {
    return this.regionFrom.controls;
  }

  editregionForm: any = new FormGroup({
    old_roi: new FormControl(""),
    new_roi: new FormControl("", [Validators.required]),
  });

  get er(): any {
    return this.editregionForm.controls;
  }

  routePredictionTimeFrom = new FormGroup({
    predictionTime: new FormControl("", [Validators.required]),
  });

  get rpt(): any {
    return this.routePredictionTimeFrom.controls;
  }

  ngOnInit(): void {
    this.displayMapInShipMap();
    this.getFeatureForUserRole();
    this.routePredictionTimeFrom.setValue({ predictionTime: "1" });
  }

  // displaying map in ship map
  displayMapInShipMap() {
    const shippopupdiv = document.getElementById("popup")!;
    const overlay = new Overlay({
      element: shippopupdiv,
      positioning: "center-center",
    });
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
          visible: true,
          className: this.maptype,
        }),
      ],
      overlays: [overlay],
      target: "map",
      view: new View({
        center: [78, 20],
        zoom: 5,
        projection: "EPSG:4326",
      }),
      controls: defaultControls().extend([
        new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: "EPSG:4326",
        }),
      ]),
    });
    this.onShipsHover();
    this.popupCloser(overlay);
    this.singleClickOnMap(overlay);
    this.changeZoomLevelOfMap();
  }

  // changing zoom level of map when Zoomin and zoom out button is clicked
  changeZoomLevelOfMap() {
    this.ShareDataservice.changeZoomLevel(
      <any>parseFloat(<any>this.map.getView().getZoom()).toFixed(0)
    );
  }

  // on click the Cross(x) button on popup window close popup
  popupCloser(overlay: any) {
    const popup_closer = document.getElementById("popup-closer");
    if (popup_closer) {
      popup_closer.onclick = () => {
        overlay.setPosition(undefined);
        popup_closer.blur();
        document
          .getElementById("popup-fav")
          ?.setAttribute("style", "display:none");
        document
          .getElementById("popup-group")
          ?.setAttribute("style", "display:none");
        return false;
      };
    }
  }

  // on single click on any ship show the popup and popup details
  singleClickOnMap(overlay: any) {
    this.map.on("singleclick", (e) => {
      const elementsToHide = ["popup-fav", "popup-group", "popup-search"];
      elementsToHide.forEach((id) => this.hideElement(id));

      const featureData = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature) => feature,
        {
          layerFilter: (layer) =>
            layer.getClassName() === "ShipLayer" ||
            layer.getClassName() === "SOILayer" ||
            layer.getClassName() === "ROILayer" ||
            layer.getClassName() === "VFLayer",
        }
      );

      if (featureData) {
        const ship = featureData.get("shipData");
        this.predictedDestination = [];

        this.clearPastTrackLayers();

        const reqdata = { mmsi: ship.mmsi, timestamp: this.plotTime };
        this.isloading = true;

        this.service.fetchShipDetailsData(reqdata).subscribe((result: any) => {
          if (result.status === "success") {
            this.shipPopupDetails = result.data[0];
            this.isloading = false;
            this.predictdestination = false;
            this.showElement("popup");
            this.displayShipDetails(ship);
            this.displayPopupTableData(ship);
            overlay.setPosition([ship.long, ship.lat]);
            const pastTrack = document.getElementById("pastTrack");
            if (pastTrack) {
              pastTrack.removeAttribute("class");
            }

            const pastRoute = document.getElementById("pastRoute");
            if (pastRoute) {
              pastRoute.removeAttribute("class");
            }
          }
        });
      } else {
        this.hideElement("popup");
        this.isloading = false;
      }
    });
  }

  // removing the past track trajectory
  clearPastTrackLayers() {
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getClassName() === "Past Track" ||
          layer.getClassName() === "Past Track Points" ||
          layer.getClassName() === "Predict Destination Layers"
      )
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
  }

  // hide element base layer id
  hideElement(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = "none";
    }
  }

  // show element base layer id
  showElement(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = "block";
    }
  }

  // ship details in popup window
  displayShipDetails(ship: any) {
    const shipName = document.getElementById("ship_name")!;
    shipName.innerHTML = ship.ship_name;
    const shipMmsi = document.getElementById("ship_mmsi")!;
    shipMmsi.innerHTML = `MMSI: ${ship.mmsi}`;
    const shipCategoryImg = `<svg style="border: 1px solid black; border-radius: 10px" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" rx="10" fill="${ship.cr}"/></svg>`;
    const shipCatImg = document.getElementById("ship-cat-img")!;
    shipCatImg.innerHTML = shipCategoryImg;
    const shipCategory = document.getElementById("ship-category")!;
    shipCategory.innerHTML = ship.category;
    document.getElementById("country")!.innerHTML =
      this.shipPopupDetails.origin_country;
    const country = this.shipPopupDetails.origin_country
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    const countryFlag = document.getElementById("country_flag")!;
    countryFlag.innerHTML = `<img style="border: 1px solid black;" src="assets/flags/${country}.svg" width="30px" alt="flag" />`;
    const shipEta = document.getElementById("shipeta")!;
    shipEta.innerHTML = this.shipPopupDetails.eta;
    const destinationPort = document.getElementById("destinationport")!;
    destinationPort.innerHTML = this.shipPopupDetails.destination;
    this.selectedmmsi = ship.mmsi;
    this.soiflag = this.shipPopupDetails.soi_flag;
    this.goiflag = this.shipPopupDetails.goi_flag;
  }

  displayPopupTableData(ship: any) {
    this.shipPopupDetails.msi = ship.mmsi;
    this.shipPopupDetails.cg = ship.cog;
    this.shipPopupDetails.tm = ship.ist_time;

    const popupTableHTML = `<tbody>
      <tr class="popUpTableContent"><td>IMO</td><td>${
        this.shipPopupDetails.imo
      }</td></tr>
      <tr class="popUpTableContent"><td>COG</td><td>${ship.cog}&ordm;</td></tr>
      <tr class="popUpTableContent"><td>SOG</td><td>${
        this.shipPopupDetails.sog
      } knots</td></tr>
      <tr class="popUpTableContent"><td>Latitude</td><td>${ship.lat}</td></tr>
      <tr class="popUpTableContent"><td>Longitude</td><td>${ship.long}</td></tr>
      <tr class="popUpTableContent"><td>Length</td><td>${
        this.shipPopupDetails.length
      } metres</td></tr>
      <tr class="popUpTableContent"><td>Width</td><td>${
        this.shipPopupDetails.width
      } metres</td></tr>
      <tr class="popUpTableContent"><td>Class</td><td>${
        this.shipPopupDetails.class_name
      }</td></tr>
      <tr class="popUpTableContent"><td>Time</td><td>${formatDate(
        this.shipPopupDetails.tm,
        "dd-MM-yyyy hh:mm:ss a",
        "en-US"
      )}</td></tr>
    </tbody>`;

    const popupTableElement = document.getElementById("popup-table")!;
    popupTableElement.innerHTML = popupTableHTML;
  }

  // Zooming In map
  zoomIn(): void {
    this.map.getView().setZoom(<any>this.map.getView().getZoom() + 1);
    this.ShareDataservice.changeZoomLevel(
      <any>parseFloat(<any>this.map.getView().getZoom()).toFixed(0)
    );
  }

  // Zooimg Out map
  zoomOut(): void {
    this.map.getView().setZoom(<any>this.map.getView().getZoom() - 1);
    this.ShareDataservice.changeZoomLevel(
      <any>parseFloat(<any>this.map.getView().getZoom()).toFixed(0)
    );
  }

  // Toggling Graticule
  showGraticule(): void {
    if (this.graticule === false) {
      this.graticule = true;
      this.map.addLayer(
        new Graticule({
          strokeStyle: new Stroke({
            color: "rgba(255,120,0,0.9)",
            width: 2,
            lineDash: [0.5, 4],
          }),
          showLabels: true,
          wrapX: true,
          className: "Graticule",
        })
      );
    } else {
      this.graticule = false;
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "Graticule")
        .forEach((layer) => this.map.removeLayer(layer));
    }
  }

  // change speed event
  receiveSpeed($event: any): void {
    this.speed = $event;
  }

  // change to full screen evnt
  receiveFullscreen($event: any): void {
    this.fullscreen();
  }

  // View fullscreen
  fullscreen(): void {
    const mapElement = document.getElementById("map")!;
    mapElement.requestFullscreen();
  }

  // receive features
  receiveFeatures($event: any): void {
    this.rolefeatures = $event;
    this.rolefeatures.forEach((feature: any) => {
      if (feature.featurename === "Ships of Interest") {
        this.roleSoiStatus = "true";
        this.cookieService.set("roleSoiStatus", "true");
      }
    });
  }

  // calling get all ships in loop
  callShipInLoop(): void {
    const refreshtime = Number(this.refreshrate) * 1000;
    this.clockRunnerFun = setInterval(() => {
      this.adjustDateTimeFlag = this.cookieService.get("adjustedClock");
      if (this.adjustDateTimeFlag === "false") {
        this.calculateddatetime = this.plotTime;
        this.getAllShipsLkp();
      } else {
        this.calculateddatetime = this.msgservice.getCalculatedTime(
          this.plotTime,
          this.speed,
          refreshtime
        );
        this.getAllShipsLkp();
      }
    }, refreshtime);
  }

  // Fetching ship data and plotting on the map
  getAllShipsLkp() {
    const reqdata = { timestamp: this.calculateddatetime, mmsi_list: [] };
    this.isloading = true;
    this.service.getShipsLkp(reqdata).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.plotTime = result.timestamp;
          this.isloading = false;
          this.plotdate = formatDate(this.plotTime, "dd/MM/yyyy", "en-US");
          this.plottime = formatDate(this.plotTime, "HH:mm:ss", "en-US");
          if (document.getElementById("plotdate") !== null) {
            document.getElementById("plotdate")!.innerHTML = this.plotdate;
          }
          if (document.getElementById("plottime") !== null) {
            document.getElementById("plottime")!.innerHTML = this.plottime;
          }
          this.plotShips(result.data);
          this.ShareDataservice.changeVesselCount(result.count);
          this.ShareDataservice.changeTimeInSideNav(result.timestamp);
          this.cookieService.set("plotTime", this.plotTime);
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // change clock status event
  receiveClockStatus($event: any): void {
    this.clockStatus = $event;
    this.cookieService.set("clockStatus", $event);
  }

  // Receiving plot time from  main-navbar component
  recievePlotTime($event: any): void {
    const refreshTime = Number(this.refreshrate) * 1000;
    this.plotTime = $event;
    this.adjustDateTimeFlag = this.cookieService.get("adjustDateTimeFlag");
    this.calculateddatetime =
      this.adjustDateTimeFlag === "true"
        ? this.plotTime
        : this.msgservice.getCalculatedTime(
            this.plotTime,
            this.speed,
            refreshTime
          );
    this.ngOnDestroy();
    this.cookieService.set("plotTime", this.plotTime);
    this.adjustDateTimeFlag = this.cookieService.get("adjustDateTimeFlag");

    if (this.clockStatus && this.adjustDateTimeFlag === "true") {
      this.getAllShipsLkp();
    } else if (
      this.adjustDateTimeFlag === "false" ||
      (this.adjustDateTimeFlag === "true" && this.clockStatus === false)
    ) {
      this.callShipInLoop();
    }
  }

  // Plotting ships on the map
  plotShips(data: any): void {
    const shipMapshipFeatures: any[] = [];
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getClassName() === "ShipLayer" ||
          layer.getClassName() === "Searched Ship"
      )
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
    data.forEach((ship: any) => {
      shipMapshipFeatures.push(
        new Feature({
          geometry: new Point([ship.long, ship.lat]),
          shipData: ship,
          category: ship.category,
          cid: ship.category_id,
          cog: ship.cog,
          mmsi: ship.mmsi,
          shipColor: ship.color,
        })
      );
    });
    this.ShipSource.clear();
    this.ShipSource.addFeatures(shipMapshipFeatures);
    this.map.addLayer(
      new WebGLPoints({
        source: <any>this.ShipSource,
        style: this.shipstyle,
        className: "ShipLayer",
      })
    );
  }

  // Handling ship hover events and showing the ship details
  onShipsHover() {
    const shiphoverDivElement = document.getElementById("shipshover")!;
    const shiphoveroverlay = new Overlay({
      element: shiphoverDivElement,
      positioning: "center-center",
    });
    this.map.on("pointermove", (e) => {
      const shipsDataonhover = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature): any => {
          return feature;
        },
        {
          layerFilter: (layer): any => {
            return (
              layer.getClassName() === "ShipLayer" ||
              layer.getClassName() === "SOILayer" ||
              layer.getClassName() === "ROILayer" ||
              layer.getClassName() === "VFLayer"
            );
          },
        }
      );
      if (shipsDataonhover && shipsDataonhover.get("shipData") !== undefined) {
        const ships = shipsDataonhover.get("shipData");
        const time = formatDate(ships.ist_time, "dd-MM-yyyy,hh:mm a", "en-US");
        shiphoverDivElement.setAttribute("style", "display:block");
        shiphoverDivElement.innerHTML = `
        <p style="margin-bottom:0px"><b>${ships.ship_name} (${ships.mmsi})</b></p>
        <p style="margin-bottom:0px"><b>Coords: </b>${ships.long}, ${ships.lat}</b></p>
        <p style="margin-bottom:0px">${ships.category}</p>
        <p style="margin-bottom:0px">${time}</p>
      `;

        shiphoveroverlay.setOffset([0, 20]);
        shiphoveroverlay.setPositioning("bottom-right");
        shiphoveroverlay.setPosition(
          shipsDataonhover.getGeometry().getCoordinates()
        );
        const offset = this.calculateOverlayOffset(this.map, shiphoveroverlay);
        if (offset[1] > 0) {
          shiphoveroverlay.setPositioning("bottom-center");
        }
        shiphoveroverlay.setOffset(offset);
        this.map.addOverlay(shiphoveroverlay);
        const iconFeature: any[] = [];
        iconFeature.push(
          new Feature({
            geometry: new Point([ships.long, ships.lat]),
          })
        );

        this.map
          .getLayers()
          .getArray()
          .filter((layer) => layer.getClassName() === "ShipHoverLayer")
          .forEach((layer: any) => {
            layer.getSource().clear();
            this.map.removeLayer(layer);
          });

        this.map.addLayer(
          new VectorLayer({
            source: new VectorSource({
              features: iconFeature,
            }),
            className: "ShipHoverLayer",
          })
        );
      } else {
        if (shiphoverDivElement) {
          this.map
            .getLayers()
            .getArray()
            .filter((layer) => layer.getClassName() === "ShipHoverLayer")
            .forEach((layer: any) => {
              layer.getSource().clear();
              this.map.removeLayer(layer);
            });
          shiphoverDivElement.setAttribute("style", "display:none");
        }
      }
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

  // receive search result
  receiveShipSearchResult($event: any): void {
    const searchShipData = $event;
    if (searchShipData.length === 0) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "Searched Ship")
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    } else {
      const iconFeature: any[] = [];
      searchShipData.forEach((mmsi: any, i: any) => {
        iconFeature.push(
          new Feature({
            geometry: new Point([mmsi.long, mmsi.lat]),
          })
        );
        iconFeature[i].setStyle(
          new Style({
            image: new Icon({
              src: "assets/map/search_ship.svg",
              scale: 3,
              color: "red",
            }),
          })
        );
      });
      this.map.addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: iconFeature,
          }),
          className: "Searched Ship",
          zIndex: 50,
        })
      );

      if (searchShipData.length === 1) {
        this.map
          .getView()
          .setCenter([searchShipData[0].long, searchShipData[0].lat]);
      }
    }
  }

  // fetch past track data
  pastTrack() {
    document.getElementById("pastTrack")!.setAttribute("class", "active-btn");
    const reqData = {
      mmsi: this.selectedmmsi,
      timestamp: this.plotTime,
    };
    this.isloading = true;
    this.service.getPastTrackData(reqData).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.pastTrackData = data.data;
          this.isloading = false;
          this.plotPastTrack();
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Plot past track
  plotPastTrack(): void {
    const coordinates: any[] = [];
    const pastTrackTrajectoryFeature: any[] = [];
    const trajectoryPointfortrack: any[] = [];
    this.pastTrackData.forEach((d: any) => {
      coordinates.push([d.long, d.lat]);
      trajectoryPointfortrack.push(
        new Feature({
          geometry: new Point([d.long, d.lat]),
          PastTrackData: {
            mmsi: d.mmsi,
            id: d.traj_id,
          },
          cog: d.cog,
        })
      );
    });
    pastTrackTrajectoryFeature.push(
      new Feature({
        geometry: new MultiLineString([coordinates]),
      })
    );
    pastTrackTrajectoryFeature[0].setStyle(
      new Style({
        stroke: new Stroke({
          color: "brown",
          width: 1,
        }),
      })
    );

    pastTrackTrajectoryFeature.push(
      new Feature({
        geometry: new Point(coordinates[0]),
      })
    );

    pastTrackTrajectoryFeature[1].setStyle(
      new Style({
        image: new Icon({
          src: "assets/soi/circle.svg",
          scale: 1,
        }),
      })
    );

    this.map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: pastTrackTrajectoryFeature,
        }),
        className: "Past Track",
      })
    );

    const trajStyle = {
      symbol: {
        symbolType: "image",
        src: "assets/map/arrow.svg",
        size: 15,
        rotateWithView: true,
        offset: [0, 0],
        opacity: 0.8,
        rotation: ["*", ["get", "cog"], Math.PI / 180],
      },
    };

    this.map.addLayer(
      new WebGLPoints({
        source: <any>new VectorSource({
          features: trajectoryPointfortrack,
        }),
        className: "Past Track Points",
        style: trajStyle,
      })
    );

    this.onTrajectoryHover();
  }

  // Hover on trajectory
  onTrajectoryHover() {
    const trajHoverDivElement = document.getElementById("trajhover")!;
    const trajoverlay = new Overlay({
      element: trajHoverDivElement,
      positioning: "center-center",
    });

    this.map.on("pointermove", (e) => {
      const trajHoverData = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature) => feature
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
        overlayContent = `
          <p style="margin-bottom: 0px;"><b>MMSI: </b>${traj.mmsi}</p>
          <p style="margin-bottom: 0px;"><b>Trajectory ID: </b>${traj.id}</p>
        `;
      } else if (trajHoverData.get("shiptypeanmolyData") !== undefined) {
        const anomaly = trajHoverData.get("shiptypeanmolyData");
        const time = formatDate(anomaly.ntime, "dd-MM-yyyy,hh:mm a", "en-US");
        overlayContent = `
          <span>Changed from ${anomaly.ptype} to ${anomaly.ntype}</span><br/>
          <span>${time}</span>
        `;
      } else if (trajHoverData.get("PastTrackData") !== undefined) {
        const pastrackData = trajHoverData.get("PastTrackData");
        overlayContent = `
          <span><b>MMSI: </b>${pastrackData.mmsi}</span> <br>
          <span><b>Trajectory ID: </b>${pastrackData.id}</span>
        `;
      } else if (trajHoverData.get("DestinationPredictedData") !== undefined) {
        const port = trajHoverData.get("DestinationPredictedData");
        overlayContent = `
          <span><b>Port name: </b>${port.port_name}</span>;`;
      } else if (trajHoverData.get("RoutePredictedData") !== undefined) {
        const predicted = trajHoverData.get("RoutePredictedData");
        const time = formatDate(predicted.tm, "dd-MM-yyyy,hh:mm a", "en-US");
        overlayContent = `
        <span><b>MMSI: </b>${predicted.mmsi}</span><br>
        <span><b>Time: </b>${time}</span><br>
        <span><b>Coords: </b>${predicted.long},${predicted.lat}</span><br>
        <span><b>Distance Travelled: </b>${predicted.distance} nautical miles</span>
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
      trajoverlay.setOffset(this.calculateOverlayOffset(this.map, trajoverlay));
      if (trajHoverDivElement) {
        trajHoverDivElement.innerHTML = overlayContent;
      }
      this.map.addOverlay(trajoverlay);
    });
  }

  // adding ship to soi form popup
  addShipToSoI() {
    this.isloading = true;
    this.service
      .addShipToSoI({
        mmsi: this.selectedmmsi,
      })
      .subscribe({
        next: (data) => {
          if (data.status === "success") {
            this.toastr.success(data.data, "", {
              timeOut: 3000,
            });
            this.isloading = false;
            this.soiflag = true;
            this.isIntrested = false;
            this.ShareDataservice.SOIupdate("update soi info");
          }
        },
        error: (error: any) => {
          this.msgservice.postErrorFunc(error);
          this.isloading = false;
        },
      });
  }

  addInterestedShip() {
    this.isIntrested = !this.isIntrested;
    this.togroup = false;
  }

  // changing the color og the crosshair based on ship added to the soi or goi or both
  getHeartImage(): string {
    if (this.soiflag && this.goiflag) {
      return "../../../assets/popup/heart-green.svg";
    } else if (this.soiflag) {
      return "../../../assets/popup/heart-red.svg";
    } else if (this.goiflag) {
      return "../../../assets/popup/heart-blue.svg";
    } else if (this.soiStatus === "true") {
      return "../../../assets/popup/heart.svg";
    }
    return "";
  }

  // Define a function to switch the map's base layer
  changeMapType(newMapType: any) {
    // Remove the existing base layer
    const oldLayer = this.map.getLayers().item(0);
    this.map.removeLayer(oldLayer);

    // Create a new base layer based on the selected map type
    let newLayer: any;
    if (newMapType === "Satellite Map") {
      newLayer = new TileLayer({
        source: new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        }),
        className: newMapType,
      });
    } else if (newMapType === "Standard Map") {
      newLayer = new TileLayer({
        source: new OSM(),
        className: newMapType,
      });
    }
    // Add the new base layer to the map
    this.map.getLayers().insertAt(0, newLayer);

    // Update the class name of the maptype
    this.maptype = newMapType;
  }

  // geting ports data for plotting ports in the map
  getPortsData(e: any): void {
    if (e.target.checked) {
      this.showports = true;
      this.isloading = true;
      this.service.getPortsData().subscribe({
        next: (result: any) => {
          if (result.status === "success") {
            this.ports = result.data;
            this.isloading = false;
            this.plotPorts();
          }
        },
        error: (error: any) => {
          this.msgservice.getErrorFunc(error);
          this.isloading = false;
        },
      });
    } else {
      this.ports = [];
      this.PortsSource.clear();
      this.plotPorts();
      this.showports = false;
    }
  }

  // plot ports
  plotPorts(): void {
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === "Ports Layers")
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
    const portsfeature: any[] = [];
    this.ports.forEach((port) => {
      portsfeature.push(
        new Feature({
          geometry: new Point([port.long, port.lat]),
          portsData: port,
        })
      );
    });

    this.PortsSource.addFeatures(portsfeature);
    const portStyle = {
      symbol: {
        symbolType: "image",
        src: "assets/map/Ports.svg",
        color: "YELLOW",
        size: 15,
        rotateWithView: true,
        offset: [0, 0],
        opacity: 0.8,
      },
    };
    this.map.addLayer(
      new WebGLPoints({
        source: <any>this.PortsSource,
        className: "Ports Layers",
        style: portStyle,
      })
    );
    const portshoverDiv = document.getElementById("portshover")!;
    const portsoverlay = new Overlay({
      element: portshoverDiv,
      positioning: "center-center",
    });

    this.map.on("pointermove", (e) => {
      const portsDataonhover = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature: any) => feature
      );

      if (portsDataonhover && portsDataonhover.get("portsData") !== undefined) {
        const ports = portsDataonhover.get("portsData");
        portshoverDiv.setAttribute("style", "display:block");
        portshoverDiv.innerHTML = `
      <p style="margin-bottom:0px;"> <b>Port ID: </b>${ports.port_id}</p>
      <p style="margin-bottom:0px;"> <b>Port name: </b>${ports.port_name}</p>
      <p style="margin-bottom:0px;"> <b>Country: </b>${ports.country_name}</p>
      <p style="margin-bottom:0px;"> <b>Latitude: </b>${ports.lat}</p>
      <p style="margin-bottom:0px;"> <b>Longitude: </b>${ports.long}</p>
    `;

        portsoverlay.setOffset([0, 0]);
        portsoverlay.setPositioning("bottom-right");
        portsoverlay.setPosition(
          portsDataonhover.getGeometry().getCoordinates()
        );
        const offset = this.calculateOverlayOffset(this.map, portsoverlay);
        portsoverlay.setPositioning(
          offset[1] > 0 ? "bottom-center" : "bottom-right"
        );
        portsoverlay.setOffset(offset);
        this.map.addOverlay(portsoverlay);
      } else {
        if (portshoverDiv) {
          portshoverDiv.setAttribute("style", "display:none");
        }
      }
    });
  }

  // geting anchors data for plotting anchors in the map
  getAnchorsData(e: any) {
    if (e.target.checked) {
      this.showanchors = true;
      this.isloading = true;
      this.service.getAnchorsData().subscribe({
        next: (result: any) => {
          if (result.status === "success") {
            this.anchors = result.data;
            this.isloading = false;
            this.plotAnchors();
          }
        },
        error: (error: any) => {
          this.msgservice.getErrorFunc(error);
          this.isloading = false;
        },
      });
    } else {
      this.anchors = [];
      this.AnchorsSource.clear();
      this.plotAnchors();
      this.showanchors = false;
    }
  }

  // plot Anchors
  plotAnchors(): void {
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === "Anchors Layers")
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
    const anchorsfeature: any[] = [];
    this.anchors.forEach((anchor) => {
      anchorsfeature.push(
        new Feature({
          geometry: new Point([anchor.long, anchor.lat]),
          anchorsData: anchor,
        })
      );
    });

    this.AnchorsSource.addFeatures(anchorsfeature);
    const anchorStyle = {
      symbol: {
        symbolType: "image",
        src: "assets/map/anchor_red.svg",
        size: 15,
        rotateWithView: true,
        offset: [0, 0],
        opacity: 0.8,
      },
    };
    this.map.addLayer(
      new WebGLPoints({
        source: <any>this.AnchorsSource,
        className: "Anchors Layers",
        style: anchorStyle,
      })
    );
    const anchorshoverDivElement = document.getElementById("anchorshover")!;
    const anchorsoverlay = new Overlay({
      element: anchorshoverDivElement,
      positioning: "center-center",
    });

    this.map.on("pointermove", (e) => {
      const anchorsDataonhover = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature: any) => feature
      );

      if (
        anchorsDataonhover &&
        anchorsDataonhover.get("anchorsData") !== undefined
      ) {
        const anchors = anchorsDataonhover.get("anchorsData");
        anchorshoverDivElement.setAttribute("style", "display:block");
        anchorshoverDivElement.innerHTML = `
      <p style="margin-bottom:0px;"> <b>Label: </b>${anchors.label}</p>
      <p style="margin-bottom:0px;"> <b>Sub Label: </b>${anchors.sublabel}</p>
      <p style="margin-bottom:0px;"> <b>Country: </b>${anchors.country_name}</p>
      <p style="margin-bottom:0px;"> <b>Latitude: </b>${anchors.lat}</p>
      <p style="margin-bottom:0px;"> <b>Longitude: </b>${anchors.long}</p>
    `;

        anchorsoverlay.setOffset([0, 0]);
        anchorsoverlay.setPositioning("bottom-right");
        anchorsoverlay.setPosition(
          anchorsDataonhover.getGeometry().getCoordinates()
        );
        const offset = this.calculateOverlayOffset(this.map, anchorsoverlay);
        anchorsoverlay.setPositioning(
          offset[1] > 0 ? "bottom-center" : "bottom-right"
        );
        anchorsoverlay.setOffset(offset);
        this.map.addOverlay(anchorsoverlay);
      } else {
        if (anchorshoverDivElement) {
          anchorshoverDivElement.setAttribute("style", "display:none");
        }
      }
    });
  }

  getFeatureForUserRole(): void {
    this.isloading = true;
    this.service.getFeatureForRole().subscribe(
      (result: any) => {
        if (result.status === "success") {
          this.rolefeatures = result.data;
          this.isloading = false;
          this.rolefeatures.forEach((feature: any) => {
            if (feature.featurename === "Ships of Interest") {
              this.soiStatus = "true";
            }
          });
        }
      },
      (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      }
    );
  }

  //soi Functions

  // delete soi action events from soi component
  receiveDeleteSoI(data: any): void {
    this.openDeleteSoiModel(data);
  }

  // open delete soi model in ship map
  openDeleteSoiModel(s: any): void {
    document.getElementById("opensoideleteModel")!.click();
    this.deletingSoiShipName = s.name;
    this.deletingsoiship = s.mmsi;
  }

  // deleting soi ship
  deleteSoI(): void {
    this.isloading = true;
    this.service.deleteSoI({ mmsi: this.deletingsoiship }).subscribe({
      next: (data) => {
        if (data?.status === "success") {
          this.toastr.success(data.data, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          this.ShareDataservice.SOIupdate("update soi info");
          this.ShareDataservice.SOIupdate("update soi track details");
          document.getElementById("closedeletesoimodel")?.click();
        }
      },

      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // selected soi event from soi component
  receiveSoiSeletected(message: any): void {
    if (message === "Stop Ship Map") {
      this.soifeatureisselected = "true";
      if (this.clockRunnerFun) {
        clearInterval(this.clockRunnerFun);
      }
      // remove ship layer.
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "ShipLayer")
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
      // plot soi ships
    }
    if (message === "Restart Ship Map") {
      this.startShipMap();
      this.soifeatureisselected = "false";
    }
    if (message !== "Stop Ship Map" && message !== "Restart Ship Map") {
      this.plotSoIShips(message);
      this.soifeatureisselected = "true";
    }
  }

  // Plot SoI ships
  plotSoIShips(data: any): void {
    this.ShipSource.clear();
    const soiShipFeatures: any[] = [];
    // Remove the WebGL Ship Layer before adding a New WebGL layer
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getClassName() === "SOILayer" ||
          layer.getClassName() === "Searched Ship"
      )
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });

    data.forEach((ship: any) => {
      soiShipFeatures.push(
        new Feature({
          geometry: new Point([ship.long, ship.lat]),
          shipData: ship,
          category: ship.category,
          cid: ship.category_id,
          cog: ship.cog,
          mmsi: ship.mmsi,
          shipColor: ship.color,
        })
      );
    });
    this.ShipSource.addFeatures(soiShipFeatures);

    this.map.addLayer(
      new WebGLPoints({
        source: <any>this.ShipSource,
        style: this.shipstyle,
        className: "SOILayer",
      })
    );
  }

  // end ship of interest

  // goi functions

  // close add goi model
  closeGoiModel(): void {
    this.isIntrested = false;
    this.goiFormSubmitted = false;
    this.goiForm.setValue({
      mmsi: "",
      group_name: "",
      flag: "",
    });
  }

  addMMSIToExistingGOI(g: any) {
    const reqdata = {
      mmsi: this.selectedmmsi,
      group_name: g.group_name,
      flag: false,
    };
    this.isloading = true;
    this.service.addToGoI(reqdata).subscribe(
      (data: any) => {
        if (data.status === "success") {
          this.toastr.success(data.message, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          this.ShareDataservice.GOIupdate("update goi info");
          this.loadGoiShipsForPopup();
          this.goiflag = true;
          this.isIntrested = false;
        }
      },
      (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      }
    );
  }
  // Open model to add new group
  openModeltoAddNewGroup(): void {
    this.togroup = false;
    document.getElementById("add-to-newgroup")!.click();
  }

  // showing groups list when we try to add a ship to a group from popup
  loadGoiShipsForPopup() {
    this.togroup = !this.togroup;
    this.isloading = true;
    this.service.getGoIDetailsForUser().subscribe(
      (result: any) => {
        this.isloading = false;
        this.goiforpopup = result.data;
        this.goiforpopuplength = this.goiforpopup.length;

        this.goiforpopup = this.goiforpopup.map((g: any) => {
          const updatedGroup = {
            ...g,
            img: "add",
          };

          const hasMmsi = g.group_info.some(
            (ginfo: any) => ginfo.mmsi === this.selectedmmsi
          );
          if (hasMmsi) {
            updatedGroup.img = "tick";
          }

          return updatedGroup;
        });
      },
      (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      }
    );
  }

  //add a ship to the group
  addShipToGoI() {
    this.goiFormSubmitted = true;
    if (this.goiForm.invalid) {
      return;
    }
    if (this.goiForm.value.group_name.trim() === "") {
      this.goiForm.controls.group_name.setErrors({ empty: true });
      return;
    }
    this.goiForm.setValue({
      mmsi: this.selectedmmsi,
      group_name: this.goiForm.value.group_name,
      flag: true,
    });
    this.isloading = true;
    this.service.addToGoI(this.goiForm.value).subscribe(
      (data: any) => {
        if (data.status === "success") {
          this.toastr.success(data.message, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          this.ShareDataservice.GOIupdate("update goi info");
          this.goiflag = true;
          document.getElementById("closegoiModel")!.click();
          this.goiFormSubmitted = false;
          this.goiForm.setValue({
            mmsi: "",
            group_name: "",
            flag: "",
          });
          this.isIntrested = false;
        }
      },
      (error: any) => {
        if (error.status === "failure") {
          this.goiForm.controls.group_name.setErrors({ duplicate: true });
          this.isloading = false;
        } else {
          this.msgservice.postErrorFunc(error);
          this.isloading = false;
        }
      }
    );
  }

  // add a ship to the group without mmsi
  addGoIWithoutMMSI() {
    this.goiFormSubmitted = true;
    if (this.goiForm.invalid) {
      return;
    }
    if (this.goiForm.value.group_name.trim() === "") {
      this.goiForm.controls.group_name.setErrors({ empty: true });
      return;
    }
    const reqData = {
      group_name: this.goiForm.value.group_name,
      mmsi: [],
      flag: true,
    };
    this.isloading = true;
    this.service.addToGoI(reqData).subscribe(
      (data: any) => {
        if (data.status === "success") {
          this.toastr.success(
            "Successfully added new group " + this.goiForm.value.group_name,
            "",
            {
              timeOut: 3000,
            }
          );
          this.isloading = false;
          this.ShareDataservice.GOIupdate("update goi info");
          document.getElementById("closeNewGoiModel")!.click();
          this.goiFormSubmitted = false;
          this.goiForm.setValue({
            mmsi: "",
            group_name: "",
            flag: "",
          });
        }
      },

      (error: any) => {
        if (error.status === "failure") {
          this.goiForm.controls.group_name.setErrors({ duplicate: true });
          this.isloading = false;
        } else {
          this.msgservice.postErrorFunc(error);
          this.isloading = false;
        }
      }
    );
  }

  // receive edit goi event
  receiveEditGoi(group_name: any): void {
    this.openEditGoI(group_name);
  }

  // edit goi model
  openEditGoI(group: any): void {
    document.getElementById("openEditGoiModel")!.click();
    this.editinggroupname = group;
  }

  // edit groupname
  editGroupName(): void {
    this.editgoisubmitted = true;
    if (this.editgoiForm.invalid) {
      return;
    }
    if (this.editgoiForm.value.new_goi.trim() === "") {
      this.editgoiForm.controls.new_goi.setErrors({ empty: true });
      return;
    }
    this.editgoiForm.setValue({
      old_goi: this.editinggroupname,
      new_goi: <any>this.editgoiForm.value.new_goi,
    });
    if (this.editinggroupname === this.editgoiForm.value.new_goi) {
      this.editgoiForm.controls.new_goi.setErrors({ samename: true });
      return;
    }
    this.isloading = true;
    this.service.editGoI(this.editgoiForm.value).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.toastr.success(data.message, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          this.editgoisubmitted = false;
          document.getElementById("closeeditgoiModel")!.click();
          this.editgoiForm.setValue({
            old_goi: "",
            new_goi: "",
          });
          this.ShareDataservice.GOIupdate("update goi info");
        }
      },
      error: (error) => {
        if (error.status === "failure") {
          this.editgoiForm.controls.new_goi.setErrors({ duplicate: true });
          this.isloading = false;
        } else {
          this.msgservice.postErrorFunc(error);
          this.isloading = false;
        }
      },
    });
  }

  // receive delete goi event
  receiveDeleteGOI(group: any): void {
    this.openDeleteGoIModel(group);
  }

  // delete goi model
  openDeleteGoIModel(group: any): void {
    document.getElementById("openDeleteGoiModel")!.click();
    this.deletinggoiship = group.group_name;
  }

  //deleting a group from the group list from ship of interest component
  deleteGoI(): void {
    const goidata = {
      group_name: this.deletinggoiship,
      mmsi: "",
    };
    this.isloading = true;
    this.service.deleteGoI(goidata).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.toastr.success(result.data, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          document.getElementById("closeDeletGoiModel")!.click();
          this.ShareDataservice.GOIupdate("update goi track details");
          this.ShareDataservice.GOIupdate("update goi info");
        }
      },

      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // close edit goi
  closeEditGoIModel(): void {
    this.editgoisubmitted = false;
    this.editgoiForm.setValue({
      old_goi: "",
      new_goi: "",
    });
  }

  // receive delete mmsi in goi event
  receiveDeleteGoIMMSI(data: any): void {
    this.openDeleteMMSIOfGoIModel(data.gid, data.mmsi);
  }

  // Delete mmsi in goi model
  openDeleteMMSIOfGoIModel(group: any, mmsi: any): void {
    document.getElementById("openDeleteMmsiOfGoiModel")!.click();
    this.deletingmmsiofgoiship = group;
    this.deletingmmsiofgoi = mmsi;
  }

  // Delete Mmsi from a group
  deleteMMSIOfGoI(): void {
    const goidata = {
      group_name: this.deletingmmsiofgoiship,
      mmsi: this.deletingmmsiofgoi,
    };
    this.isloading = true;
    this.service.deleteGoI(goidata).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.toastr.success(result.data, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          document.getElementById("closedeletemmsiofgoimodel")!.click();
          this.ShareDataservice.GOIupdate("update goi track details for mmsi");
          this.ShareDataservice.GOIupdate("update goi info");
        }
      },

      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // remove soi track traj event
  receiveRemoveTrackTraj(layername: any): void {
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === layername)
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
  }

  // soi track traj event
  receiveTrackTraj(msg: any): void {
    if (msg.length >= 1) {
      const track = msg;
      track.forEach((t: any) => {
        const trajData = { mmsi: t.mmsi, id: t.traj_id };
        let layerName;
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

        if (track.gid !== "") {
          layerName = track.gid + "_" + t.mmsi + "_" + t.traj_id;
        } else {
          layerName = t.mmsi + "_" + t.traj_id;
        }
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
        this.map.addLayer(
          new VectorLayer({
            source: new VectorSource({
              features: trajectoryfeature,
            }),
            className: layerName,
          })
        );

        this.map.addLayer(
          new WebGLPoints({
            source: <any>new VectorSource({
              features: trajectoryPointforonetrack,
            }),
            className: layerName,
            style: this.trajStyle,
          })
        );
      });
    }
    this.onTrajectoryHover();
  }

  // soi ship type anomaly traj event
  receiveShipTypeAnomalyTraj(track: any): void {
    track.forEach((t: any) => {
      const trajData = { mmsi: t.mmsi, id: t.traj_id };
      let layerName;
      if (track.gid === "" && track.rid === undefined) {
        layerName = t.mmsi + "_" + t.traj_id + "_" + "shiptypeanomaly";
      } else if (track.gid !== "" && track.rid === undefined) {
        layerName =
          track.gid +
          "_" +
          t.mmsi +
          "_" +
          t.traj_id +
          "_" +
          "goishiptypeanomaly";
      } else if (track.rid !== undefined && track.gid === undefined) {
        layerName =
          track.rid +
          "_" +
          t.mmsi +
          "_" +
          t.traj_id +
          "_" +
          "roishiptypeanomaly";
      }
      const trajectoryfeature: any[] = [];
      const coordinates: any[] = [];
      const trackPoints = t.points;
      const trajectoryPointforonetrack: any[] = [];
      trackPoints.forEach((tp: any, i: any) => {
        coordinates.push([tp.long, tp.lat]);
        trajectoryPointforonetrack.push(
          new Feature({
            geometry: new Point([tp.long, tp.lat]),
            trajectoryData: trajData,
            cog: tp.cog,
          })
        );
      });

      trajectoryfeature.push(
        new Feature({
          geometry: new MultiLineString([coordinates]),
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
          geometry: new Point(coordinates[0]),
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
          geometry: new Point(coordinates[t.points.length - 1]),
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

      this.map.addLayer(
        new WebGLPoints({
          source: <any>new VectorSource({
            features: trajectoryPointforonetrack,
          }),
          className: layerName,
          style: this.trajStyle,
        })
      );
      this.map.addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: trajectoryfeature,
          }),
          className: layerName,
        })
      );
      this.onTrajectoryHover();
    });
  }

  // soi ship type anomaly points on traj event
  receiveShipTypeAnomaly(shiptypeanamolypoints: any): void {
    let layerName;

    if (shiptypeanamolypoints.rid !== undefined) {
      layerName = `${shiptypeanamolypoints.rid}_${shiptypeanamolypoints.mmsi}_${shiptypeanamolypoints.tj}_roishiptypeanomaly`;
    } else if (shiptypeanamolypoints.gid !== undefined) {
      layerName = `${shiptypeanamolypoints.gid}_${shiptypeanamolypoints.mmsi}_${shiptypeanamolypoints.tj}_goishiptypeanomaly`;
    } else {
      layerName = `${shiptypeanamolypoints.mmsi}_${shiptypeanamolypoints.tj}_shiptypeanomaly`;
    }

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

    this.map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: shipTypeAnomalyPointForTraj,
        }),
        className: layerName + "anomaly",
      })
    );
  }

  // remove anomaly traj
  receiveRemoveAnomalyTraj(layername: any): void {
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getClassName() === layername + "anomaly" ||
          layer.getClassName() === layername
      )
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
  }

  // Region of interest --------------------------------------------------------------

  // add/remove interaction event
  receiveMarkArea(msg: any): void {
    if (msg === "yes") {
      this.addInteraction();
    } else if (msg === "no") {
      this.removeinteraction();
    }
  }

  // Add interaction to mark area on map
  addInteraction(): void {
    this.removeinteraction();
    clearInterval(this.clockRunnerFun);

    const value: any = "Box";

    if (value !== "None") {
      let geometryFunction = createBox();
      if (value === "Square") {
        geometryFunction = createRegularPolygon(4);
      }

      this.draw = new Draw({
        type: "Circle",
        geometryFunction: geometryFunction,
      });

      this.map.addInteraction(this.draw);

      this.draw.on("drawend", (evt: any): void => {
        const feature = evt.feature;
        const ROIcoords = feature.getGeometry().getCoordinates()[0];

        const coordinateIds = [
          "topLeft",
          "topRight",
          "bottomRight",
          "bottomLeft",
        ];
        for (let i = 0; i < coordinateIds.length; i++) {
          const coordId = coordinateIds[i];
          const coordLabel = "Coord";

          document.getElementById(coordId)!.innerHTML =
            ROIcoords[i][0] + "<br/>" + ROIcoords[i][1];

          document.getElementById(coordId + coordLabel)!.innerHTML =
            ROIcoords[i][0] + " " + ROIcoords[i][1];
        }

        document.getElementById("openAddROIModel")!.click();
      });
    }
  }

  // remove interaction
  removeinteraction(): void {
    if (document.getElementById("markarea-color") !== null) {
      document
        .getElementById("markarea-color")!
        .setAttribute("class", "btn markarea");
    }
    if (document.getElementById("markpolygon-color") !== null) {
      document
        .getElementById("markpolygon-color")!
        .setAttribute("class", "btn markarea");
    }
    this.map.removeInteraction(this.draw);
    this.regionsubmitted = false;
    this.regionFrom.setValue({
      roi: "",
      roi_coords: "",
    });
  }

  AddRegionOfInterest(): void {
    this.regionsubmitted = true;
    if (this.regionFrom.invalid) {
      return;
    }
    if (this.regionFrom.value.roi.trim() === "") {
      this.regionFrom.controls.roi.setErrors({ empty: true });
      return;
    }
    this.map.removeInteraction(this.draw);
    const topLeft = document.getElementById("topLeftCoord")!.innerText;
    const topRight = document.getElementById("topRightCoord")!.innerText;
    const bottomRight = document.getElementById("bottomRightCoord")!.innerText;
    const bottomLeft = document.getElementById("bottomLeftCoord")!.innerText;
    const coordsValue = `(${topLeft},${topRight},${bottomRight},${bottomLeft},${topLeft})`;
    this.regionFrom.setValue({
      roi: <any>this.regionFrom.value.roi,
      roi_coords: coordsValue,
    });
    this.isloading = true;
    this.service.addRoI(this.regionFrom.value).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.isloading = false;
          this.toastr.success(
            this.regionFrom.value.roi + " is added to region of interest",
            "",
            {
              timeOut: 3000,
            }
          );
          document.getElementById("closeroimodel")!.click();
          this.ShareDataservice.ROIupdate("update roi details");
          this.map.removeInteraction(this.draw);
          this.regionsubmitted = false;
          this.regionFrom.setValue({
            roi: "",
            roi_coords: "",
          });
          document
            .getElementById("markarea-color")!
            .setAttribute("class", "btn markarea");
        }
      },
      error: (error) => {
        this.isloading = false;
        if (error.status === "failure") {
          this.regionFrom.controls.roi.setErrors({ duplicate: true });
          this.msgservice.postErrorFunc(error);
        } else {
          this.msgservice.postErrorFunc(error);
        }
      },
    });
  }

  // add/remove interaction event
  receiveMarkPloygon(msg: any): void {
    if (msg === "yes") {
      this.addPolygonInteraction();
    } else if (msg === "no") {
      this.removeinteraction();
    }
  }

  // Add polygon interaction
  addPolygonInteraction(): void {
    this.removeinteraction();
    clearInterval(this.clockRunnerFun);
    const polygonsource = new VectorSource({ wrapX: true });
    const vector = new VectorLayer({
      source: polygonsource,
    });
    this.draw = new Draw({
      source: polygonsource,
      type: "Polygon",
      // freehand: true,
    });
    this.map.addInteraction(this.draw);

    this.draw.on("drawend", (evt: any): void => {
      this.polygoncoords = evt.feature.getGeometry().getCoordinates();
      document.getElementById("openAddROIPolygonModel")!.click();
    });
  }

  AddPolygonRegionOfInterest(): void {
    this.regionsubmitted = true;
    if (this.regionFrom.invalid) {
      return;
    }
    if (this.regionFrom.value.roi.trim() === "") {
      this.regionFrom.controls.roi.setErrors({ empty: true });
      return;
    }
    const newarray: any[] = [];
    this.polygoncoords[0].forEach((c: any) => {
      newarray.push(c[0] + " " + c[1]);
    });
    let coordsValue = newarray.toString();
    coordsValue = "(" + coordsValue + ")";
    this.regionFrom.setValue({
      roi: <any>this.regionFrom.value.roi,
      roi_coords: coordsValue,
    });
    this.isloading = true;
    this.service.addRoI(this.regionFrom.value).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.isloading = false;
          this.toastr.success(
            this.regionFrom.value.roi + " is added to region of interest",
            "",
            {
              timeOut: 3000,
            }
          );
          document.getElementById("closepolygonroimodel")!.click();
          this.ShareDataservice.ROIupdate("update roi details");
          this.map.removeInteraction(this.draw);
          this.regionsubmitted = false;
          this.regionFrom.setValue({
            roi: "",
            roi_coords: "",
          });
          document
            .getElementById("markarea-color")!
            .setAttribute("class", "btn markarea");
        }
      },
      error: (error) => {
        this.isloading = false;
        if (error.status === "failure") {
          this.regionFrom.controls.roi.setErrors({ duplicate: true });
          this.msgservice.postErrorFunc(error);
        } else {
          this.msgservice.postErrorFunc(error);
        }
      },
    });
  }

  // receive edit roi
  receiveEditrroI(roi: any): void {
    this.openEditRoI(roi);
  }

  // receive delete roi
  receiveDeleteRoI(roi: any): void {
    this.openDeleteRoIModel(roi);
  }

  // open delete roi model
  openDeleteRoIModel(val: any): void {
    document.getElementById("openroideleteModel")!.click();
    this.deletingroi = val;
    this.deletingregionname = val.region_name;
  }

  deleteRoI(): void {
    const val = this.deletingroi;
    const deleteData = { roi: val.region_id };
    this.isloading = true;
    this.service.deleteRoI(deleteData).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.isloading = false;
          this.toastr.success(
            "Deleted " + this.deletingregionname + " from region of interest ",
            "",
            {
              timeOut: 3000,
            }
          );
          this.map
            .getLayers()
            .getArray()
            .filter((layer) => layer.getClassName() === val.region_id)
            .forEach((layer: any) => {
              layer.getSource().clear();
              this.map.removeLayer(layer);
            });
          this.ShareDataservice.ROIupdate("update roi details");
          document.getElementById("closedeleteroimodel")!.click();
        }
      },

      error: (error) => {
        this.isloading = false;
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // edit roi model
  openEditRoI(r: any): void {
    document.getElementById("openEditROIModel")!.click();
    this.editingregion = r;
  }

  editRoI(): void {
    this.editregionsubmitted = true;
    if (this.editregionForm.invalid) {
      return;
    }
    if (this.editregionForm.value.new_roi.trim() === "") {
      this.editregionForm.controls.new_roi.setErrors({ empty: true });
      return;
    }
    this.editregionForm.setValue({
      old_roi: this.editingregion.region_name,
      new_roi: <any>this.editregionForm.value.new_roi,
    });
    if (this.editingregion.region_id === this.editregionForm.value.new_roi) {
      this.editregionForm.controls.new_roi.setErrors({ samename: true });
      return;
    }
    this.isloading = true;
    this.service.editRoI(this.editregionForm.value).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.toastr.success(data.message, "", {
            timeOut: 3000,
          });
          this.isloading = false;
          document.getElementById("closeeditroiModel")!.click();
          this.editregionsubmitted = false;
          this.ShareDataservice.ROIupdate("update roi details");
          this.editregionForm.setValue({
            old_roi: "",
            new_roi: "",
          });
        }
      },

      error: (error) => {
        if (error.status === "failure") {
          this.editregionForm.controls.new_roi.setErrors({ duplicate: true });
          this.msgservice.postErrorFunc(error);
        } else {
          this.msgservice.postErrorFunc(error);
        }
        this.isloading = false;
      },
    });
  }

  // close edit roi
  closeEditRoIModel(): void {
    this.editregionsubmitted = false;
    this.editregionForm.setValue({
      old_roi: "",
      new_roi: "",
    });
  }

  // receive roi selected
  receiveRoiSeletected(message: any): void {
    if (message === "Stop Ship Map") {
      // stop Ship map
      if (this.clockRunnerFun) {
        clearInterval(this.clockRunnerFun);
      }
      // remove ship layer.
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "ShipLayer")
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    }
    if (message === "Restart Ship Map") {
      this.startShipMap();
      this.ShareDataservice.changeNavbarInROI(false);
    }
    if (
      message !== "Stop Ship Map" &&
      message !== "Restart Ship Map" &&
      message !== "Show time alert"
    ) {
      this.ShareDataservice.changeVesselCount(message.length);
      this.map
        .getLayers()
        .getArray()
        .filter(
          (layer) =>
            layer.getClassName() === "ROILayer" ||
            layer.getClassName() === "Searched Ship"
        )
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
      const totalROIShips: any = [];
      message.forEach((region: any) => {
        totalROIShips.push(...region.details);
        this.plotRoIShips(region.details);
      });
      this.ShareDataservice.changeVesselCount(totalROIShips.length);
    }
  }

  // draw region on select event
  receiveDrawRegion(data: any): void {
    const roifeatures: any[] = [];
    roifeatures.push(
      new Feature({
        geometry: new Polygon(data.points),
        regionData: data.region_name,
      })
    );
    // style Only polygon in roi
    roifeatures[0].setStyle(
      new Style({
        stroke: new Stroke({
          color: "red",
          width: 3,
        }),
      })
    );

    this.map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: roifeatures,
        }),
        className: data.region_id,
      })
    );
    this.map.getView().setCenter(data.points[0][0]);
    const regionhovercontainer = document.getElementById("regionhover")!;
    const regionoverlay = new Overlay({
      element: regionhovercontainer,
      positioning: "center-center",
    });
    this.map.on("pointermove", (e) => {
      const regionDataonhover = e.map.forEachFeatureAtPixel(
        e.pixel,
        (feature): any => {
          return feature;
        }
      );
      if (
        regionDataonhover &&
        regionDataonhover.get("regionData") !== undefined
      ) {
        const region = regionDataonhover.get("regionData");
        if (regionhovercontainer) {
          regionhovercontainer.setAttribute("style", "display:block");
        }

        regionhovercontainer.innerHTML =
          "<p style=margin-bottom:0px;> <b>Region Name: </b>" + region + "</p>";
        regionoverlay.setOffset([0, 0]);
        regionoverlay.setPositioning("bottom-right");
        regionoverlay.setPosition(e.coordinate);
        const delta = this.calculateOverlayOffset(this.map, regionoverlay);
        if (delta[1] > 0) {
          regionoverlay.setPositioning("bottom-center");
        }
        regionoverlay.setOffset(delta);
        this.map.addOverlay(regionoverlay);
      } else {
        if (regionhovercontainer) {
          regionhovercontainer.setAttribute("style", "display:none");
        }
      }
    });
  }

  // remove drwan region in uncheck
  receiveRemoveRegion(layername: any): void {
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === layername)
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
  }

  // Plot RoI ships
  plotRoIShips(data: any): void {
    const roiShipFeatures: any[] = [];

    data.forEach((ship: any) => {
      roiShipFeatures.push(
        new Feature({
          geometry: new Point([ship.long, ship.lat]),
          shipData: ship,
          category: ship.category,
          cid: ship.category_id,
          cog: ship.cog,
          mmsi: ship.mmsi,
          shipColor: ship.color,
        })
      );
    });
    this.ShipSource.addFeatures(roiShipFeatures);
    this.map.addLayer(
      new WebGLPoints({
        source: <any>this.ShipSource,
        style: this.shipstyle,
        className: "ROILayer",
      })
    );
  }

  // Vessel Filter
  receiveVFSeletected(message: any): void {
    if (message === "Restart Ship Map") {
      this.startShipMap();
    }

    if (message === "Stop Ship Map") {
      // stop live map
      if (this.clockRunnerFun) {
        clearInterval(this.clockRunnerFun);
      }
      // remove ship layer.
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "ShipLayer")
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    }

    if (message !== "Stop Ship Map" && message !== "Restart Ship Map") {
      this.plotVFShips(message);
    }
  }

  // Plot Vessel Filter ships
  plotVFShips(data: any): void {
    this.ShipSource.clear();
    const shipFeatures: any[] = [];
    // Remove the WebGL Ship Layer before adding a New WebGL layer
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === "VFLayer")
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });

    // clear predicted line.
    this.clearPastTrackLayers();

    data.forEach((ship: any) => {
      shipFeatures.push(
        new Feature({
          geometry: new Point([ship.long, ship.lat]),
          shipData: ship,
          category: ship.cat,
          cid: ship.catid,
          cog: ship.cog,
          mmsi: ship.mmsi,
          coo: ship.coo,
          shipColor: ship.color,
        })
      );
    });
    this.ShipSource.addFeatures(shipFeatures);

    this.map.addLayer(
      new WebGLPoints({
        source: <any>this.ShipSource,
        style: this.shipstyle,
        className: "VFLayer",
      })
    );
  }

  // mark area in vessel filter
  receiveVFSeletectedMark(message: any): void {
    if (message === "remove") {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "display extent area")
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    } else if (message === "remove add") {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "add extent area")
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    } else {
      this.drawExtentArea("display", message);
    }
  }

  // Add extent in VF
  receiveAddExtent(msg: any): void {
    if (msg === "yes") {
      this.addextent();
    } else if (msg === "no") {
      this.removeextent();
    }
  }

  // add extent
  addextent(): void {
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === "add extent area")
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
    clearInterval(this.clockRunnerFun);
    let value = "Box";
    if (value !== "None") {
      let geometryfunctions = "";
      if (value === "Square") {
        value = "Circle";
        geometryfunctions = <any>createRegularPolygon(4);
      } else if (value === "Box") {
        value = "Circle";
        geometryfunctions = <any>createBox();
      }

      this.draw = new Draw({
        type: <any>value,
        geometryFunction: <any>geometryfunctions,
      });
      this.map.addInteraction(this.draw);

      this.draw.on("drawend", (evt: any): void => {
        const feature = evt.feature;
        const extentcoords = feature.getGeometry().getCoordinates();
        this.ShareDataservice.addExtentInVF(extentcoords);
        this.removeextent();
        this.drawExtentArea("add", extentcoords);
      });
    }
  }

  // Draw area
  drawExtentArea(type: any, data: any): void {
    const extentfeatures: any[] = [];
    extentfeatures.push(
      new Feature({
        geometry: new Polygon(data),
      })
    );

    extentfeatures[0].setStyle(
      new Style({
        stroke: new Stroke({
          color: "red",
          width: 3,
        }),
      })
    );

    this.map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: extentfeatures,
        }),
        className: type + " extent area",
      })
    );
  }

  // remove extent
  removeextent(): void {
    this.map.removeInteraction(this.draw);
  }

  // Delete Preset
  receiveDeletePreset(msg: any): void {
    document.getElementById("openDeletePresetModel")!.click();
    this.deletingPresetId = msg.pid;
    this.deletingPresetName = msg.pname;
  }

  // Delete Preset
  deletePreset(): void {
    this.isloading = true;
    this.service.deletePreset(this.deletingPresetId).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.isloading = false;
          this.toastr.success("Deleted preset " + this.deletingPresetName, "", {
            timeOut: 3000,
          });
          document.getElementById("closedeletepresetmodel")!.click();
          this.ShareDataservice.VesselFilterListUpdate(
            "update vessel filter list"
          );
          this.ShareDataservice.VesselFilterListUpdate(
            "update vessel filter Delete"
          );
        }
      },
      error: (error: any) => {
        this.isloading = false;
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  predictDestination(): void {
    this.predictdestination = true;
    const reqData = {
      mmsi: this.selectedmmsi,
      timestamp: this.plotTime,
    };
    this.isloading = true;
    this.service.getPredictDestination(reqData).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.isloading = false;
          this.predictedDestination = result.data[1];
          this.predictedDestination.forEach((destination: any) => {
            destination.src =
              "../../assets/map/dest_predicted_" + destination.color + ".svg";
            this.plotPredictedDestination(
              destination.port_name,
              destination.lat,
              destination.long,
              destination.color
            );
          });
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Plot predicted destination
  plotPredictedDestination(dest: any, lt: any, lg: any, color: any): void {
    const pointFeature: any[] = [];
    const pointSource = new VectorSource();
    const d = { port_name: dest };
    pointFeature.push(
      new Feature({
        geometry: new Point([lg, lt]),
        DestinationPredictedData: d,
      })
    );
    pointSource.addFeatures(pointFeature);
    const pointStyle = {
      symbol: {
        symbolType: "image",
        src: "../../assets/map/dest_predicted_" + color + ".svg",
        size: 50,
        rotateWithView: true,
        offset: [0, 0],
        opacity: 0.8,
      },
    };
    this.map.addLayer(
      new WebGLPoints({
        source: <any>pointSource,
        className: "Predict Destination Layers",
        style: pointStyle,
      })
    );
    this.onTrajectoryHover();
    while (
      containsXY(
        this.map.getView().calculateExtent(this.map.getSize()),
        lg,
        lt
      ) === false
    ) {
      this.map.getView().setZoom(<any>this.map.getView().getZoom() - 1);
      this.ShareDataservice.changeZoomLevel(
        <any>parseFloat(<any>this.map.getView().getZoom()).toFixed(0)
      );
      continue;
    }
  }

  // route prediction
  predictRoute(): void {
    this.predictionTimesubmitted = true;
    if (this.routePredictionTimeFrom.invalid) {
      return;
    }
    document.getElementById("pastRoute")!.setAttribute("class", "active-btn");
    const reqData = {
      mmsi: this.selectedmmsi,
      time: Number(this.routePredictionTimeFrom.value.predictionTime),
      timestamp: this.shipPopupDetails.tm,
      cog: this.shipPopupDetails.cog,
    };
    this.isloading = true;
    this.service.getPredictRoute(reqData).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.isloading = false;
          this.routePredictionTimeFrom.setValue({ predictionTime: "1" });
          this.predictionTimesubmitted = false;
          this.plotPredictRoute(data.data);
          document.getElementById("closerptmodel")!.click();
        }
      },
      error: (error) => {
        this.isloading = false;
        this.routePredictionTimeFrom.setValue({ predictionTime: "1" });
        this.predictionTimesubmitted = false;
        document.getElementById("closerptmodel")!.click();
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  plotPredictRoute(data: any): void {
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getClassName() === "Predict Route" ||
          layer.getClassName() === "Predict Route points" ||
          layer.getClassName() === "Past Track" ||
          layer.getClassName() === "Past Track points" ||
          layer.getClassName() === "Predict Destination Layers"
      )
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
    const polygoncoordinates: any = [];
    const trajectoryfeature: any = [];
    const trajectoryPointforonetrack: any = [];
    data.forEach((d: any) => {
      const trajData = {
        mmsi: d.mmsi,
        tm: d.ist_time,
        lat: d.latitude,
        long: d.longitude,
        distance: d.distance,
      };
      polygoncoordinates.push([d.longitude, d.latitude]);
      trajectoryPointforonetrack.push(
        new Feature({
          geometry: new Point([d.longitude, d.latitude]),
          RoutePredictedData: trajData,
          // cog: d.cog
        })
      );
    });
    trajectoryfeature.push(
      new Feature({
        geometry: new MultiLineString([polygoncoordinates]),
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

    this.map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: trajectoryfeature,
        }),
        className: "Predict Route",
      })
    );

    this.map.addLayer(
      new WebGLPoints({
        source: <any>new VectorSource({
          features: trajectoryPointforonetrack,
        }),
        className: "Predict Route points",
        style: {
          symbol: {
            symbolType: "image",
            src: "assets/map/bullets.svg",
            rotateWithView: true,
            size: [
              "match",
              ["get", "indexVal"],
              "index:0",
              20,
              "index:last",
              20,
              5,
            ],
            color: [
              "match",
              ["get", "indexVal"],
              "index:0",
              "#FF0000",
              "index:last",
              "#008000",
              "#0000FF",
            ],
            // offset: [0, 0],
            // textureCoord: [
            //   'match', ['get', 'indexVal'],
            //   'index:0', [0, 0, 0.5, 0.5],
            //   'index:last', [0.5, 0, 1, 1],
            //   [0, 0.5, 0.5, 1]
            // ],
            // rotation: ['*', ['get', 'cog'], Math.PI / 180],
            opacity: 0.8,
          },
        },
      })
    );

    this.onTrajectoryHover();
  }

  // clear clearRoutePredictionTimeFrom

  clearRoutePredictionTimeFrom() {
    this.routePredictionTimeFrom.setValue({ predictionTime: "1" });
  }

  // ReStart ship map
  startShipMap(): void {
    if (this.clockRunnerFun) {
      clearInterval(this.clockRunnerFun);
    }
    this.adjustDateTimeFlag = this.cookieService.get("adjustDateTimeFlag");
    if (this.clockStatus && this.adjustDateTimeFlag === "true") {
      this.getAllShipsLkp();
    } else if (
      this.adjustDateTimeFlag === "false" ||
      (this.adjustDateTimeFlag === "true" && this.clockStatus === false)
    ) {
      this.callShipInLoop();
    }
  }

  ngOnDestroy(): void {
    if (this.clockRunnerFun) {
      clearInterval(this.clockRunnerFun);
    }
  }
}
