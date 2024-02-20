import React, { useState } from "react";
import SceneGenerator from "./SceneGenerator";
const SceneNavigation = () => {
  const initialModel = "B.glb";
  console.log(initialModel);
  const [models, setModel] = useState(initialModel);
  const [sceneIndex, setSceneIndex] = useState(1);
  let [id, setId] = useState("");
  let [k, setk] = useState(1);
  //Scene Navigator
  const sceneNavigator = (currentIdFromTheGLBFile, nextScene) => {
    id = currentIdFromTheGLBFile;
    setId(id);
    setSceneIndex(sceneIndex + 1);
    setModel(nextScene);
    console.log(id);
    k++;
    setk(k);
  };
  const goBack = () => {
    setModel(initialModel);
  };
  const getSceneType = () => {
    return sceneIndex;
  };
  return (
    <div style={{ display: "flex", gap: 0 }}>
      <div>
        <button
          style={{
            background: "black",
            color: "#FFFFFF",
            padding: "10px",
            border: "none",
            marginTop: "1rem",
            marginLeft: "0.5rem",
          }}
          onClick={goBack}
        >
          Move back to First scene
        </button>
        {models ? (
          <SceneGenerator
            onMeshClick={sceneNavigator}
            firstSceneModelPath={models}
          />
        ) : (
          <h1 style={{ color: "brown" }}>End of all scenes</h1>
        )}
      </div>
    </div>
  );
};
export default SceneNavigation;
