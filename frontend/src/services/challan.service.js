import { getEnvelope, getData, postData, putData } from "./api";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

export const challanService = {
  async list(query) {
    const envelope = await getEnvelope("/challans", query);
    return { items: envelope.data, pagination: envelope.pagination ?? emptyPagination };
  },

  async get(id) {
    return getData(`/challans/${id}`);
  },

  async create(input) {
    return postData("/challans", input);
  },

  async update(id, input) {
    return putData(`/challans/${id}`, input);
  },

  async confirm(id) {
    return postData(`/challans/${id}/confirm`);
  },

  async cancel(id) {
    return postData(`/challans/${id}/cancel`);
  },
};