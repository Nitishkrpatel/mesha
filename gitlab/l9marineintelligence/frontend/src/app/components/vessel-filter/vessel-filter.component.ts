
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { CookieService } from "ngx-cookie-service";
import { MatDatepicker } from "@angular/material/datepicker";
import { MessageService } from "../shared/message.service";
import { Moment } from "moment";
import { ServiceService } from "../shared/service.service";
import { ShareDataService } from "../shared/share-data.service";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { formatDate } from "@angular/common";

@Component({
  selector: "app-vessel-filter",
  templateUrl: "./vessel-filter.component.html",
  styleUrls: ["./vessel-filter.component.scss"],
})
export class VesselFilterComponent implements OnInit, OnDestroy {
  constructor(
    private service: ServiceService,
    private toastr: ToastrService,
    private cookieService: CookieService,
    private ShareDataservice: ShareDataService,
    private msgservice: MessageService
  ) {}

  vfsub!: Subscription;
  isloading = false;
  featureSelectedVF!: string;
  featureSelectedVFSidenav!: boolean;

  allCategory: any[] = [];
  selectedVFCategory: any[] = [];
  selectedvfcat: any[] = [];
  selectallvfcat!: boolean;

  extentsub!: Subscription;
  extent: any;

  deletingPreset = "";
  selectedPreset = "";

  searchOptions = [
    { name: "Ship Name", value: "name" },
    { name: "MMSI", value: "MMSI" },
    { name: "IMO", value: "IMO" },
    { name: "Country Of Origin", value: "Coo" },
    { name: "Destination", value: "dest" },
  ];
  selectallsearch!: boolean;
  selectedSearch: any = [];
  selectedSearchOption: any[] = [];
  searchresult: any[] = [];
  vesselFilterResultLKP: any[] = [];
  vesselFilterTrack: any[] = [];
  tracksLength = 0;
  psubmitted = false;
  presetExpanded = false;
  allPreset: any[] = [];

  addPresetFlag = false;

  UpdatevfSub!: Subscription;
  today = new Date();
  info:any = `Vessel Filter Date Selection Criteria
  1. FROM DATE and TO DATE cannot exceed user ship map plot-time.
  2. If only FROM DATE is selected, TO DATE shall be set to user ship map plot-time.
  3. If only TO DATE is selected, 7 days earlier to selected TO DATE is set as FROM DATE.
  4. If neither of dates are selected, TO DATE shall be set to user ship map plot-time and FROM DATE shall be 30minute interval from TO DATE.
  5. For Extent filter, DATE selection is mandatory.`
  
  @Output() VFSelectedEvent = new EventEmitter();
  @Output() VFSelectedMarkEvent = new EventEmitter();
  @Output() markextentEvent = new EventEmitter();
  @Output() deletePresetEvent = new EventEmitter();

  vesselFilterForm: FormGroup = new FormGroup({
    from_date: new FormControl(""),
    to_date: new FormControl(""),
  });

  SearchForm: FormGroup = new FormGroup({
    name: new FormControl(""),
    MMSI: new FormControl(""),
    IMO: new FormControl(""),
    Coo: new FormControl(""),
    dest: new FormControl(""),
  });

  AddPresetForm: any = new FormGroup({
    pname: new FormControl("", [Validators.required]),
  });

  get apf(): any {
    return this.AddPresetForm.controls;
  }

  ngOnInit(): void {
    this.extent = [];
    this.vfsub = this.ShareDataservice.VF.subscribe((message) => {
      if (message === "true") {
        this.onVfFeatureSelected();
      } else if (message === "false") {
        this.onVfFeatureUnselected();
      }
    });
  }

  onVfFeatureSelected() {
    this.updateActiveTextAndImage();
    this.VFSelectedEvent.emit("Restart Ship Map");
    if (this.featureSelectedVF === "true") {
      this.featureSelectedVFSidenav = !this.featureSelectedVFSidenav;
    } else {
      this.featureSelectedVFSidenav = true;
    }
    this.featureSelectedVF = "true";
    this.getAllCategory();
    this.UpdatevfSub = this.ShareDataservice.updatevf.subscribe((msg) => {
      if (msg === "update vessel filter list") {
        this.getAllPresets();
      }
      if (msg === "update vessel filter Delete") {
        if (this.deletingPreset === this.selectedPreset) {
          this.vesselFilterResultLKP = [];
          this.VFSelectedEvent.emit(this.vesselFilterResultLKP);
          this.VFSelectedEvent.emit("Restart Ship Map");
          this.vesselFilterTrack = [];
          this.tracksLength = 0;
          this.VFSelectedMarkEvent.emit("remove");
        }
      }
    });
  }

