import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Download } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  // Helper to optimize unsplash images for cards (limit width to 600px)
  const getOptimizedImage = (url: string) => {
     if (url.includes('images.unsplash.com')) {
         // Replace existing w parameter or add it
         if (url.includes('w=')) {
             return url.replace(/w=\d+/, 'w=600&q=80');
         }
         return `${url}&w=600&q=80`;
     }
     return url;
  };

  return (
    <div className="group relative rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] bg-black/20 border border-white/5">
      {/* Background Image with Overlay */}
      <div className="aspect-[4/5] w-full relative">
         <img 
            src={getOptimizedImage(product.imageUrl)} 
            alt={product.name} 
            loading="lazy" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-300"></div>
         
         {/* Top Tags */}
         <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
               {product.category}
            </span>
         </div>

         {/* Content Overlay */}
         <div className="absolute bottom-0 left-0 w-full p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 drop-shadow-md">{product.name}</h3>
            <p className="text-gray-200 text-xs mb-3 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
               {product.description}
            </p>
            
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-xs text-gray-300">Price</span>
                   <span className="font-bold text-white">{formatter.format(product.price)}</span>
                </div>
                
                <Link 
                   to={`/product/${product._id}`}
                   className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-blue-400 hover:text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                   {product.fileType === 'MP4' ? <PlayCircle className="w-5 h-5 fill-current" /> : <Download className="w-5 h-5" />}
                </Link>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProductCard;