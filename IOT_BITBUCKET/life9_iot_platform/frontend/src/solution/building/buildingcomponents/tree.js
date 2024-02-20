// Block Component
import React, { useState, useEffect,useCallback } from 'react';
import {getBlocks,getFloors,getApartments,getDevices} from '../../../networks'
import { Box, Text, Icon } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
function TreeNode({ label, loadChildren, isLeaf, onSelect, type }) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false); // New loading state

  const loadChildrenAndUpdateState = async () => {
    setLoading(true);
    try {
        const children = await loadChildren();
        setChildren(children);
        setLoading(false);
        // Invoke onSelect with updated children
        if (onSelect) {
            onSelect({ name: label, children, type });
        }
    } catch (error) {
        console.error("Failed to load children:", error);
        setLoading(false);
    }
};

const toggleOpen = () => {
    if (!isLeaf) {
        setIsOpen(!isOpen);
        if (!isOpen) { // If we are opening the node, load children
            loadChildrenAndUpdateState();
        } else if (onSelect) { // If we are closing the node, invoke onSelect immediately
            onSelect({ name: label, children, type });
        }
    }
};



  useEffect(() => {
    let isMounted = true; // Track if the component is mounted
  
    if (isOpen && loadChildren) {
        setLoading(true); // Start loading
      
        loadChildren().then((children) => {
            if (isMounted) { // Only update state if the component is still mounted
                setChildren(children);
                setLoading(false); // End loading
            }
        }).catch(error => {
            if (isMounted) { // Only update state if the component is still mounted
                console.error("Failed to load children:", error);
                setLoading(false); // In case of error, stop loading as well
            }
        });
        // console.log(loadChildren())
    }
  
    return () => {
      isMounted = false; // Set it to false when the component is unmounted
    };
  }, [isOpen, loadChildren]); 

  const handleSelect = () => {
      if (onSelect) {
          onSelect({ name: label, children, type });
      }
  };
  return (
      <div>
          <div onClick={() => { toggleOpen(); handleSelect(); }}>
              {label}
              {!isLeaf && (isOpen ?  <Icon as={ChevronDownIcon} style={{ marginRight: '4px', fontSize: '17px' }} /> 
              :  <Icon as={ChevronRightIcon} style={{ marginRight: '4px', fontSize: '17px' }} />)}
          </div>
          {isOpen && !isLeaf && (
              <div style={{ marginLeft: '20px' }}>
                  {loading ? <div>Loading...</div> : // Render loading indicator when loading
                      children.length > 0 ?
                          children.map(child => (
                              <TreeNode key={child.name} label={child.name} loadChildren={child.loadChildren} isLeaf={child.isLeaf} onSelect={onSelect} type={child.type} />
                          )) : 'No Data'
                  }
              </div>
          )}
      </div>
  );
}

function Tree({onNodeSelect,name}) {
  // console.log('Tree component render:', { name });
  const loadBlocks = useCallback(() => {
    return fetch(getBlocks(name))
      .then(response => response.json())
      .then(data => data.data.map(block => ({
        root: block.thingId.replace(":","."),
        name:block.thingId.split(':')[1],
        loadChildren: () => loadFloors({"root":block.thingId.replace(":","."),"solutionname":name.solutionname}),
        isLeaf: false,
        type:"block"
      })));
  }, []);

  const loadFloors = useCallback((data) => { 
   
    return fetch(getFloors(data))
    .then(response =>  response.json())
    .then(data =>  data.data.map(block => ({
      root: block.thingId.replace(":","."),
      name: block.thingId.split(':')[1],
      loadChildren: () => loadApartments({"root":block.thingId.replace(":","."),"solutionname":name.solutionname}),
      isLeaf: false,
      type:"floor"
    })));
   
  }, []);
  const loadApartments =useCallback((data) => { 
   
    return fetch(getApartments(data))
    .then(response => response.json())
    .then(data => data.data.map(block => ({
      root: block.thingId.replace(":","."),
      name: block.thingId.split(':')[1],
      loadChildren: () => loadDevices({"root":block.thingId.replace(":","."),"solutionname":name.solutionname}),
      isLeaf: false,
      type:"apartment"
    })));
  }, []);
  const loadDevices = useCallback((data) => { 
   
    return fetch(getDevices(data))
    .then(response => response.json())
    .then(data => data.data.map(block => ({
      
      root: block.thingId.replace(":","."),
      name: block.thingId.split(':')[1],
      // loadChildren: () => loadFloors({"root":block.thingId.replace(":","."),"solutionname":name.solutionname}),
      isLeaf: true,
      type:"device"
    })));
  }, []);

  // Similar functions for loading apartments and devices

  return (
    <div>
      <TreeNode label={name.solutionname} loadChildren={loadBlocks} isLeaf={false}  onSelect={onNodeSelect} type="blocks" />
    </div>
  );
}
export default Tree