import { Component, OnInit } from "@angular/core";
import { Graticule, WebGLPoints } from "ol/layer";

import Map from "ol/Map";
import MousePosition from "ol/control/MousePosition";
import { OSM, XYZ } from "ol/source";
import Overlay from "ol/Overlay";
import Stroke from "ol/style/Stroke";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import { createStringXY } from "ol/coordinate";
import { defaults as defaultControls } from "ol/control";
import { MessageService } from "../shared/message.service";
import { ServiceService } from "../shared/service.service";
import { CookieService } from "ngx-cookie-service";
import { ShareDataService } from "../shared/share-data.service";
import { ToastrService } from "ngx-toastr";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { formatDate } from "@angular/common";
import VectorLayer from "ol/layer/Vector";
import Fill from "ol/style/Fill";
import { Style, Icon, Text } from "ol/style";
import { MultiLineString } from "ol/geom";
import { ChangeDetectorRef } from "@angular/core";
import { ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-play-history",
  templateUrl: "./play-history.component.html",
  styleUrls: ["./play-history.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayHistoryComponent implements OnInit {
  map!: Map;
  graticule = false;
  mapoptions = [{ maptype: "Standard Map" }, { maptype: "Satellite Map" }];
  maptype: any = "Standard Map";
  showports = false;
  showanchors = false;
  ports: any[] = [];
  anchors: any[] = [];
  PortsSource = new VectorSource();
  AnchorsSource = new VectorSource();
  playhistoryExpanded = false;
  selectVesselExpanded = false;
  criteriaoptions: any[] = [
    { name: "Ship Name", value: "name" },
    { name: "MMSI", value: "MMSI" },
    { name: "IMO", value: "IMO" },
  ];
  value = "value";
  searchedData: any[] = [];
  selectedResult: any[] = [];
  historyList: any[] = [];
  selectedShipsInHistoryList: any[] = [];
  historylistlength: any;

  startTimePlaceHolder = "set time";
  today = new Date();
  timeframe: any;
  showShipName = false;
  showShiptraj = true;
  SOImmsi: any;
  timeframeExpanded = false;
  minDate!: number;
  maxDate!: number;
  sliderSelectedTime = "";
  sliderSelectedTimeUnix!: number;
  historyResult: any[] = [];
  allHistoryResult: any[] = [];
  playStatus = "pause";
  TimerFunction: any;
  timeProgress!: number;
  repeat = false;
  allTraj_list: any[] = [];

  // spinnner
  isloading: boolean = false;

  constructor(
    private msgservice: MessageService,
    private service: ServiceService,
    private cookieService: CookieService,
    private ShareDataservice: ShareDataService,
    private toastr: ToastrService,
    private cdRef: ChangeDetectorRef
  ) {}

  searchForm: FormGroup = new FormGroup({
    search_txt: new FormControl(""),
    criteria: new FormControl(this.criteriaoptions[0][this.value]),
  });

  timeFrameForm: FormGroup = new FormGroup({
    from_date: new FormControl(""),
    duration: new FormControl("", [Validators.required]),
  });

  setSpeedForm: FormGroup = new FormGroup({
    speed: new FormControl("1"),
  });

  ngOnInit(): void {
    this.displayMapInPlayHistMap();
    this.SOImmsi = this.cookieService.get("playhistorymmsi");
    this.startTimePlaceHolder = "set time";
    let soimmsiList: any[] = [];
    if (this.SOImmsi !== "") {
      const startTime = this.parseDate(
        this.cookieService.get("playhistorystartTime").toString()
      );

      this.startTimePlaceHolder = this.cookieService.get(
        "playhistorystartTime"
      );
      const endTime = this.parseDate(
        this.cookieService.get("playhistoryendTime").toString()
      );
      if (startTime && endTime) {
        const hours = (endTime.getTime() - startTime.getTime()) / 3600000;
        soimmsiList = this.SOImmsi.split(",");
        this.selectedShipsInHistoryList = soimmsiList;
        this.timeFrameForm.setValue({
          from_date: startTime,
          duration: hours,
        });
        // this.cookieService.set("playhistorymmsi", "");
        document.getElementById("ph-pannel")!.click();
      }
    }
  }

  parseDate(inputDate: any) {
    // Split the input date string
    const dateParts = inputDate.match(/(\d+)-(\d+)-(\d+), (\d+):(\d+) (AM|PM)/);

    if (dateParts) {
      const day = parseInt(dateParts[1]);
      const month = parseInt(dateParts[2]);
      const year = parseInt(dateParts[3]);
      let hours = parseInt(dateParts[4]);
      const minutes = parseInt(dateParts[5]);
      const period = dateParts[6];

      // Convert to 24-hour format
      if (period === "PM" && hours < 12) {
        hours += 12;
      }

      // Create a Date object
      const dateObject = new Date(year, month - 1, day, hours, minutes);

      return dateObject;
    } else {
      // Handle invalid date format
      return null;
    }
  }

  // displaying map in ship map
  displayMapInPlayHistMap() {
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
      target: "play-hist-map",
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
    this.changeZoomLevelOfMap();
  }

  // changing zoom level of map when Zoomin and zoom out button is clicked
  changeZoomLevelOfMap() {
    this.ShareDataservice.changeZoomLevel(
      <any>parseFloat(<any>this.map.getView().getZoom()).toFixed(0)
    );
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
      this.cdRef.detectChanges();
      this.service.getPortsData().subscribe({
        next: (result: any) => {
          if (result.status === "success") {
            this.ports = result.data;
            this.isloading = false;
            this.cdRef.detectChanges();
            this.plotPorts();
          }
        },
        error: (error: any) => {
          this.msgservice.getErrorFunc(error);
          this.isloading = false;
          this.cdRef.detectChanges();
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
      this.cdRef.detectChanges();
      this.service.getAnchorsData().subscribe({
        next: (result: any) => {
          if (result.status === "success") {
            this.anchors = result.data;
            this.isloading = false;
            this.cdRef.detectChanges();
            this.plotAnchors();
          }
        },
        error: (error: any) => {
          this.msgservice.getErrorFunc(error);
          this.isloading = false;
          this.cdRef.detectChanges();
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

  onSearchkeyup(): void {
    this.searchForm.setValue({
      search_txt: <any>this.searchForm.value.search_txt,
      criteria: this.searchForm.value.criteria,
    });
    this.isloading = true;
    this.cdRef.detectChanges();
    this.service.getSearchResultInPlayHistory(this.searchForm.value).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.searchedData = result.data;
          this.isloading = false;
          this.cdRef.detectChanges();
          document
            .getElementById("popup-search-playhistory")!
            .setAttribute("style", "display:block");
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
        this.cdRef.detectChanges();
      },
    });
  }

  // Closing search popup
  closeSearchPopup(): void {
    document
      .getElementById("popup-search-playhistory")!
      .setAttribute("style", "display:none");
  }

  selectedOption(searchedval: any, mmsi: any, name: any): void {
    this.selectedResult.push({ val: searchedval, MMSI: mmsi, shipname: name });
    document
      .getElementById("popup-search-playhistory")!
      .setAttribute("style", "display:none");
    this.searchForm.setValue({
      search_txt: "",
      criteria: this.searchForm.value.criteria,
    });
    this.searchedData = [];
  }

  // Clear searched and selected ship
  clearOption(val: any): void {
    this.selectedResult.forEach((value: any, i) => {
      if (value.val === val) {
        this.selectedResult.splice(i, 1);
      }
    });
  }

  addToList(): void {
    const selectedmmsi: any[] = [];
    this.selectedResult.forEach((data: any) => {
      selectedmmsi.push(data.MMSI);
    });
    if (selectedmmsi.length < 1) {
      this.toastr.info("Select atleast one ship to add.", "", {
        timeOut: 3000,
      });
      return;
    }
    const reqData = { mmsi: selectedmmsi };
    this.isloading = true;
    this.cdRef.detectChanges();
    this.service.addToList(reqData).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.toastr.success("Successfully added to list", "", {
            timeOut: 3000,
          });
          this.selectedResult = [];
          this.isloading = false;
          this.cdRef.detectChanges();
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
        this.cdRef.detectChanges();
      },
    });
  }

  getHistoryList(): void {
    this.isloading = true;
    this.cdRef.detectChanges();
    this.service.getHistoryList().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.historyList = result.data;
          this.isloading = false;
          this.cdRef.detectChanges();
          this.historyList.forEach((l: any) => {
            const index = this.selectedShipsInHistoryList.indexOf(l.msi);
            if (index > -1) {
              l.className =
                "selectShipInHistoryList btn historyList_button_active";
            } else {
              l.className = "selectShipInHistoryList btn historyList_button";
            }
          });
          this.historylistlength = result.data.length;
        }
      },
      error: (error: any) => {
        this.isloading = false;
        this.cdRef.detectChanges();
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Select ship in history list to show play history
  selectShipInHistoryList(mmsi: any): void {
    if (
      document.getElementById(mmsi)!.getAttribute("class") ===
      "btn historyList_button_active selectShipInHistoryList"
    ) {
      const index = this.selectedShipsInHistoryList.indexOf(mmsi);
      if (index > -1) {
        this.selectedShipsInHistoryList.splice(index, 1);
      }
      document
        .getElementById(mmsi)!
        .setAttribute(
          "class",
          "selectShipInHistoryList btn historyList_button"
        );
    } else {
      this.selectedShipsInHistoryList.push(mmsi);
      document
        .getElementById(mmsi)!
        .setAttribute(
          "class",
          "btn historyList_button_active selectShipInHistoryList"
        );
    }
  }

  deleteFromHistoryList(deletingMMSI: any): void {
    this.isloading = true;
    this.cdRef.detectChanges();
    this.service.deleteFromHistoryList({ mmsi: deletingMMSI }).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.toastr.success("Successfully deleted", "", {
            timeOut: 3000,
          });
          const index = this.selectedShipsInHistoryList.indexOf(deletingMMSI);
          if (index > -1) {
            this.selectedShipsInHistoryList.splice(index, 1);
          }
          this.historyList.forEach((ship: any, i) => {
            if (ship.msi === deletingMMSI) {
              this.historyList.splice(i, 1);
            }
          });
          this.isloading = false;
          this.cdRef.detectChanges();
        }
      },
      error: (error) => {
        this.isloading = false;
        this.cdRef.detectChanges();
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // Toggle in repeat video
  toggleRepeat(): void {
    if (
      document.getElementById("toggleRepeat")!.getAttribute("src") ===
      "assets/soi/switch-offf.svg"
    ) {
      document
        .getElementById("toggleRepeat")!
        .setAttribute("src", "assets/soi/switch-on.svg");
      this.repeat = true;
    } else {
      document
        .getElementById("toggleRepeat")!
        .setAttribute("src", "assets/soi/switch-offf.svg");
      this.repeat = false;
    }
  }

  changePlayHistryExpandToFalse(): void {
    this.playhistoryExpanded = false;
  }

  getPlayHistoryData(): void {
    this.playStatus = "pause";
    this.timeProgress = 0;
    clearInterval(this.TimerFunction);
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getClassName() === "Trajectory" ||
          layer.getClassName() === "Trajectory Start Layer" ||
          layer.getClassName() === "Trajectory End Layer"
      )
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
    this.historyResult.forEach((ship: any) => {
      const mmsi = ship.mmsi;
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getClassName() === "Animating Layer" + mmsi)
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    });
    if (this.playhistoryExpanded === false) {
      this.playhistoryExpanded = true;
      let fromDate = "";
      if (this.selectedShipsInHistoryList.length === 0) {
        this.toastr.error("Please select one ship from history list ", "", {
          timeOut: 3000,
        });
        this.playhistoryExpanded = false;
        this.timeframeExpanded = true;
        return;
      }
      if (this.timeFrameForm.value.from_date === "") {
        this.toastr.error("Please select start date to show the history ", "", {
          timeOut: 3000,
        });
        this.playhistoryExpanded = false;
        this.timeframeExpanded = true;
        return;
      }
      if (this.timeFrameForm.value.from_date !== "") {
        fromDate = formatDate(
          <any>this.timeFrameForm.value.from_date,
          "yyyy-MM-dd HH:mm:ss",
          "en-US"
        );
      }
      const reqData = {
        mmsi: this.selectedShipsInHistoryList,
        from_date: fromDate,
        to_date: this.timeFrameForm.value.duration,
      };
      this.historyResult = [];
      this.isloading = true;
      this.cdRef.detectChanges();
      this.service.getPlayHistory(reqData).subscribe({
        next: (result) => {
          if (result.status === "success") {
            this.isloading = false;
            this.cdRef.detectChanges();
            this.minDate =
              new Date(
                formatDate(result.frm, "yyyy-MM-dd HH:mm:ss", "en-US")
              ).getTime() / 1000;
            this.maxDate =
              new Date(
                formatDate(result.to, "yyyy-MM-dd HH:mm:ss", "en-US")
              ).getTime() / 1000;
            this.sliderSelectedTime = formatDate(
              result.frm,
              "dd-MM-yyyy HH:mm:ss",
              "en-US"
            );
            this.sliderSelectedTimeUnix =
              new Date(
                formatDate(result.frm, "yyyy-MM-dd HH:mm:ss", "en-US")
              ).getTime() / 1000;
            this.timeframe =
              formatDate(result.frm, "dd-MM-yyyy HH:mm:ss", "en-US") +
              " to " +
              formatDate(result.to, "dd-MM-yyyy HH:mm:ss", "en-US");
            this.allHistoryResult = result.traj;
            if (this.showShiptraj === true) {
              this.plotTrajectory(this.allHistoryResult);
            }
            result.traj.forEach((ship: any) => {
              const allTrackPointsForSingleShip: any[] = [];
              ship.traj_details.forEach((tj: any) => {
                allTrackPointsForSingleShip.push(tj);
              });
              const traj = {
                mmsi: ship.mmsi,
                name: ship.name,
                traj: allTrackPointsForSingleShip,
              };
              this.historyResult.push(traj);
            });
          }
        },
        error: (error) => {
          this.isloading = false;
          this.cdRef.detectChanges();
          this.msgservice.postErrorFunc(error);
        },
      });
    } else {
      this.playhistoryExpanded = false;
    }
  }

  // Draw trajectory.
  plotTrajectory(allMmsiTrack: any): void {
    const trajectoryfeature: any[] = [];
    allMmsiTrack.forEach((mmsi: any, i: number) => {
      const polygoncoordinates: any[] = [];
      const startfeature: any[] = [];
      const endfeatues: any[] = [];
      mmsi.traj_details.forEach((t: any, j: number) => {
        if (mmsi.traj_details.length !== 0) {
          polygoncoordinates.push([t.lg, t.lt]);
        } else {
          this.toastr.warning(
            mmsi.name + " has no trajectory details in the selected range",
            "",
            {
              timeOut: 3000,
            }
          );
        }
      });
      startfeature.push(
        new Feature({
          geometry: new Point([
            mmsi.traj_details[0].lg,
            mmsi.traj_details[0].lt,
          ]),
        })
      );
      endfeatues.push(
        new Feature({
          geometry: new Point([
            mmsi.traj_details[mmsi.traj_details.length - 1].lg,
            mmsi.traj_details[mmsi.traj_details.length - 1].lt,
          ]),
        })
      );
      startfeature[0].setStyle(
        new Style({
          image: new Icon({
            src: "../../assets/soi/circle.svg",
            scale: 1,
          }),
        })
      );
      endfeatues[0].setStyle(
        new Style({
          image: new Icon({
            src: "../../assets/soi/ship-green.svg",
            scale: 1,
            rotation:
              (Math.PI / 180) *
              mmsi.traj_details[mmsi.traj_details.length - 1].cg,
          }),
        })
      );
      this.map.addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: startfeature,
          }),
          className: "Trajectory Start Layer",
        })
      );
      this.map.addLayer(
        new VectorLayer({
          source: new VectorSource({
            features: endfeatues,
          }),
          className: "Trajectory End Layer",
        })
      );
      trajectoryfeature.push(
        new Feature({
          geometry: new MultiLineString([polygoncoordinates]),
        })
      );
      trajectoryfeature[i].setStyle(
        new Style({
          stroke: new Stroke({
            color: "brown",
            width: 1,
          }),
        })
      );
    });

    this.map.addLayer(
      new VectorLayer({
        source: new VectorSource({
          features: trajectoryfeature,
        }),
        className: "Trajectory",
      })
    );
  }

  showShipNameCheckboxChange(e: any): void {
    this.showShipName = e.target.checked;
    e.stopPropagation();
  }

  showTrajectoryCheckboxChange(e: any): void {
    this.showShiptraj = e.target.checked;
    e.stopPropagation();
    if (this.showShiptraj === true) {
      this.plotTrajectory(this.allHistoryResult);
    } else {
      this.map
        .getLayers()
        .getArray()
        .filter(
          (layer) =>
            layer.getClassName() === "Trajectory" ||
            layer.getClassName() === "Trajectory Start Layer" ||
            layer.getClassName() === "Trajectory End Layer"
        )
        .forEach((layer: any) => {
          layer.getSource().clear();
          this.map.removeLayer(layer);
        });
    }
  }

  setSpeed(): void {
    this.playhistoryExpanded = true;
  }

  sliderMove(data: any): void {
    const convertedTime = new Date(data * 1000).toUTCString();
    this.sliderSelectedTime = formatDate(
      convertedTime,
      "dd-MM-yyyy HH:mm:ss",
      "en-US"
    );
    this.sliderSelectedTimeUnix = data;
  }

  sliderChanged(data: any): void {
    const convertedTime = new Date(data * 1000).toUTCString();
    this.sliderSelectedTime = formatDate(
      convertedTime,
      "dd-MM-yyyy HH:mm:ss",
      "en-US"
    );
    this.sliderSelectedTimeUnix = data;
    this.timeProgress = data - this.minDate;
    // Manually trigger change detection
    this.cdRef.detectChanges();
  }

  play(): void {
    if (this.playStatus === "pause") {
      this.playStatus = "playing";
      const diff = this.maxDate - this.minDate;
      this.TimerFunction = setInterval(() => {
        const time = this.minDate + this.timeProgress;
        this.sliderChanged(time);
        if (this.timeProgress >= diff && this.repeat === true) {
          this.timeProgress = 0;
        } else if (this.timeProgress >= diff && this.repeat === false) {
          clearInterval(this.TimerFunction);
          this.timeProgress = 0;
          this.playStatus = "pause";
        }
        this.timeProgress =
          this.timeProgress + 1 * this.setSpeedForm.value.speed;
        const convertedTime = new Date(time * 1000).toUTCString();
        this.plotMarker(
          formatDate(convertedTime, "dd-MM-yyyy HH:mm:ss", "en-US")
        );
      }, 1000);
    } else if (this.playStatus === "playing") {
      this.playStatus = "pause";
      clearInterval(this.TimerFunction);
    }
  }

  plotMarker(time: string): void {
    // Iterate through the ships and their trajectory data
    this.historyResult.forEach((ship: any) => {
      const mmsi = ship.mmsi;
      const source = new VectorSource(); // Create a new source for each ship
      const animatingFeature = [];

      // Find the point with a timestamp greater than or equal to the specified time
      const point: any = ship.traj.find((point: any) => {
        const convertedTime = this.convertToCommonFormat(point.tm);
        return convertedTime >= time;
      });

      if (point) {
        // Clear the previous layer associated with this ship
        this.clearAnimatingLayers(mmsi);
        // Create a new feature for the current point
        animatingFeature.push(
          new Feature({
            geometry: new Point([point.lg, point.lt]),
          })
        );

        const style: { image: Icon; text?: Text } = {
          image: new Icon({
            src: "../../assets/playhistory/animating-ship.svg",
            scale: 1,
            rotation: (Math.PI / 180) * point.cg,
          }),
        };

        if (this.showShipName === true) {
          style.text = new Text({
            text: ship.name,
            fill: new Fill({ color: "RED" }),
            stroke: new Stroke({
              color: "#FFF",
              width: 3,
            }),
          });
        }

        animatingFeature[0].setStyle(new Style(style));
        source.addFeature(animatingFeature[0]);

        // Add the new layer with the current feature to the map
        this.map.addLayer(
          new VectorLayer({
            source: source,
            className: "Animating Layer" + mmsi,
          })
        );
      }
    });
  }

  clearAnimatingLayers(mmsi: any): void {
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => layer.getClassName() === "Animating Layer" + mmsi)
      .forEach((layer: any) => {
        layer.getSource().clear();
        this.map.removeLayer(layer);
      });
  }

  convertToCommonFormat(dateTimeString: any) {
    const parts = dateTimeString.split(" ");
    const dateParts = parts[0].split("-");
    const timePart = parts[1];
    // Rearrange the parts in the 'yyyy-MM-dd HH:mm:ss' format
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
  }
}
