import Navigation from "@/components/Navigation";
import MouseFollower from "@/components/MouseFollower";
import Footer from "@/components/Footer";
import DashboardStats from "@/components/DashboardStats";
import DashboardCampaigns from "@/components/DashboardCampaigns";
import RecentActivity from "@/components/RecentActivity";
import DonationHistory from "@/components/DonationHistory";
import { LayoutDashboard, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <MouseFollower />
      <Navigation />

      <main className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Creator <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Manage your campaigns and track private donations
              </p>
            </div>

            {/* Dashboard Stats */}
            <DashboardStats />

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <DashboardCampaigns />

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Withdraw Funds",
                      description: "Transfer your earnings securely",
                      icon: "Download",
                      color: "green",
                      route: "/dashboard/withdraw",
                    },
                    {
                      title: "Post Update",
                      description: "Share news with your supporters",
                      icon: "Edit",
                      color: "blue",
                    },
                    {
                      title: "View Analytics",
                      description: "Detailed campaign insights",
                      icon: "BarChart3",
                      color: "purple",
                      route: "/dashboard/analytics",
                    },
                    {
                      title: "Privacy Settings",
                      description: "Manage your privacy preferences",
                      icon: "Shield",
                      color: "red",
                    },
                  ].map((action, index) => {
                    if (action.route) {
                      return (
                        <Link
                          key={index}
                          to={action.route}
                          className="glass p-6 rounded-xl border border-red-500/20 hover-lift cursor-pointer transition-all duration-300"
                        >
                          <div
                            className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                              action.color === "red"
                                ? "bg-red-500/10 border border-red-500/20"
                                : action.color === "blue"
                                  ? "bg-blue-500/10 border border-blue-500/20"
                                  : action.color === "green"
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : "bg-purple-500/10 border border-purple-500/20"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 ${
                                action.color === "red"
                                  ? "text-red-400"
                                  : action.color === "blue"
                                    ? "text-blue-400"
                                    : action.color === "green"
                                      ? "text-green-400"
                                      : "text-purple-400"
                              }`}
                            >
                              {action.icon === "Download" && "⬇️"}
                              {action.icon === "Edit" && "✏️"}
                              {action.icon === "BarChart3" && "📊"}
                              {action.icon === "Shield" && "🛡️"}
                            </div>
                          </div>
                          <h3 className="font-semibold text-white mb-2">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {action.description}
                          </p>
                        </Link>
                      );
                    } else {
                      return (
                        <div
                          key={index}
                          className="glass p-6 rounded-xl border border-red-500/20 hover-lift cursor-pointer transition-all duration-300"
                        >
                          <div
                            className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${
                              action.color === "red"
                                ? "bg-red-500/10 border border-red-500/20"
                                : action.color === "blue"
                                  ? "bg-blue-500/10 border border-blue-500/20"
                                  : action.color === "green"
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : "bg-purple-500/10 border border-purple-500/20"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 ${
                                action.color === "red"
                                  ? "text-red-400"
                                  : action.color === "blue"
                                    ? "text-blue-400"
                                    : action.color === "green"
                                      ? "text-green-400"
                                      : "text-purple-400"
                              }`}
                            >
                              {action.icon === "Download" && "⬇️"}
                              {action.icon === "Edit" && "✏️"}
                              {action.icon === "BarChart3" && "📊"}
                              {action.icon === "Shield" && "🛡️"}
                            </div>
                          </div>
                          <h3 className="font-semibold text-white mb-2">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {action.description}
                          </p>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <RecentActivity />

                {/* User Profile Card */}
                <div className="glass p-6 rounded-xl border border-red-500/20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 text-red-400">👤</div>
                    </div>
                    <h3 className="font-semibold text-white mb-1">
                      Creator Profile
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      wallet address: 0x1234...5678
                    </p>
                    <button className="btn-secondary px-4 py-2 text-sm font-medium w-full">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
