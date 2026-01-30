import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Settings, ShieldCheck } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">WhllXyz</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAdmin ? (
               <Link 
               to="/" 
               className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
             >
               View Store
             </Link>
            ) : (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;