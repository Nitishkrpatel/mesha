import React, { useState, useEffect } from "react";
import { Table, Tbody, Tr, Th, Td, Center,Thead } from '@chakra-ui/react';
const Blocks = ({ data }) => {
    // const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
 
    const tableData=data.children
  // Check if tableData is not null and has length
  const hasData = tableData && tableData.length > 0;
  // Render the table
  return (
    <div>
      <Table variant="simple">
    <Thead>
        <Tr>
            <Th>ID</Th>
            <Th>Block Name</Th>
        </Tr>
    </Thead>
    <Tbody>
        {hasData ? (
              tableData.map((item,index) => (
                <Tr key={item.index}>
                    <Td>{item.id || index+1}</Td>
                    <Td>{item.name}</Td>
                </Tr>
            ))
        ) : (
            <Tr>
                <Td colSpan="2">No data available</Td>
            </Tr>
        )}
    </Tbody>
</Table>
    </div>
  );
};

export default Blocks;
