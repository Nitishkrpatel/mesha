import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

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
  MdWarning,
  MdAdd,
 
} from "react-icons/md";

const Selectall = () => {
    const [selectAll, setSelectAll] = useState(false);
    const [checkboxes, setCheckboxes] = useState({
      evb1: false,
      // Add more checkboxes as needed, for example: evb2: false, evb3: false, ...
    });
  
    const handleSelectAllChange = () => {
      const newSelectAll = !selectAll;
      setSelectAll(newSelectAll);
  
      // Set the state of all checkboxes to match the state of "Select All"
      const updatedCheckboxes = {};
      for (const key in checkboxes) {
        updatedCheckboxes[key] = newSelectAll;
      }
      setCheckboxes(updatedCheckboxes);
    };
  
    const handleCheckboxChange = (key) => {
      return (e) => {
        const updatedCheckboxes = {
          ...checkboxes,
          [key]: e.target.checked,
        };
        setCheckboxes(updatedCheckboxes);
  
        // Check if all other checkboxes are checked and update the "Select All" checkbox state
        const allChecked = Object.values(updatedCheckboxes).every((value) => value);
        setSelectAll(allChecked);
      };
    };
  
    return (
      <div>
        <Form.Group className="mb-2">
          <Form.Check
            type="checkbox"
            label="Select All"
            checked={selectAll}
            onChange={handleSelectAllChange}
          />
        </Form.Group>
  
        <Form.Group className="mb-2">
          <Form.Check
            type="checkbox"
            label="Evb1"
            checked={checkboxes.evb1}
            onChange={handleCheckboxChange('evb1')}
          />
          <Form.Check
            type="checkbox"
            label="Evb2"
            checked={checkboxes.evb1}
            onChange={handleCheckboxChange('evb1')}
          />
          <Form.Check
            type="checkbox"
            label="Evb3"
            checked={checkboxes.evb1}
            onChange={handleCheckboxChange('evb1')}
          />
          <Form.Check
            type="checkbox"
            label="Evb4"
            checked={checkboxes.evb1}
            onChange={handleCheckboxChange('evb1')}
          />
          {/* Add more checkboxes here with similar structure */}
        </Form.Group>
      </div>
    );
  };
  



const Checkbox = () => {
    const [deviceName, setDeviceName] = useState(false); // Use a boolean state for the checkbox
  
    const handleCheckboxChange = (e) => {
      setDeviceName(e.target.checked); // Update the state when the checkbox value changes
    };
  
    return (
      <Form.Group className="mb-2">
        <Form.Check
          type="checkbox"
          label="Evb1"
          checked={deviceName}
          onChange={handleCheckboxChange}
        />
      </Form.Group>
    );
  };
  
function MyVerticallyCenteredModal(props) {
  const [devicename, setDeviceName] = useState('hello');

  return (
    <Modal {...props} centered>
    <Modal.Header closeButton>
      <Modal.Title>Add Solution</Modal.Title>
    </Modal.Header>
    <Modal.Body >
      <Form>
        <Form.Group className="mb-2">
          <Form.Label>Solution Name</Form.Label>
          <Form.Control
            type="text"
         
            onChange={(e) => setDeviceName(e.target.value)}
          />
        </Form.Group>

      
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="primary" >
        Add
      </Button>
      <Button variant="secondary" onClick={props.onHide}>
        Cancel
      </Button>
    </Modal.Footer>
  </Modal>
  );
}


function MyVerticallyCenteredModal1(props) {
  
    return (
      <Modal {...props} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Solutions</Modal.Title>
      </Modal.Header>
      <Modal.Body >
      <Checkbox/>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" >
          Delete
        </Button>
        <Button variant="secondary" onClick={props.onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    );
  }


  function MyVerticallyCenteredModal2(props) {

    return (
      <Modal {...props} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Device</Modal.Title>
      </Modal.Header>
      <Modal.Body >
        <Selectall/>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" >
          Add
        </Button>
        <Button variant="secondary" onClick={props.onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    );
  }


  function MyVerticallyCenteredModal3(props) {
    const [devicename, setDeviceName] = useState('hello');
 
    return (
      <Modal {...props} centered>
      <Modal.Header closeButton>
        <Modal.Title>Alert Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body >
        <Form>
          <Form.Group className="mb-2">
            <Flex style={{
        
        gap:"0.5rem",
      
      }}>
            <Flex direction='column'>
        <Text    style={{
        
        marginTop:"2.7rem",
      }}><b>Voltage</b></Text>

        <Text style={{
        
        marginTop:"0.7rem",
      }}><b>Temperature</b></Text>
        <Text style={{
        
        marginTop:"0.7rem",
      }}><b>Humidity</b></Text>
         </Flex>
         
            <Flex direction='column'>
            <Text style={{
        
        marginBottom:"0.7rem",
      }}>CriticalMin</Text>
         <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />

         </Flex>
         <Flex direction='column'>
         <Text style={{
        
        marginBottom:"0.7rem",
      }}>WarningMin</Text>
         <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />

         </Flex>
         <Flex direction='column'>
         <Text style={{
        
        marginBottom:"0.7rem",
      }}>WarningMax</Text>
         <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />

         </Flex>
         <Flex direction='column'>
         <Text style={{
        
        marginBottom:"0.7rem",
      }}>CriticalMax</Text>
         <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />
               <Form.Control
              type="number"
              value={devicename}
              onChange={(e) => setDeviceName(e.target.value)}
            />

         </Flex>
         

            </Flex>
       
          </Form.Group>
  
        
        </Form> 
      
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" >
          Apply
        </Button>
        <Button variant="secondary" onClick={props.onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
    );
  }



function Modals1(props) {
  const [modalShow, setModalShow] = useState(false);

  return (
    <>
      <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
        {props.children}
      </Text>
      <MyVerticallyCenteredModal
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
    </>
  );
}

function Modals2(props) {
  const [modalShow, setModalShow] = useState(false);

  return (
    <>
      <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
        {props.children}
      </Text>
      <MyVerticallyCenteredModal1
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
    </>
  );
}

function Modals3(props) {
  const [modalShow, setModalShow] = useState(false);

  return (
    <>
      <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
        {props.children}
      </Text>
      <MyVerticallyCenteredModal2
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
    </>
  );
}

function Modals4(props) {
    const [modalShow, setModalShow] = useState(false);
  
    return (
      <>
        <Text fontSize='sm' fontWeight='400' onClick={() => setModalShow(true)}>
          {props.children}
        </Text>
        <MyVerticallyCenteredModal3
          show={modalShow}
          onHide={() => setModalShow(false)}
        />
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
        p='15px'
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
            <Icon as={MdAdd} h='16px' w='16px' me='8px' />
            <Modals1>AddSolution</Modals1>
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
            <Icon as={MdDelete} h='16px' w='16px' me='8px' />
            <Modals2>DeleteSolutions</Modals2>
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
            <Icon as={MdAdd} h='16px' w='16px' me='8px' />
            <Modals3>AddDevice</Modals3>
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
            <Icon as={MdWarning} h='16px' w='16px' me='8px' />
            <Modals4>AlertConfig</Modals4>
          </Flex>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

