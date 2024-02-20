// Details.js
import React from "react";

const Details = ({ selectedNode }) => {
  return (
    <div>
      <h2>Details</h2>
      {selectedNode && (
        <div>
          <p>ID: {selectedNode.id}</p>
          <p>Label: {selectedNode.label}</p>
          {/* Add more details as needed */}
        </div>
      )}
    </div>
  );
};

export default Details;
