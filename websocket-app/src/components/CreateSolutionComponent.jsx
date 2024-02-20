// CreateSolutionComponent.jsx

import React, { useEffect, useState } from "react";

import axios from "axios";
import styles from "./CreateSolutionComponent.module.css";

const CreateSolutionComponent = () => {
  const [selectedSolutionFile, setSelectedSolutionFile] = useState(null);
  const [selectedDeviceFile, setSelectedDeviceFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [solutionList, setsolutionList] = useState([]);

  useEffect(() => {
    // Fetch the list of uploaded files on component mount
    fetchSolutionList();
  }, []);

  const fetchSolutionList = () => {
    // Make an API call to fetch the list of uploaded files
    axios
      .get(
        "http://192.168.31.249:5010/get_all_solution_types?tenant_id=tenant_pv5ew31X"
      )
      .then((response) => {
        setsolutionList(response.data.solution_types);
      })
      .catch((error) => {
        console.error("Error fetching uploaded files:", error);
      });
  };

  const handleSolutionFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedSolutionFile(file);
  };

  const handleDeviceFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedDeviceFile(file);
  };

  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
  };

  const handleFileUpload = () => {
    if (selectedSolutionFile && selectedDeviceFile && fileName) {
      const readerSolution = new FileReader();
      const readerDevice = new FileReader();

      readerSolution.onload = (eSolution) => {
        const solutionJsonData = eSolution.target.result;

        readerDevice.onload = (eDevice) => {
          const deviceJsonData = eDevice.target.result;

          // Send both the solution and device JSON data, file name, and solution type to the backend using Axios
          sendToBackend(fileName, solutionJsonData, deviceJsonData);
        };

        readerDevice.readAsText(selectedDeviceFile);
      };

      readerSolution.readAsText(selectedSolutionFile);
    } else {
      alert("Please select both JSON files and provide a file name");
    }
  };

  const sendToBackend = (fileName, solutionJsonData, deviceJsonData) => {
    const formData = new FormData();
    formData.append("solutionFile", selectedSolutionFile);
    formData.append("deviceFile", selectedDeviceFile);
    formData.append("fileName", fileName);
    formData.append("solutionJsonData", solutionJsonData);
    formData.append("deviceJsonData", deviceJsonData);
    formData.append("tenantId", "tenant_pv5ew31X");

    axios
      .post("http://192.168.31.249:5010/upload_solution_and_device", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        // Handle the response from the backend
        console.log(response.data);

        // After a successful upload, fetch the updated list of uploaded files
        fetchSolutionList();
        setFileName("");
      })
      .catch((error) => {
        console.error("Error:", error);

        // Handle error state or provide user feedback
      });
  };

  const handleDownload = async (solution_id) => {
    try {
      // Make a GET request using Axios to the Flask API endpoint
      const response = await axios.get(
        `http://192.168.31.249:5010/download_json/${solution_id}`,
        {
          responseType: "json",
        }
      );
      const responseData = response.data;
      const { solution_name, file_content, script_content } = responseData;

      // Construct the filename based on the extracted solution_name and ID
      const jsonfileName = `${solution_name}_data.json`;
      const scriptfileName = `${solution_name}_data.sh`;

      // Create a Blob from the file content
      const blob = new Blob([file_content], {
        type: "application/json",
      });

      // Create a Blob from the script content
      const script_blob = new Blob([script_content], {
        type: "application/json",
      });

      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = window.URL.createObjectURL(blob);
      downloadLink.download = jsonfileName;

      // Create a download link
      const scriptdownloadLink = document.createElement("a");
      scriptdownloadLink.href = window.URL.createObjectURL(script_blob);
      scriptdownloadLink.download = scriptfileName;

      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Trigger the script download
      document.body.appendChild(scriptdownloadLink);
      scriptdownloadLink.click();
      document.body.removeChild(scriptdownloadLink);
    } catch (error) {
      console.error("Error downloading JSON:", error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Create Solution</h2>
      <form className={styles.form}>
        <label htmlFor="solutionName" className={styles.label}>
          Enter Solution Name as per WoTD:
        </label>
        <input
          type="text"
          placeholder="Enter Solution Name as per WoTD"
          value={fileName}
          onChange={handleFileNameChange}
          className={styles.fileNameInput}
        />
        <label htmlFor="newSolution" className={styles.label}>
          Select Hierarchy WoTD JSON file :
        </label>
        <input
          type="file"
          onChange={handleSolutionFileChange}
          className={styles.fileInput}
          accept=".json"
          id="newSolution"
        />
        <label htmlFor="newDevice" className={styles.label}>
          Select Device WoTD JSON file :
        </label>
        <input
          type="file"
          onChange={handleDeviceFileChange}
          className={styles.fileInput}
          accept=".json"
          id="newDevice"
        />
        <button
          type="button"
          onClick={handleFileUpload}
          className={styles.uploadButton}
          disabled={!selectedSolutionFile || !selectedDeviceFile || !fileName}
        >
          Add Solution
        </button>
      </form>

      {/* Display the list of uploaded files in a table */}
      {(solutionList?.length ?? 0) > 0 && (
        <div className={styles.uploadedList}>
          <h3 className={styles.listHeading}>List of Solutions:</h3>
          <table>
            <thead>
              <tr>
                <th>Solution ID</th>
                <th>Solution Name</th>
                <th>Root Element</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {solutionList.map((solution) => (
                <tr key={solution.solution_id}>
                  <td>{solution.solution_id}</td>
                  <td>{solution.solution_name}</td>
                  <td>{solution.root}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleDownload(solution.solution_id)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreateSolutionComponent;
