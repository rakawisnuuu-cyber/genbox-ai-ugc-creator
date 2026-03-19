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
import GeneratePage from "./pages/GeneratePage";
import CharactersPage from "./pages/CharactersPage";
import GalleryPage from "./pages/GalleryPage";
import PromptPage from "./pages/PromptPage";
import BlueprintPage from "./pages/BlueprintPage";
import SettingsPage from "./pages/SettingsPage";
import CreateCharacterPage from "./pages/CreateCharacterPage";
import VideoPage from "./pages/VideoPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const protectedPaths = [
  "/dashboard",
  "/generate",
  "/characters",
  "/gallery",
  "/prompt",
  "/blueprint",
  "/video",
  "/settings",
];

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
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/prompt" element={<PromptPage />} />
              <Route path="/blueprint" element={<BlueprintPage />} />
              <Route path="/characters/create" element={<CreateCharacterPage />} />
              <Route path="/video" element={<VideoPage />} />
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
