import { getData, postData } from "./api";

export const authService = {
  async login(email, password) {
    return postData("/auth/login", { email, password });
  },

  async me() {
    return getData("/auth/me");
  },

  async changePassword(currentPassword, newPassword) {
    return postData("/auth/change-password", { currentPassword, newPassword });
  },
};