import { Box, SimpleGrid } from "@chakra-ui/react";
import React, { useContext, useEffect, useMemo, useState } from "react";

import DevelopmentAssets from "./components/DevelopmentAssets";
import axios from "axios";
import { columnsDataDevelopment } from "views/admin/marketplace/variables/tableColumnsTopCreators";
import KeycloakContext from "auth/KeycloakContext";
import { device_list } from "networks";

export default function Marketplace() {
  const [deviceList, setDeviceList] = useState([]);
  const { keycloak, authenticated, logout, userProfile } =
    useContext(KeycloakContext);
  useEffect(() => {
    // Fetch the list of uploaded files on component mount
    fetchDeviceList();
  }, []);

  const fetchDeviceList = () => {
    // Make an API call to fetch the list of uploaded files
    axios
      // .get(`http://192.168.31.236:5010/device_list?tenant_id=${userProfile?.attributes.tenant_id}`)
      .get(device_list(userProfile.attributes.tenant_id))
      .then((response) => {
        setDeviceList(response.data);
      })
      .catch((error) => {
        console.error("Error fetching uploaded files:", error);
      });
  };
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SimpleGrid
        mb="20px"
        columns={{ md: 1 }}
        spacing={{ base: "20px", xl: "20px" }}
      >
        <DevelopmentAssets
          columnsData={columnsDataDevelopment}
          tableData={deviceList}
        />
      </SimpleGrid>
    </Box>
  );
}
