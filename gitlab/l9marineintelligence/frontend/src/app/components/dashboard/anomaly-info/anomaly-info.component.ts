import { ActivatedRoute, Router } from "@angular/router";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";

import { AnomalyInfoService } from "../../shared/anomaly-info.service";

@Component({
  selector: "app-anomaly-info",
  templateUrl: "./anomaly-info.component.html",
  styleUrls: ["./anomaly-info.component.scss"],
})
export class AnomalyInfoComponent implements OnInit {
  isExpanded = false;
  collapseNav = true;
  dashboardData = [
    { name: "Overview", img: "Overview" },
    { name: "Ship Type Anomalies", img: "Ship Type Anomalies" },
    { name: "Speed Anomalies", img: "Speed Anomalies" },
    { name: "Transmission Anomalies", img: "Transmission Anomalies" },
    { name: "Overlapping Anomalies", img: "Overlapping Anomalies" },
  ];

  constructor(
    private AnomalyService: AnomalyInfoService,
    private cdRef: ChangeDetectorRef,
    private Activatedroute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.changeDashboard("Overview");
    this.Activatedroute.queryParams.subscribe((params) => {
      if (params["f"] === "Transmission Anomaly(TA)") {
        this.changeDashboard("Transmission Anomalies");
      } else if (params["f"] === "Speed Anomaly(SA)") {
        this.changeDashboard("Speed Anomalies");
      } else if (params["f"] === "Shiptype Anomaly(STA)") {
        this.changeDashboard("Ship Type Anomalies");
      } else if (params["f"] === "Overlapping") {
        this.changeDashboard("Overlapping Anomalies");
      }

      //  condition for not showing shiptype and overlapping when we are not coming from dashboard to anomalyinfo
      if (params["f"] === undefined) {
        // this.dashboardData = this.dashboardData.slice().splice(0,4);
      }
      // console.log(params["f"],this.dashboardData);
    });
  }

  // Toggle First Sidenav bar
  toggleFirstSidenav(): void {
    this.isExpanded = !this.isExpanded;
  }

  // change features in dashboard
  changeDashboard(f: string): void {
    this.AnomalyService.changedToSpeedAnoamly("false");
    this.AnomalyService.changedToTransmissionAnoamly("false");
    this.AnomalyService.changedToShipTypeAnoamly("false");
    this.AnomalyService.changedToOverview("false");
    this.AnomalyService.changedToOverlappingAnoamly("false");

    switch (f) {
      case "Overview":
        this.AnomalyService.changedToOverview("true");
        this.router.navigateByUrl("/anomaly-info");
        break;
      case "Ship Type Anomalies":
        this.AnomalyService.changedToShipTypeAnoamly("true");
        break;
      case "Speed Anomalies":
        this.AnomalyService.changedToSpeedAnoamly("true");
        break;
      case "Transmission Anomalies":
        this.AnomalyService.changedToTransmissionAnoamly("true");
        break;
      case "Overlapping Anomalies":
        this.AnomalyService.changedToOverlappingAnoamly("true");
        break;
      default:
        break;
    }
    // Trigger change detection explicitly
    this.cdRef.detectChanges();
  }
}
