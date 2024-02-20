import "./DataTable.css";

// DataTable.jsx
import React from "react";

const DataTable = ({ data, thingId }) => {
  console.log(data);
  const dataArray = [data];
  const tableId = `table-${thingId}`;

  return (
    <table className={`table-container ${tableId}`}>
      <thead>
        <tr className={`table-header ${tableId}`}>
          <th className={`table-header ${tableId}`}>Thing ID</th>
          <th className={`table-header ${tableId}`}>Policy ID</th>
          <th className={`table-header ${tableId}`}>Location</th>
          <th className={`table-header ${tableId}`}>Status</th>
          <th className={`table-header ${tableId}`}>Alert</th>
          <th className={`table-header ${tableId}`}>BV</th>
        </tr>
      </thead>
      <tbody>
        {dataArray.map((item) => (
          <tr key={item.thingId} className={`table-row ${tableId}`}>
            <td className={`table-cell ${tableId}`}>{item.thingId}</td>
            <td className={`table-cell ${tableId}`}>{item.policyId}</td>
            <td className={`table-cell ${tableId}`}>
              {item.attributes.location}
            </td>
            <td className={`table-cell ${tableId}`}>
              {item.features.status.properties.value}
            </td>
            <td className={`table-cell ${tableId}`}>
              {item.features.alert.properties.value}
            </td>
            <td className={`table-cell ${tableId}`}>
              {item.features.bv.properties.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
