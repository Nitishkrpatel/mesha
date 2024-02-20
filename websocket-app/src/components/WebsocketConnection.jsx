import "react-toastify/dist/ReactToastify.css";

import React, { useEffect, useState } from "react";

// import Model from "./Model";
import TableManager from "./TableManager";

// import { ToastContainer, toast } from "react-toastify";

const WebsocketConnection = () => {
  const [messages, setMessages] = useState([]);
  // const notify = () => {
  //   toast.success("Customized notification!", {
  //     position: toast.POSITION.TOP_RIGHT,
  //     autoClose: 2000, // Auto close the notification after 2 seconds
  //     hideProgressBar: false,
  //     closeOnClick: true,
  //     pauseOnHover: true,
  //   });
  // };

  useEffect(() => {
    let ws;

    try {
      ws = new WebSocket("ws://ditto:ditto@192.168.31.62:8080/ws/2");
      ws.onopen = () => {
        ws.send("START-SEND-EVENTS");
        // ws.send("START-SEND-MESSAGES");
        // ws.send("START-SEND-LIVE-EVENTS");
        // ws.send("START-SEND-LIVE-COMMANDS");
      };

      ws.onmessage = (message) => {
        try {
          if (message.data) {
            // Check if the message is valid JSON
            if (message.data.startsWith("{")) {
              const receivedMessage = JSON.parse(message.data);
              console.log(receivedMessage.value);
              // Update state to include the new message
              setMessages((prevMessages) => [
                receivedMessage.value,
                ...prevMessages,
                // Store the object directly
              ]);
            } else {
              // Handle non-JSON messages here
              console.log("Received non-JSON message:", message.data);
            }
          } else {
            console.error(
              "Incoming message does not contain 'data' property:",
              message
            );
          }
        } catch (error) {
          console.error("Error parsing incoming message:", error);
        }
      };

      ws.onerror = (error) => console.log(error);
      ws.onclose = () => console.log("WebSocket closed");
    } catch (error) {
      console.log(error);
    }

    // Clean up the WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, []); // Empty dependency array ensures the effect runs once on mount

  return (
    <div>
      <div>
        <h1 style={{ textAlign: "center" }}>
          Device Tables Live Data Dashboard Using Websocket
        </h1>
        {messages.length > 0 && <TableManager deviceData={messages} />}
        {/* <div className="d-flex ">
          <Model />
          <button onClick={notify} className="btn btn-success">
            Show Notification
          </button>
          <ToastContainer />
        </div> */}
      </div>
    </div>
  );
};

export default WebsocketConnection;
