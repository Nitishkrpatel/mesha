import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { CookieService } from "ngx-cookie-service";
import { MessageService } from "../shared/message.service";
import { Router } from "@angular/router";
import { ServiceService } from "../shared/service.service";
import { ShareDataService } from "../shared/share-data.service";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { formatDate } from "@angular/common";
import jwt_decode from "jwt-decode";

@Component({
  selector: "app-main-navbar",
  templateUrl: "./main-navbar.component.html",
  styleUrls: ["./main-navbar.component.scss"],
})
export class MainNavbarComponent implements OnInit {
  decodedToken: any;
  roles: any;
  username: any;
  startAt = new Date(2018, 0, 9, 10, 30, 30);
  today = new Date();
  adjustedTime: any;
  plotTime: any;
  plotdate: any;
  plottime: any;
  speed: any;
  convertedAdjustedTime: any;
  showInputForDateTime = false;
  adjustDateTimeFlag!: string;
  clockStatus!: boolean;
  resetclockStatus = true;
  clearSearchSub!: Subscription;
  searchCategorty = [
    { name: "Ship Name", value: "name" },
    { name: "MMSI", value: "MMSI" },
    { name: "IMO", value: "IMO" },
    { name: "COO", value: "Coo" },
    { name: "Destination", value: "dest" },
    { name: "Search Port", value: "port" },
  ];
  searchResultData: any;
  recenthistory: any;
  searchedresult: any;
  soisubscription!: Subscription;
  roisubscription!: Subscription;
  hideSpeed = "true";
  hidePlayPause = "true";
  hideSetTime = "true";
  hideResetTime = "true";
  hideplotTime = "true";
  hideSearch = "true";
  hidedashboard = "true";
  hideshipmap = "true";
  hideplayhistory = "true";
  hideSetAdjustedTime = "true";
  hideplotClock = "true";
  currentURL: any;

  @Output() plottimeEvent = new EventEmitter<string>();
  @Output() searchShipEvent = new EventEmitter<Array<object>>();
  @Output() clockstatusEvent = new EventEmitter();
  @Output() speedEvent = new EventEmitter<string>();

  constructor(
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService,
    private toastr: ToastrService,
    private ShareDataservice: ShareDataService,
    private router: Router
  ) {}

  timestampForm = new FormGroup({
    timestamp: new FormControl("", [Validators.required]),
  });

  setSpeedForm = new FormGroup({
    speed: new FormControl(),
  });

  searchForm = new FormGroup({
    timestamp: new FormControl(""),
    criteria: new FormControl("", [Validators.required]),
    search_txt: new FormControl(""),
  });

  ngOnInit(): void {
    this.speed = this.cookieService.get("speed");
    this.setSpeedForm.setValue({ speed: this.speed });
    this.speedEvent.emit(this.speed);
    this.adjustDateTimeFlag = this.cookieService.get("adjustDateTimeFlag");
    this.initializeDecodedToken();
    this.getClockStatus();
    this.currentURL = this.router.url;

    this.clearSearchSub = this.ShareDataservice.clearsearch.subscribe((msg) => {
      if (msg === "true") {
        this.clearSearch();
      }
    });

    if (
      this.router.url === "/" + "dashboard" ||
      this.router.url === "/" + "anomaly-info" ||
      this.router.url.startsWith("/play-history")
    ) {
      this.hideSpeed = "false";
      this.hidePlayPause = "false";
      this.hideSetTime = "false";
      this.hideResetTime = "false";
      this.hideplotTime = "false";
      this.hideSearch = "false";
    }

    if (this.router.url.startsWith("/admin-console")) {
      this.hideSpeed = "false";
      this.hidePlayPause = "false";
      this.hideSetTime = "false";
      this.hideResetTime = "false";
      this.hideplotTime = "false";
      this.hideSearch = "false";
      this.hidedashboard = "false";
      this.hideshipmap = "false";
      this.hideplayhistory = "false";
      this.hideSetAdjustedTime = "false";
      this.hideplotClock = "false";
    }

    if (this.router.url.startsWith("/play-history")) {
      this.hideplotClock = "false";
    }
  }

  initializeDecodedToken() {
    const jwtToken = this.cookieService.get("miutkn");
    this.decodedToken = jwt_decode(jwtToken) as { [key: string]: any };
    this.username = this.decodedToken.username;
    this.roles = this.decodedToken.role.trim().split(" ").join(",");
  }

  logOut() {
    this.msgservice.logOutUser(this.username);
  }

  // Reloading current url
  reloadCurrentPage(data: any): void {
    if (this.router.url === "/" + data) {
      location.reload();
    }
  }

