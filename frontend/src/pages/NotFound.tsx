import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, Plus, ArrowLeft } from 'lucide-react';
import MouseFollower from '@/components/MouseFollower';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <MouseFollower />
      
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* 404 Number */}
        <div className="text-8xl sm:text-9xl font-bold gradient-text mb-8 opacity-20">
          404
        </div>
        
        {/* Error Content */}
        <div className="glass-strong p-12 rounded-3xl border border-red-500/20">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          {/* Navigation Options */}
          <div className="space-y-4">
            <Link to="/">
              <button className="btn-primary w-full sm:w-auto px-6 py-3 font-semibold hover-lift flex items-center justify-center space-x-2">
                <Home className="w-5 h-5" />
                <span>Return to Home</span>
              </button>
            </Link>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/campaigns">
                <button className="btn-secondary px-6 py-3 font-semibold hover-lift flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Explore Campaigns</span>
                </button>
              </Link>
              
              <Link to="/create-campaign">
                <button className="btn-secondary px-6 py-3 font-semibold hover-lift flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
