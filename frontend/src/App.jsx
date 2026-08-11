import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireRole } from "@/components/guards/RequireRole";
import { PageLoader } from "@/components/ui/Spinner";
import { LoginPage } from "@/pages/LoginPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import("@/pages/customers/CustomersPage").then((m) => ({ default: m.CustomersPage })));
const CustomerFormPage = lazy(() => import("@/pages/customers/CustomerFormPage").then((m) => ({ default: m.CustomerFormPage })));
const CustomerDetailPage = lazy(() => import("@/pages/customers/CustomerDetailPage").then((m) => ({ default: m.CustomerDetailPage })));
const ProductsPage = lazy(() => import("@/pages/products/ProductsPage").then((m) => ({ default: m.ProductsPage })));
const ProductFormPage = lazy(() => import("@/pages/products/ProductFormPage").then((m) => ({ default: m.ProductFormPage })));
const ProductDetailPage = lazy(() => import("@/pages/products/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const ProductMovementsPage = lazy(() => import("@/pages/stock/ProductMovementsPage").then((m) => ({ default: m.ProductMovementsPage })));
const StockMovementsPage = lazy(() => import("@/pages/stock/StockMovementsPage").then((m) => ({ default: m.StockMovementsPage })));
const InventoryPage = lazy(() => import("@/pages/inventory/InventoryPage").then((m) => ({ default: m.InventoryPage })));
const ChallansPage = lazy(() => import("@/pages/challans/ChallansPage").then((m) => ({ default: m.ChallansPage })));
const ChallanFormPage = lazy(() => import("@/pages/challans/ChallanFormPage").then((m) => ({ default: m.ChallanFormPage })));
const ChallanDetailPage = lazy(() => import("@/pages/challans/ChallanDetailPage").then((m) => ({ default: m.ChallanDetailPage })));
const UsersPage = lazy(() => import("@/pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

function SuspenseRoute({ children }) {
  return <Suspense fallback={<PageLoader label="Loading…" />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <SuspenseRoute>
            <DashboardPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <SuspenseRoute>
            <CustomersPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "customers/new",
        element: (
          <RequireRole roles={["ADMIN", "SALES"]}>
            <SuspenseRoute>
              <CustomerFormPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "customers/:id",
        element: (
          <SuspenseRoute>
            <CustomerDetailPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "customers/:id/edit",
        element: (
          <RequireRole roles={["ADMIN", "SALES"]}>
            <SuspenseRoute>
              <CustomerFormPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "products",
        element: (
          <SuspenseRoute>
            <ProductsPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "products/new",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <SuspenseRoute>
              <ProductFormPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "products/:id",
        element: (
          <SuspenseRoute>
            <ProductDetailPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "products/:id/edit",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <SuspenseRoute>
              <ProductFormPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "products/:id/stock-movements",
        element: (
          <SuspenseRoute>
            <ProductMovementsPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <SuspenseRoute>
            <InventoryPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "stock-movements",
        element: (
          <SuspenseRoute>
            <StockMovementsPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "challans",
        element: (
          <SuspenseRoute>
            <ChallansPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "challans/new",
        element: (
          <RequireRole roles={["ADMIN", "SALES"]}>
            <SuspenseRoute>
              <ChallanFormPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "challans/:id",
        element: (
          <SuspenseRoute>
            <ChallanDetailPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "challans/:id/edit",
        element: (
          <RequireRole roles={["ADMIN", "SALES"]}>
            <SuspenseRoute>
              <ChallanFormPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "users",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <SuspenseRoute>
              <UsersPage />
            </SuspenseRoute>
          </RequireRole>
        ),
      },
      {
        path: "settings",
        element: (
          <SuspenseRoute>
            <SettingsPage />
          </SuspenseRoute>
        ),
      },
      {
        path: "*",
        element: (
          <SuspenseRoute>
            <NotFoundPage />
          </SuspenseRoute>
        ),
      },
    ],
  },
]);