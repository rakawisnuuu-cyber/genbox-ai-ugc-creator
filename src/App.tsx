import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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

import PromptPage from "./pages/PromptPage";
import BlueprintPage from "./pages/BlueprintPage";
import SettingsPage from "./pages/SettingsPage";
import CreateCharacterPage from "./pages/CreateCharacterPage";

import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardHome />} />
              {/* GeneratePage rendered permanently in DashboardLayout */}
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/prompt" element={<PromptPage />} />
              <Route path="/blueprint" element={<BlueprintPage />} />
              <Route path="/characters/create" element={<CreateCharacterPage />} />
              {/* VideoPage rendered permanently in DashboardLayout */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
