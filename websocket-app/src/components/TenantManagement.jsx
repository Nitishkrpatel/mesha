// TenantManagement.js
import React, { useEffect, useState } from "react";

import axios from "axios";
import styles from "./TenantStyles.module.css";

const TenantManagement = () => {
  const [newTenant, setNewTenant] = useState("");
  const [tenantList, setTenantList] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch tenant list from the API when the component mounts
    fetchTenantList();
  }, []);

  const fetchTenantList = async () => {
    try {
      const response = await axios.get(
        "http://192.168.31.249:5010/tenant_list"
      );
      setTenantList(response.data.tenants_list);
    } catch (error) {
      console.error("Error fetching tenant list:", error);
    }
  };

  const handleAddTenant = async () => {
    if (newTenant.trim() !== "") {
      try {
        let url;

        if (editingIndex !== null) {
          // If editing, update the tenant at the editingIndex
          url = `http://192.168.31.249:5010/edit_tenant?tenant_id=${editingIndex}&&new_tenant_name=${encodeURIComponent(
            newTenant
          )}`;
        } else {
          // If not editing, add a new tenant to the list
          url = `http://192.168.31.249:5010/tenant_registry?tenant_name=${encodeURIComponent(
            newTenant
          )}`;
        }

        // Use the GET method to add or update the tenant
        await axios.get(url);

        // Fetch the updated tenant list after adding/editing
        fetchTenantList();

        setNewTenant("");
        setEditingIndex(null);
        setError(""); // Clear any previous errors
      } catch (error) {
        console.error("Error adding/editing tenant:", error);
        setError("Error adding/editing tenant. Please try again.");
      }
    } else {
      setError("Tenant name cannot be empty.");
    }
  };

  const handleEditTenant = (tenantId) => {
    // Find the index of the tenant with the matching tenant_id
    const index = tenantList.findIndex(
      (tenant) => tenant.tenant_id === tenantId
    );

    // Check if the index is valid before setting the state
    if (index !== -1) {
      setEditingIndex(tenantId);
      setNewTenant(tenantList[index].tenant_name);
      setError(""); // Clear any previous errors
    } else {
      console.error("Tenant not found in the list");
      // Handle the case where the tenant is not found (optional)
    }
  };

  const handleCancelEdit = () => {
    setNewTenant("");
    setEditingIndex(null);
    setError(""); // Clear any previous errors
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Tenant Management</h2>

      <div className={styles.inputContainer}>
        <label htmlFor="newTenant" className={styles.label}>
          Add/Edit Tenant:
        </label>
        <input
          type="text"
          id="newTenant"
          value={newTenant}
          onChange={(e) => setNewTenant(e.target.value)}
          className={styles.input}
        />
        <button
          onClick={handleAddTenant}
          className={styles.addButton}
          disabled={!newTenant.trim()} // Disable button when newTenant is empty
        >
          {editingIndex !== null ? "Save" : "Add"}
        </button>
        {editingIndex !== null && (
          <button onClick={handleCancelEdit} className={styles.cancelButton}>
            Cancel
          </button>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {(tenantList?.length ?? 0) > 0 && (
        <div className={styles.listContainer}>
          <h3 className={styles.listHeading}>Tenant List:</h3>
          <table className={styles.tenantTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenantList.map((tenant) => (
                <tr key={tenant.tenant_id} className={styles.tenantTableRow}>
                  <td>{tenant.tenant_id}</td>
                  <td>{tenant.tenant_name}</td>
                  <td>
                    <button
                      onClick={() => handleEditTenant(tenant.tenant_id)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
