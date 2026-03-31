import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";

import CharactersPage from "./pages/CharactersPage";
import GalleryPage from "./pages/GalleryPage";


import SettingsPage from "./pages/SettingsPage";
import PromptEnginePage from "./pages/PromptEnginePage";
import CreateCharacterPage from "./pages/CreateCharacterPage";

import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import CheckoutPage from "./pages/CheckoutPage";

import AdminPage from "./pages/AdminPage";
import AdminRoute from "./components/AdminRoute";
import TrialExpiredPage from "./pages/TrialExpiredPage";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Analytics />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            
            <Route path="/trial-expired" element={<TrialExpiredPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/generate" element={null} />
              <Route path="/video" element={null} />
              {/* GeneratePage rendered permanently in DashboardLayout */}
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/gallery" element={<GalleryPage />} />

              {/* <Route path="/blueprint" element={<BlueprintPage />} /> */}
              <Route path="/characters/create" element={<CreateCharacterPage />} />
              {/* VideoPage rendered permanently in DashboardLayout */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/prompt/campaign" element={<PromptEnginePage initialMode="campaign" />} />
              <Route path="/prompt/decode" element={<PromptEnginePage initialMode="decode" />} />
              <Route path="/prompt/motion" element={<PromptEnginePage initialMode="motion" />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