  onVfFeatureUnselected() {
    this.resetActiveTextAndImage();
    this.featureSelectedVF = "false";
    this.featureSelectedVFSidenav = false;
    this.VFSelectedMarkEvent.emit("remove");
  }

  // Function to update active text and image
  updateActiveTextAndImage() {
    const regionOfInterestName = document.getElementById("Vessel Filter_name");
    if (regionOfInterestName !== null) {
      regionOfInterestName.setAttribute("class", "active_text");
    }
    const regionOfInterestImg = document.getElementById("Vessel Filter_img");
    if (regionOfInterestImg) {
      regionOfInterestImg.setAttribute(
        "src",
        "assets/side-nav/selected_features_orange/Vessel-Filter.svg"
      );
    }
  }

  // Function to reset active text and image
  resetActiveTextAndImage() {
    const regionOfInterestName = document.getElementById("Vessel Filter_name");
    if (regionOfInterestName !== null) {
      regionOfInterestName.setAttribute("class", "");
    }
    const regionOfInterestImg = document.getElementById("Vessel Filter_img");
    if (regionOfInterestImg) {
      regionOfInterestImg.setAttribute(
        "src",
        "assets/side-nav/Vessel-Filter.svg"
      );
    }
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

  // clearing Date & Time
  clearDateTime(): void {
    this.vesselFilterForm.setValue({ from_date: "", to_date: "" });
  }

  // click on select all check box for category
  onSelectAll(event: any): void {
    if (event.target.checked === true) {
      this.selectedVFCategory = [];
      this.selectedvfcat = [];
      this.selectallvfcat = false;
      this.allCategory.forEach((cat) => {
        this.selectedVFCategory.push(cat);
        this.selectedvfcat[cat] = true;
      });
      this.selectallvfcat = true;
    } else {
      this.selectedVFCategory = [];
      this.selectedvfcat = [];
      this.selectallvfcat = false;
    }
  }

  // click on select check box for individual category
  vfShiptypecheckboxchange(e: any): void {
    if (e.target.checked) {
      this.selectedVFCategory.push(e.target.value);
      this.selectedvfcat[e.target.value] = true;
    } else {
      const index = this.selectedVFCategory.indexOf(e.target.value);
      if (index > -1) {
        this.selectedVFCategory.splice(index, 1);
      }
      this.selectedvfcat[e.target.value] = false;
      this.selectallvfcat = false;
    }
  }

  // On Select all search
  onSelectAllSearch(event: any): void {
    if (event.target.checked === true) {
      this.searchOptions.forEach((option: any) => {
        this.selectedSearchOption.push(option.value);
        this.selectedSearch[option.value] = true;
        document
          .getElementById(option.value + "_inputdiv")!
          .setAttribute("style", "display: block");
      });
      this.selectallsearch = true;
    } else {
      this.selectedSearchOption = [];
      this.selectedSearch = [];
      this.selectallsearch = false;
      this.searchOptions.forEach((option) => {
        document
          .getElementById(option.value + "_inputdiv")!
          .setAttribute("style", "display: none");
        document
          .getElementById(option.value + "_result")!
          .setAttribute("style", "display: none");
      });
    }
    this.SearchForm.setValue({
      name: "",
      MMSI: "",
      IMO: "",
      Coo: "",
      dest: "",
    });
  }

  // On select for individual checkbox
  searchCheckBoxChange(e: any): void {
    if (e.target.checked) {
      this.selectedSearchOption.push(e.target.value);
      this.selectedSearch[e.target.value] = true;
      document
        .getElementById(e.target.value + "_inputdiv")!
        .setAttribute("style", "display: block");
    } else {
      const index = this.selectedSearchOption.indexOf(e.target.value);
      if (index > -1) {
        this.selectedSearchOption.splice(index, 1);
      }
      this.selectedSearch[e.target.value] = false;
      this.selectallsearch = false;
      document
        .getElementById(e.target.value + "_inputdiv")!
        .setAttribute("style", "display: none");
      document
        .getElementById(e.target.value + "_result")!
        .setAttribute("style", "display: none");
      this.setSearchFormValues("", e.target.value);
    }
  }

  onSearchkeyup(id: any, e: any): void {
    let fromDate = "";
    let toDate = "";
    if (this.vesselFilterForm.value.from_date !== "") {
      fromDate = formatDate(
        <any>this.vesselFilterForm.value.from_date,
        "yyyy-MM-dd HH:mm:ss",
        "en-US"
      );
    }
    if (this.vesselFilterForm.value.to_date !== "") {
      toDate = formatDate(
        <any>this.vesselFilterForm.value.to_date,
        "yyyy-MM-dd HH:mm:ss",
        "en-US"
      );
    }
    const reqData = {
      criteria: id,
      search_txt: e.target.value,
      from_date: fromDate,
      to_date: toDate,
      timestamp: this.cookieService.get("plotTime"),
    };
    this.isloading = true;
    this.service.getSearchResultInVesselFilter(reqData).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          this.searchresult = data.data;
          this.isloading = false;
          document
            .getElementById(id + "_result")!
            .setAttribute("style", "display: block");
        }
      },
      error: (error: any) => {
        this.msgservice.postErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // on search input focus
  onSearchFocus(): void {
    this.searchOptions.forEach((option) => {
      if (document.getElementById(option.value + "_result") !== null) {
        document
          .getElementById(option.value + "_result")!
          .setAttribute("style", "display: none");
      }
    });
  }

  // selected a searched option
  selectedOption(value: any, category: any): void {
    document
      .getElementById(category + "_result")!
      .setAttribute("style", "display: none");
    this.setSearchFormValues(value, category);
  }

  //method to set form values
  setSearchFormValues(value: any, type: string): void {
    const formValues = { ...this.SearchForm.value }; // Create a copy of the current form values
    formValues[type] = value; // Update the specific field based on the 'type' parameter
    this.SearchForm.setValue(formValues); // Set the updated form values
  }

  toggleExtent(): void {
    const extentSwitch = document.getElementById("extent-switch");
    if (!extentSwitch) {
      console.error("Element with ID 'extent-switch' not found.");
      return;
    }

    const src = extentSwitch.getAttribute("src");
    const isSwitchOff = src === "../../../assets/vf/switch-offf.svg";

    if (isSwitchOff) {
      const fromDate = this.vesselFilterForm.value.from_date;
      const toDate = this.vesselFilterForm.value.to_date;

      if (!fromDate || !toDate) {
        this.toastr.warning(
          "From date / to date should be selected to select a region.",
          "",
          {
            timeOut: 3000,
          }
        );
      } else {
        extentSwitch.setAttribute("src", "../../../assets/vf/switch-on.svg");
        this.markextentEvent.emit("yes");

        this.extentsub = this.ShareDataservice.Extent.subscribe((message) => {
          if (message !== "") {
            this.extent = message[0];
          }
        });
      }
    } else {
      extentSwitch.setAttribute("src", "../../../assets/vf/switch-offf.svg");
      this.markextentEvent.emit("no");
    }
  }

  submitVF(isSave: any): void {
    document
      .getElementById("vf-submit")!
      .setAttribute("class", "btn VF-submit-btn active-btn");
    this.vesselFilterResultLKP = [];
    this.vesselFilterTrack = [];
    this.tracksLength = 0;
    let reqData;
    let fromDate = "";
    let toDate = "";
    if (this.vesselFilterForm.value.from_date !== "") {
      fromDate = formatDate(
        <any>this.vesselFilterForm.value.from_date,
        "yyyy-MM-dd HH:mm:ss",
        "en-US"
      );
    }
    if (this.vesselFilterForm.value.to_date !== "") {
      toDate = formatDate(
        <any>this.vesselFilterForm.value.to_date,
        "yyyy-MM-dd HH:mm:ss",
        "en-US"
      );
    }
    if (this.extent.length !== 0) {
      reqData = {
        from_date: fromDate,
        to_date: toDate,
        search_text: this.SearchForm.value,
        category: this.selectedVFCategory,
        top_left_coord: this.extent[3],
        top_right_coord: this.extent[2],
        bottom_right_coord: this.extent[1],
        bottom_left_coord: this.extent[0],
        timestamp: this.cookieService.get("plotTime"),
        isSave: isSave,
        preset_name: this.AddPresetForm.value.pname,
      };
    } else {
      reqData = {
        from_date: fromDate,
        to_date: toDate,
        search_text: this.SearchForm.value,
        category: this.selectedVFCategory,
        top_left_coord: "",
        top_right_coord: "",
        bottom_right_coord: "",
        bottom_left_coord: "",
        timestamp: this.cookieService.get("plotTime"),
        isSave: isSave,
        preset_name: this.AddPresetForm.value.pname,
      };
    }
    this.isloading = true;
    this.service.getVesselFilterData(reqData).subscribe({
      next: (data: any) => {
        if (data.status === "success") {
          document
            .getElementById("vf-submit")!
            .setAttribute("class", "btn VF-submit-btn");
          const extentSwitch: any = document.getElementById("extent-switch");
          extentSwitch.setAttribute(
            "src",
            "../../../assets/vf/switch-offf.svg"
          );

          this.vesselFilterResultLKP = data.data;
          this.ShareDataservice.changeVesselCount(
            this.vesselFilterResultLKP.length
          );
          this.vesselFilterResultLKP.forEach((mmsi) => {
            mmsi.timestamp = data.plottime;
            mmsi.fromdate = data.from_date;
            mmsi.todate = data.to_date;
            mmsi.vfData = true;
          });
          this.vesselFilterTrack = data.tracks;
          this.tracksLength = this.vesselFilterTrack.length;
          this.VFSelectedEvent.emit("Stop Ship Map");
          this.VFSelectedEvent.emit(this.vesselFilterResultLKP);
          this.getAllPresets();
          this.isloading = false;
        }
      },
      error: (error: any) => {
        if (error.status === "failure") {
          this.AddPresetForm.controls.pname.setErrors({ duplicate: true });
        } else {
          this.msgservice.postErrorFunc(error);
        }
        document
          .getElementById("vf-submit")!
          .setAttribute("class", "btn VF-submit-btn");
        this.isloading = false;
      },
    });
  }

  // Open input box to add preset
  openAddPresetInput(addPreset: any): void {
    this.addPresetFlag = addPreset;
    if (this.addPresetFlag === true) {
      this.getAllPresets();
      document
        .getElementById("presetInputform")!
        .setAttribute("style", "display: block");
      this.presetExpanded = true;
    }
  }

  addPreset(isSave: any): void {
    this.psubmitted = true;
    if (this.AddPresetForm.invalid) {
      return;
    }
    this.submitVF(isSave);
  }

  resetFilter() {
    document
      .getElementById("presetInputform")!
      .setAttribute("style", "display: none");
    this.addPresetFlag = false;
    this.vesselFilterForm.setValue({ from_date: "", to_date: "" });
    this.SearchForm.setValue({
      name: "",
      MMSI: "",
      IMO: "",
      Coo: "",
      dest: "",
    });
    this.AddPresetForm.setValue({ pname: "" });
    this.selectedVFCategory = [];
    this.extent = [];
    this.selectedvfcat = [];
    this.selectedSearch = [];
    this.vesselFilterResultLKP = [];

    this.VFSelectedEvent.emit(this.vesselFilterResultLKP);
    this.VFSelectedEvent.emit("Restart Ship Map");
    this.tracksLength = 0;
    this.VFSelectedMarkEvent.emit("remove add");
    this.vesselFilterTrack = [];
    this.searchOptions.forEach((option) => {
      document
        .getElementById(option.value + "_inputdiv")!
        .setAttribute("style", "display: none");
      document
        .getElementById(option.value + "_result")!
        .setAttribute("style", "display: none");
    });
  }

  getAllPresets(): void {
    this.isloading = true;
    this.service.getAllPreset().subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.allPreset = result.data;
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  presetSelectionChange(pid: any): void {
    this.VFSelectedMarkEvent.emit("remove");
    this.selectedPreset = pid;
    this.vesselFilterResultLKP = [];
    this.vesselFilterTrack = [];
    this.tracksLength = 0;
    this.isloading = true;
    this.service.getPresetResults(pid).subscribe({
      next: (result: any) => {
        if (result.status === "success") {
          this.vesselFilterResultLKP = result.data[0].ships;
          this.ShareDataservice.changeVesselCount(
            this.vesselFilterResultLKP.length
          );
          if (this.vesselFilterResultLKP.length === 0) {
            this.toastr.warning("Saved preset has no result", "", {
              timeOut: 5000,
            });
          }
          this.vesselFilterTrack = result.data[0].track_count;
          this.tracksLength = this.vesselFilterTrack.length;
          this.vesselFilterResultLKP.forEach((mmsi) => {
            mmsi.timestamp = result.data[0].plot_time;
            mmsi.fromdate = result.data[0].from_date;
            mmsi.todate = result.data[0].to_date;
            mmsi.vfData = true;
          });
          this.VFSelectedEvent.emit("Stop Ship Map");
          this.VFSelectedEvent.emit(this.vesselFilterResultLKP);
          const extent = [
            [
              result.data[0].coords.bottom_left_coord,
              result.data[0].coords.bottom_right_coord,
              result.data[0].coords.top_right_coord,
              result.data[0].coords.top_left_coord,
              result.data[0].coords.bottom_left_coord,
            ],
          ];
          this.VFSelectedMarkEvent.emit(extent);
          this.isloading = false;
        }
      },
      error: (error: any) => {
        this.msgservice.getErrorFunc(error);
        this.isloading = false;
      },
    });
  }

  // Delete Preset
  deletePreset(id: any, name: any): void {
    this.deletingPreset = id;
    const data = { pid: id, pname: name };
    this.deletePresetEvent.emit(data);
  }

  ngOnDestroy(): void {
    if (this.vfsub !== undefined) {
      this.vfsub.unsubscribe();
    }
    if (this.extentsub !== undefined) {
      this.extentsub.unsubscribe();
    }
    if (this.UpdatevfSub !== undefined) {
      this.UpdatevfSub.unsubscribe();
    }
  }
}
