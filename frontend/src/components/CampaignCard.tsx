import { Heart, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CampaignCardProps {
  id: string;
  title: string;
  creator: string;
  description: string;
  category: string;
  image: string;
  supportersCount: number;
  daysLeft: number;
  progressPercentage: number;
}

const CampaignCard = ({
  id,
  title,
  creator,
  description,
  category,
  image,
  supportersCount,
  daysLeft,
  progressPercentage
}: CampaignCardProps) => {
  return (
    <div className="glass rounded-2xl border border-red-500/20 overflow-hidden hover-lift group">
      {/* Campaign Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Privacy Badge */}
        <div className="absolute top-4 left-4 flex items-center space-x-1 bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-red-500/30">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <span className="text-xs text-red-400 font-medium">Private</span>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-4 right-4 bg-glass backdrop-blur-sm px-3 py-1 rounded-full border border-glass-border">
          <span className="text-xs text-gray-300 font-medium">{category}</span>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-400">by {creator}</p>
        </div>
        
        <p className="text-gray-300 text-sm line-clamp-3 mb-4">{description}</p>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{progressPercentage}% funded</span>
            <span>Goal amount private</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{supportersCount} supporters</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{daysLeft} days left</span>
          </div>
        </div>
        
        {/* Action Button */}
        <Link 
          to={`/campaign/${id}`}
          className="w-full btn-primary py-3 font-semibold text-center flex items-center justify-center space-x-2 transition-all duration-300"
        >
          <Heart className="w-4 h-4" />
          <span>Support Project</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default CampaignCard;