// import 'highcharts/modules/venn.js';

import * as Highcharts from "highcharts";

import { Component, OnInit } from "@angular/core";

import { AnomalyInfoService } from "../../shared/anomaly-info.service";
import { CookieService } from "ngx-cookie-service";
import { MessageService } from "../../shared/message.service";
import { Router } from "@angular/router";
import { ServiceService } from "../../shared/service.service";
import { ShareDataService } from "../../shared/share-data.service";
import { Subscription } from "rxjs";
import venn from "highcharts/modules/venn";

venn(Highcharts);

@Component({
  selector: "app-overview",
  templateUrl: "./overview.component.html",
  styleUrls: ["./overview.component.scss"],
})
export class OverviewComponent implements OnInit {
  shipCount: number = 0;
  chartData: any[] = [];
  indianShipsChartData: any[] = [];
  neighbouringcountryshipdata: any[] = [];
  totalneighbouringcountryshipcount: number = 0;
  indianShipsCount: number = 0;
  showOverview = false;
  overviewSub!: Subscription;

  //anomaly
  speedAnomalies: any = 0;
  shipTypeAnomalies: any = 0;
  transmissionAnomalies: any = 0;
  atLeastOneMMSI: any = 0;
  allTrajectoyList: any;
  vennChartData: any;

  // colors
  
  colors = [
    "#32CD32", // Lime Green
    "#FF6666", // Coral
    "#6666FF", // Medium Blue
    "#FFFF66", // Canary Yellow
    "#FF66FF", // Orchid
    "#66FFFF", // Light Blue (Medium Cyan)
    "#808080", // Gray
    "#FFC0CB", // Pink (Medium contrast with Gray)
    "#993399", // Medium Purple
    "#FF8C00", // Dark Orange (Medium contrast with Gray)
    "#006400", // Dark Green (Medium contrast with Gray)
    "#800000", // Maroon
    "#808080", // Gray (Repeated color for consistency)
    "#D2B48C", // Tan
    "#B87333", // Copper
    "#FFD700", // Gold (Medium contrast with Gray)
    "#32CD99", // Sea Green
    "#20B2AA", // Light Sea Green (Medium contrast with Gray)
    "#8B4513", // Saddle Brown
    "#FF6347", // Tomato
    "#FF7F50", // Coral (Medium contrast with Gray)
    "#5F9EA0", // Cadet Blue
    "#800000", // Maroon (Repeated color for consistency)
    "#BA55D3", // Medium Orchid
  ]


  constructor(
    private cookieService: CookieService,
    private service: ServiceService,
    private msgservice: MessageService,
    private AnomalyService: AnomalyInfoService,
    private ShareDataservice: ShareDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chartData = [];
    this.indianShipsChartData = [];
    this.neighbouringcountryshipdata = [];
  }

  ngAfterViewInit(): void {
    this.overviewSub = this.AnomalyService.Overview.subscribe((msg) => {
      if (msg === "true") {
        this.showOverview = true;
        this.chartData = [];
        this.indianShipsChartData = [];
        this.neighbouringcountryshipdata = [];
        this.getOverviewData();
        this.getNeighbouringCountryShipCount();
        this.getVennChartDataDetails();
        if (document.getElementById("Overview") !== null) {
          document
            .getElementById("Overview_img")!
            .setAttribute("src", "assets/anomaly-info/selected/Overview.svg");
          if (document.getElementById("Overview_name") !== null) {
            document.getElementById("Overview_name")!.style.color = "#FFBE3D";
          }
        }
      } else {
        this.showOverview = false;
        this.chartData = [];
        this.indianShipsChartData = [];
        this.neighbouringcountryshipdata = [];
        if (document.getElementById("Overview") !== null) {
          document
            .getElementById("Overview_img")!
            .setAttribute("src", "assets/anomaly-info/Overview.svg");
          if (document.getElementById("Overview_name") !== null) {
            document.getElementById("Overview_name")!.style.color = "white";
          }
        }
      }
    });
  }

  getOverviewData() {
    this.chartData = [];
    this.indianShipsChartData = [];
    this.service
      .getOverviewData({ timestamp: this.cookieService.get("plotTime") })
      .subscribe({
        next: (result: any) => {
          if (result.status === "success") {
            this.shipCount = result.count;
            this.indianShipsCount = result.india_count;
            result.data.forEach((type: any) => {
              this.chartData.push({
                name: type.category,
                data: [type.count],
                type: "bar",
              });
            });
            result.india_data.forEach((type: any) => {
              this.indianShipsChartData.push({
                name: type.category,
                y: type.count,
                type: "bar",
              });
            });
            this.plotBarChart(this.chartData, "Ships by category");
            this.plotChartForIndianShips(
              this.indianShipsChartData,
              "Indian ships by category"
            );
          }
        },
        error: (error: any) => {
          this.msgservice.getErrorFunc(error);
        },
      });
  }

