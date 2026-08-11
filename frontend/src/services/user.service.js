import { getData, patchData, postData } from "./api";

export const userService = {
  async list() {
    return getData("/users");
  },

  async updateRole(id, role) {
    return patchData(`/users/${id}/role`, { role });
  },

  async updateStatus(id, isActive) {
    return patchData(`/users/${id}/status`, { isActive });
  },

  async resetPassword(id, newPassword) {
    return postData(`/users/${id}/reset-password`, { newPassword });
  },
};