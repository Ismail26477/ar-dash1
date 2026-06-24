import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/contexts/AuthContext";

// Admin dashboard pages
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Analytics from "./pages/Analytics";
import Marketing from "./pages/Marketing";
import Payments from "./pages/Payments";
import Fulfillment from "./pages/Fulfillment";
import Reviews from "./pages/Reviews";
import Discounts from "./pages/Discounts";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

// Auth + order detail (admin)
import Login from "./pages/auth/Login";
import OrderDetail from "./pages/orders/OrderDetail";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth adminOnly>{children}</RequireAuth>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Admin authentication */}
            <Route path="/login" element={<Login />} />

            {/* Admin dashboard (staff only) */}
            <Route path="/" element={<AdminRoute><Index /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><Orders /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><Products /></AdminRoute>} />
            <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
            <Route path="/admin/marketing" element={<AdminRoute><Marketing /></AdminRoute>} />
            <Route path="/admin/payments" element={<AdminRoute><Payments /></AdminRoute>} />
            <Route path="/admin/fulfillment" element={<AdminRoute><Fulfillment /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><Reviews /></AdminRoute>} />
            <Route path="/admin/discounts" element={<AdminRoute><Discounts /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><Support /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="/admin/help" element={<AdminRoute><Help /></AdminRoute>} />

            {/* Full order view (admin) */}
            <Route path="/order/:orderNumber" element={<AdminRoute><OrderDetail /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
