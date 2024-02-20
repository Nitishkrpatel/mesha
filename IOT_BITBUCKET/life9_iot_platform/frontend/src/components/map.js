import * as React from "react";
import Map from "react-map-gl";

import { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Card from "./card/Card.js";
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoic2ltbW1wbGUiLCJhIjoiY2wxeG1hd24xMDEzYzNrbWs5emFkdm16ZiJ9.q9s0sSKQFFaT9fyrC-7--g"; // Set your mapbox token her

export default function MapComponent() {
  return ( 
    <Card>
      {" "}
      <Map
        initialViewState={{
            latitude: 12.9716,
            longitude: 77.5946,
          zoom: 14,
        }}
        style={{ width: "100%", height: "100vh" }}
        mapStyle="mapbox://styles/simmmple/ckwxecg1wapzp14s9qlus38p0"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Marker longitude={77.59} latitude={12.97} anchor="bottom">

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  class="w-6 h-6"
  style={{ color: " #422AFB", height: "4rem", width: "4rem" }}
>
  <path
    fill-rule="evenodd"
    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
    clip-rule="evenodd"
  />
</svg>
</Marker>
      </Map>
    </Card>
  );
}