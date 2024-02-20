import React, { useState } from 'react';
import { Form} from 'react-bootstrap';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Box,
} from "@chakra-ui/react";
import { MdUpload } from "react-icons/md";
import Dropzone from "views/admin/profile/components/Dropzone";
import {
  DownloadIcon,
  ArrowUpIcon,
  DeleteIcon,
  SettingsIcon,
  AddIcon,
} from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import {
  
  Progress,
  Table,
  Tbody,
  Td, 
  Th,
  Thead,
  Tr,
  
} from "@chakra-ui/react";
import {
  Icon,
  Flex,
  Text,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  MdOutlineMoreHoriz,
  MdDelete,
  MdCloudUpload,
  MdAdd,
    MdFileDownload,
  MdOutlineSettings,
} from "react-icons/md";
const handleDownload = () => {
  // Content of the downloadable file
  const content = 'This is the content of your downloadable file. Modify it as needed.';
  
  // Create a Blob with the content
  const blob = new Blob([content], { type: 'text/plain' });

  // Create a temporary URL for the Blob
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger a download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'downloadedFile.txt';
  document.body.appendChild(a);
  a.click();

  // Clean up
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
// function MyVerticallyCenteredModal(props) {
//   const [devicename, setDeviceName] = useState('hello');
//   const [serialnumber, setSerialNumber] = useState('');
//   const [solution, setSolution] = useState('');
//   const [macId, setMacId] = useState('');
//   return (
//     <Modal {...props} centered>
//     <Modal.Header closeButton>
//       <Modal.Title>Add Asset</Modal.Title>
//     </Modal.Header>
//     <Modal.Body >
//       <Form>
//         <Form.Group className="mb-2">
//           <Form.Label>Device Name</Form.Label>
//           <Form.Control
//             type="text"
//             value={devicename}
//             onChange={(e) => setDeviceName(e.target.value)}
//           />
//         </Form.Group>

//         <Form.Group className="mb-2">
//           <Form.Label>Mac ID</Form.Label>
//           <Form.Control
//             type="text"
//             value={macId}
//             onChange={(e) => setMacId(e.target.value)}
//           />
//         </Form.Group>

//         <Form.Group className="mb-2">
//           <Form.Label>Serial Number</Form.Label>
//           <Form.Control
//             type="text"
//             value={serialnumber}
//             onChange={(e) => setSerialNumber(e.target.value)}
//           />
//         </Form.Group>

//         <Form.Group className="mb-2">
//           <Form.Label>Select Solution</Form.Label>
//           <Form.Select
//             value={solution}
//             onChange={(e) => setSolution(e.target.value)}
//           >
//             <option value="">None</option>
//             {/* Map over solutions and create options */}
//           </Form.Select>
//         </Form.Group>
//       </Form>
//     </Modal.Body>
//     <Modal.Footer>
//       <Button variant="primary" >
//         Add
//       </Button>
//       <Button variant="secondary" onClick={props.onHide}>
//         Cancel
//       </Button>
//     </Modal.Footer>
//   </Modal>
//   );
// }


// function MyVerticallyCenteredModal1(props) {
//   const [devicename, setDeviceName] = useState('hello');
//   const [serialnumber, setSerialNumber] = useState('');
//   const [solution, setSolution] = useState('');
//   const [macId, setMacId] = useState('');
//   return (
//     <Modal {...props} centered>
//     <Modal.Header closeButton>
//       <Modal.Title>Deleted Asset</Modal.Title>
//     </Modal.Header>
//     <Modal.Body >
//      <Table>
//       <Tr>
//         <Th>mac Id</Th>
//         <Th>devicename</Th>
//       </Tr>
//       <Tr>
//         <Td>1.0.0.0</Td>
//         <Td>Evb1</Td>
//       </Tr>
//       <Tr>
//         <Td>2.89.99.89</Td>
//         <Td>Evb2</Td>
//       </Tr>
//      </Table>
//     </Modal.Body>
//     <Modal.Footer>
    
//       <Button variant="secondary" onClick={props.onHide}>
//         Cancel
//       </Button>
//     </Modal.Footer>
//   </Modal>
//   );
// }


// function MyVerticallyCenteredModal2(props) {
//   const [devicename, setDeviceName] = useState('hello');
//   const [serialnumber, setSerialNumber] = useState('');
//   const [solution, setSolution] = useState('');
//   const [macId, setMacId] = useState('');
//   return (
//     <Modal {...props} centered>
//     <Modal.Header closeButton>
//       <Modal.Title>Bulk Upload</Modal.Title>
//     </Modal.Header>
//     <Modal.Body >
//       <Form>
//         <Form.Group className="mb-2">
        
//           <Form.Control
//             type="file"
        
//             onChange={(e) => setDeviceName(e.target.value)}
//           />
//         </Form.Group>

       
//       </Form>
//     </Modal.Body>
//     <Modal.Footer>
//       <Button variant="primary" >
//         Upload
//       </Button>
//       <Button variant="secondary" onClick={props.onHide}>
//         Cancel
//       </Button>
//     </Modal.Footer>
//   </Modal>
//   );
// }


// function Modals1(props) {
//   const [modalShow, setModalShow] = useState(false);

//   return (
//     <>
//       <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
//         {props.children}
//       </Text>
//       <MyVerticallyCenteredModal1
//         show={modalShow}
//         onHide={() => setModalShow(false)}
//       />
//     </>
//   );
// }


// function Modals2(props) {
//   const [modalShow, setModalShow] = useState(false);

//   return (
//     <>
//       <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
//         {props.children}
//       </Text>
//       <MyVerticallyCenteredModal2
//         show={modalShow}
//         onHide={() => setModalShow(false)}
//       />
//     </>
//   );
// }

// function Modals3(props) {
//   const [modalShow, setModalShow] = useState(false);

//   return (
//     <>
//       <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
//         {props.children}
//       </Text>
//       <MyVerticallyCenteredModal
//         show={modalShow}
//         onHide={() => setModalShow(false)}
//       />
//     </>
//   );
// }

function DeletedAssets() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [size, setSize] = React.useState("md");

  return (
    <>
      {/* <Button onClick={onOpen}>Open Modal</Button> */}
  <Flex align='center'>
  <Text onClick={onOpen} style={{ verticalAlign: "center" }}>
    <Flex align='center'>
      <Icon as={MdDelete} h='16px' w='16px' me='8px' cursor='pointer' />
      <span style={{ marginTop: "0.3rem" }}>Deleted Assets</span>
    </Flex>
  </Text>
</Flex>
{/* 
      <Flex align='center'onClick={handleDownload}>
          <Icon as={MdFileDownload} h='16px' w='16px' me='8px'  cursor='pointer' />
            <Text>Download</Text>
          </Flex> */}

      <Modal isOpen={isOpen} onClose={onClose} size={size} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Deleted Assets</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* <Lorem count={2} /> */}
            {/* abcdefgjkl */}
            {/* <Selectall /> */}
            <Table>
              <Tr>
                <Th>mac Id</Th>
                <Th>devicename</Th>
              </Tr>
              <Tr>
                <Td>1.0.0.0</Td>
                <Td>Evb1</Td>
              </Tr>
              <Tr>
                <Td>2.89.99.89</Td>
                <Td>Evb2</Td>
              </Tr>
            </Table>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
function BulkUpload() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [size, setSize] = React.useState("xl");
  const [devicename, setDeviceName] = useState("hello");
  return (
    <>
      {/* <Button onClick={onOpen}>Open Modal</Button> */}

      <Text onClick={onOpen} style={{ verticalAlign: "center" }}>
        {" "}
        <Icon as={MdCloudUpload} h='16px' w='16px' me='8px'  cursor='pointer' />
        {/* <ArrowUpIcon w={3} h={3} style={{ marginRight: "0.1rem" }} /> */}
        <span style={{ marginTop: "0.3rem" }}>Bulk upload</span>
      </Text>

      <Modal isOpen={isOpen} onClose={onClose} size={size} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bulk upload</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* <Lorem count={2} /> */}
            {/* abcdefgjkl */}
            {/* <Selectall /> */}

            <Dropzone
              w={{ base: "100%", "2xl": "150px" }}
              me="36px"
              // maxH={{ base: "60%", lg: "50%", "2xl": "100%" }}
              // minH={{ base: "60%", lg: "50%", "2xl": "100%" }}
              height="10rem"
           
              content={
                <Box>
                  <Icon as={MdUpload} w="30px" h="30px" color="#422AFB" />
                  <Flex justify="center" mx="auto" mb="12px">
                    <Text fontSize="xl" fontWeight="700" color="#422AFB">
                      Upload Files
                    </Text>
                  </Flex>
                  <Text
                    fontSize="sm"
                    fontWeight="500"
                    color="secondaryGray.500"
                  >
                    PNG, JPG and GIF files are allowed
                  </Text>
                </Box>
              }
            />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="brand" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
function AddAssets() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [size, setSize] = React.useState("md");
  const [devicename, setDeviceName] = useState("hello");
  const [serialnumber, setSerialNumber] = useState("");
  const [solution, setSolution] = useState("");
  const [macId, setMacId] = useState("");
  return (
    <>
      {/* <Button onClick={onOpen}>Open Modal</Button> */}

      <Text onClick={onOpen} style={{ verticalAlign: "center" }}>
        {" "}
        <Icon as={MdAdd} h='16px' w='16px' me='8px'  cursor='pointer' />
        {/* <AddIcon w={3} h={3} style={{ marginRight: "0.1rem" }} /> */}
        <span style={{ marginTop: "0.3rem" }}>Add Asset</span>
      </Text>

      <Modal isOpen={isOpen} onClose={onClose} size={size} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Asset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* <Lorem count={2} /> */}
            {/* abcdefgjkl */}
            {/* <Selectall /> */}

            <FormControl className="mb-2">
              <FormLabel>Device Name</FormLabel>
              <Input
                type="text"
                value={devicename}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </FormControl>

            <FormControl className="mb-2">
              <FormLabel>Mac ID</FormLabel>
              <Input
                type="text"
                value={macId}
                onChange={(e) => setMacId(e.target.value)}
              />
            </FormControl>

            <FormControl className="mb-2">
              <FormLabel>Serial Number</FormLabel>
              <Input
                type="text"
                value={serialnumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </FormControl>

            <FormControl className="mb-2">
              <FormLabel>Select Solution</FormLabel>
              <Select
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              >
                <option value="">None</option>
                {/* Map over solutions and create options */}
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="brand">Add</Button>
            <Button variant="primary" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
export default function Banner(props) {
  const { ...rest } = props;
  const textColor = useColorModeValue("secondaryGray.500", "white");
  const textHover = useColorModeValue(
    { color: "secondaryGray.900", bg: "unset" },
    { color: "secondaryGray.500", bg: "unset" }
  );
  const iconColor = useColorModeValue("brand.500", "white");

  // Ellipsis modals
  const {
    isOpen: isOpen1,
    onOpen: onOpen1,
    onClose: onClose1,
  } = useDisclosure();

  return (
    <Menu isOpen={isOpen1} onClose={onClose1}>
      <MenuButton
        align='center'
        justifyContent='center'
        _hover={textHover}
        w='37px'
        h='37px'
        lineHeight='100%'
        onClick={onOpen1}
        borderRadius='10px'
        {...rest}
      >
        <Icon as={MdOutlineMoreHoriz} color={iconColor} w='24px' h='24px' />
      </MenuButton>
      <MenuList
        w='150px'
        minW='unset'
        maxW='150px !important'
        border='transparent'
        backdropFilter='blur(63px)'
        boxShadow='14px 17px 40px 4px rgba(112, 144, 176, 0.08)'
        borderRadius='20px'
        p='6px'
      >
        <MenuItem
          transition='0.2s linear'
          color={textColor}
          _hover={textHover}
          p='0px'
          borderRadius='8px'
          _active={{
            bg: "transparent",
          }}
          _focus={{
            bg: "transparent",
          }}
          mb='10px'
        >
          <Flex align='center'>
            {/* <Icon as={MdDelete} h='16px' w='16px' me='8px' /> */}
           < DeletedAssets/>
            {/* <Modals1>DeletedAssets</Modals1> */}
          </Flex>
        </MenuItem>
        <MenuItem
          transition='0.2s linear'
          color={textColor}
          _hover={textHover}
          p='0px'
          borderRadius='8px'
          _active={{
            bg: "transparent",
          }}
          _focus={{
            bg: "transparent",
          }}
          mb='10px'
        >
          <Flex align='center'onClick={handleDownload}>
          <Icon as={MdFileDownload} h='16px' w='16px' me='8px'  cursor='pointer' />
            <Text>Download</Text>
          </Flex>
        </MenuItem>
        <MenuItem
          transition='0.2s linear'
          p='0px'
          borderRadius='8px'
          color={textColor}
          _hover={textHover}
          _active={{
            bg: "transparent",
          }}
          _focus={{
            bg: "transparent",
          }}
          mb='10px'
        >
          <Flex align='center'>
            {/* <Icon as={MdCloudUpload} h='16px' w='16px' me='8px' /> */}
            {/* <Modals2>BulkUpload</Modals2> */}
            <BulkUpload/>
          </Flex>
        </MenuItem>
        <MenuItem
          transition='0.2s linear'
          p='0px'
          borderRadius='8px'
          color={textColor}
          _hover={textHover}
          _active={{
            bg: "transparent",
          }}
          _focus={{
            bg: "transparent",
          }}
          mb='10px'
        >
          <Flex align='center'>
            {/* <Icon as={MdAdd} h='16px' w='16px' me='8px' /> */}
            {/* <Modals3>AddAssets</Modals3> */}
            <AddAssets/>
          </Flex>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

