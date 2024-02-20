import { Component, EventEmitter, OnInit, Output } from "@angular/core";

import { CookieService } from "ngx-cookie-service";
import { MessageService } from "../shared/message.service";
import { Router } from "@angular/router";
import { ServiceService } from "../shared/service.service";
import { ShareDataService } from "../shared/share-data.service";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { formatDate } from "@angular/common";

@Component({
  selector: "app-ship-of-interest",
  templateUrl: "./ship-of-interest.component.html",
  styleUrls: ["./ship-of-interest.component.scss"],
})
export class ShipOfInterestComponent implements OnInit {
  isSoiFeature = "false";
  isSoiFeatureSidenav = false;
  getSOI: any;

  // soi
  selectedsoiships: any[] = [];
  soiselectedmmsi: any[] = [];
  soiData: any[] = [];
  soisubscription!: Subscription;
  trackdetails: any[] = [];
  trackdetailslength = 0;
  UpdatesoiSubscription!: Subscription;
  deletingsoiship: any;

  //soi anomalyInformation
  soishiptypeanomaly: any[] = [];

  // soi  track traj indformation
  showtracjectorymmsi: any[] = [];
  showtracjectorytrajid: any[] = [];
  // soi ship anomaly traj
  shiptypeananomalytrajmmsi: any[] = [];
  shiptypeanomalytrajid: any[] = [];

  //goi
  goiData: any[] = [];
  goitrackdetailslength = 0;
  selectedgoi: any[] = [];
  selectedgoiships: any[] = [];
  UpdategoiSubscription!: Subscription;
  deletinggoiship: any;
  deletingmmsiofgoiship: any;
  deletingmmsiofgoi: any;
  goiselected: any[] = [];
  goiselectedmmsi: any[] = [];
  goiselectedmmsiwithgrp: any[] = [];

  // Goi track info
  goitrackdetails: any[] = [];
  showgrptrajectorygid: any[] = [];
  showgrptracjectorymmsi: any[] = [];
  showgrptracjectorytrajid: any[] = [];

  //goi anomalyInformation
  goishiptypeanomaly: any[] = [];
  goishiptypeanomalytrajgid: any[] = [];
  goishiptypeananomalytrajmmsi: any[] = [];
  goishiptypeanomalytrajid: any[] = [];

  // spinnner
  isloading: boolean = false;

  @Output() DeleteSOIEvent = new EventEmitter();
  @Output() SOISelectedEvent = new EventEmitter();
  @Output() GOISelectedEvent = new EventEmitter();
  @Output() EditGOIEvent = new EventEmitter();
  @Output() DeleteGoiEvent = new EventEmitter();
  @Output() DeleteGOIMMSIEvent = new EventEmitter();
  @Output() removeTrackTrajEvent = new EventEmitter();
  @Output() shiptypeanomalytrajectoryEvent = new EventEmitter();
  @Output() shiptyptrajanomalyEvent = new EventEmitter();
  @Output() TracktrajectoryEvent = new EventEmitter();
  @Output() removeanomalyTrajEvent = new EventEmitter();

  constructor(
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService,
    private ShareDataservice: ShareDataService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Subscribe to the SOI (Ships of Interest) service to listen for changes
    this.soisubscription = this.ShareDataservice.SOI.subscribe((message) => {
      if (message === "true") {
        this.SOISelectedEvent.emit("Restart Ship Map");
        this.handleSoiFeatureActivation();
      } else if (message === "false") {
        this.handleSoiFeatureDeactivation();
      }
    });
  }

  // Function to handle activation of SOI feature
  handleSoiFeatureActivation() {
    // Toggle the SOI feature sidenav
    this.isSoiFeatureSidenav =
      this.isSoiFeature === "true" ? !this.isSoiFeatureSidenav : true;

    // Set isSoiFeature to 'true'
    this.isSoiFeature = "true";

    // Clear existing data and get new SOI and GOI ships data
    this.soishiptypeanomaly = [];
    this.getSoiShips();
    this.getGoiShips();

    // Subscribe to the SOI and GOI update services
    this.UpdatesoiSubscription = this.ShareDataservice.updatesoi.subscribe(
      (msg) => {
        if (msg === "update soi info") {
          this.getSoiShips();
        } else if (msg === "update soi track details") {
          this.updateSoiTrackDetails();
        }
      }
    );

    this.UpdategoiSubscription = this.ShareDataservice.updategoi.subscribe(
      (msg) => {
        if (msg === "update goi info") {
          this.getGoiShips();
        } else if (msg === "update goi track details") {
          this.updateGoiTrackDetails();
        } else if (msg === "update goi track details for mmsi") {
          this.upadteGoiTrackDetailsForMmsi();
        }
      }
    );

    // Update active text and image
    this.updateActiveTextAndImage();

    // Clear existing track details
    this.trackdetails = [];
    this.trackdetailslength = 0;
  }

  // Function to handle deactivation of SOI feature
  handleSoiFeatureDeactivation() {
    // Set isSoiFeature to 'false' and close sidenav
    this.isSoiFeature = "false";
    this.isSoiFeatureSidenav = false;

    // Clean SOI and GOI data
    this.cleanSoiData();
    this.cleanGoiData();

    // Reset selected ships
    this.resetSelectedShips();

    // Reset active text and image
    this.resetActiveTextAndImage();
  }

  // Function to update SOI track details
  updateSoiTrackDetails() {
    const index = this.soiselectedmmsi.indexOf(Number(this.deletingsoiship));
    if (index > -1) {
      // Remove selected ships from SOI data
      this.soiselectedmmsi.splice(index, 1);
      this.selectedsoiships[Number(this.deletingsoiship)] = false;
      this.soiData = this.soiData.filter(
        (ele) => ele.msi !== this.deletingsoiship
      );
      this.ShareDataservice.changeVesselCount(this.soiData.length);
      this.SOISelectedEvent.emit(this.soiData);

      // Remove SOI trajectory
      this.removeSoiTrajectory(this.deletingsoiship);

      // Remove track details when unchecked
      this.trackdetails = this.trackdetails.filter(
        (track) => track.mmsi !== this.deletingsoiship
      );
      this.trackdetailslength = this.trackdetails.length;

      // Remove ship type anomaly details when unchecked
      this.soishiptypeanomaly = this.soishiptypeanomaly.filter(
        (typedev) => typedev.mmsi !== this.deletingsoiship
      );
      this.selectedsoiships[this.deletingsoiship] = false;
      this.getSoiShips();
    }
  }

