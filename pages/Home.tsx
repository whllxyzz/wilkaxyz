import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/mockApi';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Loader2, Search, Filter } from 'lucide-react';

const CATEGORIES = ["All", "UI Kits", "Templates", "E-Books", "Icons", "Software"];

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
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
    fetchProducts();
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
        <p>Loading catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-lg shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Premium Digital Assets
          </h1>
          <p className="text-blue-100 text-lg md:text-xl">
            High-quality boilerplates, UI kits, and icons for developers and designers. Instant delivery.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full pl-11 pr-4 py-3.5 rounded-full text-gray-900 bg-white/95 backdrop-blur shadow-lg focus:ring-4 focus:ring-blue-400/50 outline-none transition-all placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Categories & Grid */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             {CATEGORIES.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                   selectedCategory === cat 
                     ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                     : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap hidden md:block">
            Showing {filteredProducts.length} Results
          </span>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No products found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              We couldn't find any items matching your search for "{searchQuery}" in {selectedCategory}.
            </p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCategory('All')}}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;