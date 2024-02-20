import React, { useEffect } from "react";
import * as BABYLON from "babylonjs";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  SceneLoader,
  HemisphericLight,
} from "@babylonjs/core";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/loaders";

const SceneGenerator = ({ onMeshClick, firstSceneModelPath }) => {
  useEffect(() => {
    const canvas = document.getElementById("scene-canvas");
    const engine = new Engine(canvas, true);
    const scene = createScene(engine, new Color3(1, 1, 1));
    const camera = createCamera(scene);
    createLight(scene);
    loadModel(scene, onMeshClick, firstSceneModelPath);
    let isPointerDown = false;
    let startingPointerPosition;
    // Handle pointer down event
    canvas.addEventListener("pointerdown", (event) => {
      isPointerDown = true;
      startingPointerPosition = {
        x: event.clientX,
        y: event.clientY,
      };
    });
    // Handle pointer up event
    canvas.addEventListener("pointerup", () => {
      isPointerDown = false;
    });
    // Handle pointer move event
    canvas.addEventListener("pointermove", (event) => {
      if (isPointerDown) {
        const deltaX = event.clientX - startingPointerPosition.x;
        const deltaY = event.clientY - startingPointerPosition.y;
        // Adjust rotation based on pointer movement
        camera.alpha -= deltaX * 0.01;
        camera.beta += deltaY * 0.01;
        // Clamp beta to avoid flipping
        camera.beta = Math.max(
          -Math.PI / 2 + 0.01,
          Math.min(Math.PI / 2 - 0.01, camera.beta)
        );
        startingPointerPosition = {
          x: event.clientX,
          y: event.clientY,
        };
      }
    });
    engine.runRenderLoop(() => {
      scene.render();
    });
    window.addEventListener("resize", () => {
      engine.resize();
    });
    return () => {
      window.removeEventListener("resize", () => {
        engine.resize();
      });
      engine.dispose();
    };
  }, [onMeshClick]);
  const createScene = (engine, clearColor) => {
    const newScene = new Scene(engine);
    newScene.clearColor = new BABYLON.Color3(0.9608, 0.9412, 0.9216);
    return newScene;
  };
  const createCamera = (scene) => {
    const newCamera = new ArcRotateCamera(
      "camera",
      0,
      0,
      10,
      new Vector3(0, 0, 0),
      scene
    );
    newCamera.setPosition(new Vector3(0, 0, -20));
    scene.activeCamera = newCamera;
    return newCamera;
  };
  const createLight = (scene) => {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
  };
  const loadModel = async (scene, onMeshClick, firstSceneModelPath) => {
    try {
      const modelPath = firstSceneModelPath;

      const loadedMeshes = await SceneLoader.ImportMeshAsync(
        "",
        modelPath,
        "",
        scene
      );
      // Define brown material
      const brownMaterial = new BABYLON.StandardMaterial(
        `brownMaterial`,
        scene
      );
      brownMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
      loadedMeshes.meshes.forEach((mesh, index) => {
        let mainId = mesh.name;
        let onlyMainArray = mainId.split("/");
        let meshId = onlyMainArray[0];
        // let id = "B1.F2.A6";
        let defectiveIds = ["B1.F2.A6", "B3.F1.A1", "B3.F4.A2"];

        // Split the id string into an array of its components

        let newIdArray = [];
        let newId = "";
        for (let j = 0; j < defectiveIds.length; j++) {
          let idArray = defectiveIds[j].split(".");
          // Loop through the components in reverse order
          for (let i = idArray.length - 1; i >= 0; i--) {
            // Join the components up to the current index to create the new id
            newId = idArray.slice(0, i + 1).join(".");
            newIdArray.push(newId);
            // Print the new id
            console.log("New id:", newId);
          }
        }

        console.log(newIdArray);
        // Print the original id
        if (newIdArray.includes(meshId)) {
          mesh.material = new BABYLON.StandardMaterial(`redMaterial`, scene);
          mesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red color
        } else {
          // Apply brown color to other meshes
          mesh.material = brownMaterial;
        }

        // Set up click event handler for all meshes
        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            function (event) {
              onMeshClick(onlyMainArray[0], onlyMainArray[1]);
            }
          )
        );
      });
    } catch (error) {
      console.error("Error loading GLB model:", error);
    }
  };

  return (
    <canvas
      id="scene-canvas"
      style={{
        height: "80vh",
        width: "90vw",
        outline: "none",
        margin: "1rem",
        border: "none",
      }}
    />
  );
};
export default SceneGenerator;
