import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Format price to IDR
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm">
          {product.category || 'Digital'}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
          <span className="text-lg font-bold text-gray-900">
            {formatter.format(product.price)}
          </span>
          <Link 
            to={`/product/${product._id}`}
            className="inline-flex items-center gap-2 bg-gray-50 hover:bg-blue-600 text-gray-900 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Buy Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;