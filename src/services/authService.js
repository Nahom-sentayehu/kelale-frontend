import API from "../api/axios";

export const registerCustomer = (data) => {
  return API.post("/customers/register", data);
};
