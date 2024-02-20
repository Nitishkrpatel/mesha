// App.js
import React, { useEffect, useState } from "react";

import Details from "./Details.jsx";
import Tree from "./Tree.jsx";

// import axios from "axios";

// import treeData from "./TreeData.js";

const treeData = [
  {
    id: 1,
    label: "Block 1",
    children: [
      {
        id: 2,
        label: "Floor 1",
        children: [
          {
            id: 3,
            label: "Apartment 101",
          },
          {
            id: 4,
            label: "Apartment 102",
          },
        ],
      },
      {
        id: 5,
        label: "Floor 2",
        children: [
          {
            id: 6,
            label: "Apartment 201",
          },
          {
            id: 7,
            label: "Apartment 202",
          },
        ],
      },
    ],
  },
  {
    id: 8,
    label: "Block 2",
    children: [
      {
        id: 9,
        label: "Floor 1",
        children: [
          {
            id: 10,
            label: "Apartment 301",
          },
          {
            id: 11,
            label: "Apartment 302",
          },
        ],
      },
      {
        id: 12,
        label: "Floor 2",
        children: [
          {
            id: 13,
            label: "Apartment 401",
          },
          {
            id: 14,
            label: "Apartment 402",
          },
        ],
      },
    ],
  },
];

const TreeView = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  // const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    // Fetch tenant list from the API when the component mounts
    // fetchTreeData("life9_bms", "block1.gf.apartment");
  }, []);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  // const fetchTreeData = async (solution_id, path) => {
  //   try {
  //     const response = await axios.get(
  //       `http://192.168.31.249:5010/tree_view?solution_id=${solution_id}&path=${path}`
  //     );
  //     setTreeData(response.data.tenants_list);
  //   } catch (error) {
  //     console.error("Error fetching tenant list:", error);
  //   }
  // };

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1 }}>
        <Tree data={treeData} onNodeClick={handleNodeClick} />
      </div>
      <div style={{ flex: 1, marginLeft: "20px" }}>
        <Details selectedNode={selectedNode} />
      </div>
    </div>
  );
};

export default TreeView;
