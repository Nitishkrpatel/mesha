import React, { useState } from "react";
import Calendar from "react-calendar";
import { MdToday } from 'react-icons/md';
import "react-calendar/dist/Calendar.css";
import { Text, Icon, ButtonGroup, Button, Box, Center } from "@chakra-ui/react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export default function ToggleGroup(props) {
  const { selectRange, ...rest } = props;
  const [value, onChange] = useState(new Date());
  const [selectedValue, setSelectedValue] = useState(3600);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  return (
    <Box position="relative">
      <Center>
        <ButtonGroup
          value={selectedValue}
          onChange={(event, newValue) => {
            setSelectedValue(newValue);
            console.log(newValue);
          }}
          aria-label="Font Style"
          style={{ marginBottom: "10px" }}
        >
          <Button variant="brand" value={3600}>1H</Button>
          <Button variant="brand" value={21600}>6H</Button>
          <Button variant="brand" value={86400}>1D</Button>
          <Button variant="brand" value={604800}>1W</Button>
          <Button variant="brand" value={2592000}>1M</Button>
          <Button variant="brand" onClick={toggleCalendar}><Icon as={MdToday} width="20px" height="20px" color="inherit" /></Button>
        </ButtonGroup>
      </Center>
      {isCalendarOpen && (
        <Box
          position="absolute"
          top="-300px" // Adjust top position as needed
          right="40" // Align to the right
          width="300px"
          zIndex="999"
          backgroundColor="white"
          borderRadius="4px"
          boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <Icon
              as={MdChevronLeft}
              w="24px"
              h="24px"
              mt="4px"
              onClick={() => onChange(new Date(value.getFullYear(), value.getMonth() - 1, value.getDate()))}
            />
            <Text fontSize="sm">
              <span style={{ fontWeight: "bold" }}>From:</span>{" "}
              {startDate.toLocaleDateString()}
            </Text>
            {endDate && (
              <>
                <Text fontSize="sm" ml="8px">
                  <span style={{ fontWeight: "bold" }}>To:</span>{" "}
                  {endDate.toLocaleDateString()}
                </Text>
              </>
            )}
            <Icon
              as={MdChevronRight}
              w="24px"
              h="24px"
              mt="4px"
              onClick={() => onChange(new Date(value.getFullYear(), value.getMonth() + 1, value.getDate()))}
            />
          </div>
          <Calendar
            onChange={(date) => {
              if (!startDate || (startDate && endDate)) {
                // If there's no start date or both start and end dates are set, update start date
                setStartDate(date);
                setEndDate(null); // Reset end date
              } else if (date > startDate) {
                // If a date is selected after the start date, update the end date
                setEndDate(date);
              } else {
                // Otherwise, update the start date
                setStartDate(date);
                setEndDate(null); // Reset end date
              }
            }}
            value={value}
            selectRange={selectRange}
            view={"month"}
            tileContent={<Text color="brand.500"></Text>}
            prevLabel={<Icon as={MdChevronLeft} w="24px" h="24px" mt="4px" />}
            nextLabel={<Icon as={MdChevronRight} w="24px" h="24px" mt="4px" />}
          />
        </Box>
      )}
    </Box>
  );
}
