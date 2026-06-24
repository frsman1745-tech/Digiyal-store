import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/layout/Layout';
import { StoreAuthProvider, AdminAuthProvider, StoreAuthGuard, AdminAuthGuard } from './hooks/useAuth';

const HomePage = lazy(() => import('./pages/user/HomePage'));
const StorePage = lazy(() => import('./pages/user/StorePage'));
const ProductPage = lazy(() => import('./pages/user/ProductPage'));
const QRScannerPage = lazy(() => import('./pages/user/QRScannerPage'));
const RegisterStorePage = lazy(() => import('./pages/user/RegisterStorePage'));

const StoreLoginPage = lazy(() => import('./pages/store/StoreLoginPage'));
const StoreChangePasswordPage = lazy(() => import('./pages/store/StoreChangePasswordPage'));
const StoreDashboardPage = lazy(() => import('./pages/store/StoreDashboardPage'));
const StoreFlyerDesignerPage = lazy(() => import('./pages/store/StoreFlyerDesignerPage'));
const StoreProductsPage = lazy(() => import('./pages/store/StoreProductsPage'));
const StoreAddProductPage = lazy(() => import('./pages/store/AddProductPage'));
const StoreEditProductPage = lazy(() => import('./pages/store/EditProductPage'));

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminRegistrationsPage = lazy(() => import('./pages/admin/AdminRegistrationsPage'));
const AdminStoresPage = lazy(() => import('./pages/admin/AdminStoresPage'));
const AdminStoreDetailPage = lazy(() => import('./pages/admin/AdminStoreDetailPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminLogsPage = lazy(() => import('./pages/admin/AdminLogsPage'));
const AdminBroadcastPage = lazy(() => import('./pages/admin/AdminBroadcastPage'));
const AdminManagePage = lazy(() => import('./pages/admin/AdminManagePage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminFlyersPage = lazy(() => import('./pages/admin/AdminFlyersPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-600 text-lg">الصفحة غير موجودة</p>
      <a href="/" className="mt-6 text-blue-600 hover:underline">العودة للرئيسية</a>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/store/:slug" element={<Layout><StorePage /></Layout>} />
            <Route path="/product/:id" element={<Layout><ProductPage /></Layout>} />
            <Route path="/scan" element={<Layout><QRScannerPage /></Layout>} />
            <Route path="/register-store" element={<Layout><RegisterStorePage /></Layout>} />

            <Route path="/store/login" element={<StoreAuthProvider><StoreLoginPage /></StoreAuthProvider>} />
            <Route path="/store/change-password" element={<StoreAuthProvider><StoreChangePasswordPage /></StoreAuthProvider>} />
            <Route path="/store/dashboard" element={<StoreAuthProvider><StoreAuthGuard><StoreDashboardPage /></StoreAuthGuard></StoreAuthProvider>} />
            <Route path="/store/flyer" element={<StoreAuthProvider><StoreAuthGuard><StoreFlyerDesignerPage /></StoreAuthGuard></StoreAuthProvider>} />
            <Route path="/store/products" element={<StoreAuthProvider><StoreAuthGuard><StoreProductsPage /></StoreAuthGuard></StoreAuthProvider>} />
            <Route path="/store/products/new" element={<StoreAuthProvider><StoreAuthGuard><StoreAddProductPage /></StoreAuthGuard></StoreAuthProvider>} />
            <Route path="/store/products/:id/edit" element={<StoreAuthProvider><StoreAuthGuard><StoreEditProductPage /></StoreAuthGuard></StoreAuthProvider>} />

            <Route path="/admin/login" element={<AdminAuthProvider><AdminLoginPage /></AdminAuthProvider>} />
            <Route path="/admin/dashboard" element={<AdminAuthProvider><AdminAuthGuard><AdminDashboardPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/registrations" element={<AdminAuthProvider><AdminAuthGuard><AdminRegistrationsPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/stores" element={<AdminAuthProvider><AdminAuthGuard><AdminStoresPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/stores/:id" element={<AdminAuthProvider><AdminAuthGuard><AdminStoreDetailPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/settings" element={<AdminAuthProvider><AdminAuthGuard><AdminSettingsPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/logs" element={<AdminAuthProvider><AdminAuthGuard><AdminLogsPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/broadcast" element={<AdminAuthProvider><AdminAuthGuard><AdminBroadcastPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/admins" element={<AdminAuthProvider><AdminAuthGuard><AdminManagePage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/products" element={<AdminAuthProvider><AdminAuthGuard><AdminProductsPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/reviews" element={<AdminAuthProvider><AdminAuthGuard><AdminReviewsPage /></AdminAuthGuard></AdminAuthProvider>} />
            <Route path="/admin/flyers" element={<AdminAuthProvider><AdminAuthGuard><AdminFlyersPage /></AdminAuthGuard></AdminAuthProvider>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </LanguageProvider>
    </HelmetProvider>
  );
}
