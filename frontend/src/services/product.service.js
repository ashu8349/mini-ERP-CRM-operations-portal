import { getEnvelope, getData, postData, putData } from "./api";

const emptyPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

export const productService = {
  async list(query) {
    const envelope = await getEnvelope("/products", {
      ...query,
      lowStock: query.lowStock === undefined ? undefined : String(query.lowStock),
    });
    return { items: envelope.data, pagination: envelope.pagination ?? emptyPagination };
  },

  async get(id) {
    return getData(`/products/${id}`);
  },

  async categories() {
    return getData("/products/categories");
  },

  async create(input) {
    return postData("/products", input);
  },

  async update(id, input) {
    return putData(`/products/${id}`, input);
  },
};