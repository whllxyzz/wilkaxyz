import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/mockApi';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Loader2, Search, Filter, Bell, Sparkles, ChevronRight, LayoutGrid } from 'lucide-react';

const CATEGORIES = ["All", "UI Kits", "Templates", "E-Books", "Icons", "Software"];

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Listener for real-time updates within the same browser/tabs
    const handleStorageChange = () => {
        fetchProducts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('db_update', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('db_update', handleStorageChange);
    };
  }, []);

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-blue-200/50">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-white" />
        <p className="font-light tracking-wider text-gray-100">LOADING ASSETS...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col gap-6">
      
      {/* Top Floating Glass Bar (Search & User) */}
      <div className="glass-panel rounded-full px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 mx-auto w-full">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-100 group-focus-within:text-white transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search movies, assets, templates..." 
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm focus:bg-white/10 focus:border-white/30 outline-none transition-all placeholder-gray-200 text-white font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
         </div>

         <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
             {CATEGORIES.slice(0, 4).map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-200 hover:text-white'}`}
                >
                  {cat}
                </button>
             ))}
             <button className="text-sm text-gray-200 hover:text-white flex items-center gap-1">More <ChevronRight className="w-3 h-3" /></button>
         </div>

         <div className="hidden md:flex items-center gap-3">
             <button className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition-colors border border-white/10 relative">
                <Bell className="w-4 h-4 text-white" />
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red]"></span>
             </button>
             <div className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1 border border-white/10">
                 <img src="https://ui-avatars.com/api/?name=User" className="w-6 h-6 rounded-full" alt="User" />
                 <span className="text-xs font-bold text-white">Guest</span>
             </div>
         </div>
      </div>

      {/* Main Glass Window Container */}
      <div className="glass-panel flex-grow rounded-[2.5rem] p-6 md:p-8 overflow-y-auto border border-white/10 relative">
         
         {/* Hero / Highlight Section */}
         {!searchQuery && selectedCategory === 'All' && (
           <div className="mb-10 relative group cursor-pointer overflow-hidden rounded-[2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
              {/* OPTIMIZED HERO IMAGE SIZE (w=800 instead of 2670) */}
              <img 
                 src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop" 
                 alt="Hero" 
                 className="w-full h-[300px] md:h-[400px] object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 max-w-2xl">
                 <div className="flex gap-2 mb-4">
                    <span className="bg-orange-500/20 text-orange-200 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">NEW ARRIVAL</span>
                    <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">FEATURED</span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">Premium 3D Abstract<br/>Assets Bundle</h1>
                 <p className="text-gray-100 text-lg mb-6 line-clamp-2 max-w-lg drop-shadow-md font-medium">Elevate your designs with our latest collection of 4K rendered glass and metal abstract shapes. Perfect for modern web design.</p>
                 <div className="flex gap-4">
                    <button className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                       <LayoutGrid className="w-4 h-4" /> Browse Collection
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-full font-bold backdrop-blur-md transition-all">
                       View Demo
                    </button>
                 </div>
              </div>
           </div>
         )}

         {/* Products Grid */}
         <div>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-yellow-400" />
                 {searchQuery ? `Results for "${searchQuery}"` : "Trending Assets"}
               </h2>
               <span className="text-sm text-gray-200 hover:text-white cursor-pointer font-medium">See all</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                   <Filter className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold text-white">No items found</h3>
                <p className="text-gray-200">Try changing your filters or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
         </div>

      </div>
    </div>
  );
};

export default Home;