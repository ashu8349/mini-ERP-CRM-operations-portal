export const ROLE_LABELS = {
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  ACCOUNTS: "Accounts",
};

export const ROLE_BADGE_STYLES = {
  ADMIN: "bg-violet-100 text-violet-700 ring-violet-200",
  SALES: "bg-blue-100 text-blue-700 ring-blue-200",
  WAREHOUSE: "bg-amber-100 text-amber-700 ring-amber-200",
  ACCOUNTS: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

export const CUSTOMER_TYPE_LABELS = {
  Retail: "Retail",
  Wholesale: "Wholesale",
  Distributor: "Distributor",
};

export const CUSTOMER_TYPE_STYLES = {
  Retail: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Wholesale: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Distributor: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
};

export const CUSTOMER_STATUS_LABELS = {
  Lead: "Lead",
  Active: "Active",
  Inactive: "Inactive",
};

export const CUSTOMER_STATUS_STYLES = {
  Lead: "bg-amber-50 text-amber-700 ring-amber-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const CHALLAN_STATUS_LABELS = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

export const CHALLAN_STATUS_STYLES = {
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const MOVEMENT_TYPE_LABELS = {
  IN: "Stock In",
  OUT: "Stock Out",
};

export const MOVEMENT_TYPE_STYLES = {
  IN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OUT: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const APP_NAME = "OpsFlow ERP";
export const APP_SUBTITLE = "Mini ERP + CRM Operations Portal";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
export const TOKEN_STORAGE_KEY = "opsflow_token";