import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyDownloadToken, createReview, getTransactions } from '../services/mockApi';
import { Download, CheckCircle, Home, Star, FileText, Printer, X, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction } from '../types';

const Success: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  
  // Invoice Modal
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (token) {
      const initData = async () => {
        try {
          // 1. Verify Token
          const res = await verifyDownloadToken(token);
          if (res.success && res.data) {
            setDownloadUrl(res.data.url);
            setProductName(res.data.product);
            setTransaction(res.data.transaction);
            setLoading(false);
            
            // Trigger confetti safely
            try {
              if (typeof confetti === 'function') {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              }
            } catch (e) {
              console.warn("Confetti failed to launch", e);
            }

          } else {
            setLoading(false);
            setError(res.message || 'Invalid token');
          }
        } catch (err) {
          console.error(err);
          setLoading(false);
          setError('An unexpected error occurred');
        }
      };

      initData();
    }
  }, [token]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !transaction) return;
    
    await createReview({
        productId: transaction.productId,
        transactionId: transaction._id,
        rating,
        comment,
        userName: 'Verified Buyer'
    });
    setReviewSubmitted(true);
  };

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
       <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
       <p className="text-gray-200">Verifying purchase...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full border border-red-500/30">
          <h2 className="text-xl font-bold mb-2 text-red-400">Access Denied</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          <Link to="/" className="inline-flex items-center justify-center px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 transition-colors">
            Back to Home
          </Link>
        </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      
      {/* INVOICE MODAL (Keep White for Printing) */}
      {showInvoice && transaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowInvoice(false)}>
           <div className="bg-white text-black w-full max-w-md md:max-w-lg rounded-none md:rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Invoice Toolbar */}
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center no-print">
                 <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Official Receipt</h3>
                 <div className="flex gap-2">
                    <button onClick={() => window.print()} className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Print"><Printer className="w-5 h-5" /></button>
                    <button onClick={() => setShowInvoice(false)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                 </div>
              </div>

              {/* Invoice Content */}
              <div id="invoice-area" className="p-8 bg-white text-left font-sans text-sm relative">
                  {/* Watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-45deg]">
                    <span className="text-9xl font-black uppercase text-black">PAID</span>
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-8 border-b-2 border-gray-100 pb-6">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <div className="bg-blue-600 p-1.5 rounded text-white"><ShoppingBag className="w-4 h-4" /></div>
                          <span className="text-xl font-bold tracking-tight text-gray-900">WhllXyz</span>
                       </div>
                       <p className="text-gray-500 text-xs">Digital Store Official</p>
                    </div>
                    <div className="text-right">
                       <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-widest text-opacity-80">Invoice</h2>
                       <p className="text-gray-500 font-mono mt-1">#{transaction._id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                     <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Billed To</p>
                        <p className="font-bold text-gray-900">{transaction.customerEmail || 'Guest Customer'}</p>
                        <p className="text-gray-500">{new Date(transaction.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Payment Method</p>
                        <p className="font-medium text-gray-900 capitalize">{transaction.paymentMethod.replace('_', ' ')}</p>
                        <div className="mt-2 inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-green-200">
                           PAID IN FULL
                        </div>
                     </div>
                  </div>

                  {/* Item Table */}
                  <div className="mb-8">
                     <table className="w-full">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                           <tr>
                              <th className="py-2 px-3 text-left rounded-l-lg">Description</th>
                              <th className="py-2 px-3 text-right rounded-r-lg">Amount</th>
                           </tr>
                        </thead>
                        <tbody className="text-gray-700">
                           <tr className="border-b border-gray-50">
                              <td className="py-4 px-3">
                                 <p className="font-bold text-gray-900">{productName}</p>
                                 <p className="text-xs text-gray-500">Digital License / Product Asset</p>
                              </td>
                              <td className="py-4 px-3 text-right font-mono font-medium">
                                 {formatter.format(transaction.amount)}
                              </td>
                           </tr>
                        </tbody>
                     </table>
                  </div>

                  {/* Total & Resi Section */}
                  <div className="flex flex-col items-end border-t-2 border-gray-900 pt-4 mb-8">
                     <div className="flex justify-between w-full max-w-[200px] mb-2">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">{formatter.format(transaction.amount)}</span>
                     </div>
                     <div className="flex justify-between w-full max-w-[200px] text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span>{formatter.format(transaction.amount)}</span>
                     </div>
                  </div>

                  {/* Resi Info */}
                  {transaction.resi && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8">
                          <p className="text-xs font-bold text-blue-500 uppercase mb-1">Tracking Number / Reference Code</p>
                          <p className="font-mono text-lg font-bold text-gray-900 tracking-wide">{transaction.resi}</p>
                      </div>
                  )}

                  {/* Footer */}
                  <div className="text-center pt-8 border-t border-gray-100">
                     <p className="text-gray-900 font-bold text-sm mb-1">Thank you for your business!</p>
                     <p className="text-xs text-gray-400">Please keep this receipt for your records.</p>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* MAIN SUCCESS PAGE CONTENT (Glass) */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl shadow-2xl">
        <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"><CheckCircle className="w-10 h-10" /></div>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Verified!</h1>
        <p className="text-gray-200 mb-8">Thank you for purchasing <strong>{productName}</strong>.</p>

        {/* Resi Alert on Main Page */}
        {transaction?.resi && (
           <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><FileText className="w-5 h-5" /></div>
              <div>
                 <h4 className="font-bold text-white text-sm">Shipment Info / Reference Code</h4>
                 <p className="font-mono text-lg font-bold text-blue-300">{transaction.resi}</p>
                 <p className="text-xs text-gray-300">Please save this code for future reference.</p>
              </div>
           </div>
        )}

        <div className="flex flex-col gap-3 mb-8">
            <div className="p-6 bg-white/5 rounded-xl border border-dashed border-white/20">
            <p className="text-sm text-gray-300 mb-4">Your secure download link:</p>
            <a 
                href={downloadUrl || '#'} 
                download 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 w-full sm:w-auto border border-white/10"
            >
                <Download className="w-5 h-5" /> Download Product
            </a>
            </div>
            
            <button 
                onClick={() => setShowInvoice(true)}
                className="w-full py-3 rounded-xl border-2 border-white/10 hover:border-white/20 font-bold text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
                <FileText className="w-4 h-4" /> View Official Receipt
            </button>
        </div>

        {/* Rating Form */}
        {!reviewSubmitted ? (
            <div className="mt-12 pt-8 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">How was the product?</h3>
                <form onSubmit={handleSubmitReview} className="max-w-sm mx-auto space-y-4">
                    <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(star => (
                            <button key={star} type="button" onClick={() => setRating(star)} className={`transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}>
                                <Star className={`w-8 h-8 ${star <= rating ? 'fill-current' : ''}`} />
                            </button>
                        ))}
                    </div>
                    <textarea 
                        placeholder="Write a quick review..." 
                        className="glass-input w-full p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none placeholder-gray-400 text-white"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                    <button type="submit" disabled={rating === 0} className="w-full bg-white/10 text-white py-2 rounded-lg font-medium disabled:opacity-50 hover:bg-white/20 transition-colors border border-white/10">Submit Review</button>
                </form>
            </div>
        ) : (
            <div className="mt-8 p-4 bg-green-500/20 text-green-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-green-500/30">
                <CheckCircle className="w-4 h-4" /> Thanks for your feedback!
            </div>
        )}

        <div className="mt-8">
            <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white transition-colors"><Home className="w-4 h-4 mr-2" /> Return to Store</Link>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
            body * { visibility: hidden; }
            #invoice-area, #invoice-area * { visibility: visible; }
            #invoice-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; }
            .no-print { display: none; }
        }
      `}</style>
    </div>
  );
};

export default Success;