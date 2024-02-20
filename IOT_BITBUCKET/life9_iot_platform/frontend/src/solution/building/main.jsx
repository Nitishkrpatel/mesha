import React, { useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Box, SimpleGrid } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import Card from 'components/card/Card'; // Adjust the path based on your project structure
import Tree from './buildingcomponents/tree';
import Blocks from './buildingcomponents/blocks';
import Floors from './buildingcomponents/floors';
import Devices from './buildingcomponents/devices';
import Device from './buildingcomponents/device';
import Apartments from './buildingcomponents/apartments';
import Blocksvr from './vrComponents/Blocksvr';
import Floorsvr from './vrComponents/Floorsvr';
import Apartmentsvr from './vrComponents/Apartmentsvr';
import Devicesvr from './vrComponents/Devicesvr'
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
const Main = () => {
  const location = useLocation();
  const data = useMemo(() => location.state, [location.state]);
  const vrCardRef = useRef(null);
  var data1 = localStorage.getItem('myData')
  data1 = JSON.parse(data1)
  const [selectedNode, setSelectedNode] = useState(null);
  const handleNodeSelect = useCallback((node) => {

    setSelectedNode(node);
  }, []);
  useEffect(() => {
    if (selectedNode) {
    }
  }, [selectedNode]);

  return (
    <>
      <Box pt={{ base: '130px', md: '20px', xl: '20px' }} style={{ marginTop: '55px' }}>
        {/* <SimpleGrid mb="20px" columns={{ base: 1, md: 2 }} spacing={{ base: '20px', xl: '20px' }}>
          <Card>
          <div>
          {selectedNode && selectedNode.type === 'blocks' && <Blocksvr data={selectedNode} />}
          {selectedNode && selectedNode.type === 'block' && <Floorsvr data={selectedNode}/>}
          {selectedNode && selectedNode.type === 'floor' && <Apartmentsvr data={selectedNode}/>}
          <Devicesvr></Devicesvr>
          </div>
          </Card>

          <Card>
            <Tree onNodeSelect={handleNodeSelect} name={data} />
          </Card>
        </SimpleGrid> */}
        <Tabs isFitted variant='enclosed'>
          <TabList>
            <Tab>VR</Tab>
            <Tab>Tree</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Card>
                <div>
                  {selectedNode && selectedNode.type === 'blocks' && <Blocksvr data={selectedNode} />}
                  {selectedNode && selectedNode.type === 'block' && <Floorsvr data={selectedNode} />}
                  {selectedNode && selectedNode.type === 'floor' && <Apartmentsvr data={selectedNode} />}
                  {/* <Devicesvr></Devicesvr> */}
                </div>
              </Card>
            </TabPanel>
            <TabPanel>
              <Card>
                <Tree onNodeSelect={handleNodeSelect} name={data} />
              </Card>
            </TabPanel>

          </TabPanels>
        </Tabs>
        {/* Bottom card for Switch */}
        <Card >
          <div>
            {selectedNode && selectedNode.type === 'blocks' && <Blocks data={selectedNode} />}
            {selectedNode && selectedNode.type === 'block' && <Floors data={selectedNode} />}
            {selectedNode && selectedNode.type === 'floor' && <Apartments data={selectedNode} />}
            {selectedNode && selectedNode.type === 'apartment' && <Devices data={selectedNode} />}
            {selectedNode && selectedNode.type === 'device' && <Device data={selectedNode} />}
          </div>
        </Card>
      </Box>
    </>
  );
};

export default Main;