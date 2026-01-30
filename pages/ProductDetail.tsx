import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createTransaction } from '../services/mockApi';
import { Product } from '../types';
import { Loader2, Shield, Zap, CreditCard, ArrowLeft, QrCode, Landmark } from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (id) {
      getProductById(id).then(res => {
        if (res.data) setProduct(res.data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleBuy = async (method: string) => {
    if (!product || !email) {
      alert("Please enter your email to receive the product.");
      return;
    }
    
    setProcessing(true);
    // Simulate transaction creation and redirect to payment gateway
    try {
      const res = await createTransaction(product._id, method, email);
      if (res.success && res.data) {
        // Redirect to the simulated Payment Gateway
        navigate(`/payment/${res.data._id}`);
      } else {
        alert("Transaction failed.");
      }
    } catch (e) {
      alert("Error processing payment");
    } finally {
      setProcessing(false);
    }
  };

  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  });

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!product) return <div className="text-center p-20">Product not found.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-gray-100 p-8 md:p-12 flex items-center justify-center">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full max-w-md shadow-2xl rounded-lg transform rotate-1 hover:rotate-0 transition-transform duration-500"
          />
        </div>
        
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-6">{formatter.format(product.price)}</p>
          
          <div className="prose prose-sm text-gray-500 mb-8">
            <p>{product.description}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="p-2 bg-green-50 rounded-full text-green-600"><Zap className="w-4 h-4" /></div>
              <span>Instant automatic delivery via email</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="p-2 bg-blue-50 rounded-full text-blue-600"><Shield className="w-4 h-4" /></div>
              <span>Secure payment by Midtrans (Simulated)</span>
            </div>
          </div>

          <button 
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Checkout
                </h3>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">We'll send the file to this email.</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900 mb-1">Select Payment Method</p>
              
              <button 
                disabled={processing}
                onClick={() => handleBuy('qris')}
                className="w-full flex items-center justify-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50/50 transition-all group bg-white"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                    <QrCode className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <span className="block font-semibold text-gray-900 group-hover:text-blue-700">QRIS (Gopay/Ovo/Dana)</span>
                    <span className="text-xs text-gray-500">Scan QR Code</span>
                </div>
              </button>

              <button 
                disabled={processing}
                onClick={() => handleBuy('bank_transfer')}
                className="w-full flex items-center justify-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50/50 transition-all group bg-white"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                    <Landmark className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <span className="block font-semibold text-gray-900 group-hover:text-blue-700">Bank Transfer</span>
                    <span className="text-xs text-gray-500">BCA / Mandiri</span>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setShowPaymentModal(false)}
              className="mt-6 w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;