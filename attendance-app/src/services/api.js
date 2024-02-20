// api.js

import axios from "axios";

const baseURL = "https://api.example.com"; // Replace with your API base URL

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    // Add any other headers you may need
  },
});

// Function to make a GET request
export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Function to make a POST request
export const postData = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};

// Add more functions for other types of requests (PUT, DELETE, etc.) as needed