  plotBarChart(chartdata: any, title: any) {
    // Filter out series with zero values
    const filteredChartData = chartdata.filter((series: any) => {
      return series.data.some((point: any) => point.y !== 0);
    });
  
    if (filteredChartData.length >= 1) {
      const xaxisLabel: any = [];
      filteredChartData.forEach((c: any) => {
        xaxisLabel.push("");
      });
      Highcharts.chart("highcharts", {
        chart: {
          type: "bar",
          margin: [0, 0, 5, 5],
        },
        title: {
          text: title,
        },
        xAxis: {
          labels: {
            enabled: false,
          },
          categories: xaxisLabel,
        },
        yAxis: {
          min: 0,
          title: {
            text: "Vessel count",
          },
        },
        tooltip: {
          pointFormat: "{series.name}: <b>{point.y}</b>",
        },
        plotOptions: {
          bar: {
            pointPadding: 0.25,
            pointWidth: 10,
            dataLabels: {
              enabled: true,
              format: "{y}",
              style: {
                fontWeight: "bold",
              },
            },
          },
        },
        legend: {
          enabled: true,
          align: "right",
          verticalAlign: "bottom",
          margin: 50,
          layout: "horizontal",
          itemStyle: {
            fontWeight: "bold",
            fontSize: "10px",
          },
        },
        colors: this.colors,
        series: filteredChartData,
      });
    } else {
      document.getElementById("highcharts")!.innerHTML = "No Graph Data";
    }
  }
  

  getNeighbouringCountryShipCount() {
    this.service
      .getNeighbouringCountryShipCount({
        timestamp: this.cookieService.get("plotTime"),
      })
      .subscribe({
        next: (result: any) => {
          if (result.status === "success") {
            this.neighbouringcountryshipdata = result.data;
            this.totalneighbouringcountryshipcount = result.total_count;
          }
        },
        error: (error: any) => {
          this.msgservice.getErrorFunc(error);
        },
      });
  }

  plotChartForIndianShips(chartdata: any, title: any) {
    // Create the chart
    const chartOptions: any = {
      chart: {
        type: "pie",
      },
      title: {
        text: "Indian origin ships by category",
        align: "center",
      },
      plotOptions: {
        pie: {
          shadow: false,
          center: ["50%", "50%"],
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.percentage:.1f} %",
            fontSize: "4px",
          },
        },
      },
      colors:this.colors,
      series: [
        {
          name: "count",
          data: chartdata,
          size: "90%",
        },
      ],
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 400,
            },
            chartOptions: {
              series: [
                {},
                {
                  id: "versions",
                  dataLabels: {
                    enabled: false,
                  },
                },
              ],
            },
          },
        ],
      },
    };
    // Get the container element
    const container = document.getElementById("container");

    // Create the chart with the defined options
    if (container) {
      Highcharts.chart(container as any, chartOptions);
    } else {
      console.error("Container element not found.");
    }
  }

  // draw pie chart getVennChartData

  getVennChartDataDetails(): void {
    const reqdata = this.cookieService.get("plotTime");
    this.service.getVennChartData(reqdata).subscribe({
      next: (data) => {
        if (data.status === "success") {
          this.speedAnomalies = data.speed;
          this.shipTypeAnomalies = data.type;
          this.transmissionAnomalies = data.trans;
          this.allTrajectoyList = data.traj_list;
          this.vennChartData = data.data;
          this.atLeastOneMMSI = data.mmsi;
          this.plotVennDiagramChart(data.data);
        }
      },
      error: (error) => {
        this.msgservice.getErrorFunc(error);
      },
    });
  }

  plotVennDiagramChart(chartData: any) {
    if (chartData.length >= 1) {
      // document.getElementById("chartButton")!.style.display = "block";
      const chartOptions: any = {
        plotOptions: {
          series: {
            cursor: "pointer",
            point: {
              events: {
                click: this.vennDiagramSetsFun.bind(this),
                legendItemClick: function () {
                  return false;
                },
              },
            },
            
          },
        },
        series: [
          {
            type: "venn",
            data: chartData,
            dataLabels: {
              enabled: true, // Set to true to show data labels
              allowOverlap: false,
              rotation: 0,
              distance: 1000,
              format: "{point.name}: {point.value}", // Show name and count
            },
          },
        ],
        title: {
          text: "Overlapping Anomalies",
        },
      };

      // Get the container element
      const container = document.getElementById("vennchart");

      // Create the chart with the defined options
      if (container) {
        Highcharts.chart(container as any, chartOptions);
      } else {
        console.error("Container element not found.");
      }
    } else {
      document.getElementById("vennchart")!.innerHTML = "No Graph Data";
    }
  }

  vennDiagramSetsFun(data: any) {
    const anomaly_button = document.querySelectorAll(".anomaly_btn");
    anomaly_button.forEach((btn: any) => {
      btn.style.backgroundColor = "";
    });

    const element = document.getElementById(data.point.name);

    if (element) {
      element.style.backgroundColor = "#FFBE3D";
    }
  }

  getAnomalyDetails(anomalyType: any) {
    switch (anomalyType) {
      case "TA&SA":
        this.ShareDataservice.getOverlappingAnomalyTrajList(
          this.allTrajectoyList.trans_speed
        );
        anomalyType = "Overlapping";
        break;
      case "TA&STA":
        this.ShareDataservice.getOverlappingAnomalyTrajList(
          this.allTrajectoyList.trans_type
        );
        anomalyType = "Overlapping";
        break;
      case "SA&STA":
        this.ShareDataservice.getOverlappingAnomalyTrajList(
          this.allTrajectoyList.speed_type
        );
        anomalyType = "Overlapping";
        break;
      case "TA&SA&STA":
        this.ShareDataservice.getOverlappingAnomalyTrajList(
          this.allTrajectoyList.trans_speed_type
        );
        anomalyType = "Overlapping";
        break;
      default:
        break;
    }
    this.router.navigateByUrl("/anomaly-info?f=" + anomalyType);
    const anomaly_button = document.querySelectorAll(".anomaly_btn");
    anomaly_button.forEach((btn: any) => {
      btn.style.backgroundColor = "";
    });

    const element = document.getElementById(anomalyType);

    if (element) {
      element.style.backgroundColor = "#FFBE3D";
    }
  }
}