  // Function to update GOI track details
  updateGoiTrackDetails() {
    this.removeGoiTrajectory(this.deletinggoiship);
    this.selectedgoi[this.deletinggoiship] = this.selectedgoiships[
      this.deletinggoiship
    ] = false;

    this.goiselected.splice(this.goiselected.indexOf(this.deletinggoiship), 1);

    this.goiData.forEach((g: any) => {
      if (g.Group_ID === this.deletinggoiship) {
        g.group_details.forEach((gd: any) => {
          this.goiselectedmmsi.splice(this.goiselectedmmsi.indexOf(gd.mmsi), 1);
          this.goiselectedmmsiwithgrp.splice(
            this.goiselectedmmsiwithgrp.indexOf(
              gd.mmsi + "_" + this.deletinggoiship
            ),
            1
          );
          this.soiData = this.soiData.filter((s) => gd.mmsi !== s.msi);
        });
        this.ShareDataservice.changeVesselCount(this.soiData.length);
        this.SOISelectedEvent.emit(this.soiData);
      }
    });

    // Remove GOI trajectory and track details
    this.goitrackdetails = this.goitrackdetails.filter(
      (gid) => gid.group_name !== this.deletinggoiship
    );
    this.goitrackdetailslength = this.goitrackdetails.length;

    // Remove ship type anomaly details when unchecked
    this.goishiptypeanomaly = this.goishiptypeanomaly.filter(
      (gid) => gid.group_name !== this.deletinggoiship
    );
  }

  // Function to update GOI track details for mmmi
  upadteGoiTrackDetailsForMmsi() {
    this.goiselected = this.goiselected.filter(
      (item) => item !== this.deletingmmsiofgoiship
    );
    this.goiselectedmmsi = this.goiselectedmmsi.filter(
      (item) => item !== this.deletingmmsiofgoi
    );
    this.goiselectedmmsiwithgrp = this.goiselectedmmsiwithgrp.filter(
      (item) =>
        item !== this.deletingmmsiofgoi + "_" + this.deletingmmsiofgoiship
    );

    const groupShipKey = `${this.deletingmmsiofgoi}_${this.deletingmmsiofgoiship}`;

    this.soiData = this.soiData.filter((s) => s.msi !== this.deletingmmsiofgoi);

    const newVesselCount = this.soiData.length;
    this.ShareDataservice.changeVesselCount(newVesselCount);

    // Emit the updated soiData
    this.SOISelectedEvent.emit(this.soiData);
    this.goitrackdetails = this.goitrackdetails.map((grp) => {
      if (this.deletingmmsiofgoiship === grp.group_name) {
        grp.traj_data = grp.traj_data.filter(
          (mmsi: any) => Number(this.deletingmmsiofgoi) !== mmsi.mmsi
        );
      }
      return grp;
    });

    this.goishiptypeanomaly = this.goishiptypeanomaly.map((grp) => {
      if (this.deletingmmsiofgoiship === grp.group_name) {
        grp.anomoly_data = grp.anomoly_data.filter(
          (mmsi: any) => Number(this.deletingmmsiofgoi) !== mmsi.mmsi
        );
      }
      return grp;
    });
  }

  // Function to update active text and image
  updateActiveTextAndImage() {
    const shipsOfInterestName = document.getElementById(
      "Ships of Interest_name"
    );
    if (shipsOfInterestName !== null) {
      shipsOfInterestName.setAttribute("class", "active_text");
    }
    const shipsOfInterestImg = document.getElementById("Ships of Interest_img");
    if (shipsOfInterestImg) {
      shipsOfInterestImg.setAttribute(
        "src",
        "assets/side-nav/selected_features_orange/Ships-of-Interest.svg"
      );
    }
  }

  // Function to clean SOI data
  cleanSoiData() {
    this.soiselectedmmsi.forEach((mmsi) => {
      this.removeSoiTrajectory(mmsi.toString());
    });
    this.trackdetails = [];
    this.trackdetailslength = 0;
    this.soishiptypeanomaly = [];
    this.soiselectedmmsi = [];
    this.selectedsoiships = [];
  }

  // Function to clean GOI data
  cleanGoiData() {
    const allSelectedGrp = this.goiselected;
    allSelectedGrp.forEach((g) => {
      this.removeGoiTrajectory(g);
    });
    this.selectedgoi = [];
    this.selectedgoiships = [];
    this.goiselected = [];
    this.goiselectedmmsi = [];
    this.goiselectedmmsiwithgrp = [];
    this.goitrackdetails = [];
    this.goitrackdetailslength = 0;
    this.goishiptypeanomaly = [];
  }

  // Function to reset selected ships
  resetSelectedShips() {
    this.soiselectedmmsi = [];
    this.selectedsoiships = [];
    this.goiselected = [];
    this.goiselectedmmsi = [];
    this.goiselectedmmsiwithgrp = [];
  }

  // Function to reset active text and image
  resetActiveTextAndImage() {
    const shipsOfInterestName = document.getElementById(
      "Ships of Interest_name"
    );
    if (shipsOfInterestName !== null) {
      shipsOfInterestName.setAttribute("class", "");
    }
    const shipsOfInterestImg = document.getElementById("Ships of Interest_img");
    if (shipsOfInterestImg) {
      shipsOfInterestImg.setAttribute(
        "src",
        "assets/side-nav/Ships-of-Interest.svg"
      );
    }
  }

