import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../lib/routes';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export function Logo() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <Link
      to={ROUTES.HOME}
      className="group relative"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Shield
          className={cn(
            "h-8 w-8 text-indigo-600 transition-all duration-300",
            "group-hover:scale-110",
            isAnimating && "animate-pulse scale-125"
          )}
          />
          <div className="absolute inset-0 border-2 border-indigo-600 rounded-full opacity-50"></div>
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
          Fortivo
        </span>
      </div>
      <div className={cn(
        "mt-2 text-sm text-gray-500 transition-all duration-300",
        "opacity-0 group-hover:opacity-100",
        isAnimating && "opacity-100 translate-y-1"
      )}>
        Secure Asset Management
      </div>
    </Link>
  );
}