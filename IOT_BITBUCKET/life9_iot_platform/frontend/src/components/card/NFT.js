import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { AddIcon, SettingsIcon } from '@chakra-ui/icons';
import {
  AvatarGroup,
  Avatar,
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Link as ChakraLink,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,

} from "@chakra-ui/react";

import Card from "components/card/Card.js";
import { IoHeart, IoHeartOutline } from "react-icons/io5";

export default function NFT(props) {
  const { image, name, author, bidders, download, currentbid, offline } = props;
  const [like, setLike] = useState(false);

  const [isAddDeviceModalOpen, setAddDeviceModalOpen] = useState(false);
  const textColor = useColorModeValue("navy.700", "white");
  const textColorBid = useColorModeValue("brand.500", "white");

  //for alert configuration
  const [isModalOpen, setModalOpen] = useState(false);
  const [devicename, setDeviceName] = useState("hello");
  const [size, setSize] = React.useState("xl");

  //add device for modal open
  const openModal1 = () => {
    setAddDeviceModalOpen(true);
  };
  const closeModal1 = () => {
    setAddDeviceModalOpen(false);
  };
  const toggleAddDeviceModal = () => {
    setAddDeviceModalOpen((prevState) => !prevState);
  };
  const addDevice = () => {
    // Perform actions for adding a device
    console.log('Device added!');
    // Close the modal
    toggleAddDeviceModal();
  };

  //alert configuration modal open 
  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <Card p='20px'>
      <Flex direction={{ base: "column" }} justify='center'>
        <Box mb={{ base: "20px", "2xl": "20px" }} position='relative'>
          <Image
            src={image}
            w={{ base: "100%", "3xl": "100%" }}
            h={{ base: "100%", "3xl": "100%" }}
            borderRadius='20px'
          />
          <Button
            position='absolute'
            bg='white'
            _hover={{ bg: "whiteAlpha.900" }}
            _active={{ bg: "white" }}
            _focus={{ bg: "white" }}
            p='0px !important'
            top='14px'
            right='14px'
            borderRadius='50%'
            minW='36px'
            h='36px'
            onClick={() => {
              setLike(!like);
            }}>
            <Icon
              transition='0.2s linear'
              w='20px'
              h='20px'
              as={like ? IoHeart : IoHeartOutline}
              color='brand.500'
            />
          </Button>
        </Box>
        <Flex flexDirection='column' justify='space-between' h='100%'>
          <Flex
            justify='space-between'
            direction={{
              base: "row",
              md: "column",
              lg: "row",
              xl: "column",
              "2xl": "row",
            }}
            mb='auto'>
            <Flex direction='column'>
              <Text
                color={textColor}
                fontSize={{
                  base: "xl",
                  md: "lg",
                  lg: "lg",
                  xl: "lg",
                  "2xl": "md",
                  "3xl": "lg",
                }}
                mb='5px'
                fontWeight='bold'
                me='14px'>
                {name}
              </Text>
              <Text
                color='secondaryGray.600'
                fontSize={{
                  base: "sm",
                }}
                fontWeight='400'
                me='14px'>
                {author}
              </Text>
            </Flex>
            <AvatarGroup
              max={3}
              // color={textColorBid}
              size='sm'
              mt={{
                base: "0px",
                md: "10px",
                lg: "0px",
                xl: "10px",
                "2xl": "0px",
              }}
              fontSize='12px'>
              {bidders.map(({ icon, color, count }, key) => (
                <React.Fragment key={key}>
                  <Box marginRight="5px" display="flex" alignItems="center">
                    {React.isValidElement(icon) && React.cloneElement(icon, { style: { color, fontSize: '15px' } })}
                    <span style={{ marginLeft: '5px' }}>{count}</span>
                  </Box>
                </React.Fragment>
              ))}
            </AvatarGroup>
          </Flex>
          <Flex
            align='start'
            justify='space-between'
            direction={{
              base: "row",
              md: "column",
              lg: "row",
              xl: "column",
              "2xl": "row",
            }}
            mt='25px'>
            <Text fontWeight='700' fontSize='sm' color={textColorBid}>
              {/* Current Bid: {currentbid} */}
              Offline: {offline}
            </Text>

            {/* <Flex  direction="row" alignItems="center" justifyContent="space-between" spacing={4} > */}
            <Flex
              align='start'
              justify='space-between'
              direction={{
                base: "row",
                md: "column",
                lg: "row",
                xl: "column",
                "2xl": "row",
              }}>
              <div >
                <ChakraLink

                  as={Link}
                  to={{ pathname: '/admin/data-tables/SolutionsData', state: { data: name } }}
                  mt={{
                    base: "0px",
                    md: "10px",
                    lg: "0px",
                    xl: "10px",
                    "2xl": "0px",
                  }}>
                  <Button
                    variant='darkBrand'
                    color='white'
                    fontSize='sm'
                    fontWeight='500'
                    borderRadius='70px'
                    px='24px'
                    py='5px'>
                    Details
                  </Button>

                </ChakraLink>
                <ChakraLink
                  // as={Link}
                  // to="/admin/data-tables/SolutionsData"
                  mt={{
                    base: "0px",
                    md: "10px",
                    lg: "0px",
                    xl: "10px",
                    "2xl": "0px",
                  }}>
                  <Button
                    variant='darkBrand'
                    color='white'
                    fontSize='sm'
                    fontWeight='500'
                    borderRadius='70px'
                    px='24px'
                    py='5px' onClick={openModal1}
                    style={{ marginLeft: "7px" }}>
                    <AddIcon />
                  </Button>

                </ChakraLink>
                <ChakraLink
                  mt={{
                    base: "0px",
                    md: "10px",
                    lg: "0px",
                    xl: "10px",
                    "2xl": "0px",
                  }}>
                  <Button
                    variant='darkBrand'
                    color='white'
                    fontSize='sm'
                    fontWeight='500'
                    borderRadius='70px'
                    px='24px'
                    py='5px' onClick={openModal}
                    style={{ marginLeft: "8px" }}>
                    <SettingsIcon />
                  </Button>

                  <Modal isOpen={isModalOpen} size={size} onClose={closeModal} isCentered>
                    <ModalOverlay />
                    <ModalContent >
                      <ModalHeader>Alert Configuration</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <FormControl>
                          <Flex style={{ gap: "0.3rem" }}>
                            <Flex direction="column" style={{ gap: "0.3rem" }}>
                              <FormLabel style={{ marginTop: "3.0rem" }}>
                                <b>Volt</b>
                              </FormLabel>

                              <FormLabel style={{ marginTop: "0.7rem" }}>
                                <b>Temp</b>
                              </FormLabel>

                              <FormLabel style={{ marginTop: "0.7rem" }}>
                                <b>Hum</b>
                              </FormLabel>
                            </Flex>

                            <Flex direction="column" style={{ gap: "0.3rem" }}>
                              <FormLabel
                                style={{
                                  marginBottom: "0.7rem",
                                  textAlign: "center",
                                }}
                              >
                                CriticalMin
                              </FormLabel>

                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                            </Flex>

                            <Flex direction="column" style={{ gap: "0.3rem" }}>
                              <FormLabel
                                style={{
                                  marginBottom: "0.7rem",
                                  textAlign: "center",
                                }}
                              >
                                WarningMin
                              </FormLabel>

                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                            </Flex>

                            <Flex direction="column" style={{ gap: "0.3rem" }}>
                              <FormLabel
                                style={{
                                  marginBottom: "0.7rem",
                                  textAlign: "center",
                                }}
                              >
                                WarningMax
                              </FormLabel>

                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                            </Flex>

                            <Flex direction="column" style={{ gap: "0.3rem" }}>
                              <FormLabel
                                style={{
                                  marginBottom: "0.7rem",
                                  textAlign: "center",
                                }}
                              >
                                CriticalMax
                              </FormLabel>

                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                              <Input
                                borderRadius="16px"
                                type="number"
                                value={devicename}
                                onChange={(e) => setDeviceName(e.target.value)}
                              />
                            </Flex>
                          </Flex>
                        </FormControl>
                      </ModalBody>
                      <ModalFooter>
                        <Button colorScheme="brand">Add</Button>
                        <Button onClick={closeModal} colorScheme="brand">
                          Cancel
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>


                  <Modal isOpen={isAddDeviceModalOpen} onClose={toggleAddDeviceModal} isCentered>
                    <ModalOverlay />
                    <ModalContent maxW="sm">
                      <ModalHeader>Onboard devices</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <div>{name}</div>
                      </ModalBody>
                      <ModalFooter>
                        <Button colorScheme="brand" onClick={addDevice}>
                          Add
                        </Button>
                        <Button onClick={toggleAddDeviceModal} colorScheme="brand">
                          Cancel
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>

                </ChakraLink>
              </div>
            </Flex>
          </Flex>

        </Flex>
      </Flex>
    </Card>
  );
}
