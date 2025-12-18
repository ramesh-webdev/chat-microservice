import api from "./api";

export const fetchUsers = () => {
  return api.get("/users");
};
