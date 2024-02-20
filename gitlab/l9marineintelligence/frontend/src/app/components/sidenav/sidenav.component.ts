import { Component, EventEmitter, OnInit, Output } from "@angular/core";

import { CookieService } from "ngx-cookie-service";
import { MessageService } from "../shared/message.service";
import { Router } from "@angular/router";
import { ServiceService } from "../shared/service.service";
import { ShareDataService } from "../shared/share-data.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-sidenav",
  templateUrl: "./sidenav.component.html",
  styleUrls: ["./sidenav.component.scss"],
})
export class SidenavComponent implements OnInit {
  isExpanded = false;
  rolefeatures: any[] = [];
  vesselCount!: number;
  vesselCountSub!: Subscription;
  zoomLevel!: number;
  zoomLevelSub!: Subscription;
  fullScreen!: string;
  collapseNav = true;
  plotTime: any;
  timeSub!: Subscription;

  @Output() fullscreenEvent = new EventEmitter<string>();
  @Output() rolFeaturesEvent = new EventEmitter();

  constructor(
    private service: ServiceService,
    private msgservice: MessageService,
    private ShareDataservice: ShareDataService
  ) {}

  ngOnInit(): void {
    this.getFeatureForRole();
    this.vesselCountSub = this.ShareDataservice.vesselCount.subscribe(
      (message) => {
        this.vesselCount = message;
      }
    );
    this.timeSub = this.ShareDataservice.time.subscribe((message) => {
      this.plotTime = message;
    });
    this.zoomLevelSub = this.ShareDataservice.zoomLevel.subscribe((msg) => {
      this.zoomLevel = msg;
    });
  }

  getFeatureForRole(): void {
    this.service.getFeatureForRole().subscribe(
      (result: any) => {
        if (result.status === "success") {
          this.rolefeatures = result.data;
          this.rolFeaturesEvent.emit(this.rolefeatures);
        }
      },
      (error: any) => {
        this.msgservice.getErrorFunc(error);
      }
    );
  }

  // Toggle First Sidenav bar

  toggleFirstSidenav(): void {
    this.isExpanded = !this.isExpanded;

    const collapseSidenav = document.getElementById("collapse-sidenav");
    const secondNavbar = document.getElementById("secondnavbar");

    const expandedStyles = {
      collapseSidenav: "left: 475px; display: block;",
      secondNavbar:
        "left: 212px; display: block; padding: 0px; position: fixed; z-index: 1; width: 280px;",
    };

    const collapsedStyles = {
      collapseSidenav: "left: 350px; display: block;",
      secondNavbar:
        "left: 75px; display: block; padding: 0px; position: fixed; z-index: 1; width: 280px;",
    };

    if (this.isExpanded && this.collapseNav) {
      collapseSidenav?.setAttribute("style", expandedStyles.collapseSidenav);
      secondNavbar?.setAttribute("style", expandedStyles.secondNavbar);
    } else if (!this.isExpanded && this.collapseNav) {
      collapseSidenav?.setAttribute("style", collapsedStyles.collapseSidenav);
      secondNavbar?.setAttribute("style", collapsedStyles.secondNavbar);
    }
  }

  // View fullscreen map
  fullscreen(): void {
    this.fullscreenEvent.emit("yes");
  }

  // Switching between features
  changeFeature(f: any): void {
    const ShareDataservice = this.ShareDataservice;
    // Clear search
    ShareDataservice.clearSearch("true");
    const collapseSidenav = document.getElementById("collapse-sidenav");
    const secondNavbar = document.getElementById("secondnavbar");

    const expandedStyles = {
      collapseSidenav: "left: 475px; display: block;",
      secondNavbar:
        "left: 212px; display: block; padding: 0px; position: fixed; z-index: 1; width: 280px;",
    };

    const collapsedStyles = {
      collapseSidenav: "left: 350px; display: block;",
      secondNavbar:
        "left: 75px; display: block; padding: 0px; position: fixed; z-index: 1; width: 280px;",
    };

    if (this.isExpanded && this.collapseNav) {
      collapseSidenav?.setAttribute("style", expandedStyles.collapseSidenav);
      secondNavbar?.setAttribute("style", expandedStyles.secondNavbar);
    } else if (!this.isExpanded && this.collapseNav) {
      collapseSidenav?.setAttribute("style", collapsedStyles.collapseSidenav);
      secondNavbar?.setAttribute("style", collapsedStyles.secondNavbar);
    }

    // Handle different values of `f`
    switch (f) {
      case "Ships of Interest":
        ShareDataservice.changedtoSOI("true");
        ShareDataservice.changedtoROI("false");
        ShareDataservice.changedtoVF("false");
        break;
      case "Region of Interest":
        ShareDataservice.changedtoSOI("false");
        ShareDataservice.changedtoROI("true");
        ShareDataservice.changedtoVF("false");
        break;
      case "Vessel Filter":
        ShareDataservice.changedtoSOI("false");
        ShareDataservice.changedtoROI("false");
        ShareDataservice.changedtoVF("true");
        break;
      default:
        // Handle the default case if needed
        break;
    }
  }

  // changing all feature to false.
  ngOnDestroy(): void {
    this.ShareDataservice.changedtoSOI("false");
    this.ShareDataservice.changedtoROI("false");
    this.ShareDataservice.changedtoVF("false");
    if (this.vesselCountSub !== undefined) {
      this.vesselCountSub.unsubscribe();
    }
    if (this.zoomLevelSub !== undefined) {
      this.zoomLevelSub.unsubscribe();
    }
    if (this.timeSub !== undefined) {
      this.timeSub.unsubscribe();
    }
  }
}
