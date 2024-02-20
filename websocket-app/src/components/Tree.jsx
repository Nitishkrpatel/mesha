// Tree.jsx
import React, { useState } from "react";

import styles from "./Tree.module.css";

const TreeNode = ({ node, onNodeClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    console.log(isOpen);
  };

  return (
    <div>
      <div onClick={() => onNodeClick(node)}>
        {hasChildren && (
          <span onClick={handleToggle} className={styles.treeArrow}>
            {isOpen ? "▼" : "▶"}
          </span>
        )}
        {node.label}
      </div>
      {hasChildren && isOpen && (
        <div style={{ marginLeft: "20px" }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onNodeClick={onNodeClick} />
          ))}
        </div>
      )}
    </div>
  );
};

const Tree = ({ data, onNodeClick }) => {
  return (
    <div>
      <h2>BMS TREE VIEW</h2>
      {data.map((node) => (
        <TreeNode key={node.id} node={node} onNodeClick={onNodeClick} />
      ))}
    </div>
  );
};

export default Tree;
