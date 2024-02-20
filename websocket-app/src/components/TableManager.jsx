import DataTable from "./DataTable";
// TableManager.jsx
import React from "react";

const TableManager = ({ deviceData }) => {
  console.log(deviceData);
  return (
    <div>
      {deviceData.map((device) => (
        <DataTable
          key={device.thingId}
          data={device}
          thingId={device.thingId}
        />
      ))}
    </div>
  );
};

export default TableManager;
