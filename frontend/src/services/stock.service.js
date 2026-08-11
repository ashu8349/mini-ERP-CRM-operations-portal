import { getEnvelope, postData } from "./api";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

export const stockService = {
  async list(query) {
    const envelope = await getEnvelope("/stock-movements", query);
    return { items: envelope.data, pagination: envelope.pagination ?? emptyPagination };
  },

  async create(input) {
    return postData("/stock-movements", input);
  },

  async productHistory(productId, query) {
    const envelope = await getEnvelope(`/products/${productId}/stock-movements`, query);
    return { items: envelope.data, pagination: envelope.pagination ?? emptyPagination };
  },
};