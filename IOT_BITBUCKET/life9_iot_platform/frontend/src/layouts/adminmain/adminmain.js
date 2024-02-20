// Import Chakra UI components

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  Input,
  Select,
  SimpleGrid,
  FormLabel,
  FormControl,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Center,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { MdAdd, MdFileDownload } from 'react-icons/md';
import Card from "components/card/Card.js";

import { MdUpload } from "react-icons/md";
import axios from "axios";

import KeycloakContext from "auth/KeycloakContext";
import { solutiontypes } from "networks";
import { upload_solution_and_device } from "networks";
import { download_json } from "networks";

const AdminMain = () => {

  const textColorSecondary = "gray.400";
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [selectedSolutionFile, setSelectedSolutionFile] = useState(null);
  const [selectedDeviceFile, setSelectedDeviceFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [solutionList, setsolutionList] = useState([]);
  // const [selectedFile, setSelectedFile] = useState(null);
  const { userProfile } =
    useContext(KeycloakContext);

  useEffect(() => {
    // Fetch the list of uploaded files on component mount
    fetchSolutionList();
  }, []);

  const fetchSolutionList = () => {
    // Make an API call to fetch the list of uploaded files
    axios
      .get(
        solutiontypes(userProfile?.attributes.tenant_id)
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
    console.log(file)
    // setSelectedFile(event.target.files[0]);
    // Handle file change logic here if needed

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
    formData.append("tenantId", userProfile?.attributes.tenant_id);

    axios
      .post(upload_solution_and_device(), formData, {
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
        download_json(solution_id),
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
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Heading color={textColor}
        fontSize='22px'
        fontWeight='700'
        lineHeight='100%' mb={2}>
        Create Solution
      </Heading>
      <form >
        <SimpleGrid mb="20px" columns={{ base: 1, md: 3 }} spacing={{ base: '20px', xl: '20px' }}>

          <Card>
            <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}>
              Enter Solution Name as per WoTD:
            </Text>
            <Input
            variant="auth"
              type="text"
              placeholder="Enter Solution Name as per WoTD"
              value={fileName}
              onChange={handleFileNameChange}
              
            />
          </Card>

          {/* <FormControl>
              <Card >
                <FormLabel htmlFor="newSolution"> Select Hierarchy WoTD JSON file :</FormLabel>
                <Dropzone
                  w={{ base: '100%', '2xl': '268px' }}
                  me='36px'
                  maxH={{ base: '60%', lg: '150%', '2xl': '100%' }}
                  minH={{ base: '60%', lg: '170%', '2xl': '100%' }}
                  handleFileChange={handleSolutionFileChange}
                  content={
                    <>
                      <Input
                        type="file"
                        onChange={handleSolutionFileChange}

                        accept=".json"
                        id="newSolution"
                       
                        
                      />
                      <label>
                        <Box position="relative" overflow="hidden" type="file">

                          <Icon as={MdUpload} w="30px" h="30px" color="blue.500" />
                          <Flex justify="center" mx="auto" mb="5px">
                            <Text fontSize="xl" fontWeight="700" color="blue.500">
                              Upload Files
                            </Text>
                          </Flex>
                          <Text fontSize="sm" fontWeight="500">
                            Json files are allowed
                          </Text>
                        </Box>
                      </label>
                    </>
                  }
                />
              </Card>
            </FormControl> */}

          <Card>
            <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}>
              Hierarchy WoTD JSON file :
            </Text>
            <Center>
              <Box position="relative" overflow="hidden">
                <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
                  <Center> <Icon as={MdUpload} w="30px" h="30px" color="blue.500" /></Center>

                  <Flex justify="center" mx="auto" mb="5px">
                    <Text fontSize="xl" fontWeight="700" color="blue.500">
                      Upload Files
                    </Text>
                  </Flex>
                  <Text fontSize="sm" fontWeight="500">
                    Json files are allowed
                  </Text>
                </label>
                <Input
                  type="file"
                  id="fileInput"
                  accept=".json"
                  onChange={handleSolutionFileChange}
                  style={{ display: 'none' }}
                />
                {selectedSolutionFile && (
                  <Text fontSize="sm" fontWeight="500">
                    Selected file: {selectedSolutionFile.name}
                  </Text>
                )}
              </Box>
            </Center>
            {/* <Input
              type="file"
              onChange={handleSolutionFileChange}

              accept=".json"
              id="newSolution"
              color={textColor}
            /> */}
          </Card>

          {/* <FormControl>
              <Card >
                <FormLabel htmlFor="newSolution">   Select Device WoTD JSON file :</FormLabel>
                <Dropzone
                  w={{ base: '100%', '2xl': '268px' }}
                  me='36px'
                  maxH={{ base: '60%', lg: '150%', '2xl': '100%' }}
                  minH={{ base: '60%', lg: '170%', '2xl': '100%' }}
                  content={

                    <>
                      <Input
                        variant="auth"
                        type="file"
                        onChange={handleDeviceFileChange}
                        className={styles.fileInput}
                        accept=".json"
                        id="newDevice"
                        color={textColor}
                        style={{ display: "none" }}
                      />
                      <label>
                        <Box position="relative" overflow="hidden" type="file">

                          <Icon as={MdUpload} w="30px" h="30px" color="blue.500" />
                          <Flex justify="center" mx="auto" mb="5px">
                            <Text fontSize="xl" fontWeight="700" color="blue.500">
                              Upload Files
                            </Text>
                          </Flex>
                          <Text fontSize="sm" fontWeight="500">
                            Json files are allowed
                          </Text>
                        </Box>
                      </label>
                    </>
                  }
                />
              </Card>
            </FormControl> */}

          <Card>
            <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}>
              Device WoTD JSON file :
            </Text>
            <Center>
            <Box position="relative" overflow="hidden">
              <label htmlFor="deviceFileInput" style={{ cursor: 'pointer' }}>
                <Center>
                  <Icon as={MdUpload} w="30px" h="30px" color="blue.500" />
                </Center>
                <Flex justify="center" mx="auto" mb="5px">
                  <Text fontSize="xl" fontWeight="700" color="blue.500">
                    Upload Files
                  </Text>
                </Flex>
                <Text fontSize="sm" fontWeight="500">
                  Json files are allowed
                </Text>
              </label>
              <Input
                variant="auth"
                type="file"
                onChange={handleDeviceFileChange}
                accept=".json"
                id="deviceFileInput"
                style={{ display: 'none' }}
              />
              {selectedDeviceFile && (
                <Text fontSize="sm" fontWeight="500">
                  Selected Device file: {selectedDeviceFile.name}
                </Text>
              )}
            </Box>
            </Center>
          </Card>

        </SimpleGrid>
        <Button
          onClick={handleFileUpload}

          variant='darkBrand'
          color='white'
          fontSize='sm'
          fontWeight='500'
          borderRadius='70px'
          px='24px'
          py='5px'
          mb={4}
          mt={-2}
          leftIcon={<MdAdd />}
          disabled={!selectedSolutionFile || !selectedDeviceFile || !fileName}
        >
          Add
        </Button>
      </form>


      {/* Display the list of uploaded files in a table */}
      {(solutionList?.length ?? 0) > 0 && (
        <div >
          <Heading color={textColor}
            fontSize='22px'
            fontWeight='700'
            lineHeight='100%' mb={2}>List of Solutions:</Heading>

          <Card
            direction="column"
            w="100%"
            px="0px"
            overflowX={{ sm: "scroll", lg: "hidden" }}

          >
            <Table variant="simple" >
              <Thead >
                <Tr>
                  <Th borderColor="gray.200" color="gray.400">Solution ID</Th>
                  <Th borderColor="gray.200" color="gray.400">Solution Name</Th>
                  <Th borderColor="gray.200" color="gray.400">Root Element</Th>
                  <Th borderColor="gray.200" color="gray.400">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {solutionList.map((solution, index) => (
                  <Tr key={solution.solution_id}>
                    <Td key={index}
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}>{solution.solution_id}</Td>
                    <Td key={index}
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}>{solution.solution_name}</Td>
                    <Td key={index}
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}>{solution.root}</Td>
                    <Td key={index}
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}>
                      <Button
                        variant='darkBrand'
                        color='white'
                        fontSize='sm'
                        fontWeight='500'
                        borderRadius='70px'
                        px='24px'
                        py='5px'
                        leftIcon={<MdFileDownload />}
                        onClick={() => handleDownload(solution.solution_id)}
                      >
                        Download
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

    </Box>
  );
};

// export default CreateSolutionComponent;

export default AdminMain;
