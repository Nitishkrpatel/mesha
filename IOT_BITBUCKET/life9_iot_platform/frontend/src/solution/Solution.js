import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import NFT from "solution/NFT";
import { MdUpload } from "react-icons/md";
// Chakra imports
import {
  Box,
  Button,
  Flex,
  Grid,
  Link,
  Text,
  useColorModeValue,
  SimpleGrid,
  Checkbox,
  Center,
  Icon
} from "@chakra-ui/react";

import { Route, Switch, useLocation } from "react-router-dom";
// import Graph from "./components/Graph";
import { download_json, solutiontypes, upload_solution_and_device } from '../networks'
// Assets
import Nft1 from "assets/img/nfts/Nft1.png";

import { MdAdd } from 'react-icons/md'; // Import MdPhone icon from react-icons
import { useDisclosure, Input, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@chakra-ui/react';

import KeycloakContext from 'auth/KeycloakContext';
import Card from 'components/card/Card.js';
function Solution() {
  const location = useLocation();
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorBrand = useColorModeValue("brand.500", "white");

  // Modals and Refs
  const initialRef = React.useRef();
  const { isOpen, onOpen, onClose } = useDisclosure()

  // State for managing solutions
  const [solutions, setSolutions] = useState([]);

  const [selectedSolutionFile, setSelectedSolutionFile] = useState(null);
  const [selectedDeviceFile, setSelectedDeviceFile] = useState(null);

  const [solutionList, setsolutionList] = useState([]);

  const [fileName, setFileName] = useState('');
  const [fileNameError, setFileNameError] = useState(false);
  // State for managing new solution input
  const [newSolutionName, setNewSolutionName] = useState("");

  // State for managing delete confirmation checkboxes
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(Array(solutions.length).fill(false));
  const { userProfile, keycloak } =
    useContext(KeycloakContext);
  const tenant_id = userProfile?.attributes.tenant_id;
  console.log(keycloak.realmAccess)
  // toggle
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = () => {
    toggleVisibility(); // Hide the form
    // You can add additional logic here if needed
  };
  // Check if userProfile is defined and has the realmAccess property
  const isAdmin = keycloak && keycloak.realmAccess && keycloak.realmAccess.roles.includes('tenant_admin');
  const fetchData = async () => {
    try {
      const response = await axios.get(solutiontypes(tenant_id), { /* Your request body */ });

      // Assuming the response data is in the format you expect for tableData
      setSolutions(response.data.solution_types);

    } catch (error) {
      console.error('Error fetching device data:', error);
      // Handle error appropriately
    }
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
    const inputValue = event.target.value;

    // Regular expression to check for special characters
    const regex = /[!@#$%^&*(),.?":{}|<>_]/;

    // Check if the input matches the regex pattern
    if (regex.test(inputValue)) {
      // If it contains special characters, set a state variable to indicate error
      setFileNameError(true);
    } else {
      // If it doesn't contain special characters, update the state
      setFileName(inputValue);
      // Clear the error state
      setFileNameError(false);
    }
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
        onClose();
        console.log(response.data);
        setIsVisible(false);

        // After a successful upload, fetch the updated list of uploaded files
        fetchData();
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
    <>
      <Box pt={{ base: '130px', md: '20px', xl: '35px' }} >
        <Flex
          flexDirection='column'
          gridArea={{ xl: "1 / 1 / 2 / 3", "2xl": "1 / 1 / 2 / 2" }}>

          <Flex direction='column'>
            <Flex
              mt='45px'
              mb='20px'
              justifyContent='space-between'
              direction={{ base: "column", md: "row" }}
              align={{ base: "start", md: "center" }}>
              <Text color={textColor} fontSize='2xl' ms='24px' fontWeight='700'>
              </Text>
              <Flex
                align='center'
                me='20px'
                ms={{ base: "24px", md: "0px" }}
                mt={{ base: "20px", md: "0px" }}>


                {isAdmin && (
                  <Button
                    variant='darkBrand'
                    color='white'
                    fontSize='md'
                    fontWeight='500'
                    borderRadius='10px'
                    px='24px'
                    py='5px'
                    // onClick={toggleVisibility}                  
                    onClick={onOpen}>
                    Create Solution
                  </Button>
                )}
              </Flex>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap='20px'>
              {/* Render existing solutions */}
              {solutions.map((solution, index) => (
                <NFT
                  name={solution.solution_name}
                  root={solution.root}
                  solution_id={solution.solution_id}
                  image={Nft1}
                  link='bms'
                />
              ))}

            </SimpleGrid>
          </Flex>
        </Flex>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalCloseButton />
            <ModalBody>

              <Box >
                <SimpleGrid mb="20px" columns={{ base: 1, md: 1 }} spacing={{ base: '20px', xl: '20px' }}>

                  <Card>
                    <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}  >
                      Solution Name:
                    </Text>
                    <Input
                      variant="auth"
                      type="text"
                      placeholder="Enter Solution Name "
                      value={fileName}
                      onChange={handleFileNameChange}
                      borderColor={fileNameError ? "red.500" : undefined}
                    />
                    {/* Display alert below the input field when fileNameError is true */}
                    {fileNameError && (
                      <Text color="red.500" mt={2}>
                        Numbers and special characters are not allowed.
                      </Text>
                    )}
                  </Card>


                  <SimpleGrid mb="20px" columns={{ base: 1, md: 2 }} spacing={{ base: '20px', xl: '20px' }}>
                    <Card>
                      <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}>
                        WoT TM file :
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

                    </Card>
                    <Card>
                      <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}>
                        WoT TD file :
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

                <Button mb={4}
                  mt={-2}
                  ml={4} fontSize='sm'
                  fontWeight='500'
                  borderRadius='70px'
                  px='24px'
                  py='5px' colorScheme='blue' mr={3} onClick={onClose}>
                  Close
                </Button>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </>
  )
}

export default Solution
