import { deleteData, getEnvelope, getData, postData, putData } from "./api";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

export const customerService = {
  async list(query) {
    const envelope = await getEnvelope("/customers", query);
    return { items: envelope.data, pagination: envelope.pagination ?? emptyPagination };
  },

  async get(id) {
    return getData(`/customers/${id}`);
  },

  async create(input) {
    return postData("/customers", input);
  },

  async update(id, input) {
    return putData(`/customers/${id}`, input);
  },

  async remove(id) {
    return deleteData(`/customers/${id}`);
  },

  async addFollowUp(customerId, note, followUpDate) {
    return postData(`/customers/${customerId}/followups`, { note, followUpDate });
  },
};