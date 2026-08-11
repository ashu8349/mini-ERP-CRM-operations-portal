import { getData } from "./api";

export const dashboardService = {
  async stats() {
    return getData("/dashboard/stats");
  },
};