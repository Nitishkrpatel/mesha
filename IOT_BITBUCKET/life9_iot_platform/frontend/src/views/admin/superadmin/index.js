import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdEdit, MdAdd } from 'react-icons/md';
import {
  Box,
  Button,
  SimpleGrid,
  useColorModeValue,
  Text,
  FormLabel,
  FormControl,
  Input,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Grid,
  Icon,
  Flex,
  useDisclosure
} from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import Card from 'components/card/Card.js';
import { edittenant } from 'networks';
import { addtenant } from 'networks';
import { tenant_list } from 'networks';

const Superadmin = () => {
  const textColorSecondary = "gray.400";
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [scrollBehavior, setScrollBehavior] = React.useState('inside')

  const btnRef = React.useRef()
  const [newTenant, setNewTenant] = useState("");
  const [username, setUsername] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobileNumber] = useState("");
  const [alternate_mobile, setAlternateMobileNumber] = useState("");
  const [email, setEmail] = useState("");

  const [tenantList, setTenantList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState("");


  const [fileNameError, setFileNameError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [mobileError, setMobileError] = useState(false);
  const [alternateMobileError, setAlternateMobileError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  useEffect(() => {
    // Fetch tenant list from the API when the component mounts
    fetchTenantList();
  }, []);

  const fetchTenantList = async () => {
    try {
      const response = await axios.get(
        tenant_list()
      );
      setTenantList(response.data.tenants_list);
    } catch (error) {
      console.error("Error fetching tenant list:", error);
    }
  };

  const handleAddTenant = async () => {
    try {

      if (newTenant.trim() !== "" && username.trim() !== "" && firstname.trim() !== "" && lastname.trim() !== "" && password.trim() !== "" && mobile.trim() !== "" && email.trim() !== "") {

        const tenantInfoData = {
          tenant_name: newTenant,
          username,
          firstname,
          lastname,
          password,
          mobile,
          alternate_mobile,
          email
        }

        // Make a POST request to the backend API using Axios
        axios
          .post(addtenant(), tenantInfoData)
          .then((response) => {
            // Handle success
            onClose();
            fetchTenantList();
            setNewTenant("");
            setUsername("");
            setFirstName("");
            setLastName("");
            setPassword("");
            setMobileNumber("");
            setAlternateMobileNumber("");
            setEmail("");
            setEditingIndex(null);
            setError(""); // Clear any previous errors
            console.log("user Adding tenant:", response.data);
          })
          .catch((error) => {
            // Handle error
            console.error("Error user Adding tenant:", error);
          });
      } else {
        setError("All fields are required.");
      }

    } catch (error) {
      console.error("Error adding tenant:", error);
      setError("Error adding tenant. Please try again.");
    }
  };

  const submitEditTenant = async () => {
    try {
      if (editingIndex !== null && newTenant.trim() !== "") {
        // If editing, update the tenant at the editingIndex
        // Use the GET method to add or update the tenant
        const editTenantData = {
          editingIndex,
          newTenant
        }
        await axios.get(edittenant(editTenantData));
        handleCancelEdit();
        fetchTenantList();
        onClose();
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleEditTenant = (tenantId) => {
    // Find the index of the tenant with the matching tenant_id
    const index = tenantList.findIndex(
      (tenant) => tenant.tenant_id === tenantId
    );

    // Check if the index is valid before setting the state
    if (index !== -1) {
      setEditingIndex(tenantId);
      setNewTenant(tenantList[index].tenant_name);
      setError(""); // Clear any previous errors
    } else {
      console.error("Tenant not found in the list");
      // Handle the case where the tenant is not found (optional)
    }
  };

  const handleCancelEdit = () => {
    setNewTenant("");
    setEditingIndex(null);
    setError(""); // Clear any previous errors
  };

  return (
    <>
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>

        <Flex

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
            <Button variant='darkBrand'
              color='white'
              fontSize='md'
              fontWeight='500'
              borderRadius='10px'
              px='24px'
              py='5px' onClick={onOpen} ref={btnRef}>Add Tenant</Button>
          </Flex>
        </Flex>


        <SimpleGrid mb="20px" spacing={{ base: '20px', xl: '20px' }}>
          <Modal
            isCentered
            onClose={onClose}
            isOpen={isOpen}
            motionPreset='slideInBottom'
            finalFocusRef={btnRef}
            scrollBehavior={scrollBehavior}
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Tenant admin Information</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Card>
                  {/* <Text fontSize="md" color="gray.500" mt={{ base: '1px', '2xl': 'auto' }}>
                    Tenant admin Information:
                  </Text> */}
                  <form>
                    <FormControl id="tenantName" mt={4} isRequired>
                      <FormLabel>Add Tenant name</FormLabel>
                      <Input
                        type="text"
                        variant="auth"
                        placeholder="Enter Tenant"
                        value={newTenant}
                        borderColor={fileNameError ? "red.500" : undefined}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Regular expression to check for special characters
                          const regex = /[!@#$%^&*(),?":{}|<>_1]/;

                          // Check if the input matches the regex pattern
                          if (regex.test(inputValue)) {
                            // If it contains special characters, set a state variable to indicate error
                            setFileNameError(true);
                          } else {
                            // If it doesn't contain special characters, update the state
                            setNewTenant(inputValue);
                            // Clear the error state
                            setFileNameError(false);
                          }
                        }}
                      />
                      {/* Display alert below the input field when fileNameError is true */}
                      {fileNameError && (
                        <Text color="red.500" mt={2}>
                          Special characters are not allowed.
                        </Text>
                      )}
                    </FormControl>
                    {editingIndex === null && (<><FormControl id="username" mt={4} isRequired>
                      <FormLabel> Tenant admin username</FormLabel>
                      <Input
                        type="text"
                        variant="auth"
                        placeholder="Enter Username"
                        value={username}
                        borderColor={usernameError ? "red.500" : undefined}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Regular expression to check for special characters
                          const regex = /[!@#$%^&*(),.?":{}|<>\s]/;

                          // Check if the input matches the regex pattern
                          if (regex.test(inputValue)) {
                            // If it contains special characters, set usernameError to true
                            setUsernameError(true);
                          } else {
                            // If it doesn't contain special characters, update the state
                            setUsername(inputValue);
                            // Clear the error state
                            setUsernameError(false);
                          }
                        }}
                      />
                      {/* Display alert below the input field when usernameError is true */}
                      {usernameError && (
                        <Text color="red.500" mt={2}>
                         Only underscore is allowed 
                        </Text>
                      )}
                    </FormControl>
                      <Flex gap={{ base: "20px", xl: "14px" }}>
                        <FormControl id="firstname" mt={4} isRequired>
                          <FormLabel>First Name</FormLabel>
                          <Input
                            type="text"
                            variant="auth"
                            placeholder="Enter First Name"
                            value={firstname}
                            borderColor={firstNameError ? "red.500" : undefined}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Regular expression to check for non-alphabet characters
                              const regex = /[^a-zA-Z s]/;

                              // Check if the input matches the regex pattern
                              if (!regex.test(inputValue)) {
                                // If it doesn't contain non-alphabet characters, update the state
                                setFirstName(inputValue);
                                // Clear the error state
                                setFirstNameError(false);
                              } else {
                                // If it contains non-alphabet characters, set firstNameError to true
                                setFirstNameError(true);
                              }
                            }}
                          />
                          {/* Display alert below the input field when firstNameError is true */}
                          {firstNameError && (
                            <Text fontSize="sm" color="red.500">First name should contain only alphabetic characters.</Text>
                          )}
                        </FormControl>
                        <FormControl id="lastname" mt={4} isRequired>
                          <FormLabel>Last Name</FormLabel>
                          <Input
                            type="text"
                            variant="auth"
                            placeholder="Enter Last Name"
                            value={lastname}
                            borderColor={lastNameError ? "red.500" : undefined}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Regular expression to check for non-alphabet characters
                              const regex = /[^a-zA-Z s]/;

                              // Check if the input matches the regex pattern
                              if (!regex.test(inputValue)) {
                                // If it doesn't contain non-alphabet characters, update the state
                                setLastName(inputValue);
                                // Clear the error state
                                setLastNameError(false);
                              } else {
                                // If it contains non-alphabet characters, set lastNameError to true
                                setLastNameError(true);
                              }
                            }}
                          />
                          {/* Display alert below the input field when lastNameError is true */}
                          {lastNameError && (
                            <Text fontSize="sm" color="red.500">Last name should contain only alphabetic characters.</Text>
                          )}
                        </FormControl>
                      </Flex>
                      <FormControl id="password" mt={4} isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          variant="auth"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </FormControl>
                      <FormControl id="mobile" mt={4} isRequired>
                        <FormLabel>Mobile Number</FormLabel>
                        <Input
                          type="tel"
                          variant="auth"
                          placeholder="Enter number"
                          value={mobile}
                          borderColor={mobileError ? "red.500" : undefined}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Regular expression to check for numbers only
                            const regex = /^\d*$/;

                            // Check if the input matches the regex pattern and is not longer than 10 characters
                            if (regex.test(inputValue) && inputValue.length <= 10) {
                              // If it's a valid phone number format, update the state
                              setMobileNumber(inputValue);
                              // Clear the error state
                              setMobileError(false);
                            } else {
                              // If it's not a valid phone number format, set mobileError to true
                              setMobileError(true);
                            }
                          }}
                        />
                        {/* Display alert below the input field when mobileError is true */}
                        {mobileError && (
                          <Text fontSize="sm" color="red.500">
                            Please enter a valid 10-digit phone number.
                          </Text>
                        )}
                      </FormControl>
                      <FormControl id="alternate_mobile" mt={4} isRequired>
                        <FormLabel>Alternate Mobile Number</FormLabel>
                        <Input
                          type="tel"
                          variant="auth"
                          placeholder="Enter number"
                          value={alternate_mobile}
                          borderColor={alternateMobileError ? "red.500" : undefined}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Regular expression to check for valid phone number format
                            const regex = /^\d*$/;

                            // Check if the input matches the regex pattern
                            if (regex.test(inputValue) && inputValue.length <= 10) {
                              // If it's a valid phone number format, update the state
                              setAlternateMobileNumber(inputValue);
                              // Clear the error state
                              setAlternateMobileError(false);
                            } else {
                              // If it's not a valid phone number format, set alternateMobileError to true
                              setAlternateMobileError(true);
                            }
                          }}
                        />
                        {/* Display alert below the input field when alternateMobileError is true */}
                        {alternateMobileError && (
                          <Text fontSize="sm" color="red.500">Please enter a valid 10-digit phone number.</Text>
                        )}
                      </FormControl>
                      <FormControl id="email" mt={4} isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          variant="auth"
                          placeholder="Enter email"
                          value={email}
                          borderColor={emailError ? "red.500" : undefined}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Regular expression to validate email format
                            const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{4,}$/;

                            // Check if the input matches the regex pattern
                            if (!regex.test(inputValue)) {
                              // If it's a valid email format, update the state
                              setEmail(inputValue);
                              // Clear the error state
                              setEmailError(false);
                            } else {
                              // If it's not a valid email format, set emailError to true
                              setEmailError(true);
                            }
                          }}
                        />
                        {/* Display alert below the input field when emailError is true */}
                        {emailError && (
                          <Text fontSize="sm" color="red.500">Please enter a valid email address.</Text>
                        )}
                      </FormControl>
                    </>)}
                    <Button
                      onClick={editingIndex !== null ? submitEditTenant : handleAddTenant}
                      variant="brand"
                      mt={4}
                      disabled={!newTenant.trim()} // Disable button when tenantName is empty
                    >
                      {editingIndex !== null ? "Save" : "Add"}
                    </Button>
                    {editingIndex !== null && (
                     <Button onClick={() => {
                      handleCancelEdit();
                      onClose();
                  }} mt={4} ml={2}>Cancel</Button>
                    )}
                    {error && <p>{error}</p>}
                  </form>
                </Card>
                {/* <Button fontSize='sm'
                  fontWeight='500'
                  borderRadius='70px' colorScheme='blue' mr={3} onClick={onClose}>
                  Close
                </Button> */}
              </ModalBody>

            </ModalContent>
          </Modal>


          {(tenantList?.length ?? 0) > 0 && (
            <Card direction="column"
              w="100%"

              overflowX={{ sm: "scroll", lg: "hidden" }}>

              <Heading
                color={textColor}
                fontSize='22px'
                fontWeight='700'
                lineHeight='100%' mb={2}>
                Tenant List:
              </Heading>


              {/* <Heading size="md" fontSize="2xl">Tenant List:</Heading> */}
              <Table variant="simple">
                <Thead mt={{ base: '5px', '2xl': 'auto' }} color={textColorSecondary}>
                  <Tr>
                    <Th borderColor="gray.200" color="gray.400">ID</Th>
                    <Th borderColor="gray.200" color="gray.400">Name</Th>
                    <Th borderColor="gray.200" color="gray.400">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tenantList.map((tenant, index) => (
                    <Tr key={tenant.tenant_id} >
                      <Td

                        fontWeight="700"
                        color={textColor}
                        minW={{ sm: "150px", md: "200px", lg: "auto" }}>{tenant.tenant_id}</Td>
                      <Td

                        fontWeight="700"
                        color={textColor}
                        minW={{ sm: "150px", md: "200px", lg: "auto" }}>{tenant.tenant_name}</Td>
                      <Td

                        fontWeight="700"
                        color={textColor}
                        minW={{ sm: "150px", md: "200px", lg: "auto" }}>
                        <Button
                          onClick={() => {
                            handleEditTenant(tenant.tenant_id);
                            onOpen(); // Open the modal when edit button is clicked
                        }}

                        >
                          <Icon as={MdEdit} width="20px" height="20px" color="inherit" />
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </SimpleGrid>
      </Box>

    </>
  );
};

export default Superadmin;