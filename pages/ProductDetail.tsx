import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createTransaction, getReviewsByProductId } from '../services/mockApi';
import { Product, Review } from '../types';
import { Loader2, Shield, Zap, ArrowLeft, Star, User, PlayCircle } from 'lucide-react';
import { useToast } from '../components/ToastContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        getProductById(id),
        getReviewsByProductId(id)
      ]).then(([prodRes, revRes]) => {
        if (prodRes.data) setProduct(prodRes.data);
        if (revRes.data) setReviews(revRes.data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleBuy = async () => {
    if (!product) return;
    setProcessing(true);
    try {
      const res = await createTransaction(product._id, 'bank_transfer', "guest@whllxyz.com");
      if (res.success && res.data) {
        addToast("Transaction created! Redirecting...", 'success');
        navigate(`/payment/${res.data._id}`);
      } else {
        addToast("Failed to create transaction", 'error');
        setProcessing(false);
      }
    } catch (e) {
      addToast("Error processing payment", 'error');
      setProcessing(false);
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!product) return <div className="text-center p-20 text-white">Product not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <button onClick={() => navigate('/')} className="flex items-center text-gray-200 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
      </button>

      {/* Main Product Info - Glass Container */}
      <div className="glass-panel rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-black/30 p-8 md:p-12 flex flex-col items-center justify-center gap-6 border-r border-white/10">
          <div className="relative w-full max-w-md">
            <img src={product.imageUrl} alt={product.name} className="w-full shadow-2xl shadow-black/50 rounded-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 border border-white/10" />
            {product.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-black/40 backdrop-blur-md p-4 rounded-full shadow-lg border border-white/20">
                    <PlayCircle className="w-8 h-8 text-white" />
                 </div>
              </div>
            )}
          </div>

          {/* Video Preview Section */}
          {product.videoUrl && (
            <div className="w-full max-w-md mt-4">
               <h4 className="text-xs font-bold text-gray-100 mb-2 uppercase tracking-wider">Product Preview</h4>
               <video 
                  src={product.videoUrl} 
                  controls 
                  className="w-full rounded-xl shadow-lg border border-white/10 bg-black"
               />
            </div>
          )}
        </div>
        
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-4">
             <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
             {/* Rating Header */}
             <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= (product.averageRating || 0) ? 'fill-current' : 'text-gray-500'}`} />
                    ))}
                </div>
                <span className="text-sm text-gray-200 font-medium">({product.totalReviews || 0} reviews)</span>
             </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
             <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{formatter.format(product.price)}</p>
             {(product.fileSize || product.fileType) && (
               <div className="flex items-center gap-2 text-xs font-medium text-gray-100 bg-white/10 border border-white/10 px-3 py-1 rounded-full">
                 {product.fileType && <span>{product.fileType}</span>}
                 {product.fileSize && <><span>•</span><span>{product.fileSize}</span></>}
               </div>
             )}
          </div>
          
          <div className="prose prose-sm text-gray-100 mb-8 leading-relaxed"><p>{product.description}</p></div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <div className="p-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/30"><Zap className="w-4 h-4" /></div>
              <span>Instant automatic delivery (after approval)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30"><Shield className="w-4 h-4" /></div>
              <span>Secure manual payment verification</span>
            </div>
          </div>

          <button onClick={handleBuy} disabled={processing} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait border border-white/10">
            {processing ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-6">Customer Reviews</h3>
        {reviews.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl border-dashed border-white/20 text-gray-200">
                No reviews yet. Be the first to review this product!
            </div>
        ) : (
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review._id} className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10"><User className="w-4 h-4" /></div>
                                <span className="font-bold text-white">{review.userName}</span>
                            </div>
                            <span className="text-xs text-gray-300">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-yellow-400 mb-3">
                            {[1,2,3,4,5].map(star => (
                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-gray-600'}`} />
                            ))}
                        </div>
                        <p className="text-gray-100 text-sm">{review.comment}</p>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;