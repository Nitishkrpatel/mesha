import "react-calendar/dist/Calendar.css";

import React, { useEffect, useState } from "react";

import Calendar from "react-calendar";
import Chart from "react-apexcharts";
import axios from "axios";
import styles from "./Chart.module.css";

const LineChart = () => {
  const [chartData, setChartData] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    // Fetch the list of uploaded files on component mount
    fetchAlertData();
  }, [startDate, endDate]);

  // connecting to TD engine
  const username = "root";
  const password = "taosdata";
  const basicAuthHeader = "Basic " + btoa(`${username}:${password}`);

  const fetchAlertData = () => {
    const apiUrl = "http://192.168.31.231:6041/rest/sql/power";
    const sqlQuery = `select * from alerts where ts >= '${startDate.toISOString()}' and ts <= '${endDate.toISOString()}'`;

    axios
      .post(apiUrl, sqlQuery, {
        headers: {
          "Content-Type": "application/text",
          Authorization: basicAuthHeader,
        },
      })
      .then((response) => {
        const formattedData = {
          code: response.data.code,
          column_meta: response.data.column_meta.map((column) => ({
            [column[0]]: column[1],
          })),
          data: response.data.data.map((row) => ({
            [response.data.column_meta[0][0]]: row[0],
            [response.data.column_meta[1][0]]: row[1],
          })),
          rows: response.data.rows,
        };

        setChartData(formattedData);
        // Handle the formatted data as needed
      })
      .catch((error) => {
        console.error("Error fetching alert data:", error);
      });
  };

  // Options for the chart
  const chartOptions = {
    chart: {
      id: "line-chart",
    },
    xaxis: {
      categories: chartData
        ? chartData.data.map((item) => new Date(item.ts).toLocaleString())
        : [],
      labels: {
        rotate: 45,
        rotateAlways: true, // This property forces label rotation
        style: {
          fontSize: "12px",
        },
        offsetX: 40,
        offsetY: 75,
      },
      axisTicks: {
        show: true,
        position: "below",
      },
    },
    yaxis: {
      min: 0, // Set the minimum value of the y-axis to 0
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.calendarContainer}>
        <Calendar
          onChange={(date) => {
            // Assuming the calendar allows selecting a date range
            if (date.length === 1) {
              setStartDate(date[0]);
              setEndDate(date[0]);
            } else {
              setStartDate(date[0]);
              setEndDate(date[1]);
            }
          }}
          selectRange={true}
        />
      </div>
      {chartData && chartData.data.length > 0 && (
        <div className={styles.chartContainer}>
          <Chart
            options={chartOptions}
            series={[
              { data: chartData.data.map((item) => parseInt(item.v, 10)) },
            ]}
            type="line"
            height={350}
          />
        </div>
      )}
    </div>
  );
};

export default LineChart;
