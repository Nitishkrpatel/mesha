import React, { useState, useEffect } from 'react';
import { Table, Tbody, Tr, Th, Td, Center,Thead } from '@chakra-ui/react';
import axios from 'axios';
import {devicetelemetry} from '../../../networks';
const Device = ({ data }) => {
  const [columnMeta, setColumnMeta] = useState([]);
  const [data1, setData] = useState([]);
  useEffect(() => {
    // Function to make the POST request
    const fetchData = async () => {
      try {
        const username = 'root';
        const password = 'taosdata';
        const basicAuth = 'Basic ' + btoa(username + ':' + password);
        // Prepare the SQL query
        console.log(basicAuth)
        const body = "select * from " + data.name+" order by ts desc;"; // Ensure response.data.root has the table name
        // const body = "select * from test order by ts desc";
        // RequestOptions for the POST request
        const headers= {
          'Content-Type': 'application/text',
          'Authorization': basicAuth // Include the basic auth in your headers
            }
        const response = await axios.post(devicetelemetry(), body, { headers })
        // Assuming the response data is in the format you expect for tableData
        const payload = response.data;
        setColumnMeta(payload.column_meta);
        setData(payload.data);
      } catch (error) {
        console.error('Error fetching device data:', error);
        // Handle error appropriately
      }
    };

    fetchData();
  }, []); 
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
  
    const day = date.getDate(); // Day of the month
    const month = date.toLocaleString('en-US', { month: 'short' }); // Month as a three-letter abbreviation
    const year = date.getFullYear(); // Full year
    const hours = date.getHours(); // Hours (0-23)
    const minutes = ('0' + date.getMinutes()).slice(-2); // Minutes with leading zero
    const seconds = ('0' + date.getSeconds()).slice(-2); // Seconds with leading zero
  
    // Construct the formatted string
    return `${month} ${day} ${year} ${hours}:${minutes}:${seconds}`;
  };
    // Check if tableData is not null and has length
    const hasData = data1 && data1.length > 0;
  
    // Render the table
    return (
      <div style={{ overflowX: 'auto' }}>
        
    <Table variant="simple">
    <Thead>
        <Tr>
        {hasData ? (
        columnMeta.map((meta, index) => (
            <Th key={index}>{meta[0]}</Th> // Using the first element of each column_meta array as the header
          ))
          ) : (
            <Tr>
                <Td colSpan="2">No data available</Td>
            </Tr>
        )
          }
        </Tr>
    </Thead>
    <Tbody>
        {hasData ? (
              data1.map((row, rowIndex) => (
                <Tr key={rowIndex}>
                  {row.map((cell, cellIndex) => {
                // Assume the date-time value is in the third column (index 2)
                if (cellIndex === 0) {
                  // Format the date-time string
                  return <Td whiteSpace="nowrap" key={cellIndex}>{formatDateTime(cell)}</Td>;
                }
                // Render other cells normally
                return <Td key={cellIndex}>{cell}</Td>;
              })}
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
export default Device;
