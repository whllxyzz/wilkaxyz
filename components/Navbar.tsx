import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Settings, ShieldCheck, Home, Search, Heart, User, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // Helper to determine active state
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar / Dock (Left Side) - Matches the reference image sidebar */}
      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-6 p-3 glass-panel rounded-[2rem] w-20 items-center justify-between min-h-[500px]">
        {/* Logo Area */}
        <Link to="/" className="p-3 rounded-full hover:bg-white/10 transition-all group">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
             <ShoppingBag className="w-6 h-6 text-white" />
          </div>
        </Link>

        {/* Main Nav Items */}
        <div className="flex flex-col gap-4 w-full items-center">
            <Link to="/" className={`p-4 rounded-full transition-all duration-300 ${isActive('/') ? 'nav-icon-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
               <Home className="w-6 h-6" />
            </Link>
            <Link to="/search" className={`p-4 rounded-full transition-all duration-300 ${isActive('/search') ? 'nav-icon-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
               <Search className="w-6 h-6" />
            </Link>
            <div className="w-8 h-[1px] bg-white/10 my-1"></div>
            <Link to="/admin" className={`p-4 rounded-full transition-all duration-300 ${isAdmin ? 'nav-icon-active' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
               <ShieldCheck className="w-6 h-6" />
            </Link>
        </div>

        {/* Bottom Profile */}
        <div className="mt-auto flex flex-col gap-4 items-center w-full">
            <button className="p-4 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition-all">
               <User className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Profile" className="w-full h-full opacity-80" />
            </div>
        </div>
      </nav>

      {/* Mobile Top Navbar (Floating Pill) */}
      <nav className="md:hidden fixed top-4 left-4 right-4 z-50 glass-panel rounded-full px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-1.5 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">WhllXyz</span>
          </Link>
          
          <Link 
            to={isAdmin ? "/" : "/admin"} 
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            {isAdmin ? <Home className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </Link>
      </nav>
    </>
  );
};

export default Navbar;