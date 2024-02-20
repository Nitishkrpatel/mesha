const BASE_URL = "http://192.168.31.236:5010";
const SOLUTION_ID = "life_sanitizer";
const TD_URL = "http://192.168.31.236:6041";
const KEYCLOAK_URL = "http://192.168.31.236:8085";

export const getBlocks = (data) => {
  return `${BASE_URL}/tree_view?solution_id=${data.solutionname}&path=${data.data}`;
};

export const getFloors = (data) => {
  return `${BASE_URL}/tree_view?solution_id=${data.solutionname}&path=${data.root}`;
};

export const getApartments = (data) => {
  return `${BASE_URL}/tree_view?solution_id=${data.solutionname}&path=${data.root}`;
};

export const getDevices = (data) => {
  return `${BASE_URL}/tree_view?solution_id=${data.solutionname}&path=${data.root}`;
};

export const devicetelemetry = () => {
  return `${TD_URL}/rest/sql/iot_platform`;
};

export const solutiontypes = (data) => {
  return `${BASE_URL}/get_all_solution_types?tenant_id=${data}`;
};

export const tenant_list = () => {
  return `${BASE_URL}/tenant_list`;
};

export const addtenant = (data) => {
  return `${BASE_URL}/tenant_registry`;
};

export const edittenant = (data) => {
  return `${BASE_URL}/edit_tenant?tenant_id=${
    data.editingIndex
  }&&new_tenant_name=${encodeURIComponent(data.newTenant)}`;
};

export const Keycloak_URL = () => {
  return `${KEYCLOAK_URL}`;
};

export const upload_solution_and_device = () => {
  return ` ${BASE_URL}/upload_solution_and_device`;
};

export const download_json = (data) => {
  return ` ${BASE_URL}/download_json/${data}`;
};

export const getTeanantUserList = (data) => {
  return `  ${BASE_URL}/tenant_users?tenant_id=${data}`;
};

export const userResetPassword = () => {
  return `${BASE_URL}/reset_password`;
};

export const editUserProfile = () => {
  return `${BASE_URL}/edit_profile`;
};

export const device_list = (data) => {
  return `${BASE_URL}/device_list?tenant_id=${data}`;
};

export const getUserRoles = (data) => {
  return `${BASE_URL}/user_roles?tenant_id=${data}`;
};

export const addUser = () => {
  return `${BASE_URL}/user_registration`;
};
