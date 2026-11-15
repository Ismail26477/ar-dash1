import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

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

// Order detail
import OrderDetail from "./pages/orders/OrderDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Open dashboard routes; login now sends visitors straight to the dashboard. */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Index />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/customers" element={<Customers />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/marketing" element={<Marketing />} />
            <Route path="/admin/payments" element={<Payments />} />
            <Route path="/admin/fulfillment" element={<Fulfillment />} />
            <Route path="/admin/reviews" element={<Reviews />} />
            <Route path="/admin/discounts" element={<Discounts />} />
            <Route path="/admin/support" element={<Support />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/help" element={<Help />} />

            <Route path="/order/:orderNumber" element={<OrderDetail />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
