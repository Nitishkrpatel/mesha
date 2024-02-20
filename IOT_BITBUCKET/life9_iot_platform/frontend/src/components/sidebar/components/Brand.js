import React from "react";

// Chakra imports
import { Flex, useColorModeValue } from "@chakra-ui/react";

// Custom components
import { HorizonLogo } from "components/icons/Icons";
import { HSeparator } from "components/separator/Separator";
import logo from '../../../assets/img/logo.png'; // Adjust the path based on the relative position of the file
export function SidebarBrand({ logoColor }) {


  return (
    <Flex align='center' direction='column'>
      <img
        src={logo} // Use the imported local logo image
        alt="Local Logo"
        style={{ marginBottom: '25px', marginTop:'21px', color: useColorModeValue(logoColor, 'white') }} // Adjust color mode for logoColor
        width='90px'
        height='60px'
      />
      <HSeparator mb='20px' />
    </Flex>
  );
}

export default SidebarBrand;
