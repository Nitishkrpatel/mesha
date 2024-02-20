import React, { useState } from "react";

const Model = () => {
  const [isModalVisible, setModalVisibility] = useState(false);
  // Your function to show the modal
  const showModal = () => {
    setModalVisibility(true);
  };
  return (
    <div>
      {/* Your content */}
      <button onClick={showModal} className="btn btn-primary">
        Show Modal
      </button>

      {/* Bootstrap Modal */}
      <div
        className={`modal fade ${isModalVisible ? "show" : ""}`}
        tabIndex="-1"
        role="dialog"
        style={{ display: isModalVisible ? "block" : "none" }}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Modal Title</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setModalVisibility(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {/* Modal content goes here */}
              Your modal content
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalVisibility(false)}
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model;
