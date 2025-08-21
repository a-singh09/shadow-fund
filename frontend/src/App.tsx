import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "@/providers/WagmiProvider";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Dashboard from "./pages/Dashboard";
import DashboardWithdraw from "./pages/DashboardWithdraw";
import DashboardAnalyticsPage from "./pages/DashboardAnalyticsPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <WagmiProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/withdraw" element={<DashboardWithdraw />} />
          <Route
            path="/dashboard/analytics"
            element={<DashboardAnalyticsPage />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </WagmiProvider>
);

export default App;
