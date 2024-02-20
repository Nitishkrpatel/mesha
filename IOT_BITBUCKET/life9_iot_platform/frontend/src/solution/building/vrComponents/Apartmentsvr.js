import React, { useEffect, useRef } from 'react';
import { Engine, Scene, HemisphericLight, Vector3, ArcRotateCamera, SceneLoader, Color4, Mesh,Color3,StandardMaterial } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock } from '@babylonjs/gui'; // Import GUI elements from gui
import '@babylonjs/loaders';
import wall from 'assets/glb/room4.glb';

const SceneComponent = ({ data }) => {
    const renderCanvas = useRef(null);
    const babylonEngine = useRef(null);

    useEffect(() => {
        if (renderCanvas.current) {
            babylonEngine.current = new Engine(renderCanvas.current, true);
            const scene = new Scene(babylonEngine.current);
            scene.clearColor = new Color4(1, 1, 1, 1);
            
            // Create a top-down view camera
            // const camera = new ArcRotateCamera("camera", Math.PI / 2, 0, 50, new Vector3(0, 0, 0), scene);
            // camera.attachControl(renderCanvas.current, true);

            const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
            light.intensity = 0.7;

            const loadModel = async (modelPath, position, name,color) => {
                try {
                    const { meshes } = await SceneLoader.ImportMeshAsync("", modelPath, "", scene);
                    meshes.forEach(mesh => {
                        mesh.position = position;
                        
                        // Ensure we're working with the base mesh or submeshes
                        
                            let material = mesh.material;
                            if (material) {
                                // Force a new material to ensure updates
                                material = new StandardMaterial(name + "_mat", scene);
                                material.diffuseColor = color; // Set to red
                                mesh.material = material;
                            } else {
                                // Create a new material if none exists
                                material = new StandardMaterial(name + "_mat", scene);
                                material.diffuseColor = color; // Set to red
                                mesh.material = material;
                            }
                        
                    });

                    // Create GUI label
                    const plane = Mesh.CreatePlane("textPlane", 5, scene, false);
                    plane.position = new Vector3(position.x, position.y * 200, position.z); // Adjust Y offset as needed
                    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
            
                    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
            
                    const rectangle = new Rectangle("label for " + name);
                    rectangle.background = "white";
                    rectangle.height = "50px";
                    rectangle.alpha = 0.5;
                    rectangle.width = "200px";
                    rectangle.cornerRadius = 20;
                    rectangle.thickness = 1;
                    rectangle.linkOffsetY = 30;
                    advancedTexture.addControl(rectangle);
            
                    const label = new TextBlock();
                    label.text = name;
                    label.color = "black";
                    label.fontSize = 24; // Adjust font size as needed
                    rectangle.addControl(label);
            
                } catch (error) {
                    console.error("Error loading GLB model:", error);
                }
            };

            // Load a building for each item in data.children
            const gridSize = Math.ceil(Math.sqrt(data.children.length));
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
            let gridCenter = new Vector3(0, 0, 0);
            let redColor = new Color3(1, 0, 0);
            data.children.forEach((child, index) => {
                const x = (index % gridSize) * 12; // Adjust spacing as needed
                const z = Math.floor(index / gridSize) * 12; // Adjust spacing as needed
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
                const position = new Vector3(x, 0, z);
                const name = child.name; // Use the name from the data
                if(child.name==="apartment1"){
                    redColor=new Color3(1, 0, 0);
                }
                else
                {
                    redColor=new Color3(0, 1, 0);
                }
                 // Use the name from the data
                loadModel(wall, position, name,redColor);
            });
            gridCenter.x = (minX + maxX) / 2;
            gridCenter.z = (minZ + maxZ) / 2;

            // Set up the camera with the grid center
            const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2, 40, gridCenter, scene);
            camera.attachControl(renderCanvas.current, true);
            camera.upperBetaLimit = 0;
            // Render loop
            babylonEngine.current.runRenderLoop(() => {
                scene.render();
            });

            // Resize the engine on window resize
            window.addEventListener('resize', function () {
                babylonEngine.current.resize();
            });
        }
    }, [data.children]); // Depend on data.children so it updates when props change

    return (
        <canvas ref={renderCanvas} id="renderCanvas" style={{ width: '100%', height: '100%' }}></canvas>
    );
}

export default SceneComponent;
