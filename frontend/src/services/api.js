import axios from "axios";
import { API_BASE_URL, TOKEN_STORAGE_KEY } from "@/utils/constants";

export class ApiClientError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      onUnauthorized?.();
    }
    const data = error.response?.data;
    const message = data?.message ?? "Something went wrong. Please try again.";
    throw new ApiClientError(message, error.response?.status ?? 500, data?.errors);
  }
);

export async function getEnvelope(url, params) {
  const response = await api.get(url, { params });
  return {
    data: response.data.data,
    message: response.data.message,
    pagination: response.data.pagination,
  };
}

export async function getData(url, params) {
  const envelope = await getEnvelope(url, params);
  return envelope.data;
}

export async function postData(url, body) {
  const response = await api.post(url, body);
  return response.data.data;
}

export async function putData(url, body) {
  const response = await api.put(url, body);
  return response.data.data;
}

export async function patchData(url, body) {
  const response = await api.patch(url, body);
  return response.data.data;
}

export async function deleteData(url) {
  const response = await api.delete(url);
  return response.data.data;
}