  getClockStatus(): void {
    const clockstatusdata = { flag: false };
    this.service.clockStatus(clockstatusdata).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.clockStatus = data.data;
          this.clockstatusEvent.emit(this.clockStatus);
          this.getUserAdjustedTime();
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  getUserAdjustedTime() {
    this.service.getUserAdjustedTime().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.adjustedTime = result.data.at;
          this.plotTime = result.data.pt;
          this.plottimeEvent.emit(this.plotTime);
          this.cookieService.set("plotTime", this.plotTime);
          this.convertedAdjustedTime = formatDate(
            this.adjustedTime,
            "dd-MM-yyyy,hh:mm a",
            "en-US"
          );
          this.plotdate = formatDate(this.plotTime, "dd/MM/yyyy", "en-US");
          this.plottime = formatDate(this.plotTime, "HH:mm:ss", "en-US");
          if (document.getElementById("plotdate") !== null) {
            document.getElementById("plotdate")!.innerHTML = this.plotdate;
          }
          if (document.getElementById("plottime") !== null) {
            document.getElementById("plottime")!.innerHTML = this.plottime;
          }
          const date = new Date(this.adjustedTime);
          this.timestampForm.setValue({ timestamp: this.adjustedTime });
          this.startAt = new Date(this.adjustedTime);
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  changeClockStatus(): void {
    const pause = !this.clockStatus;
    const clockstatusdata = { pause, flag: true };

    this.service.clockStatus(clockstatusdata).subscribe({
      next: (data) => {
        if (data.status === "success") {
          const clockstatustext = this.clockStatus ? "play" : "paused";
          this.toastr.success(`Plot clock is ${clockstatustext} state.`, "", {
            timeOut: 3000,
          });
          this.getClockStatus();
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  setAdjustedTime(): void {
    const timestamp = this.timestampForm.value.timestamp;
    if (!timestamp) {
      return;
    }

    const formattedTimestamp = formatDate(
      timestamp,
      "yyyy-MM-dd HH:mm:ss",
      "en-US"
    );

    if (this.adjustedTime === formattedTimestamp) {
      return;
    }

    const reqdata = {
      timestamp: formattedTimestamp,
      is_adjusted: true,
    };

    this.service.updateAdjusteTime(reqdata).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.cookieService.set("adjustDateTimeFlag", "true");
          this.showInputForDateTime = false;
          this.ngOnInit();
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  syncToServerTime(): void {
    this.service.updateAdjusteTime({ is_adjusted: false }).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.cookieService.set("adjustDateTimeFlag", "false");
          this.ngOnInit();
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  setSpeed(): void {
    const speed = this.setSpeedForm.value.speed;

    this.service.updateSpeed(speed).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.cookieService.set("speed", speed);
          this.speedEvent.emit(speed);
        }
      },
      error: (error) => {
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  showAdjustedTimeInput() {
    this.showInputForDateTime = !this.showInputForDateTime;
  }

  // open search popup
  displaySearchPopup(): void {
    const searchPopup = document.getElementById("search-popup");
    if (searchPopup) {
      searchPopup.style.display = "block";
    }
  }

  closeSearchPopup(): void {
    const searchPopup = document.getElementById("search-popup");
    if (searchPopup) {
      searchPopup.style.display = "none";
    }
  }

  // Change search criteria
  selectCategory(name: any): void {
    this.searchForm.patchValue({
      criteria: name,
      timestamp: this.plotTime,
    });

    const selectedButton = document.getElementById(name);
    if (selectedButton) {
      selectedButton.classList.add("btn-dark");
    }

    this.searchCategorty.forEach((ele) => {
      const button = document.getElementById(ele.value);
      if (button) {
        button.classList.toggle("btn-dark", ele.value === name);
        button.classList.toggle("btn-light", ele.value !== name);
      }
    });

    if (this.searchForm.value.search_txt !== "") {
      this.searchShip();
    }
  }

  getSearchHistory() {
    this.service.getSearchHistory().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.recenthistory = result.data;
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  searchShip(): void {
    if (this.searchForm.invalid && !this.searchForm.value.criteria) {
      this.toastr.warning("Please select a category", "", {
        timeOut: 3000,
      });
      return;
    }

    this.searchForm.patchValue({ timestamp: this.plotTime });

    this.service.getSearchOptionsResult(this.searchForm.value).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          this.searchResultData = data.data;
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
      },
    });
  }

  // selecting search result for search details
  selectFromHistoryOrResult(value: any, type: any): void {
    this.clearSearch();

    this.searchForm.patchValue({
      search_txt: value,
      criteria: this.searchForm.value.criteria,
      timestamp: this.plotTime,
    });

    const reqsearchdata = {
      search_txt: value,
      criteria: type,
      timestamp: this.plotTime,
    };

    const searchPopup = document.getElementById("search-popup");
    if (searchPopup) {
      searchPopup.style.display = "none";
    }

    this.getSearchResults(reqsearchdata);
  }

  // Clearing search
  clearSearch(): void {
    const searchPopup = document.getElementById("search-popup");
    if (searchPopup) {
      searchPopup.style.display = "none";
    }

    this.searchResultData = [];

    if (this.plotTime) {
      this.searchForm.setValue({
        search_txt: "",
        criteria: "",
        timestamp: this.plotTime,
      });
    }
    this.searchCategorty.forEach((ele) => {
      const button = document.getElementById(ele.value);
      if (button) {
        button.classList.add("btn-light");
        button.classList.remove("btn-dark");
      }
    });

    this.searchedresult = [];
    this.searchShipEvent.emit(this.searchedresult);
  }

  getSearchResults(searchdata: any) {
    this.searchResultData = [];

    this.service.getSearchResult(searchdata).subscribe({
      next: (result) => {
        if (result.status === "success") {
          this.searchedresult = result.data;
          this.searchShipEvent.emit(this.searchedresult);
        }
      },
      error: (error) => {
        this.msgservice.postErrorFunc(error);
      },
      complete: () => {
        const searchPopup = document.getElementById("search-popup");
        if (searchPopup) {
          searchPopup.style.display = "none";
        }
      },
    });
  }

  ngOnDestroy(): void {
    if (this.soisubscription !== undefined) {
      this.soisubscription.unsubscribe();
    }
    if (this.roisubscription !== undefined) {
      this.soisubscription.unsubscribe();
    }
    if (this.clearSearchSub !== undefined) {
      this.clearSearchSub.unsubscribe();
    }
  }
}