  // get individual ships of interest
  getSoiShips() {
    this.isloading = true;
    this.service.getShipOfInterestOfUser().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.getSOI = result.data;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // selecting and unselecting the individual ship
  handleSelectedSOIShipChange(e: any): void {
    const mmsi = Number(e.target.value);
    if (e.target.checked) {
      this.selectSOIShip(mmsi);
    } else {
      this.unselectSOIShip(mmsi);
    }
  }

  // Select individual ship in the list
  selectSOIShip(mmsi: number): void {
    this.soiselectedmmsi.push(mmsi);
    this.selectedsoiships[mmsi] = true;

    const reqdata = {
      timestamp: this.cookieService.get("plotTime"),
      mmsi_list: [mmsi],
    };
    this.isloading = true;
    this.service.getShipsLkp(reqdata).subscribe({
      next: (data) => {
        if (data.status === "success" && data.data[0] !== undefined) {
          this.soiData.push(data.data[0]);
          this.isloading = false;
        }
        this.cookieService.set("plotTime", data.timestamp);
        this.ShareDataservice.changeTimeInSideNav(data.timestamp);
        this.ShareDataservice.changeVesselCount(this.soiData.length);
        this.emitSOISelectedEvent();
        this.fetchSOITrackAndAnomalyInfo(mmsi);
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // unselect individual ship in the list
  unselectSOIShip(mmsi: number): void {
    const index = this.soiselectedmmsi.indexOf(mmsi);
    if (index !== -1) {
      this.soiselectedmmsi.splice(index, 1);
    }
    this.selectedsoiships[mmsi] = false;

    this.soiData = this.soiData.filter(
      (soiShip) => soiShip.mmsi.toString() !== mmsi.toString()
    );
    this.ShareDataservice.changeVesselCount(this.soiData.length);
    this.emitSOISelectedEvent();
    this.removeSoiTrajectory(mmsi);

    this.trackdetails = this.trackdetails.filter(
      (track) => track.mmsi !== mmsi
    );
    this.trackdetailslength = this.trackdetails.length;

    this.soishiptypeanomaly = this.soishiptypeanomaly.filter(
      (typedev) => typedev.mmsi !== mmsi
    );

    if (
      this.soiselectedmmsi.length === 0 &&
      this.goiselectedmmsi.length === 0
    ) {
      this.SOISelectedEvent.emit("Restart Ship Map");
    }
  }

  // Update the ship map base on the selected ship
  emitSOISelectedEvent(): void {
    this.SOISelectedEvent.emit("Stop Ship Map");
    this.SOISelectedEvent.emit(this.soiData);
  }

  // Delete Ship of interest ships
  deleteSoI(data: any): void {
    this.unselectSOIShip(data.mmsi);
    this.deletingsoiship = data.mmsi;
    this.DeleteSOIEvent.emit(data);
  }

  // Soi track info details for single mmsi
  fetchSOITrackAndAnomalyInfo(receivedMMSI: any): void {
    const trackinfo = {
      mmsi: receivedMMSI,
      timestamp: this.cookieService.get("plotTime"),
      group_name: "",
    };
    this.isloading = true;
    this.service.soigoiTrackInfo(trackinfo).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.isloading = false;
          this.processTrajData(result.traj_data);
          this.processAnomolyData(result.anomoly_data);
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // processTrajData of Soi track info details for single mmsi
  processTrajData(trajData: any): void {
    trajData.detailslength = trajData.traj_info.length;
    trajData.traj_info.forEach((tj: any) => {
      tj.atd = formatDate(tj.atd, "dd-MM-yyyy, hh:mm a", "en-US");
      tj.eta = formatDate(tj.eta, "dd-MM-yyyy, hh:mm a", "en-US");
      tj.src = this.getTrajectorySrc(tj);
    });

    this.trackdetails.push(trajData);
    this.trackdetailslength = this.trackdetails.length;
  }

  // processAnomolyData of Soi track info details for single mmsi
  processAnomolyData(anomolyData: any): void {
    anomolyData.detailslength = anomolyData.anomoly_info.length;
    anomolyData.anomoly_info.forEach((traj: any) => {
      traj.atd = new Date(traj.atd);
      traj.eta = new Date(traj.eta);
      traj.src = this.getAnomolySrc(traj);
      this.calculateAnomalyPercentage(traj);
      traj.atd = formatDate(traj.atd, "dd-MM-yyyy, hh:mm a", "en-US");
      traj.eta = formatDate(traj.eta, "dd-MM-yyyy, hh:mm a", "en-US");
    });

    this.soishiptypeanomaly.push(anomolyData);
  }

  // update the scr based on the visibility of the trajectory in track info
  getTrajectorySrc(traj: any): string {
    const isTrajectoryVisible =
      this.showtracjectorymmsi.includes(traj.mmsi) &&
      this.showtracjectorytrajid.includes(traj.trid);
    return isTrajectoryVisible
      ? "../../../assets/soi/switch-on.svg"
      : "../../../assets/soi/switch-offf.svg";
  }

  // update the scr based on the visibility of the trajectory in anomaly info
  getAnomolySrc(traj: any): string {
    const isAnomalyVisible =
      this.shiptypeananomalytrajmmsi.includes(traj.mmsi) &&
      this.shiptypeanomalytrajid.includes(traj.trid);
    return isAnomalyVisible
      ? "../../../assets/soi/switch-on.svg"
      : "../../../assets/soi/switch-offf.svg";
  }

  // calulating the percentage for applying css on anomaly ponits to display on the line
  calculateAnomalyPercentage(traj: any): void {
    const totalTimeTravelled = Math.abs(traj.eta - traj.atd);
    traj.anomoly.forEach((anomaly: any, i: any) => {
      anomaly.ntime = new Date(anomaly.ntime);
      const anomalyTimeFromStartTime = Math.abs(anomaly.ntime - traj.atd);
      let percentage = (anomalyTimeFromStartTime / totalTimeTravelled) * 100;

      const prevAnomaly = traj.anomoly[i - 1];
      if (prevAnomaly) {
        const diff = Math.abs(percentage - prevAnomaly.percentage);
        if (diff < 2) {
          percentage = prevAnomaly.percentage + 2;
        }
      }

      anomaly.percentage = Math.min(percentage, 96);
      anomaly.message = `Change from ${anomaly.ptype} to ${anomaly.ntype}`;
    });
  }
  // getting all Goi ships
  getGoiShips(): void {
    this.isloading = true;
    this.service.getGoIDetailsForUser().subscribe(
      (result: any) => {
        if (result.status === "success") {
          this.goiData = result.data;
          this.isloading = false;
        }
      },
      (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      }
    );
  }

  // Edit group name
  editGoI(group_name: any): void {
    this.EditGOIEvent.emit(group_name);
  }

  // Delete ship in a group
  deleteMMSIFromGroup(g: any, m: any): void {
    this.unselectGroupShip(g, m);
    const data = { gid: g, mmsi: m };
    this.deletingmmsiofgoiship = g;
    this.deletingmmsiofgoi = m;
    this.DeleteGOIMMSIEvent.emit(data);
  }

  // Delete group
  deleteGoI(group: any): void {
    this.unselectGroupAndShips(group.group_name);
    this.deletinggoiship = group.group_name;
    this.DeleteGoiEvent.emit(group);
  }

  // Get details for selected group
  handleSelectedGroup(e: any): void {
    if (e.target.checked) {
      this.selectGroupAndShips(e.target.id);
    } else {
      this.unselectGroupAndShips(e.target.id);
    }
  }

  // Select the group and the show the selected group details
  selectGroupAndShips(groupId: any): void {
    this.selectedgoi[groupId] = true;
    this.selectedgoiships[groupId] = true;
    this.goiselected.push(groupId);
    const mmsiList: any[] = [];

    this.goiData.forEach((group: any) => {
      if (group.group_name === groupId) {
        group.group_info.forEach((ship: any) => {
          mmsiList.push(ship.mmsi);
          this.goiselectedmmsi.push(ship.mmsi);
          this.goiselectedmmsiwithgrp.push(ship.mmsi + "_" + groupId);
        });
      }
    });

    if (mmsiList.length !== 0) {
      this.fetchAndProcessShipsLkpData(mmsiList, groupId);
    } else {
      this.fetchGroupTrackInformation(groupId, true);
    }
  }

  // show the ships of group in ship map and show track info and anomaly information
  fetchAndProcessShipsLkpData(mmsiList: any[], groupId: any): void {
    const reqdata = {
      timestamp: this.cookieService.get("plotTime"),
      mmsi_list: mmsiList,
    };
    this.isloading = true;
    this.service.getShipsLkp(reqdata).subscribe({
      next: (data) => {
        if (data.status === "success" && data.data.length !== 0) {
          this.isloading = false;
          data.data.forEach((ship: any) => {
            this.soiData.push(ship);
          });
        }
        this.cookieService.set("plotTime", data.timestamp);
        this.ShareDataservice.changeTimeInSideNav(data.timestamp);
        this.ShareDataservice.changeVesselCount(this.soiData.length);
        this.emitSOISelectedEvent();
        this.fetchGroupTrackInformation(groupId, true);
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // on unselect the group and the remove the selected group details
  unselectGroupAndShips(groupId: any): void {
    this.selectedgoi[groupId] = false;
    this.selectedgoiships[groupId] = false;
    const index = this.goiselected.indexOf(groupId);
    if (index > -1) {
      this.goiselected.splice(index, 1);
    }

    this.goiData.forEach((group: any) => {
      if (group.group_name === groupId) {
        group.group_info.forEach((ship: any) => {
          this.removeShipFromSelection(ship.mmsi, groupId);
          this.removeShipFromSOIData(ship.mmsi);
        });
      }
    });

    this.ShareDataservice.changeVesselCount(this.soiData.length);
    this.emitSOISelectedEvent();
    this.removeGoiTrajectory(groupId);
    this.removeGroupTrackDetails(groupId);
    this.removeGroupShipTypeAnomaly(groupId);

    if (
      this.soiselectedmmsi.length === 0 &&
      this.goiselectedmmsi.length === 0
    ) {
      this.SOISelectedEvent.emit("Restart Ship Map");
    }
  }

  // remove ship from unselected groups
  removeShipFromSelection(mmsi: any, groupId: any): void {
    const index = this.goiselectedmmsi.indexOf(mmsi);
    if (index > -1) {
      this.goiselectedmmsi.splice(index, 1);
    }

    const index2 = this.goiselectedmmsiwithgrp.indexOf(mmsi + "_" + groupId);
    if (index2 > -1) {
      this.goiselectedmmsiwithgrp.splice(index2, 1);
    }
  }

  // removing ship from soidata when unselecting  the group
  removeShipFromSOIData(mmsi: any): void {
    this.soiData = this.soiData.filter((ship) => ship.mmsi !== mmsi);
  }

  // removing Goi tarckDetails from Goi track info when unselecting  the group
  removeGroupTrackDetails(groupId: any): void {
    this.goitrackdetails = this.goitrackdetails.filter(
      (gid) => gid.group_name !== groupId
    );
    this.goitrackdetailslength = this.goitrackdetails.length;
  }

  // removing Goi Group ShipType anomaly from Goi track info when unselecting  the group
  removeGroupShipTypeAnomaly(groupId: any): void {
    this.goishiptypeanomaly = this.goishiptypeanomaly.filter(
      (gid) => gid.group_name !== groupId
    );
  }

  // get details for selected ship in a group
  handleSelectedShipInGroup(groupId: any, e: any): void {
    if (e.target.checked) {
      this.selectGroupShip(groupId, e);
    } else {
      this.unselectGroupShip(groupId, Number(e.target.value));
    }
  }

  // on selecting a specific ship in a group
  selectGroupShip(groupId: any, e: any): void {
    const mmsi = Number(e.target.value);
    this.goiselectedmmsi.push(mmsi);
    this.goiselectedmmsiwithgrp.push(`${mmsi}_${groupId}`);
    this.selectedgoi[groupId] = true;

    // Add the group to goiselected if not already present
    if (!this.goiselected.includes(groupId)) {
      this.goiselected.push(groupId);
    }

    const reqdata = {
      timestamp: this.cookieService.get("plotTime"),
      mmsi_list: [mmsi],
    };
    this.isloading = true;
    this.service.getShipsLkp(reqdata).subscribe({
      next: (data) => {
        if (data.status === "success" && data.data.length !== 0) {
          this.isloading = false;
          data.data.forEach((ship: any) => {
            this.soiData.push(ship);
          });
        }
        this.cookieService.set("plotTime", data.timestamp);
        this.ShareDataservice.changeTimeInSideNav(data.timestamp);
        this.ShareDataservice.changeVesselCount(this.soiData.length);
        this.emitSOISelectedEvent();
        this.fetchGroupTrackInformationForSingleMmsi(groupId, false);
        this.updateGroupShipDisplayStatus(groupId, mmsi, true);
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = true;
      },
    });
  }

  // on unSelecting a specific ship in a group
  unselectGroupShip(groupId: any, grpmmsi: any): void {
    const mmsi = grpmmsi;
    const index = this.goiselectedmmsi.indexOf(mmsi);
    if (index > -1) {
      this.goiselectedmmsi.splice(index, 1);
    }

    const index2 = this.goiselectedmmsiwithgrp.indexOf(`${mmsi}_${groupId}`);
    if (index2 > -1) {
      this.goiselectedmmsiwithgrp.splice(index2, 1);
    }

    this.goiData.forEach((group: any) => {
      if (group.group_name === groupId) {
        this.removeShipFromSOIData(mmsi);
      }
    });

    this.ShareDataservice.changeVesselCount(this.soiData.length);
    this.emitSOISelectedEvent();
    this.cleanupGroupShipTrajectories(groupId, mmsi);
    this.updateGroupShipDisplayStatus(groupId, mmsi, false);
  }

  // display trackInfo base on ship selected in group
  updateGroupShipDisplayStatus(
    groupId: any,
    mmsi: any,
    display: boolean
  ): void {
    this.goitrackdetails.forEach((grp) => {
      if (groupId === grp.group_name) {
        grp.traj_data.forEach((mmsiData: any) => {
          if (mmsi === mmsiData.mmsi) {
            mmsiData.display = display;
          }
        });
      }
    });

    this.goishiptypeanomaly.forEach((grp) => {
      if (groupId === grp.group_name) {
        grp.anomoly_data.forEach((mmsiData: any) => {
          if (mmsi === mmsiData.mmsi) {
            mmsiData.display = display;
          }
        });
      }
    });
  }

  // Display the details of ship in track info and shipType anomaly when group is selected
  fetchGroupTrackInformation(groupId: any, flag: any): void {
    const trackinfo = {
      group_name: groupId,
      timestamp: this.cookieService.get("plotTime"),
      mmsi: flag ? [] : this.goiselectedmmsi,
    };
    this.isloading = true;
    this.service.soigoiTrackInfo(trackinfo).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.isloading = false;
          // Track info
          const trackData = result.traj_data.map((ship: any) => ({
            ...ship,
            display: this.goiselectedmmsiwithgrp.includes(
              ship.mmsi + "_" + groupId
            ),
            detailslength: ship.traj_info.length,
            traj_info: ship.traj_info.map((tj: any) => ({
              ...tj,
              atd: formatDate(tj.atd, "dd-MM-yyyy, hh:mm a", "en-US"),
              eta: formatDate(tj.eta, "dd-MM-yyyy, hh:mm a", "en-US"),
              src:
                this.showgrptrajectorygid.includes(groupId) &&
                this.showgrptracjectorymmsi.includes(ship.mmsi) &&
                this.showgrptracjectorytrajid.includes(tj.trid)
                  ? "../../../assets/soi/switch-on.svg"
                  : "../../../assets/soi/switch-offf.svg",
            })),
          }));

          this.goitrackdetails.push({
            group_name: groupId,
            traj_data: trackData,
            traj_data_length: trackData.length,
          });
          this.goitrackdetailslength = this.goitrackdetails.length;

          // Ship type anomaly info
          const anomalyData = result.anomoly_data.map((ship: any) => ({
            ...ship,
            display: this.goiselectedmmsiwithgrp.includes(
              ship.mmsi + "_" + groupId
            ),
            detailslength: ship.anomoly_info.length,
            anomoly_info: ship.anomoly_info.map((traj: any) => {
              traj.atd = new Date(traj.atd);
              traj.eta = new Date(traj.eta);
              traj.src =
                this.goishiptypeanomalytrajgid.includes(groupId) &&
                this.goishiptypeananomalytrajmmsi.includes(ship.mmsi) &&
                this.goishiptypeanomalytrajid.includes(traj.trid)
                  ? "../../../assets/soi/switch-on.svg"
                  : "../../../assets/soi/switch-offf.svg";
              this.calculateAnomalyPercentage(traj);

              traj.atd = formatDate(traj.atd, "dd-MM-yyyy, hh:mm a", "en-US");
              traj.eta = formatDate(traj.eta, "dd-MM-yyyy, hh:mm a", "en-US");

              return traj;
            }),
          }));

          this.goishiptypeanomaly.push({
            group_name: groupId,
            anomoly_data: anomalyData,
            anomaly_length: anomalyData.length,
          });
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Display the details of ship in track info and shipType anomaly when a ship is selected in a group
  fetchGroupTrackInformationForSingleMmsi(groupId: any, flag: any): void {
    const trackinfo = {
      group_name: groupId,
      timestamp: this.cookieService.get("plotTime"),
      mmsi: flag ? [] : this.goiselectedmmsi,
    };

    this.isloading = true;
    this.service.soigoiTrackInfo(trackinfo).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.isloading = false;
          // Track info
          const trackData = result.traj_data.map((ship: any) => ({
            ...ship,
            display: this.goiselectedmmsiwithgrp.includes(
              ship.mmsi + "_" + groupId
            ),
            detailslength: ship.traj_info.length,
            traj_info: ship.traj_info.map((tj: any) => ({
              ...tj,
              atd: formatDate(tj.atd, "dd-MM-yyyy, hh:mm a", "en-US"),
              eta: formatDate(tj.eta, "dd-MM-yyyy, hh:mm a", "en-US"),
              src:
                this.showgrptrajectorygid.includes(groupId) &&
                this.showgrptracjectorymmsi.includes(ship.mmsi) &&
                this.showgrptracjectorytrajid.includes(tj.trid)
                  ? "../../../assets/soi/switch-on.svg"
                  : "../../../assets/soi/switch-offf.svg",
            })),
          }));

          this.removeGroupTrackDetails(groupId);

          this.goitrackdetails.push({
            group_name: groupId,
            traj_data: trackData,
            traj_data_length: trackData.length,
          });
          this.goitrackdetailslength = this.goitrackdetails.length;

          // Ship type anomaly info
          const anomalyData = result.anomoly_data.map((ship: any) => ({
            ...ship,
            display: this.goiselectedmmsiwithgrp.includes(
              ship.mmsi + "_" + groupId
            ),
            detailslength: ship.anomoly_info.length,
            anomoly_info: ship.anomoly_info.map((traj: any) => {
              traj.atd = new Date(traj.atd);
              traj.eta = new Date(traj.eta);
              traj.src =
                this.goishiptypeanomalytrajgid.includes(groupId) &&
                this.goishiptypeananomalytrajmmsi.includes(ship.mmsi) &&
                this.goishiptypeanomalytrajid.includes(traj.trid)
                  ? "../../../assets/soi/switch-on.svg"
                  : "../../../assets/soi/switch-offf.svg";

              this.calculateAnomalyPercentage(traj);

              traj.atd = formatDate(traj.atd, "dd-MM-yyyy, hh:mm a", "en-US");
              traj.eta = formatDate(traj.eta, "dd-MM-yyyy, hh:mm a", "en-US");

              return traj;
            }),
          }));

          this.removeGroupShipTypeAnomaly(groupId);

          this.goishiptypeanomaly.push({
            group_name: groupId,
            anomoly_data: anomalyData,
            anomaly_length: anomalyData.length,
          });
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // showing the trajectory of ship In ship-map
  showTracjectory(mmsi: any, trajid: any): void {
    const layerName = mmsi + "_" + trajid;
    const isSwitchedOn =
      this.showtracjectorymmsi.includes(mmsi) &&
      this.showtracjectorytrajid.includes(trajid);

    if (!isSwitchedOn) {
      this.showtracjectorymmsi.push(mmsi);
      this.showtracjectorytrajid.push(trajid);
      this.getShipTrack(
        {
          timestamp: this.cookieService.get("plotTime"),
          traj_id: trajid,
          mmsi: mmsi,
        },
        "track",
        ""
      );

      // Set the image source to the switched-on version
      document
        .getElementById(layerName)!
        .setAttribute("src", "../../../assets/soi/switch-on.svg");
    } else {
      const mmsiIndex = this.showtracjectorymmsi.indexOf(mmsi);
      const trajidIndex = this.showtracjectorytrajid.indexOf(trajid);

      if (mmsiIndex > -1) {
        this.showtracjectorymmsi.splice(mmsiIndex, 1);
      }

      if (trajidIndex > -1) {
        this.showtracjectorytrajid.splice(trajidIndex, 1);
      }

      // Set the image source to the switched-off version
      document
        .getElementById(layerName)!
        .setAttribute("src", "../../../assets/soi/switch-offf.svg");
      this.removeTrackTrajEvent.emit(layerName);
    }
  }

  // showing the trajectory of ship In ship-map when ship is selected from a group
  showTracjectoryForGroup(group_name: any, mmsi: any, trajid: any): void {
    const layername = group_name + "_" + mmsi + "_" + trajid;
    const isSwitchedOn =
      this.showgrptracjectorymmsi.includes(mmsi) &&
      this.showgrptracjectorytrajid.includes(trajid) &&
      this.showgrptrajectorygid.includes(group_name);

    if (!isSwitchedOn) {
      this.showgrptracjectorymmsi.push(mmsi);
      this.showgrptracjectorytrajid.push(trajid);
      this.showgrptrajectorygid.push(group_name);

      const showtrajectoryData = {
        timestamp: this.cookieService.get("plotTime"),
        traj_id: trajid,
        mmsi: mmsi,
      };
      this.getShipTrack(showtrajectoryData, "track", group_name);

      // Set the image source to the switched-on version
      document
        .getElementById(layername)!
        .setAttribute("src", "../../../assets/soi/switch-on.svg");
    } else {
      const mmsiIndex = this.showgrptracjectorymmsi.indexOf(mmsi);
      const trajidIndex = this.showgrptracjectorytrajid.indexOf(trajid);
      const groupIndex = this.showgrptrajectorygid.indexOf(group_name);

      if (mmsiIndex > -1) {
        this.showgrptracjectorymmsi.splice(mmsiIndex, 1);
      }

      if (trajidIndex > -1) {
        this.showgrptracjectorytrajid.splice(trajidIndex, 1);
      }

      if (groupIndex > -1) {
        this.showgrptrajectorygid.splice(groupIndex, 1);
      }

      // Set the image source to the switched-off version
      document
        .getElementById(layername)!
        .setAttribute("src", "../../../assets/soi/switch-offf.svg");
      this.removeTrackTrajEvent.emit(layername);
    }
  }

  //Sowing  Tracjectory for shiptype anomaly
  showShiptypeAnomalyTracjectory(selectedmmsi: any, selectedtj: any): void {
    const layername = `${selectedmmsi}_${selectedtj}_shiptypeanomaly`;
    const isSwitchedOn =
      document.getElementById(layername)?.getAttribute("src") ===
      "../../../assets/soi/switch-on.svg";

    if (isSwitchedOn) {
      const mmsiIndex = this.shiptypeananomalytrajmmsi.indexOf(selectedmmsi);
      const tjIndex = this.shiptypeanomalytrajid.indexOf(selectedtj);

      if (mmsiIndex > -1) {
        this.shiptypeananomalytrajmmsi.splice(mmsiIndex, 1);
      }

      if (tjIndex > -1) {
        this.shiptypeanomalytrajid.splice(tjIndex, 1);
      }

      // Remove trajectory
      document
        .getElementById(layername)
        ?.setAttribute("src", "../../../assets/soi/switch-offf.svg");
      this.removeanomalyTrajEvent.emit(layername);
    } else {
      this.shiptypeananomalytrajmmsi.push(selectedmmsi);
      this.shiptypeanomalytrajid.push(selectedtj);

      // Show trajectory
      document
        .getElementById(layername)
        ?.setAttribute("src", "../../../assets/soi/switch-on.svg");
      const shiptypeanomaly = {
        timestamp: this.cookieService.get("plotTime"),
        traj_id: selectedtj,
        mmsi: selectedmmsi,
      };
      this.getShipTrack(shiptypeanomaly, "shiptype", "");

      let shiptypeanamolypoints: any[] = [];
      this.soishiptypeanomaly.forEach(({ mmsi, anomoly_info }) => {
        if (selectedmmsi === mmsi) {
          anomoly_info.forEach((points: any) => {
            if (selectedtj === points.trid) {
              points.anomoly.mmsi = selectedmmsi;
              points.anomoly.tj = selectedtj;
              shiptypeanamolypoints = points.anomoly;
            }
          });
        }
      });
      this.shiptyptrajanomalyEvent.emit(shiptypeanamolypoints);
    }
  }

  // show ship type Anomaly traj for a ship in a group
  showGoiShiptypeAnomalyTrajectory(groupID: any, mmsi: any, tj: any): void {
    const layername = `${groupID}_${mmsi}_${tj}_goishiptypeanomaly`;
    const isSwitchedOn =
      document.getElementById(layername)?.getAttribute("src") ===
      "../../../assets/soi/switch-on.svg";

    if (isSwitchedOn) {
      const mmsiIndex = this.goishiptypeananomalytrajmmsi.indexOf(mmsi);
      const tjIndex = this.goishiptypeanomalytrajid.indexOf(tj);
      const groupIndex = this.goishiptypeanomalytrajgid.indexOf(groupID);

      if (mmsiIndex > -1) {
        this.goishiptypeananomalytrajmmsi.splice(mmsiIndex, 1);
      }

      if (tjIndex > -1) {
        this.goishiptypeanomalytrajid.splice(tjIndex, 1);
      }

      if (groupIndex > -1) {
        this.goishiptypeanomalytrajgid.splice(groupIndex, 1);
      }

      document
        .getElementById(layername)
        ?.setAttribute("src", "../../../assets/soi/switch-offf.svg");
      // Remove trajectory
      this.removeanomalyTrajEvent.emit(layername);
    } else {
      document
        .getElementById(layername)
        ?.setAttribute("src", "../../../assets/soi/switch-on.svg");
      this.goishiptypeanomalytrajgid.push(groupID);
      this.goishiptypeananomalytrajmmsi.push(mmsi);
      this.goishiptypeanomalytrajid.push(tj);

      // Show trajectory
      const shiptypeanomaly = {
        timestamp: this.cookieService.get("plotTime"),
        traj_id: tj,
        mmsi: mmsi,
      };
      this.getShipTrack(shiptypeanomaly, "shiptype", groupID);

      let goishiptypeanamolypoints: any[] = [];
      this.goishiptypeanomaly.forEach(({ group_name, anomoly_data }) => {
        if (groupID === group_name) {
          anomoly_data.forEach((ship: any) => {
            if (mmsi === ship.mmsi) {
              ship.anomoly_info.forEach((traj: any) => {
                if (tj === traj.trid) {
                  traj.anomoly.mmsi = mmsi;
                  traj.anomoly.tj = tj;
                  traj.anomoly.gid = groupID;
                  goishiptypeanamolypoints = traj.anomoly;
                }
              });
            }
          });
        }
      });
      this.shiptyptrajanomalyEvent.emit(goishiptypeanamolypoints);
    }
  }

  // Remove soi trajectory
  removeSoiTrajectory(unmmsi: any): void {
    function removeFromArray(arr: any[], value: any) {
      const index = arr.indexOf(value);
      if (index > -1) {
        arr.splice(index, 1);
      }
    }

    // Removing trajectory and removing mmsi and trajid from trajectory details
    if (this.showtracjectorymmsi.length > 0) {
      const mmsiNum = Number(unmmsi);
      this.trackdetails.forEach((ship) => {
        if (ship.mmsi === mmsiNum) {
          ship.traj_info.forEach((tj: any) => {
            removeFromArray(this.showtracjectorymmsi, ship.mmsi);
            removeFromArray(this.showtracjectorytrajid, tj.trid);
            const layername = `${ship.mmsi}_${tj.trid}`;
            this.removeTrackTrajEvent.emit(layername);
          });
        }
      });
    }

    if (this.shiptypeananomalytrajmmsi.length > 0) {
      const mmsiNum = Number(unmmsi);
      this.soishiptypeanomaly.forEach((ship) => {
        if (ship.mmsi === mmsiNum) {
          ship.anomoly_info.forEach((tj: any) => {
            removeFromArray(this.shiptypeananomalytrajmmsi, ship.mmsi);
            removeFromArray(this.shiptypeanomalytrajid, tj.trid);
            const layername = `${ship.mmsi}_${tj.trid}_shiptypeanomaly`;
            this.removeanomalyTrajEvent.emit(layername);
          });
        }
      });
    }
  }

  // Remove Goi trajectory
  removeGoiTrajectory(gid: any): void {
    function removeFromArray(arr: any[], value: any) {
      return arr.filter((item: any) => item !== value);
    }

    // Removing track info tracks
    if (this.showgrptrajectorygid.length > 0) {
      const grpidindex = this.showgrptrajectorygid.indexOf(gid);
      if (grpidindex > -1) {
        const groupTrajectories = this.goitrackdetails.find(
          (grp) => grp.group_name === gid
        );
        if (groupTrajectories) {
          groupTrajectories.traj_data.forEach((ship: any) => {
            const mmsiindex = this.showgrptracjectorymmsi.indexOf(ship.mmsi);
            if (mmsiindex > -1) {
              ship.traj_info.forEach((traj: any) => {
                const trajindex = this.showgrptracjectorytrajid.indexOf(
                  traj.trid
                );
                if (trajindex > -1) {
                  this.showgrptracjectorytrajid = removeFromArray(
                    this.showgrptracjectorytrajid,
                    traj.trid
                  );
                  this.showgrptracjectorymmsi = removeFromArray(
                    this.showgrptracjectorymmsi,
                    ship.mmsi
                  );
                  this.showgrptrajectorygid = removeFromArray(
                    this.showgrptrajectorygid,
                    gid
                  );
                  const layername = `${gid}_${ship.mmsi}_${traj.trid}`;
                  this.removeTrackTrajEvent.emit(layername);
                }
              });
            }
          });
        }
      }
    }

    // Removing shiptype anomalys tracks
    if (this.goishiptypeanomalytrajgid.length > 0) {
      const grpidindex = this.goishiptypeanomalytrajgid.indexOf(gid);
      if (grpidindex > -1) {
        const groupTrajectories = this.goitrackdetails.find(
          (grp) => grp.group_name === gid
        );
        if (groupTrajectories) {
          groupTrajectories.traj_data.forEach((ship: any) => {
            const mmsiindex = this.goishiptypeananomalytrajmmsi.indexOf(
              ship.mmsi
            );
            if (mmsiindex > -1) {
              ship.traj_info.forEach((traj: any) => {
                const trajindex = this.goishiptypeanomalytrajid.indexOf(
                  traj.trid
                );
                if (trajindex > -1) {
                  this.goishiptypeanomalytrajid = removeFromArray(
                    this.goishiptypeanomalytrajid,
                    traj.trid
                  );
                  this.goishiptypeananomalytrajmmsi = removeFromArray(
                    this.goishiptypeananomalytrajmmsi,
                    ship.mmsi
                  );
                  this.goishiptypeanomalytrajgid = removeFromArray(
                    this.goishiptypeanomalytrajgid,
                    gid
                  );
                  const layername = `${gid}_${ship.mmsi}_${traj.trid}_goishiptypeanomaly`;
                  this.removeanomalyTrajEvent.emit(layername);
                }
              });
            }
          });
        }
      }
    }
  }

  //on Unselecting the group remove trackinfo and anomaly info.
  cleanupGroupShipTrajectories(groupId: any, mmsi: any): void {
    const mmsiNum = Number(mmsi);

    // Removing track info tracks
    this.showgrptrajectorygid = this.showgrptrajectorygid.filter(
      (gid) => gid !== groupId
    );
    this.goitrackdetails.forEach((grp) => {
      if (grp.group_name === groupId) {
        grp.traj_data.forEach((ship: any) => {
          if (ship.mmsi === mmsiNum) {
            this.showgrptracjectorymmsi = this.showgrptracjectorymmsi.filter(
              (m) => m !== mmsiNum
            );
            ship.traj_info.forEach((traj: any) => {
              this.showgrptracjectorytrajid =
                this.showgrptracjectorytrajid.filter(
                  (trid) => trid !== traj.trid
                );
              const layername = `${groupId}_${mmsiNum}_${traj.trid}`;
              this.removeTrackTrajEvent.emit(layername);
            });
          }
        });
      }
    });

    // Removing shiptype anomaly tracks
    this.goishiptypeanomalytrajgid = this.goishiptypeanomalytrajgid.filter(
      (gid) => gid !== groupId
    );
    this.goitrackdetails.forEach((grp) => {
      if (grp.group_name === groupId) {
        grp.traj_data.forEach((ship: any) => {
          if (ship.mmsi === mmsiNum) {
            this.goishiptypeananomalytrajmmsi =
              this.goishiptypeananomalytrajmmsi.filter(
                (mmsi) => mmsi !== mmsiNum
              );
            ship.traj_info.forEach((traj: any) => {
              this.goishiptypeanomalytrajid =
                this.goishiptypeanomalytrajid.filter(
                  (trid) => trid !== traj.trid
                );
              const layername = `${groupId}_${mmsiNum}_${traj.trid}_goishiptypeanomaly`;
              this.removeanomalyTrajEvent.emit(layername);
            });
          }
        });
      }
    });
  }

  // get the trajectory points data and plot in ship-map
  getShipTrack(reqdata: any, type: any, gid: any): void {
    this.isloading = true;
    this.service.shipTrack(reqdata).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          this.isloading = false;
          const track = data.data;
          track.gid = gid;
          if (type === "track") {
            this.TracktrajectoryEvent.emit(track);
          } else if (type === "shiptype") {
            this.shiptypeanomalytrajectoryEvent.emit(track);
          }
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  playHistory(mmsi: any, data: any, t: any): void {
    // Clear specific cookies
    this.cookieService.delete("playhistorymmsi");
    this.cookieService.delete("playhistorystartTime");
    this.cookieService.delete("playhistoryendTime");
    this.cookieService.delete("soiShipTypeAnomlayInPlayHistory");

    if (t === "shiptype") {
      this.cookieService.delete("soiShipTypeAnomlayInPlayHistory");
    }

    // Set new cookies
    this.cookieService.set("playhistorymmsi", mmsi.toString());
    this.cookieService.set("playhistorystartTime", data[data.length - 1].atd);
    this.cookieService.set("playhistoryendTime", data[0].eta);
    this.cookieService.set("soiShipTypeAnomlayInPlayHistory", "false");

    if (t === "shiptype") {
      this.cookieService.set("soiShipTypeAnomlayInPlayHistory", "true");
    }

    this.router.navigateByUrl("/play-history");
  }

  ngOnDestroy(): void {
    if (this.soisubscription !== undefined) {
      this.soisubscription.unsubscribe();
    }
    if (this.UpdatesoiSubscription !== undefined) {
      this.UpdatesoiSubscription.unsubscribe();
    }
    if (this.UpdategoiSubscription !== undefined) {
      this.UpdategoiSubscription.unsubscribe();
    }
  }
}
