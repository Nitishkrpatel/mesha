import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

import Card from "components/card/Card.js";
import KeycloakContext from "auth/KeycloakContext";
import { MdAdd } from "react-icons/md";
import { addUser } from "networks";
import axios from "axios";
import { capsLockActive } from "Utils/SupportingFunction";
import { editUser } from "networks";
import { getTeanantUserList } from "networks";
import { getUserRoles } from "networks";

const UserManangement = () => {
  const textColorSecondary = "gray.400";
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const [userList, setUserList] = useState([]);
  const { userProfile } = useContext(KeycloakContext);

  const [username, setUsername] = useState("");
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobile, setMobileNumber] = useState("");
  const [alternate_mobile, setAlternateMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [roles, setRoles] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [capsLockActiveStatus, setCapsLockActive] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState(false);

  const handleKeyPress = (e) => {
    const capsLockActiveStatus = capsLockActive(e);
    setCapsLockActive(capsLockActiveStatus);
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(
      (prevShowConfirmPassword) => !prevShowConfirmPassword
    );
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    // Check if passwords match and update error state
    setPasswordMismatchError(value !== password);
  };

  const handleSelectChange = (event) => {
    const selectedRole = [...roles].filter(
      (role) => role.roleId === event.target.value
    );
    setSelectedRole(selectedRole);
  };

  useEffect(() => {
    fetchUserList();
    getRoles();
  }, []);

  const fetchUserList = async () => {
    try {
      const response = await axios.get(
        getTeanantUserList(userProfile?.attributes.tenant_id)
      );
      setUserList(response.data.users);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  };

  const getRoles = async () => {
    try {
      const response = await axios.get(
        getUserRoles(userProfile?.attributes.tenant_id)
      );
      setRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching roles list:", error);
    }
  };

  const handleAddUser = async () => {
    try {
      if (
        username.trim() !== "" &&
        firstname.trim() !== "" &&
        lastname.trim() !== "" &&
        password.trim() !== "" &&
        mobile.trim() !== "" &&
        email.trim() !== "" &&
        selectedRole
      ) {
        const userInfoData = {
          tenant_id: userProfile?.attributes.tenant_id,
          username,
          firstname,
          lastname,
          password,
          mobile,
          alternate_mobile,
          email,
          roleid: selectedRole[0].roleId,
          rolename: selectedRole[0].roleName,
        };
        // Make a POST request to the backend API using Axios
        axios
          .post(addUser(), userInfoData)
          .then((response) => {
            // Handle success
            fetchUserList();
            onClose();
          })
          .catch((error) => {
            // Handle error
            console.error("Error user Adding user:", error);
          });
      } else {
        setError("All fields are required.");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setError("Error adding user. Please try again.");
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex
        align="right"
        justify="flex-end"
        me="20px"
        ms={{ base: "24px", md: "0px" }}
        mt={{ base: "20px", md: "0px" }}
        mb="20px"
      >
        <Button
          variant="darkBrand"
          color="white"
          fontSize="sm"
          fontWeight="500"
          borderRadius="7px"
          px="24px"
          py="5px"
          onClick={onOpen}
        >
          Add New User
        </Button>
      </Flex>
      <SimpleGrid mb="20px" spacing={{ base: "20px", xl: "20px" }}>
        <Modal isOpen={isOpen} onClose={onClose} size={"xl"}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add User</ModalHeader>
            {/* <Text>{capsLockActive && "Caps Lock is ON!"}</Text> */}
            {capsLockActiveStatus && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Caps Lock is ON!</AlertTitle>
                {/* <AlertDescription>
                  Your Chakra experience may be degraded.
                </AlertDescription> */}
              </Alert>
            )}
            <ModalCloseButton />
            <ModalBody>
              <form>
                <Flex gap={{ base: "20px", xl: "14px" }}>
                  <FormControl id="firstname" mt={4} isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      type="text"
                      variant="auth"
                      // placeholder="Enter First Name"
                      placeholder="Enter First Name"
                      value={firstname}
                      onKeyDown={handleKeyPress}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </FormControl>
                  <FormControl id="lastname" mt={4} isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      type="text"
                      variant="auth"
                      placeholder="Enter Last Name"
                      onKeyDown={handleKeyPress}
                      value={lastname}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </FormControl>
                </Flex>
                <Flex gap={{ base: "20px", xl: "14px" }}>
                  <FormControl id="username" mt={4} isRequired>
                    <FormLabel>Username</FormLabel>
                    <Input
                      type="text"
                      variant="auth"
                      placeholder="Enter Username"
                      onKeyDown={handleKeyPress}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </FormControl>
                  <FormControl id="email" mt={4} isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      variant="auth"
                      placeholder="Enter email"
                      value={email}
                      onKeyDown={handleKeyPress}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>
                </Flex>
                <Flex gap={{ base: "20px", xl: "14px" }}>
                  <FormControl id="mobile" mt={4} isRequired>
                    <FormLabel>Mobile Number</FormLabel>
                    <Input
                      type="tel"
                      variant="auth"
                      placeholder="Enter mobile number"
                      value={mobile}
                      onKeyDown={handleKeyPress}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </FormControl>
                  <FormControl id="alternate_mobile" mt={4}>
                    <FormLabel>Alternate Mobile Number</FormLabel>
                    <Input
                      type="tel"
                      variant="auth"
                      placeholder="Enter alternate mobile number"
                      value={alternate_mobile}
                      onKeyDown={handleKeyPress}
                      onChange={(e) => setAlternateMobileNumber(e.target.value)}
                    />
                  </FormControl>
                </Flex>
                <Flex gap={{ base: "20px", xl: "14px" }}>
                  <FormControl mt={4} isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        variant="auth"
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                      <InputRightElement width="3rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          onClick={handleTogglePasswordVisibility}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl mt={4} isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        variant="auth"
                        onChange={(e) =>
                          handleConfirmPasswordChange(e.target.value)
                        }
                        onKeyDown={handleKeyPress}
                      />
                      <InputRightElement width="3rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          onClick={handleToggleConfirmPasswordVisibility}
                          icon={
                            showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />
                          }
                        />
                      </InputRightElement>
                    </InputGroup>
                    {passwordMismatchError && (
                      <Text color="red.500" mt={2}>
                        Passwords do not match.
                      </Text>
                    )}
                  </FormControl>
                </Flex>
                <FormControl
                  id="role"
                  mt={4}
                  style={{ width: "50%" }}
                  isRequired
                >
                  <FormLabel>Role</FormLabel>
                  <Select
                    placeholder="Select Role"
                    variant="auth"
                    value={selectedRole.length > 0 && selectedRole[0].roleId}
                    onChange={handleSelectChange}
                  >
                    {roles.map((role) => (
                      <option value={role.roleId} key={role}>
                        {role.roleName}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {error && <p>{error}</p>}
              </form>
            </ModalBody>

            <ModalFooter>
              <Button onClick={handleAddUser} variant="brand" mr={3}>
                Add
              </Button>

              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {(userList?.length ?? 0) > 0 && (
          <Card direction="row" w="100%" px="0px" style={{ overflowX: "auto" }}>
            <Table variant="simple">
              <Thead
                mt={{ base: "5px", "2xl": "auto" }}
                color={textColorSecondary}
              >
                <Tr>
                  <Th borderColor="gray.200" color="gray.400">
                    Username
                  </Th>
                  <Th borderColor="gray.200" color="gray.400">
                    Name
                  </Th>
                  <Th borderColor="gray.200" color="gray.400">
                    Roles
                  </Th>
                  <Th borderColor="gray.200" color="gray.400">
                    Email
                  </Th>

                  <Th borderColor="gray.200" color="gray.400">
                    Alt Mobile
                  </Th>
                  <Th borderColor="gray.200" color="gray.400">
                    Mobile
                  </Th>

                  <Th borderColor="gray.200" color="gray.400">
                    Created Timestamp
                  </Th>
                  <Th borderColor="gray.200" color="gray.400">
                    Email Verified
                  </Th>
                  <Th borderColor="gray.200" color="gray.400">
                    Enabled
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {userList.map((user, index) => (
                  <Tr key={user.username}>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.username}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {`${user.firstName} ${user.lastName}`}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.roles[0]}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.email}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.attributes.altmobile &&
                        user.attributes.altmobile[0]}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.attributes.mobile && user.attributes.mobile[0]}
                    </Td>

                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.createdTimestamp}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.emailVerified ? "Yes" : "No"}
                    </Td>
                    <Td
                      fontWeight="700"
                      color={textColor}
                      minW={{ sm: "150px", md: "200px", lg: "auto" }}
                    >
                      {user.enabled ? "Yes" : "No"}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        )}
      </SimpleGrid>
    </Box>
  );
};

export default UserManangement;
