import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
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
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

import Card from "components/card/Card.js";
import KeycloakContext from "auth/KeycloakContext";
import axios from "axios";
import { capsLockActive } from "Utils/SupportingFunction";
import { editUserProfile } from "networks";
import { userResetPassword } from "networks";

const ProfileSettings = () => {
  const [fname, setFirstName] = useState("");
  const [lname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobileNumber] = useState("");
  const [altmobile, setAltMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState(false);
  const { logout, userProfile } = useContext(KeycloakContext);
  const [capsLockActiveStatus, setCapsLockActive] = useState(false);

  const textColorSecondary = "gray.400";
  const textColor = useColorModeValue("secondaryGray.900", "white");

  const handleKeyPress = (e) => {
    const capsLockActiveStatus = capsLockActive(e);
    setCapsLockActive(capsLockActiveStatus);
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await logout();
      console.log("Logout successful");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile?.firstName || "");
      setLastName(userProfile?.lastName || "");
      setEmail(userProfile?.email || "");
      setMobileNumber(userProfile?.attributes.mobile || "");
      setAltMobile(userProfile?.attributes.altmobile || "");
    }
  }, [userProfile]);

  const changePassword = () => {
    onOpen();
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

  const handleChangePaaswordSubmit = () => {
    // Prepare the data to be sent to the backend
    const userData = {
      username: userProfile?.username,
      password, // Include password only if changePasswordMode is true
    };

    // Make a POST request to the backend API using Axios
    axios
      .post(userResetPassword(), userData)
      .then((response) => {
        // Handle success
        onClose();
        handleLogout();
        console.log("Password Updated:", response.data);
      })
      .catch((error) => {
        // Handle error
        console.error("Error updating Password:", error);
      });
  };

  const handleProfileEdit = () => {
    // Prepare the data to be sent to the backend
    const userProfileEditData = {
      username: userProfile?.username,
      tenant_id: userProfile?.attributes.tenant_id,
      fname,
      lname,
      email,
      mobile,
      altmobile,
    };

    // Make a POST request to the backend API using Axios
    axios
      .post(editUserProfile(), userProfileEditData)
      .then((response) => {
        // Handle success
        onClose();
        handleLogout();
        console.log("user Profile Edited:", response.data);
      })
      .catch((error) => {
        // Handle error
        console.error("Error user Profile Editind:", error);
      });
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card>
        <Heading as="h3" size="md" mb={5}>
          {" "}
          Profile Settings{" "}
        </Heading>
        <Stack spacing={4}>
          <FormControl isRequired>
            <FormLabel>First Name</FormLabel>
            <Input
              variant="auth"
              type="text"
              value={fname}
              onChange={(e) => setFirstName(e.target.value)}
              disabled
              style={{ cursor: "not-allowed" }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Last Name</FormLabel>
            <Input
              variant="auth"
              type="text"
              value={lname}
              onChange={(e) => setLastName(e.target.value)}
              disabled
              style={{ cursor: "not-allowed" }}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              variant="auth"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Mobile Number</FormLabel>
            <Input
              variant="auth"
              type="tel"
              value={mobile}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Alternate Mobile Number</FormLabel>
            <Input
              variant="auth"
              type="tel"
              value={altmobile}
              onChange={(e) => setAltMobile(e.target.value)}
            />
          </FormControl>
        </Stack>
      </Card>
      <Button
        onClick={changePassword}
        mt={4}
        variant="darkBrand"
        color="white"
        fontSize="sm"
        fontWeight="500"
        borderRadius="70px"
      >
        Change Password
      </Button>

      <Button
        onClick={handleProfileEdit}
        mt={4}
        ml={4}
        variant="darkBrand"
        color="white"
        fontSize="sm"
        fontWeight="500"
        borderRadius="70px"
      >
        Save Changes
      </Button>

      {/* Modal for changing password */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Password</ModalHeader>
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
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
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
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <InputRightElement width="3rem">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    onClick={handleToggleConfirmPasswordVisibility}
                    icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  />
                </InputRightElement>
              </InputGroup>
              {passwordMismatchError && (
                <Text color="red.500" mt={2}>
                  Passwords do not match.
                </Text>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              variant="ghost"
              onClick={handleChangePaaswordSubmit}
              isDisabled={passwordMismatchError}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Text color="red.500" fontSize="sm" mt={2} fontWeight="500">
        Note: Profile edits and password changes will require relogin.
      </Text>
    </Box>
  );
};

export default ProfileSettings;
